import { useEffect, useRef, useState } from "react";
import { unclippedMenuHeight } from "@/lib/select-menu-fit";

const px = (value: string) => Number.parseFloat(value) || 0;

const nextFrame = () =>
	new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Shows a short pop-up menu whole once Radix has placed it. */
const fitMenu = (viewport: HTMLElement) => {
	const content = viewport.parentElement;
	const wrapper = content?.parentElement;
	if (!content || !wrapper) return;
	// Radix grows a bottom-anchored menu upwards itself; only a menu pinned
	// to the top edge gets shortened.
	if (wrapper.style.bottom === "0px") return;
	const style = window.getComputedStyle(content);
	const fullHeight =
		px(style.borderTopWidth) +
		px(style.paddingTop) +
		viewport.scrollHeight +
		px(style.paddingBottom) +
		px(style.borderBottomWidth);
	const rect = wrapper.getBoundingClientRect();
	const height = unclippedMenuHeight({
		top: rect.top,
		height: content.getBoundingClientRect().height,
		fullHeight,
		viewportHeight: window.innerHeight,
		scrollTop: viewport.scrollTop,
	});
	if (height === null) return;
	wrapper.style.height = `${height}px`;
	viewport.scrollTop = 0;
};

/**
 * Open state and a viewport ref for `Select`: once the menu is placed, a
 * short list that Radix shortened near the top of the window shows whole
 * (see `unclippedMenuHeight`).
 */
export const useSelectMenuFit = () => {
	const [open, setOpen] = useState(false);
	const viewportRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		void (async () => {
			await nextFrame();
			await nextFrame();
			const viewport = viewportRef.current;
			if (!cancelled && viewport) fitMenu(viewport);
		})();
		return () => {
			cancelled = true;
		};
	}, [open]);

	return { open, onOpenChange: setOpen, viewportRef };
};
