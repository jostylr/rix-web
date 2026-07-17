import { expect, test } from "bun:test";

test("tutorial sources use runnable RiX blocks and a challenge", async () => {
    const source = await Bun.file(new URL("../tutorials/getting-started.md", import.meta.url)).text();
    expect(source).toContain("```rix");
    expect(source).toContain(":::challenge");
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
    expect(source).toContain('↑ ${escapeHtml(label(section))}');
    expect(source).toContain('↓ ${escapeHtml(label(down))}');
    expect(source).toContain('class="next-link"');
});

test("tutorial references use the published RiX documentation", async () => {
    const source = await Bun.file(new URL("../scripts/build-tutorials.js", import.meta.url)).text();
    expect(source).toContain("https://docs.rix.ratmath.com/eval/syntax-guide.html#assignment-definition");
    expect(source).toContain("https://docs.rix.ratmath.com/developer-guide.html#adding-a-user-facing-capability");
    expect(source).not.toContain("github.com/jostylr/ratmath/blob/main/rix/docs");
});
