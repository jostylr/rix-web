import { expect, test } from "bun:test";
import {
    Context,
    createDefaultRegistry,
    createDefaultSystemContext,
    formatValue,
    parseAndEvaluate,
} from "../../rix/src/index.js";
import { normalizeReplSource } from "../src/repl-source.js";
import { createRixRepl } from "../src/repl-runtime.js";
import { tutorials } from "../src/tutorial-index.js";

test("the web REPL runtime keeps its RiX context between cells", () => {
    const context = new Context();
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

test("the web REPL returns structured HTML for portable output values", () => {
    const repl = createRixRepl();
    const response = repl.run(".Algebra.SyntheticDivision(1, [2, -6, 2, -1])");

    expect(response.type).toBe("result");
    expect(response.html).toContain("rix-output-grid");
    expect(response.html).toContain("rix-grid-rule-top");
    expect(response.text).toContain("-3");
});

test("the web REPL catalogs bundled plugins and loads approved JavaScript on demand", () => {
    const repl = createRixRepl();

    expect(repl.run('.Plugin.List()').text).toContain("approx-math-js");
    expect(repl.run(".float(1 / 3)").type).toBe("error");
    expect(repl.run('.Plugin.Load("approx-math-js")').type).toBe("result");
    expect(repl.run(".float(1 / 3)").text).toBe("0.3333333333333333");
    expect(repl.run(".float(1 / 3) * .float(3)").text).toBe("1");
    expect(repl.run(".float(1 / 2) + 2").text).toBe("2.5");
    expect(repl.run(".float.Round(.float(1 / 3), 2)").text).toBe("33/100");
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

test("automatic top-level line separation can be disabled for script parity", () => {
    const repl = createRixRepl({ autoSeparateLines: false });
    const source = `value := 2
value`;

    expect(repl.run(source).type).toBe("error");

    repl.setAutoSeparateLines(true);
    expect(repl.run(source).text).toBe("2");
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

test("a dot-prefixed system call starts a new notebook statement", () => {
    const repl = createRixRepl();
    const response = repl.run(`grid := 0:1 :: 5
.RandomSeed(7)
0:1 :% (1, 1000)`);

    expect(response.type).toBe("result");
    expect(response.text).toBe("11/1000");
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

test("the web REPL exposes contextual completion without evaluating the draft", () => {
    const repl = createRixRepl();
    repl.run("values := [1, 2, 3]");
    const result = repl.complete("values.");

    expect(result.candidates.some((candidate) => candidate.kind === "method")).toBe(true);
    expect(result.candidates.map((candidate) => candidate.insertText)).toContain("_proto");
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
