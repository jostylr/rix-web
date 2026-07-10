import { expect, test } from "bun:test";
import {
    Context,
    createDefaultRegistry,
    createDefaultSystemContext,
    formatValue,
    parseAndEvaluate,
} from "../../rix/src/index.js";
import { installSymbolicBindings } from "../../rix/src/eval/functions/symbolic.js";
import { normalizeReplSource } from "../src/repl-source.js";
import { createRixRepl } from "../src/repl-runtime.js";
import { tutorials } from "../src/tutorial-index.js";

test("the web REPL runtime keeps its RiX context between cells", () => {
    const context = new Context();
    installSymbolicBindings(context);
    const options = {
        context,
        registry: createDefaultRegistry(),
        systemContext: createDefaultSystemContext(),
    };

    const result = parseAndEvaluate(normalizeReplSource(`radius := 7
area := radius ^ 2 * 22 / 7
area`), options);

    expect(formatValue(result)).toBe("154");
    expect(context.getAllNames()).toContain("radius");
    expect(context.getAllNames()).toContain("area");
});

test("notebook newlines leave nested and continued expressions alone", () => {
    const source = `values := [
  1,
  2
]
total := 3 +
  4
total`;

    expect(normalizeReplSource(source)).toBe(`values := [
  1,
  2
];
total := 3 +
  4;
total`);
});

test("notebook newlines separate statements following a sigil container", () => {
    const repl = createRixRepl();
    const response = repl.run(`warm := {| 1, 2 |}
cool := {| 2, 3 |}
warm.Union(cool)`);
    expect(response.type).toBe("result");
    expect(response.text).toBe("{| 1, 2, 3 |}");
});

test("a standalone null ends a notebook statement", () => {
    const repl = createRixRepl();
    const response = repl.run(`reading := _
bounds := 18:22
bounds`);

    expect(response.type).toBe("result");
    expect(response.text).toBe("18:22");
});

test(".Help(topic) returns matching inline RiX REPL help", () => {
    const repl = createRixRepl();
    const response = repl.run('.Help("interval")');

    expect(response.type).toBe("help");
    expect(response.groups.flatMap((group) => group.items).some(([syntax]) => syntax === "2:5")).toBe(true);
});

test("a fresh RatCalc session does not expose host symbolic bindings as variables", () => {
    const repl = createRixRepl();
    expect(repl.variables()).toEqual([]);
    repl.run("radius := 7");
    expect(repl.variables().map(({ name }) => name)).toEqual(["radius"]);
});

test("every indexed tutorial has a Markdown source file", async () => {
    for (const tutorial of tutorials) {
        const source = Bun.file(new URL(`../tutorials/${tutorial.file.replace(/\.html$/, ".md")}`, import.meta.url));
        expect(await source.exists(), `lesson ${tutorial.number}`).toBe(true);
    }
});

test("every published RiX tutorial cell executes", async () => {
    for (const tutorial of tutorials) {
        const source = await Bun.file(new URL(`../tutorials/${tutorial.file.replace(/\.html$/, ".md")}`, import.meta.url)).text();
        const cells = source.matchAll(/(?:~~~|```)rix\n([\s\S]*?)\n(?:~~~|```)/g);
        for (const [, code] of cells) {
            const response = createRixRepl().run(code);
            expect(response.type, `lesson ${tutorial.number}: ${response.text}`).toBe("result");
        }
    }
});
