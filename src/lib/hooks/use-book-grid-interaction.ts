import type React from "react";
import { useMemo, useRef } from "react";
import type { LibraryBook } from "@/bindings";
import type { BookCardActions } from "@/components/atoms/BookCard";
import {
	downloadUrlDragData,
	dragIconPath,
	primaryLocalPath,
	primaryRemoteFile,
} from "@/lib/book-files";
import { bookShortcutHint } from "@/lib/app-shortcuts";
import { bookMenuEntries } from "@/lib/book-menu";
import {
	bookClickIntent,
	clearSelection,
	extendSelection,
	selectedBooks,
	selectForContextMenu,
	selectOnly,
	toggleBook,
} from "@/lib/book-selection";
import type { ContextMenuEntry } from "@/lib/context-menu";
import { contextMenuPoint, fromKeyboard } from "@/lib/context-menu-point";
import { dragOutGuard } from "@/lib/drag-out-guard";
import {
	bookMenuContext,
	openBookDetails,
	updateBookSelection,
	useBookSelectionActions,
	useBookSelectionStore,
} from "@/lib/hooks/use-book-selection";
import {
	type ContextMenuController,
	useContextMenu,
} from "@/lib/hooks/use-context-menu";
import { usePlatform } from "@/lib/platform/context";
import { bookCardDomId } from "@/components/atoms/BookCard";
import { useLibraryStore } from "@/stores/library/store";
import { useLibraryView } from "@/stores/library-view/store";

// Only Chromium reads `DownloadURL`; it is also the only engine with
// `navigator.userAgentData`. Elsewhere a cover drags nothing at all rather
// than its image as web content.
const supportsDownloadUrlDrag = () =>
	typeof navigator !== "undefined" && "userAgentData" in navigator;

export interface BookGridInteraction {
	cardActions: BookCardActions;
	menu: ContextMenuController;
	/** A click on the grid's empty space clears the selection. */
	onBackgroundClick: (event: React.MouseEvent) => void;
	/** The Menu key or Shift-F10 on the grid: the menu for the cursor's book. */
	onGridContextMenu: (event: React.MouseEvent) => void;
}

/**
 * How the cover grid answers the pointer: what a click, ⌘-click, ⇧-click,
 * double-click, right-click and drag do on this platform.
 */
export const useBookGridInteraction = (
	books: readonly (LibraryBook | undefined)[],
): BookGridInteraction => {
	const platform = usePlatform();
	const menu = useContextMenu();
	const selectionActions = useBookSelectionActions();
	const latest = useRef({ books, platform, menu, selectionActions });
	latest.current = { books, platform, menu, selectionActions };

	const cardActions = useMemo<BookCardActions>(
		() => ({
			onPress: (index, book, modifiers) => {
				const { books, platform } = latest.current;
				const intent = bookClickIntent(modifiers, {
					clickSelects: platform.capabilities.supportsNativeWindows,
					isMac: platform.os === "macos",
				});
				updateBookSelection((selection) => {
					switch (intent) {
						case "toggle":
							return toggleBook(selection, index, book.id);
						case "extend":
							return extendSelection(selection, index, books);
						default:
							return selectOnly(index, book.id);
					}
				});
				if (intent === "open") openBookDetails(book);
			},

			onContextMenu: (event, index, book) => {
				const { books, platform, menu, selectionActions } = latest.current;
				updateBookSelection((selection) =>
					selectForContextMenu(selection, index, book.id),
				);
				const library = useLibraryStore.getState();
				const context = bookMenuContext({
					selection: useBookSelectionStore.getState().selection,
					books,
					total: library.bookCache.total ?? books.length,
					hideRead: useLibraryView.getState().hideRead,
					canEdit: library.library?.readOnly === false,
					platform,
				});
				const env = {
					os: platform.os,
					desktop: platform.capabilities.supportsNativeWindows,
				};
				const items: ContextMenuEntry[] = bookMenuEntries(context).map(
					(entry) => {
						if (entry.type === "separator") return entry;
						const hint = bookShortcutHint(entry.id, env);
						return {
							...entry,
							...(hint && { shortcut: hint.label, keyShortcuts: hint.aria }),
							onSelect: () => selectionActions.run(entry.id),
						};
					},
				);
				menu.openAt(
					event,
					items,
					context.selectedCount === 1 ? book.title : "Book actions",
				);
			},

			onDragStart: (event, index, book) => {
				const { books, platform } = latest.current;
				updateBookSelection((selection) =>
					selectForContextMenu(selection, index, book.id),
				);
				const dragged = selectedBooks(
					useBookSelectionStore.getState().selection,
					books,
				);
				if (platform.capabilities.canDragFilesOut) {
					event.preventDefault();
					const paths = dragged.flatMap((candidate) => {
						const path = primaryLocalPath(candidate);
						return path !== null ? [path] : [];
					});
					if (paths.length === 0) return;
					const thumb = useLibraryStore.getState().coverThumbs.get(book.id);
					void platform.window
						.startDrag(paths, dragIconPath(book, thumb) ?? undefined)
						.catch((error: unknown) => console.error(error));
					return;
				}
				const remote = primaryRemoteFile(book);
				if (remote === null || !supportsDownloadUrlDrag()) {
					event.preventDefault();
					return;
				}
				dragOutGuard.begin();
				event.currentTarget.addEventListener(
					"dragend",
					() => dragOutGuard.end(),
					{ once: true },
				);
				event.dataTransfer.effectAllowed = "copy";
				event.dataTransfer.setData("DownloadURL", downloadUrlDragData(remote));
				event.dataTransfer.setData("text/uri-list", remote.url);
			},
		}),
		[],
	);

	const onGridContextMenu = (event: React.MouseEvent) => {
		if (event.defaultPrevented || !fromKeyboard(event)) return;
		const { cursor } = useBookSelectionStore.getState().selection;
		const book = cursor >= 0 ? books[cursor] : undefined;
		if (book === undefined) return;
		const card = document
			.getElementById(bookCardDomId(book.id))
			?.querySelector("img, [style]");
		const rect = card?.getBoundingClientRect() ?? null;
		cardActions.onContextMenu(contextMenuPoint(event, rect), cursor, book);
	};

	const onBackgroundClick = (event: React.MouseEvent) => {
		if (!(event.target instanceof Element)) return;
		if (event.target.closest("[data-book-id], button, a, input, label")) return;
		updateBookSelection(clearSelection);
	};

	return { cardActions, menu, onBackgroundClick, onGridContextMenu };
};
