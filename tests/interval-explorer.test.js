import { expect, test } from "bun:test";
import { analyzeIntervalExpression, isRationalIntervalValue } from "../src/interval-explorer.js";
import { createRixRepl } from "../src/repl-runtime.js";

test("interval explorer derives exact top-level arithmetic provenance in the active session", () => {
    const repl = createRixRepl();
    repl.run("left := 1/3:2/3");
    repl.run("right := 3/2:2");
    const provenance = analyzeIntervalExpression("left * right", (source) => repl.run(source));

    expect(provenance.operator).toBe("*");
    expect(provenance.left.source).toBe("left");
    expect(provenance.right.source).toBe("right");
    expect(provenance.left.value.start.toString()).toBe("1/3");
    expect(provenance.right.value.end.toString()).toBe("2");
});

test("interval explorer ignores non-arithmetic and multi-statement sources", () => {
    const repl = createRixRepl();
    expect(analyzeIntervalExpression("1:2", (source) => repl.run(source))).toBeNull();
    expect(analyzeIntervalExpression("x := 1:2; x", (source) => repl.run(source))).toBeNull();
    expect(isRationalIntervalValue(repl.run("2:1").value)).toBe(true);
});
