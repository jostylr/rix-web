import { expect, test } from "bun:test";
import { parse, tokenize } from "../../rix/src/index.js";
import { tutorialByNumber, tutorials } from "../src/tutorial-index.js";
import { normalizeReplSource } from "../src/repl-source.js";

test("tutorial sources use runnable RiX blocks and a challenge", async () => {
    const source = await Bun.file(new URL("../tutorials/getting-started.md", import.meta.url)).text();
    expect(source).toContain("```rix edu");
    expect(source).toContain(":::challenge");
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

test("structured output has focused table, document, graphic, drawing, and sheet lessons", async () => {
    expect(tutorialByNumber("12a")?.file).toBe("tables-and-grids.html");
    expect(tutorialByNumber("12b")?.file).toBe("documents-and-slides.html");
    expect(tutorialByNumber("12c")?.file).toBe("plots-and-graphics.html");
    expect(tutorialByNumber("12d")?.file).toBe("drawing-with-draw.html");
    expect(tutorialByNumber("12e")?.file).toBe("sheets-and-tensor-views.html");
    const drawing = await Bun.file(new URL("../tutorials/drawing-with-draw.md", import.meta.url)).text();
    const sheets = await Bun.file(new URL("../tutorials/sheets-and-tensor-views.md", import.meta.url)).text();
    expect(drawing).toContain(".Graphics.Transform");
    expect(drawing).toContain(".Graphics.Clip");
    expect(sheets).toContain("grid[2,3]");
    expect(sheets).toContain("slice = [_, _, 2]");
    expect(sheets).toContain(".Sheet(.Bind(grid)");
    expect(sheets).toContain(".FormulaSheet");
    expect(sheets).toContain("$model[1,1] := @{10}");
    expect(sheets).toContain("$values[1,1]");
    expect(sheets).toContain("$$Scale");
    expect(sheets).toContain(".LiveView");
    expect(sheets).toContain("$$source1 := 2");
    expect(sheets).toContain("$source1 := 10");
    expect(sheets).toContain("${");
    expect(sheets).toContain("$$average := ($values[1,1] + $values[1,2]) / 2");
    expect(sheets).toContain("$$functionvalue := {;");
    expect(sheets).toContain("Scale($values[1,1])");
    expect(sheets).toContain(".Graphics.Circle");
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

test("plugin tutorials are generated after core lessons and grouped by theme", async () => {
    expect(tutorialByNumber("14")?.title).toBe("Plugins: Numbers and numerics");
    expect(tutorialByNumber("14a")?.file).toBe("plugin-float.html");
    expect(tutorialByNumber("14b")?.status).toBe("proposed");
    expect(tutorialByNumber("15")?.title).toBe("Plugins: Graphics and geometry");
    expect(tutorialByNumber("15a")?.pluginId).toBe("draw");
    expect(tutorialByNumber("15b")?.pluginId).toBe("plot");
    const generator = await Bun.file(new URL("../scripts/generate-plugin-tutorial-index.js", import.meta.url)).text();
    expect(generator).toContain('path.join(pluginsRoot, entry.name, "tutorial.md")');
    expect(generator).toContain('"Numbers and numerics"');
    expect(generator).toContain('"Graphics and geometry"');
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

test("tutorial navigation links to the walkthrough, section, and labeled destinations", async () => {
    const source = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    expect(source).toContain('href="./index.html">RiX walkthrough</a>');
    expect(source).toContain('id="lesson-start"');
    expect(source).toContain('`./${section.file}#lesson-start`');
    expect(source).toContain('↑ ${escapeHtml(label(section))}');
    expect(source).toContain('↓ ${escapeHtml(label(down))}');
    expect(source).toContain('rootTutorials[rootTutorials.findIndex');
    expect(source).toContain('replace(/[^\\p{L}\\p{N}]+$/u, "")');
    expect(source).toContain('tutorials.findIndex((item) => item.number === current.number)');
    expect(source).toContain('class="next-link"');
});

test("tutorial references use the published RiX documentation", async () => {
    const source = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    expect(source).toContain("https://docs.rix.ratmath.com/eval/syntax-guide.html#assignment-definition");
    expect(source).toContain("https://docs.rix.ratmath.com/developer-guide.html#adding-a-user-facing-capability");
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
