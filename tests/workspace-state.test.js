import { expect, test } from "bun:test";
import {
    ClearCoordinator,
    createSessionSnapshot,
    modePresentation,
    parseSession,
    serializePortableSession,
    serializeSession,
} from "../src/workspace-state.js";
import { createRixRepl } from "../src/repl-runtime.js";

test("RiX session files preserve commands, draft input, mode, settings, and dashboard state", () => {
    const saved = serializeSession({
        transcript: [{ source: "x := 1/3", text: "1/3" }],
        input: "x + 1",
        scriptMode: true,
        autoSeparateLines: false,
        numberConfig: { input: "x", display: ".[12],.." },
        reactiveInputs: [{ name: "width", source: "7/2" }],
        dashboardOpen: true,
        pluginProfile: { name: "standard-v1", plugins: ["numerics"], source: '.Plugin.Load("numerics"); .numerics[:Exp];' },
        savedAt: "2026-08-15T12:00:00.000Z",
    });

    expect(parseSession(saved)).toEqual(createSessionSnapshot({
        transcript: [{ source: "x := 1/3", text: "1/3" }],
        input: "x + 1",
        scriptMode: true,
        autoSeparateLines: false,
        numberConfig: { input: "x", display: ".[12],.." },
        reactiveInputs: [{ name: "width", source: "7/2" }],
        dashboardOpen: true,
        pluginProfile: { name: "standard-v1", plugins: ["numerics"], source: '.Plugin.Load("numerics"); .numerics[:Exp];' },
        savedAt: "2026-08-15T12:00:00.000Z",
    }));
    expect(() => parseSession('{"format":"something-else","version":1}')).toThrow("not a RiX Web session");
});

test("portable session export embeds its profile and replays only executable RiX", () => {
    const source = serializePortableSession({
        transcript: [
            { source: "x := Exp(2)", text: "..." },
            { source: ".vars", text: "x" },
        ],
        input: "x + 1",
        numberConfig: { input: "z[10]", display: ".[12],.." },
        reactiveInputs: [{ name: "width", source: "7/2" }],
        pluginProfile: {
            name: "standard-v1",
            plugins: ["numerics"],
            source: '.Plugin.Load("numerics"); .numerics[:Exp];',
        },
    });

    expect(source).toContain("plugins: [numerics]");
    expect(source).toContain("## RIX-WEB-PROFILE-BEGIN standard-v1");
    expect(source).toContain('.numerics[:Exp]');
    expect(source).toContain("x := Exp(2);");
    expect(source).not.toContain("\n.vars;");
    expect(source).toContain("$width := 7/2;");
    expect(source).toContain("## x + 1");
});

test("saved command history and reactive input snapshots rebuild calculator state", async () => {
    const session = parseSession(serializeSession({
        transcript: [
            { source: "third := 1/3", text: "1/3" },
            { source: "$$width := .Slider(2, 0:10, 1/2, \"Width\")", text: "2" },
        ],
        reactiveInputs: [{ name: "width", source: "7/2" }],
    }));
    const repl = createRixRepl();

    for (const entry of session.transcript) expect((await repl.runAsync(entry.source)).type).toBe("result");
    for (const reactive of session.reactiveInputs) {
        expect((await repl.runAsync(`$${reactive.name} := ${reactive.source}`)).type).toBe("result");
    }

    expect(repl.run("third + $width").text).toBe("3..5/6");
    await repl.dispose();
});

test("Clear requires a deliberate second action before resetting the session", () => {
    const clear = new ClearCoordinator();
    expect(clear.activate(true)).toBe("clear-input");
    expect(clear.armed).toBe(true);
    expect(clear.activate(false)).toBe("clear-session");
    expect(clear.armed).toBe(false);

    expect(clear.activate(false)).toBe("confirm-session");
    clear.reset();
    expect(clear.armed).toBe(false);
});

test("input mode presentation clearly distinguishes calculator and script entry", () => {
    expect(modePresentation(false)).toMatchObject({
        buttonLabel: "Input: Calculator",
        status: expect.stringContaining("Enter runs"),
    });
    expect(modePresentation(true)).toMatchObject({
        buttonLabel: "Input: Script",
        status: expect.stringContaining("adds a line"),
    });
});
