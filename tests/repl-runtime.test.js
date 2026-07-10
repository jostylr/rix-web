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
