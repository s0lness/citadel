import { type RefObject, useEffect, useState } from "react";
import {
	type EdgeResize,
	ResizeEdge,
	useEdgeResize,
} from "@/lib/hooks/use-edge-resize";
import {
	BOOK_DRAWER_WIDTH,
	bookDrawerMaxWidth,
	useBookDrawer,
} from "@/stores/book-drawer/store";

const useElementWidth = (
	ref: RefObject<HTMLElement | null>,
	active: boolean,
): number | null => {
	const [width, setWidth] = useState<number | null>(null);
	useEffect(() => {
		const element = ref.current;
		if (!active || !element) return;
		setWidth(element.clientWidth);
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(() => setWidth(element.clientWidth));
		observer.observe(element);
		return () => observer.disconnect();
	}, [ref, active]);
	return width;
};

/**
 * The book drawer's left edge. The width shown never exceeds 70% of the
 * panel the drawer sits in (`panelRef`); a drag past that stops there, so
 * the stored width is always one the user saw.
 */
export const useBookDrawerResize = (
	panelRef: RefObject<HTMLElement | null>,
	open: boolean,
): EdgeResize => {
	const stored = useBookDrawer((s) => s.width);
	const setStored = useBookDrawer((s) => s.setWidth);
	const resetWidth = useBookDrawer((s) => s.resetWidth);
	const max = bookDrawerMaxWidth(useElementWidth(panelRef, open));
	return useEdgeResize({
		width: Math.min(stored, max),
		min: BOOK_DRAWER_WIDTH.min,
		max,
		step: BOOK_DRAWER_WIDTH.step,
		edge: ResizeEdge.left,
		label: "Resize Details",
		setWidth: (width) => setStored(Math.min(width, max)),
		resetWidth,
	});
};
