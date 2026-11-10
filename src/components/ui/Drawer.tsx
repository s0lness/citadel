import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import { DialogCloseButton } from "./DialogCloseButton";
import styles from "./Drawer.module.css";
import { ignorePopoverInteractOutside } from "./popover-interop";

export const DrawerPlacement = {
	/** Modal, over the whole window, behind a scrim. */
	window: "window",
	/**
	 * Non-modal, inside the page that renders it: the page places it (and
	 * the scrim, if any) with `className`/`scrimClassName`; toolbar and
	 * sidebar stay usable, and only a press on the scrim or Escape closes it.
	 */
	panel: "panel",
} as const;

export type DrawerPlacement =
	(typeof DrawerPlacement)[keyof typeof DrawerPlacement];

export interface DrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	children: ReactNode;
	width?: number;
	/**
	 * Drawers are usually opened programmatically (no Dialog.Trigger), so Radix
	 * has no trigger to return focus to on close. Callers should preventDefault
	 * here and refocus the control that opened the drawer.
	 */
	onCloseAutoFocus?: (event: Event) => void;
	/**
	 * Radix autofocuses the first focusable element — the header close button.
	 * Callers can preventDefault here and focus a more useful default.
	 */
	onOpenAutoFocus?: (event: Event) => void;
	/**
	 * Content runs to the drawer's edges and under the close button, for a
	 * header with its own background; the content sets its own padding.
	 */
	bleed?: boolean;
	placement?: DrawerPlacement;
	/** Panel placement: positions the drawer within its page. */
	className?: string;
	/** Panel placement: positions a scrim that closes the drawer on a press. */
	scrimClassName?: string;
	/** Panel placement: a resize handle on the drawer's leading edge. */
	resizeHandleProps?: HTMLAttributes<HTMLDivElement>;
	contentRef?: Ref<HTMLDivElement>;
}

const preventDefault = (event: Event) => event.preventDefault();

/** A right-edge slide-over panel, e.g. for book details. */
export const Drawer = ({
	placement = DrawerPlacement.window,
	...props
}: DrawerProps) =>
	placement === DrawerPlacement.panel ? (
		<PanelDrawer {...props} />
	) : (
		<WindowDrawer {...props} />
	);

const WindowDrawer = ({
	open,
	onOpenChange,
	title,
	children,
	width = 420,
	onCloseAutoFocus,
	onOpenAutoFocus,
	bleed = false,
	contentRef,
}: DrawerProps) => (
	<Dialog.Root open={open} onOpenChange={onOpenChange}>
		<Dialog.Portal>
			<Dialog.Overlay className={styles.overlay} />
			{/* No Dialog.Description; aria-describedby={undefined} silences the Radix warning. */}
			<Dialog.Content
				ref={contentRef}
				className={clsx(styles.content, styles.window)}
				data-drawer=""
				data-bleed={bleed || undefined}
				style={{ width: `min(${width}px, calc(100vw - 32px))` }}
				aria-describedby={undefined}
				onCloseAutoFocus={onCloseAutoFocus}
				onOpenAutoFocus={onOpenAutoFocus}
				onPointerDownOutside={ignorePopoverInteractOutside}
				onInteractOutside={ignorePopoverInteractOutside}
			>
				<DrawerHeader title={title} />
				<div className={clsx(styles.body, "ctd-scroller")}>{children}</div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
);

const PanelDrawer = ({
	open,
	onOpenChange,
	title,
	children,
	width = 420,
	onCloseAutoFocus,
	onOpenAutoFocus,
	bleed = false,
	className,
	scrimClassName,
	resizeHandleProps,
	contentRef,
}: DrawerProps) => (
	<Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
		{scrimClassName !== undefined && (
			<button
				type="button"
				tabIndex={-1}
				aria-hidden={!open || undefined}
				aria-label="Close Details"
				className={clsx(styles.panelScrim, scrimClassName)}
				data-state={open ? "open" : "closed"}
				onClick={() => onOpenChange(false)}
			/>
		)}
		<Dialog.Content
			ref={contentRef}
			className={clsx(styles.content, styles.panel, className)}
			data-drawer=""
			data-bleed={bleed || undefined}
			style={{ "--drawer-width": `${width}px` } as CSSProperties}
			aria-describedby={undefined}
			onCloseAutoFocus={onCloseAutoFocus}
			onOpenAutoFocus={onOpenAutoFocus}
			// Presses on the toolbar, sidebar or search keep the drawer open;
			// the scrim over the grid is what closes it.
			onInteractOutside={preventDefault}
		>
			{resizeHandleProps && (
				<div className={styles.resizer} {...resizeHandleProps} />
			)}
			<DrawerHeader title={title} />
			<div className={styles.panelBody}>{children}</div>
		</Dialog.Content>
	</Dialog.Root>
);

const DrawerHeader = ({ title }: { title?: string }) => (
	<div className={styles.header}>
		{title ? (
			<Dialog.Title className={styles.title}>{title}</Dialog.Title>
		) : (
			// Radix requires a Title for screen readers even when the
			// drawer has no visible heading.
			<Dialog.Title className={styles.hiddenTitle}>Details</Dialog.Title>
		)}
		<Dialog.Close asChild>
			<DialogCloseButton />
		</Dialog.Close>
	</div>
);
