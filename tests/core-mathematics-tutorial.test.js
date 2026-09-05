import { expect, test } from "bun:test";
import { Context, parseAndEvaluate, parseAndEvaluateAsync } from "../../rix/src/index.js";
import { UNDECIDED } from "../../rix/src/runtime/decision.js";

for (const [mode,evaluate] of [["sync",parseAndEvaluate],["async",parseAndEvaluateAsync]]) {
    test(`${mode}: core mathematics tutorial cells execute in order`, async () => {
        const source = await Bun.file(new URL("../tutorials/core-mathematics.md",import.meta.url)).text();
        const cells = [...source.matchAll(/^```rix edu\n([\s\S]*?)^```/gm)].map(match=>match[1]);
        const context = new Context();
        const results = [];
        for (const cell of cells) results.push(await evaluate(cell,{context}));
        expect(results.length).toBeGreaterThanOrEqual(3);
        expect(results[0].values[0].value).toBe(1n);
        expect(results[1].values[0].value).toBe(5n);
        expect(results[2].value).toBe(1n);
        expect(results[3].values.slice(0,3).map(value=>value.value)).toEqual([7n,1n,1n]);
        expect(results[4].values[0]).toBeNull();
        expect(results[4].values[1].value).toBe(1n);
        expect(results[4].values[2]).toBe(UNDECIDED);
        expect(results[5].values[0]).toBeNull();
        expect(results[5].values[1].value).toBe(1n);
        expect(results[6].values[0].value).toBe(1n);
        expect(results[6].values[1]).toBeNull();
        expect(results[7].values[0].value).toBe(1n);
        expect(results[8].values[0].value).toBe(1n);
        expect(results[8].values[1].value).toBe("desc");
        expect(results[8].values[2]).toBeNull();
        expect(results[9].values[0]).toBeNull();
        expect(results[10].values[0].value).toBe("unresolved");
        expect(results[10].values[1]).toBeNull();
        expect(results[10].values[2]).toBe(UNDECIDED);
    });
}
