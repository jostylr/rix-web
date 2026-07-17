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
