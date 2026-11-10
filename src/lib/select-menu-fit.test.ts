import { describe, expect, it } from "vitest";
import { unclippedMenuHeight } from "./select-menu-fit";

const near = {
	top: 10,
	height: 76,
	fullHeight: 99,
	viewportHeight: 700,
	scrollTop: 24,
};

describe("unclippedMenuHeight", () => {
	it("grows a short menu that was shortened and scrolled near the top", () => {
		expect(unclippedMenuHeight(near)).toBe(99);
	});

	it("unscrolls a menu that is tall enough but kept its scroll", () => {
		expect(unclippedMenuHeight({ ...near, height: 99 })).toBe(99);
	});

	it("leaves a menu that already shows every item", () => {
		expect(
			unclippedMenuHeight({ ...near, height: 99, scrollTop: 0 }),
		).toBeNull();
	});

	it("leaves a long list scrolling when it can't fit below its top", () => {
		expect(
			unclippedMenuHeight({ ...near, fullHeight: 900, height: 680 }),
		).toBeNull();
		expect(
			unclippedMenuHeight({ ...near, top: 640, viewportHeight: 700 }),
		).toBeNull();
	});
});
