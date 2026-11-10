import {
	createRootRoute,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import clsx from "clsx";
import { type CSSProperties, useState } from "react";
import { F7SidebarLeft } from "@/components/icons/F7SidebarLeft";
import { ServerUpdatedBanner } from "@/components/molecules/ServerUpdatedBanner";
import { AddBookButton, AddBookProvider } from "@/components/organisms/AddBook";
import {
	BookUploads,
	UploadToolbarStatus,
} from "@/components/organisms/BookUploads";
import { Sidebar } from "@/components/organisms/Sidebar";
import { IconButton, Tooltip } from "@/components/ui";
import { useAppKeymap } from "@/lib/hooks/use-app-keymap";
import { useNativeThemeSync } from "@/lib/hooks/use-native-theme-sync";
import { useServerUpdatedNotice } from "@/lib/hooks/use-server-updated-notice";
import { useSidebarResize } from "@/lib/hooks/use-sidebar-resize";
import { useWindowChromeState } from "@/lib/hooks/use-window-chrome-state";
import { usePlatform } from "@/lib/platform/context";
import { useSidebar } from "@/stores/sidebar/store";
import classes from "./root.module.css";

interface SidebarToggleProps {
	open: boolean;
	onToggle: () => void;
	className?: string;
}

const SidebarToggle = ({ open, onToggle, className }: SidebarToggleProps) => {
	const label = open ? "Hide Sidebar" : "Show Sidebar";
	return (
		<Tooltip label={label}>
			<IconButton
				aria-label={label}
				aria-expanded={open}
				className={clsx(classes.sidebarToggle, className)}
				onClick={onToggle}
			>
				<F7SidebarLeft aria-hidden="true" />
			</IconButton>
		</Tooltip>
	);
};

const Root = () => {
	// The phone sidebar belongs to the page it was opened on: going anywhere
	// closes it.
	const [mobileOpenedOn, setMobileOpenedOn] = useState<string | null>(null);
	const desktopOpened = useSidebar((s) => s.visible);
	const toggleSidebar = useSidebar((s) => s.toggleSidebar);
	const resize = useSidebarResize();
	const { location } = useRouterState();
	const platform = usePlatform();
	const isDesktop = platform.capabilities.supportsNativeWindows;
	const serverUpdated = useServerUpdatedNotice(!isDesktop);
	const mobileOpened = mobileOpenedOn === location.href;
	useNativeThemeSync();
	useWindowChromeState();
	// Self-disables in the settings window (/settings pathname check inside).
	useAppKeymap();

	// The desktop settings window loads /settings in its own webview; it
	// brings its own full-window layout and must not inherit the library
	// chrome (toolbar, sidebar, Add Book). On the web, Settings is a page of
	// the app like any other.
	if (isDesktop && location.pathname.startsWith("/settings")) {
		return <Outlet />;
	}

	return (
		<AddBookProvider>
			<div
				className={classes.shell}
				data-sidebar-open={desktopOpened || undefined}
				data-sidebar-resizing={resize.resizing || undefined}
				data-mobile-sidebar-open={mobileOpened || undefined}
				style={{ "--sidebar-width": `${resize.width}px` } as CSSProperties}
			>
				<header className={classes.header} data-tauri-drag-region>
					<div className={classes.headerControls} data-tauri-drag-region>
						<SidebarToggle
							open={mobileOpened}
							className={classes.mobileOnly}
							onToggle={() =>
								setMobileOpenedOn(mobileOpened ? null : location.href)
							}
						/>
						<SidebarToggle
							open={desktopOpened}
							className={classes.desktopOnly}
							onToggle={toggleSidebar}
						/>
						<AddBookButton />
						<UploadToolbarStatus />
					</div>
				</header>

				<div className={classes.body}>
					<nav
						className={classes.nav}
						aria-label="Sidebar"
						data-closed={!desktopOpened || undefined}
					>
						<div className={classes.navInner}>
							<Sidebar />
						</div>
						<div className={classes.resizer} {...resize.handleProps} />
					</nav>
					{mobileOpened && (
						<button
							type="button"
							tabIndex={-1}
							aria-label="Close sidebar"
							className={classes.scrim}
							onClick={() => setMobileOpenedOn(null)}
						/>
					)}

					<main className={classes.main}>
						<div className={classes.content}>
							<Outlet />
						</div>
					</main>
				</div>
			</div>
			<BookUploads />
			{serverUpdated.build && (
				<ServerUpdatedBanner
					onReload={serverUpdated.reload}
					onDismiss={serverUpdated.dismiss}
				/>
			)}
		</AddBookProvider>
	);
};

export const Route = createRootRoute({
	component: Root,
});
