import { expect, test } from "bun:test";
import { createRixRepl } from "../src/repl-runtime.js";
import {
    findShowcaseExamples,
    showcaseExample,
    showcaseExamples,
} from "../src/showcase-examples.js";

test("the help gallery spans exact, reactive, graphical, and polynomial showcases", () => {
    expect(showcaseExamples.length).toBeGreaterThanOrEqual(10);
    expect(new Set(showcaseExamples.map(({ id }) => id)).size).toBe(showcaseExamples.length);
    expect(showcaseExamples.filter(({ category }) => category === "Exact numbers").length).toBeGreaterThanOrEqual(3);
    expect(showcaseExamples.filter(({ source }) => source.includes("$$")).length).toBeGreaterThanOrEqual(5);
    expect(showcaseExamples.some(({ output }) => output === "Graphic")).toBe(true);
    expect(showcaseExamples.some(({ source }) => source.includes('.Plugin.Load("plot")'))).toBe(true);

    const quadratic = showcaseExample("reactive-quadratic");
    expect(quadratic.source).toContain("$$a := .Choice");
    expect(quadratic.source).toContain("[$a, $b, $c]");

    const recenter = showcaseExample("synthetic-recenter");
    expect(recenter.source.match(/SyntheticDivide/g)).toHaveLength(3);
    expect(recenter.source).toContain("P(h + u)");

    const spatial = showcaseExamples.filter(({ category }) => category === "Spatial labs");
    expect(spatial.map(({ id }) => id)).toEqual([
        "scene3d-camera-studio",
        "nd-hypercube-lab",
        "nd-slice-sweep",
    ]);
    const scene3d = showcaseExample("scene3d-camera-studio").source;
    expect(scene3d).toContain("OrbitCamera");
    expect(scene3d).toContain("ParametricCurve");
    expect(scene3d).toContain("snapshot[:picking]");
    expect(showcaseExample("nd-hypercube-lab").source).toContain("CoordinateProjection");
    expect(showcaseExample("nd-slice-sweep").source).toContain("SlicePoints");
});

test("showcase search covers descriptions, tags, and source", () => {
    expect(findShowcaseExamples("synthetic").map(({ id }) => id)).toContain("synthetic-recenter");
    expect(findShowcaseExamples("financial").map(({ id }) => id)).toContain("simple-interest");
    expect(findShowcaseExamples("Graphics.Circle").map(({ id }) => id)).toContain("reactive-circle");
    expect(findShowcaseExamples("tesseract").map(({ id }) => id)).toContain("nd-slice-sweep");
    expect(showcaseExample("missing-example")).toBeNull();
});

test("every help showcase executes successfully in a fresh RiX-Web session", async () => {
    for (const example of showcaseExamples) {
        const repl = createRixRepl();
        const response = await repl.runAsync(example.source);
        expect(response.type, `${example.id}: ${response.text}`).toBe("result");
        await repl.dispose();
    }
});

test("the help menu exposes one-click showcase loading", async () => {
    const main = await Bun.file(new URL("../src/main.js", import.meta.url)).text();
    expect(main).toContain('data-showcase-example="${escapeHtml(example.id)}"');
    expect(main).toContain("loadShowcase(showcase.dataset.showcaseExample)");
    expect(main).toContain('<details class="help-section help-showcases">');
    expect(main).toContain('<details class="help-section help-group">');
    expect(main).toContain("group.description");
});
