import { useCallback, useRef, useState } from "react";
import { SIDEBAR_WIDTH, useSidebar } from "@/stores/sidebar/store";

export interface SidebarResize {
	width: number;
	/** A drag is under way; width changes then should not animate. */
	resizing: boolean;
	handleProps: {
		role: "separator";
		tabIndex: 0;
		"aria-orientation": "vertical";
		"aria-label": string;
		"aria-valuemin": number;
		"aria-valuemax": number;
		"aria-valuenow": number;
		onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
		onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
		onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
		onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
		onDoubleClick: () => void;
		onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
	};
}

const KEY_STEPS: Record<string, number> = {
	ArrowLeft: -SIDEBAR_WIDTH.step,
	ArrowRight: SIDEBAR_WIDTH.step,
};

/**
 * The sidebar's edge: drag to resize, double-click to reset, and arrow keys
 * (Home/End for the limits) when the handle has focus.
 */
export const useSidebarResize = (): SidebarResize => {
	const width = useSidebar((s) => s.width);
	const setWidth = useSidebar((s) => s.setWidth);
	const resetWidth = useSidebar((s) => s.resetWidth);
	const [resizing, setResizing] = useState(false);
	const start = useRef<{ x: number; width: number } | null>(null);

	const onPointerDown = useCallback(
		(event: React.PointerEvent<HTMLElement>) => {
			if (event.button !== 0) return;
			event.preventDefault();
			event.currentTarget.setPointerCapture(event.pointerId);
			start.current = { x: event.clientX, width };
			setResizing(true);
		},
		[width],
	);

	const onPointerMove = useCallback(
		(event: React.PointerEvent<HTMLElement>) => {
			if (!start.current) return;
			setWidth(start.current.width + event.clientX - start.current.x);
		},
		[setWidth],
	);

	const end = useCallback((event: React.PointerEvent<HTMLElement>) => {
		if (!start.current) return;
		start.current = null;
		setResizing(false);
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	}, []);

	const onKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLElement>) => {
			const step = KEY_STEPS[event.key];
			if (step !== undefined) {
				event.preventDefault();
				setWidth(width + (event.shiftKey ? step * 5 : step));
			} else if (event.key === "Home") {
				event.preventDefault();
				setWidth(SIDEBAR_WIDTH.min);
			} else if (event.key === "End") {
				event.preventDefault();
				setWidth(SIDEBAR_WIDTH.max);
			}
		},
		[setWidth, width],
	);

	return {
		width,
		resizing,
		handleProps: {
			role: "separator",
			tabIndex: 0,
			"aria-orientation": "vertical",
			"aria-label": "Resize Sidebar",
			"aria-valuemin": SIDEBAR_WIDTH.min,
			"aria-valuemax": SIDEBAR_WIDTH.max,
			"aria-valuenow": width,
			onPointerDown,
			onPointerMove,
			onPointerUp: end,
			onPointerCancel: end,
			onDoubleClick: resetWidth,
			onKeyDown,
		},
	};
};
