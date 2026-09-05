import { expect, test } from "bun:test";
import { Context, parseAndEvaluate, parseAndEvaluateAsync } from "../../rix/src/index.js";

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
    });
}
