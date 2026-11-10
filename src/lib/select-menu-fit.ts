/** Radix Select keeps its item-aligned menu this far from the window edges. */
export const MENU_MARGIN_PX = 10;

export interface MenuFitInput {
	/** The menu's top edge, in the viewport. */
	top: number;
	/** The menu's height now. */
	height: number;
	/** The height it needs to show every item without scrolling. */
	fullHeight: number;
	/** `window.innerHeight`. */
	viewportHeight: number;
	/** How far its list is scrolled. */
	scrollTop: number;
}

/**
 * The height an open pop-up menu should grow to so every item shows, or
 * null when it already does or can't.
 *
 * Near the top of the window Radix can't line the chosen item up with the
 * button, so it shortens the menu and scrolls the list to keep the item
 * there, relying on a min-height to undo that for short lists. WebKit keeps
 * the scroll (and the short menu), so a four-item menu opened with "Author
 * (Z–A)" chosen showed three items and a scroll arrow. A short list that
 * fits below its top edge should simply show whole.
 */
export const unclippedMenuHeight = ({
	top,
	height,
	fullHeight,
	viewportHeight,
	scrollTop,
}: MenuFitInput): number | null => {
	const clipped = height + 0.5 < fullHeight || scrollTop > 0;
	if (!clipped) return null;
	const room = viewportHeight - MENU_MARGIN_PX - top;
	return fullHeight <= room ? Math.ceil(fullHeight) : null;
};
