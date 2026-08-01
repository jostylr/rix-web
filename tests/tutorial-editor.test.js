import { describe, expect, test } from "bun:test";
import { applyTutorialEditorKey } from "../src/tutorial-editor.js";

describe("tutorial editor keys", () => {
    test("Enter carries forward the line indentation", () => {
        expect(applyTutorialEditorKey("callout:\n    exact", 18, 18, { key: "Enter" })).toEqual({
            value: "callout:\n    exact\n    ", start: 23, end: 23,
        });
    });

    test("Tab and Shift-Tab indent and deindent selected lines", () => {
        const indented = applyTutorialEditorKey("one\ntwo", 0, 7, { key: "Tab" });
        expect(indented).toEqual({ value: "    one\n    two", start: 4, end: 15 });
        expect(applyTutorialEditorKey(indented.value, indented.start, indented.end, { key: "Tab", shiftKey: true }))
            .toEqual({ value: "one\ntwo", start: 0, end: 7 });
    });

    test("Tab at a cursor inserts indentation while Shift-Tab removes it", () => {
        expect(applyTutorialEditorKey("item", 2, 2, { key: "Tab" })).toEqual({ value: "it    em", start: 6, end: 6 });
        expect(applyTutorialEditorKey("    item", 6, 6, { key: "Tab", shiftKey: true }))
            .toEqual({ value: "item", start: 2, end: 2 });
    });
});
