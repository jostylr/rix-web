import { describe, expect, test } from "bun:test";
import { createNewGeometryBoard, NEW_GEOMETRY_BOARD_SOURCE } from "../src/geometry-board.js";
import { isInteractiveOutputEvent } from "../src/interactive-output.js";
import { createRixRepl } from "../src/repl-runtime.js";

describe("first-class geometry board", () => {
    test("opens a live blank authoring workbench", () => {
        const repl = createRixRepl();
        const result = repl.run(NEW_GEOMETRY_BOARD_SOURCE);
        expect(result.type, result.text).toBe("result");
        expect(result.value.kind).toBe("graphic");
        expect(result.text).toContain("Geometry workbench");
        expect(typeof result.observe).toBe("function");
        expect(NEW_GEOMETRY_BOARD_SOURCE).toContain("geometry-author-1-constrained-move");
        result.dispose();
    });

    test("creates independent boards in one evaluation session", () => {
        const repl = createRixRepl();
        const first = createNewGeometryBoard(1);
        const second = createNewGeometryBoard(2);
        expect(repl.run(first.source).type).toBe("result");
        expect(repl.run(second.source).type).toBe("result");
        expect(first.pointActionId).not.toBe(second.pointActionId);
    });

    test("interactive descendants do not activate output inspection", () => {
        const button = {};
        const target = { closest: () => button };
        const output = { contains: (candidate) => candidate === button };
        expect(isInteractiveOutputEvent({ target }, output)).toBe(true);
        expect(isInteractiveOutputEvent({ target: { closest: () => null } }, output)).toBe(false);
        expect(isInteractiveOutputEvent({ target }, { contains: () => false })).toBe(false);
    });
});
