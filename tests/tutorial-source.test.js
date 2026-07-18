import { expect, test } from "bun:test";
import { tutorialByNumber } from "../src/tutorial-index.js";

test("tutorial sources use runnable RiX blocks and a challenge", async () => {
    const source = await Bun.file(new URL("../tutorials/getting-started.md", import.meta.url)).text();
    expect(source).toContain("```rix");
    expect(source).toContain(":::challenge");
});

test("tutorial code fields initially fit their supplied code", async () => {
    const generator = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    const runner = await Bun.file(new URL("../src/tutorial-runner.js", import.meta.url)).text();
    expect(generator).toContain("function textareaRows(source, minimum = 5)");
    expect(generator).toContain('rows="${textareaRows(code)}"');
    expect(generator).toContain('rows="${textareaRows(challengeCode)}"');
    expect(runner).toContain("function sizeTutorialSource(input)");
    expect(runner).toContain("input.style.height = `${input.scrollHeight}px`");
});

test("structured output has focused table, document, graphic, and drawing lessons", async () => {
    expect(tutorialByNumber("12a")?.file).toBe("tables-and-grids.html");
    expect(tutorialByNumber("12b")?.file).toBe("documents-and-slides.html");
    expect(tutorialByNumber("12c")?.file).toBe("plots-and-graphics.html");
    expect(tutorialByNumber("12d")?.file).toBe("drawing-with-draw.html");
    const drawing = await Bun.file(new URL("../tutorials/drawing-with-draw.md", import.meta.url)).text();
    expect(drawing).toContain(".Graphics.Transform");
    expect(drawing).toContain(".Graphics.Clip");
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
