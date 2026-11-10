/**
 * Keeps the window from behaving like a web page: no browser context menu
 * (Reload, Save Image As…), no Select All over the chrome, and no links or
 * images dragged out as web content. Text stays text: fields, editable
 * content and selected content keep the browser's own behaviour.
 */

/** The part of Element the guards read, so they can be tested without a DOM. */
export interface GuardTarget {
	closest(selector: string): unknown;
}

const TEXT_FIELD_SELECTOR = [
	"textarea",
	'[contenteditable]:not([contenteditable="false"])',
	"input:not([type]), input:is([type='text'], [type='search'], [type='email'], [type='url'], [type='tel'], [type='password'], [type='number'])",
].join(", ");

export const SELECTABLE_SELECTOR = ".ctd-selectable, [data-selectable]";

const DRAG_GUARDED_SELECTOR = "a, img";
const EXPLICITLY_DRAGGABLE_SELECTOR = '[draggable="true"]';

const isTextField = (target: GuardTarget | null): boolean =>
	target?.closest(TEXT_FIELD_SELECTOR) != null;

/**
 * The browser's menu stays for text: in a field, or over selectable content
 * while something is selected (Copy, Look Up, spelling).
 */
export const allowsBrowserContextMenu = (
	target: GuardTarget | null,
	selectedText: string,
): boolean =>
	isTextField(target) ||
	(target?.closest(SELECTABLE_SELECTOR) != null &&
		selectedText.trim().length > 0);

/** Select All belongs to fields; elsewhere the app decides (e.g. all books). */
export const allowsNativeSelectAll = (target: GuardTarget | null): boolean =>
	isTextField(target);

/** Links and images drag only where something opted into dragging them. */
export const allowsDragStart = (target: GuardTarget | null): boolean =>
	target?.closest(DRAG_GUARDED_SELECTOR) == null ||
	target.closest(EXPLICITLY_DRAGGABLE_SELECTOR) != null;

const isSelectAllChord = (event: KeyboardEvent): boolean =>
	event.key.toLowerCase() === "a" &&
	(event.metaKey || event.ctrlKey) &&
	!event.shiftKey &&
	!event.altKey;

const asTarget = (target: EventTarget | null): GuardTarget | null => {
	if (target instanceof Element) return target;
	if (target instanceof Node) return target.parentElement;
	return null;
};

/**
 * Inside a block of selectable content, Select All selects that block, as in
 * a read-only NSTextView; anywhere else it does nothing native.
 */
const selectAllWithinContent = (doc: Document) => {
	const anchor = asTarget(doc.getSelection()?.anchorNode ?? null);
	const content = anchor?.closest(SELECTABLE_SELECTOR);
	if (!(content instanceof Element)) return;
	const range = doc.createRange();
	range.selectNodeContents(content);
	const selection = doc.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
};

export interface ChromeGuardOptions {
	/** Development builds let ⌥-right-click through, for Inspect Element. */
	allowInspect?: boolean;
}

export const installChromeGuards = (
	doc: Document = document,
	{ allowInspect = false }: ChromeGuardOptions = {},
): (() => void) => {
	const onContextMenu = (event: MouseEvent) => {
		if (event.defaultPrevented) return;
		if (allowInspect && event.altKey) return;
		const selectedText = doc.getSelection()?.toString() ?? "";
		if (allowsBrowserContextMenu(asTarget(event.target), selectedText)) return;
		event.preventDefault();
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.defaultPrevented || !isSelectAllChord(event)) return;
		if (allowsNativeSelectAll(asTarget(event.target))) return;
		event.preventDefault();
		selectAllWithinContent(doc);
	};
	const onDragStart = (event: DragEvent) => {
		if (allowsDragStart(asTarget(event.target))) return;
		event.preventDefault();
	};
	doc.addEventListener("contextmenu", onContextMenu);
	doc.addEventListener("keydown", onKeyDown);
	doc.addEventListener("dragstart", onDragStart);
	return () => {
		doc.removeEventListener("contextmenu", onContextMenu);
		doc.removeEventListener("keydown", onKeyDown);
		doc.removeEventListener("dragstart", onDragStart);
	};
};
