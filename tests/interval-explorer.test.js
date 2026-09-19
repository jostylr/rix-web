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

test("inspection reads current exact leaves without executing session statements or functions", () => {
    const repl = createRixRepl();
    repl.run("x := 9; $$live := 2; Danger() -> 99");
    const inspect = (source) => repl.readExactLeaf(source);
    expect(String(inspect("x"))).toBe("9");
    expect(String(inspect("$live"))).toBe("2");
    expect(repl.reactiveVariables().find((entry) => entry.name === "live").sourceText).toBe("2");
    for (const source of ["x := 10", "Danger()", "x; 10", "x + 1", "{; x := 10; x }"]) {
        expect(() => inspect(source)).toThrow();
    }
    expect(analyzeIntervalExpression("(x := 10) + 1", inspect)).toBeNull();
    expect(analyzeIntervalExpression("Danger() + 1", inspect)).toBeNull();
    expect(analyzeIntervalExpression("$live * (1:3)", inspect).left.value.toString()).toBe("2:2");
    expect(repl.run("x").text).toBe("9");
});

test("output responses retain bounded arithmetic snapshots across later session edits", () => {
    const repl = createRixRepl();
    repl.run("x := 1:2");
    const response = repl.run("x * (3 + 1)");
    repl.run("x := 100:200");
    expect(String(response.exactTrace.result.value)).toBe("4:8");
    expect(String(analyzeIntervalExpression(response.source, (source) => repl.readExactLeaf(source), response.exactTrace).left.value)).toBe("1:2");
    expect(response.exactTrace.steps.length).toBeLessThanOrEqual(64);
});
