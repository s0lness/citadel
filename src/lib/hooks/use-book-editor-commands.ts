import { useEffect, useRef } from "react";
import { menuBarOwnsChords } from "@/lib/app-shortcuts";
import { useKeymap } from "@/lib/hooks/use-keymap";
import type { KeyBinding } from "@/lib/keymap";
import { usePlatform } from "@/lib/platform/context";
import {
	registerBookEditor,
	unregisterBookEditor,
} from "@/stores/book-editor/store";

interface BookEditorCommandsOptions {
	canUndo: boolean;
	undo: () => void;
	save: () => void;
}

/**
 * The book editor's keys: ⌘S (Ctrl+S) saves on every platform, never the
 * browser's Save Page. Undo outside a text field steps back the editor's
 * saves: from Edit > Undo in the macOS menu bar, from ⌘Z/Ctrl+Z elsewhere.
 * Text fields keep their own typing undo.
 */
export const useBookEditorCommands = ({
	canUndo,
	undo,
	save,
}: BookEditorCommandsOptions) => {
	const platform = usePlatform();
	const latest = useRef({ undo, save });
	latest.current = { undo, save };

	useEffect(() => {
		registerBookEditor({ canUndo, undo: () => latest.current.undo() });
	}, [canUndo]);
	useEffect(() => unregisterBookEditor, []);

	const bindings: KeyBinding[] = [
		{
			chord: "mod+s",
			allowInEditable: true,
			onMatch: () => latest.current.save(),
		},
	];
	const menuBar = menuBarOwnsChords({
		os: platform.os,
		desktop: platform.capabilities.supportsNativeWindows,
	});
	if (!menuBar && canUndo) {
		bindings.push({ chord: "mod+z", onMatch: () => latest.current.undo() });
	}
	useKeymap(bindings);
};
