import { expect, test } from "bun:test";
import { parse, tokenize } from "../../rix/src/index.js";
import { tutorialByNumber, tutorials } from "../src/tutorial-index.js";
import { normalizeReplSource } from "../src/repl-source.js";
import { createBundledPluginCatalog } from "../src/generated/bundled-plugin-catalog.js";

function tutorialBody(source) {
    return source.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

test("tutorial bodies leave the page-level heading to the page template", async () => {
    const tutorialsDir = new URL("../tutorials/", import.meta.url).pathname;
    for await (const file of new Bun.Glob("*.md").scan({ cwd: tutorialsDir })) {
        const source = await Bun.file(new URL(`../tutorials/${file}`, import.meta.url)).text();
        expect(tutorialBody(source), file).not.toMatch(/^# /m);
    }

    for (const tutorial of tutorials.filter(({ pluginTutorial }) => pluginTutorial)) {
        const source = await Bun.file(new URL(tutorial.sourcePath, new URL("../", import.meta.url))).text();
        expect(tutorialBody(source), tutorial.pluginId).not.toMatch(/^# /m);
    }
});

test("tutorial sources use runnable RiX blocks and a challenge", async () => {
    const source = await Bun.file(new URL("../tutorials/getting-started.md", import.meta.url)).text();
    expect(source).toContain("```rix edu");
    expect(source).toContain(":::challenge");
});

test("live lint laboratory is indexed and receives page-scoped lint controls", async () => {
    expect(tutorialByNumber("10f")?.file).toBe("linting.html");
    expect(tutorialByNumber("10g")?.file).toBe("capstone-package-design.html");
    const source = await Bun.file(new URL("../tutorials/linting.md", import.meta.url)).text();
    const generator = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    const runner = await Bun.file(new URL("../src/tutorial-runner.js", import.meta.url)).text();
    expect(source).toContain("lint: true");
    expect(source).toContain("RX1904");
    expect(generator).toContain("data-tutorial-lint");
    expect(generator).toContain('lint: meta.lint === "true"');
    expect(runner).toContain("lintTutorialSource");
    expect(runner).toContain("function lintCell(cell, button)");
});

test("tutorial RiX cells are ready to edit in the notebook", async () => {
    const tutorialsDir = new URL("../tutorials/", import.meta.url).pathname;
    for await (const file of new Bun.Glob("*.md").scan({ cwd: tutorialsDir })) {
        const source = await Bun.file(new URL(`../tutorials/${file}`, import.meta.url)).text();
        for (const header of source.match(/^```rix.*$/gim) || []) expect(header).toBe("```rix edu");
        for (const [, code] of source.matchAll(/^```rix edu\n([\s\S]*?)^```[ \t]*$/gim)) {
            expect(normalizeReplSource(code), file).toBe(code);
            const finalToken = tokenize(code)
                .filter((token) => token.type !== "End" && !(token.type === "String" && token.kind === "comment"))
                .at(-1);
            expect(finalToken?.value, file).toBe(";");
            expect(() => parse(code), file).not.toThrow();
        }
    }
});

test("plugin tutorial RiX cells use complete semicolon-terminated script syntax", async () => {
    for (const tutorial of tutorials.filter(({ pluginTutorial }) => pluginTutorial)) {
        const source = await Bun.file(new URL(tutorial.sourcePath, new URL("../", import.meta.url))).text();
        const cells = [...source.matchAll(/^```rix(?:[ \t]+[^\n]*)?\n([\s\S]*?)^```[ \t]*$/gim)];
        expect(cells.length, tutorial.pluginId).toBeGreaterThan(0);
        for (const [, code] of cells) {
            expect(normalizeReplSource(code), tutorial.pluginId).toBe(code);
            const finalToken = tokenize(code)
                .filter((token) => token.type !== "End" && !(token.type === "String" && token.kind === "comment"))
                .at(-1);
            expect(finalToken?.value, tutorial.pluginId).toBe(";");
            expect(() => parse(code), tutorial.pluginId).not.toThrow();
        }
    }
});

test("tutorial code fields initially fit their supplied code", async () => {
    const generator = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    const runner = await Bun.file(new URL("../src/tutorial-runner.js", import.meta.url)).text();
    expect(generator).toContain("function textareaRows(source, minimum = 5)");
    expect(generator).toContain('rows="${textareaRows(code)}"');
    expect(generator).toContain('rows="${textareaRows(challengeCode)}"');
    expect(runner).toContain("function sizeTutorialSource(input)");
    expect(runner).toContain("input.style.height = `${input.scrollHeight}px`");
    expect(runner).toContain("insertTutorialText(sourceInput, address)");
});

test("structured output has focused table, document, graphic, drawing, sheet, interaction, and control lessons", async () => {
    expect(tutorialByNumber("12a")?.file).toBe("tables-and-grids.html");
    expect(tutorialByNumber("12b")?.file).toBe("documents-and-slides.html");
    expect(tutorialByNumber("12c")?.file).toBe("plots-and-graphics.html");
    expect(tutorialByNumber("12d")?.file).toBe("drawing-with-draw.html");
    expect(tutorialByNumber("12e")?.file).toBe("sheets-and-tensor-views.html");
    expect(tutorialByNumber("12f")?.file).toBe("interactive-graphics.html");
    expect(tutorialByNumber("12g")?.file).toBe("control-panels.html");
    expect(tutorialByNumber("12h")?.file).toBe("reactive-scenes-and-snapshots.html");
    const drawing = await Bun.file(new URL("../tutorials/drawing-with-draw.md", import.meta.url)).text();
    const sheets = await Bun.file(new URL("../tutorials/sheets-and-tensor-views.md", import.meta.url)).text();
    const interactive = await Bun.file(new URL("../tutorials/interactive-graphics.md", import.meta.url)).text();
    const controls = await Bun.file(new URL("../tutorials/control-panels.md", import.meta.url)).text();
    expect(drawing).toContain(".Graphics.Transform");
    expect(drawing).toContain(".Graphics.Clip");
    expect(sheets).toContain("grid[2,3]");
    expect(sheets).toContain("slice = [_, _, 2]");
    expect(sheets).toContain(".Sheet(.Bind(grid)");
    expect(sheets).toContain(".FormulaSheet");
    expect(sheets).toContain('model.SetSource(1, 1, "::= 10")');
    expect(sheets).toContain("namedView.At");
    expect(sheets).toContain("near[0,-1]");
    expect(sheets).toContain("model.Near");
    expect(sheets).toContain("Copying a selected formula cell");
    expect(sheets).toContain("Double-click a row or column header");
    expect(sheets).toContain("$values[1,1]");
    expect(sheets).toContain("$$Scale");
    expect(sheets).toContain("$$frag := .Fragment");
    expect(sheets).toContain(".Sheet($values");
    expect(sheets).toContain("$frag");
    expect(sheets).toContain("$$source1 := 2");
    expect(sheets).toContain("$source1 := 10");
    expect(sheets).toContain("${");
    expect(sheets).toContain("$$average := ($values[1,1] + $values[1,2]) / 2");
    expect(sheets).toContain("$$functionvalue := {;");
    expect(sheets).toContain("Scale($values[1,1])");
    expect(sheets).toContain(".Graphics.Circle");
    expect(interactive).toContain(".Graphics.DragPoint");
    expect(controls).toContain(".Controls.Input");
    expect(controls).toContain(".Controls.Choice");
    expect(controls).toContain(".Controls.Toggle");
    expect(controls).toContain(".Controls.Range");
    expect(controls).toContain(".Controls.Reset");
    expect(controls).toContain("format={=");
    expect(controls).toContain('x _> ".~"');
    expect(controls).toContain("validate=Positive");
    expect(interactive).toContain("graphic:position");
    expect(interactive).toContain("$$point := {: 90, 70}");
});

test("structural arithmetic has focused notation and parser lessons", async () => {
    expect(tutorialByNumber("9d")?.file).toBe("structural-arithmetic.html");
    expect(tutorialByNumber("9e")?.file).toBe("backtick-parsers.html");
    const structural = await Bun.file(new URL("../tutorials/structural-arithmetic.md", import.meta.url)).text();
    const parsers = await Bun.file(new URL("../tutorials/backtick-parsers.md", import.meta.url)).text();
    expect(structural).toContain("`@(offset^2 + 1)/4`");
    expect(structural).toContain("`6/4 + 2/4`");
    expect(parsers).toContain("`.SArith.Fun:");
    expect(parsers).toContain("`.Poly:");
});

test("method extensions and scoped randomness have focused runnable lessons", async () => {
    expect(tutorialByNumber("3e")?.file).toBe("scoped-randomness.html");
    expect(tutorialByNumber("10d")?.file).toBe("method-extensions.html");
    const randomness = await Bun.file(new URL("../tutorials/scoped-randomness.md", import.meta.url)).text();
    const methods = await Bun.file(new URL("../tutorials/method-extensions.md", import.meta.url)).text();
    const float = await Bun.file(new URL("../../rix/plugins/float/tutorial.md", import.meta.url)).text();
    expect(randomness).toContain(".RNG(:default, {= seed=77 })");
    expect(randomness).toContain("RandomPartition");
    expect(randomness).toContain("seed=:random");
    expect(methods).toContain(".RegisterMethod(:Rational, :Twice");
    expect(methods).toContain("already exists");
    expect(methods).toContain('.Plugin.Load("radix")');
    expect(float).toContain("(1 / 3).Float()");
});

test("number and decision tutorials cover certified notation, output modes, and unresolved dispatch", async () => {
    const numbers = await Bun.file(new URL("../tutorials/number-notation.md", import.meta.url)).text();
    const decisions = await Bun.file(new URL("../tutorials/ternaries.md", import.meta.url)).text();
    const multifunctions = await Bun.file(new URL("../tutorials/multifunctions.md", import.meta.url)).text();

    for (const spelling of [
        "0.1#6", "-2..1/4", "3.~7~15", "1.25_^3",
        "1.23[56:67]", "23.456?789", "3.~7~15?", "0xA.B?C",
        "0b10", "0z[6]15", "ToDecimalApproximation", "ToContinuedFractionApproximation",
    ]) {
        expect(numbers, spelling).toContain(spelling);
    }
    for (const mode of ['q _> "/"', 'q _> ".."', 'q _> "."', 'q _> ".~"', 'q _> "~"', 'q _> "^"']) {
        expect(numbers, mode).toContain(mode);
    }
    expect(numbers).toContain(".125");
    expect(numbers).toContain("1_000");
    expect(numbers).toContain("0.{0~7}1");
    expect(numbers).toContain("Receiver option maps and locale display");
    expect(numbers).toContain("intentional exception");
    expect(numbers).toContain('(1/97) ~> ".12"');
    expect(numbers).toContain("Halo neighborhoods");
    expect(decisions).toContain("Undecided is a third result");
    expect(decisions).toContain("? && _");
    expect(multifunctions).toContain("Undecided guards block unsafe fallthrough");
    expect(multifunctions).toContain("Classify(0.5?)");
    expect(multifunctions).toContain("?? :needsRefinement");
    expect(multifunctions).toContain("??-");
    expect(multifunctions).toContain("??!-");
});

test("plugin tutorials are generated after core lessons and grouped by theme", async () => {
    expect(tutorialByNumber("14")?.title).toBe("Plugins: Numbers and numerics");
    expect(tutorialByNumber("14a")?.file).toBe("plugin-ball.html");
    expect(tutorialByNumber("14b")?.file).toBe("plugin-cauchy.html");
    expect(tutorialByNumber("14c")?.file).toBe("plugin-continued-fraction.html");
    expect(tutorialByNumber("14d")?.file).toBe("plugin-float.html");
    expect(tutorialByNumber("14e")?.file).toBe("plugin-numerics.html");
    expect(tutorialByNumber("14f")?.file).toBe("plugin-oracle.html");
    expect(tutorialByNumber("14g")?.file).toBe("plugin-radix.html");
    expect(tutorialByNumber("14h")?.file).toBe("plugin-algebraic-real.html");
    expect(tutorialByNumber("15")?.title).toBe("Plugins: Algebra and analysis");
    expect(tutorialByNumber("15a")?.pluginId).toBe("algebra");
    expect(tutorials.filter(({ parent }) => parent === "15").map(({ pluginId }) => pluginId)).toContain("stats");
    expect(tutorials.filter(({ parent }) => parent === "15").map(({ pluginId }) => pluginId)).toContain("stern-brocot");
    expect(tutorialByNumber("16")?.title).toBe("Plugins: Graphics and geometry");
    expect(tutorials.filter(({ parent }) => parent === "16").map(({ pluginId }) => pluginId)).toEqual([
        "draw", "geometry", "nd", "plot", "scene3d",
    ]);
    expect(tutorialByNumber("17")?.title).toBe("Plugins: Data and documents");
    expect(tutorials.filter(({ parent }) => parent === "17").map(({ pluginId }) => pluginId)).toEqual(["data", "document"]);
    expect(tutorialByNumber("18")?.title).toBe("Plugins: Renderers and exporters");
    expect(tutorials.filter(({ parent }) => parent === "18").map(({ pluginId }) => pluginId)).toEqual([
        "canvas", "csv", "gltf", "html", "latex", "markdown", "pdf", "png", "quarto", "svg", "terminal-ascii", "tikz", "gif",
    ]);
    expect(tutorialByNumber("19")?.title).toBe("Plugins: Higher-dimensional visualization");
    expect(tutorials.filter(({ parent }) => parent === "19").map(({ pluginId }) => pluginId)).toEqual(["complex-viz"]);
    const generator = await Bun.file(new URL("../scripts/generate-plugin-tutorial-index.js", import.meta.url)).text();
    expect(generator).toContain('path.join(pluginsRoot, entry.name, "tutorial.md")');
    expect(generator).toContain('"Numbers and numerics"');
    expect(generator).toContain('"Graphics and geometry"');
    expect(generator).toContain('"Renderers and exporters"');
});

test("every implemented plugin tutorial has a browser catalog contract", () => {
    const ids = new Set(createBundledPluginCatalog().list().map(({ id }) => id));
    for (const tutorial of tutorials.filter(({ pluginTutorial, status }) => pluginTutorial && status === "implemented")) {
        expect(ids.has(tutorial.pluginId), tutorial.pluginId).toBe(true);
    }
});

test("built renderer tutorial pages are present", async () => {
    for (const id of ["canvas", "csv", "gltf", "html", "latex", "markdown", "pdf", "png", "quarto", "svg", "terminal-ascii", "tikz"]) {
        const page = Bun.file(new URL(`../docs/tutorial/plugin-${id}.html`, import.meta.url));
        expect(await page.exists(), id).toBe(true);
        const source = await page.text();
        expect(source, id).toContain("Runnable RiX");
        expect(source, id).toContain("https://docs.rix.ratmath.com/eval/renderer-guide.html");
        expect(source, id).toContain(`rix/plugins/render-${id}/tutorial.md`);
    }
});

test("proposed plugin tutorials render as non-runnable acceptance documentation", async () => {
    const source = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    expect(source).toContain('runnable: lesson.status !== "proposed"');
    expect(source).toContain("Proposed RiX API");
    expect(source).toContain("This acceptance tutorial documents planned behavior.");
});

test("tutorial generator writes a tutorial index and removes the legacy learn path", async () => {
    const source = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    expect(source).toContain('path.join(root, "docs", "tutorial")');
    expect(source).toContain('path.join(outDir, "index.html")');
    expect(source).toContain("Learn RiX by running it.");
    expect(source).toContain("await rm(legacyOutDir");
});

test("tutorial navigation is loaded from one runtime manifest", async () => {
    const generator = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    const navigation = await Bun.file(new URL("../src/tutorial-navigation.js", import.meta.url)).text();
    const runner = await Bun.file(new URL("../src/tutorial-runner.js", import.meta.url)).text();
    expect(generator).toContain('href="./index.html">RiX walkthrough</a>');
    expect(generator).toContain('id="lesson-start"');
    expect(generator).toContain('data-tutorial-sidebar');
    expect(generator).toContain('data-tutorial-page-navigation');
    expect(generator).toContain('path.join(outDir, "navigation.json")');
    expect(navigation).toContain('new URL("./navigation.json", document.baseURI)');
    expect(navigation).toContain('renderTutorialSidebar(document, container, tutorials, currentFile)');
    expect(navigation).toContain('renderTutorialPageNavigation(document, container, tutorials, currentFile)');
    expect(navigation).toContain('renderTutorialIndex(document, container, tutorials, false)');
    expect(navigation).toContain('replace(/[^\\p{L}\\p{N}]+$/u, "")');
    expect(runner).toContain("mountTutorialNavigation()");
});

test("tutorial navigation can be built dynamically or pre-rendered", async () => {
    const generator = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    const packageJson = await Bun.file(new URL("../package.json", import.meta.url)).json();
    expect(generator).toContain('argument.startsWith("--navigation=")');
    expect(generator).toContain('new Set(["dynamic", "static"])');
    expect(generator).toContain('navigationMode === "static" ? staticSidebar(current) : sidebarPlaceholder()');
    expect(generator).toContain('navigationMode === "static" ? staticNavigation(current) : navigationPlaceholder()');
    expect(packageJson.scripts["build:dynamic"]).toBe("bun run build");
    expect(packageJson.scripts["build:static"]).toContain("build:tutorials:static");
});

test("tutorial references use the published RiX documentation", async () => {
    const source = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    expect(source).toContain("https://docs.rix.ratmath.com/eval/syntax-guide.html#assignment-definition");
    expect(source).toContain("https://docs.rix.ratmath.com/developer-guide.html#adding-a-user-facing-capability");
    expect(source).toContain("https://docs.rix.ratmath.com/eval/renderer-guide.html");
    expect(source).not.toContain("github.com/jostylr/ratmath/blob/main/rix/docs");
});

test("tutorial references open in the embedded documentation pane", async () => {
    const source = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    const runner = await Bun.file(new URL("../src/tutorial-runner.js", import.meta.url)).text();
    expect(source).toContain('data-doc-reference');
    expect(source).toContain('id="tutorial-docs-panel"');
    expect(runner).toContain("function openDocumentation(link)");
    expect(runner).toContain("data-close-tutorial-docs");
});

test("the tutorial documentation pane is part of the responsive page layout", async () => {
    const styles = await Bun.file(new URL("../src/tutorial-extra.css", import.meta.url)).text();
    expect(styles).toContain(".tutorial-shell.docs-open .lesson-layout");
    expect(styles).toContain("position: sticky");
    expect(styles).toContain("grid-column: 1 / -1");
    expect(styles).toContain("grid-column: 2; grid-row: 2");
    expect(styles).toContain("grid-template-rows: minmax(0, 1fr) minmax(0, 1fr)");
});

test("tablet tutorials can collapse their contents sidebar", async () => {
    const source = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    const runner = await Bun.file(new URL("../src/tutorial-runner.js", import.meta.url)).text();
    expect(source).toContain('data-toggle-contents');
    expect(source).toContain('aria-controls="lesson-sidebar"');
    expect(source).toContain('aria-expanded="false"');
    expect(runner).toContain("function toggleContents()");
    expect(runner).toContain('window.matchMedia("(max-width: 760px)")');
    expect(runner).toContain('getComputedStyle(contentsSidebar).display !== "none"');
    expect(runner).toContain("requestAnimationFrame");
    const styles = await Bun.file(new URL("../src/tutorial-extra.css", import.meta.url)).text();
    expect(styles).toContain(".tutorial-header-actions button { display: block; }");
    expect(styles).toContain("background: #5b42a0");
    expect(styles).toContain("minmax(320px, 1fr) minmax(320px, 1fr)");
});
