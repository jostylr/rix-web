import { expect, test } from "bun:test";
import { Context, createDefaultSystemContext, parseAndEvaluate, parseAndEvaluateAsync, renderOutputHtml, formatValue } from "../../rix/src/index.js";
import { createBundledPluginCatalog } from "../src/generated/bundled-plugin-catalog.js";

for (const [mode, evaluate] of [["sync", parseAndEvaluate], ["async", parseAndEvaluateAsync]]) {
    test(`${mode}: shaped representation tutorial preserves exact versus Float values`, async () => {
        const source = await Bun.file(new URL("../tutorials/tensors.md", import.meta.url)).text();
        const context = new Context();
        const systemContext = createDefaultSystemContext({ pluginCatalog: createBundledPluginCatalog() });
        const results = [];
        for (const [, code] of source.matchAll(/^```rix edu\n([\s\S]*?)^```/gm)) results.push(await evaluate(code, { context, systemContext }));
        expect(results[0].value).toBe(3n);
        expect(results[1].values.map(String)).toEqual(["2", "1", "1"]);
        const html = renderOutputHtml(results[2], formatValue);
        expect(html).toContain("17");
        expect(html).toContain("39");
        expect(results[2].data.map(value => value.value)).toEqual([17, 39]);
        expect(results[2].data.every(value => value.type === "float_ieee754")).toBe(true);
    }, 30000);
    test(`${mode}: bounded plot lesson retains source IDs and omission disclosure`, async () => {
        const source = await Bun.file(new URL("../tutorials/plots-and-graphics.md", import.meta.url)).text();
        const context = new Context();
        const systemContext = createDefaultSystemContext({ pluginCatalog: createBundledPluginCatalog() });
        let result;
        for (const [, code] of source.matchAll(/^```rix edu\n([\s\S]*?)^```/gm)) result = await evaluate(code, { context, systemContext });
        const html = renderOutputHtml(result, formatValue);
        const line = await evaluate(".plot.StreamLine(state, {= maxPoints=4 });", { context, systemContext });
        expect(line.metadata.get("plot").entries.get("records").values.map(record => record.entries.get("id").value)).toEqual(["sample-3", "sample-4", "sample-5", "sample-6"]);
        expect(html).toContain("dropped");
        expect(html).toContain("aggregate");
        let error;
        try { await evaluate('.plot.Downsample([[1,2],[2,3]],{= maxPoints=3 });', { context, systemContext }); } catch (failure) { error = failure; }
        expect(error?.message).toContain("maxPoints");
    }, 30000);
}
