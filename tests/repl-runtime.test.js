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
