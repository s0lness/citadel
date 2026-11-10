import type { Meta, StoryObj } from "@storybook/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { PlatformProvider } from "@/lib/platform/context";
import { createWebPlatform } from "@/lib/platform/create";
import type { Library } from "@/lib/services/library";
import { LibraryState, useLibraryStore } from "@/stores/library/store";
import { Authors } from "./Authors";

const Frame = () => {
	useLibraryStore.setState({
		library: { readOnly: false } as Library,
		libraryState: LibraryState.ready,
		authorsLoading: false,
		authors: [
			{ id: "a1", name: "George Eliot", sortable_name: "Eliot, George", book_count: 3 },
			{ id: "a2", name: "Nobody Yet", sortable_name: "Yet, Nobody", book_count: 0 },
		],
	} as never);
	const router = createRouter({ routeTree: createRootRoute({ component: Authors }), history: createMemoryHistory() });
	return (
		<PlatformProvider value={createWebPlatform()}>
			<RouterProvider router={router} />
		</PlatformProvider>
	);
};
const meta: Meta<typeof Frame> = { title: "Tmp/AuthorsD", component: Frame };
export default meta;
export const Default: StoryObj<typeof Frame> = {};
