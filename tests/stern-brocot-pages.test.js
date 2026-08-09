import { expect, test } from "bun:test";

const read = (relativePath) => Bun.file(
    new URL(`../${relativePath}`, import.meta.url),
).text();

test("the tidy main page links the showcase catalog", async () => {
    const source = await read("src/index.html");
    expect(source).toContain('href="./showcases.html"');
    expect(source).not.toContain('class="showcase-links"');
    expect(source).not.toContain('href="./stern-brocot.html"');
});

test("the showcase catalog links both Stern-Brocot variants", async () => {
    const source = await read("src/showcases.html");
    expect(source).toContain('href="./stern-brocot.html"');
    expect(source).toContain('href="./stern-brocot-rix/"');
});

test("the app build publishes both Stern-Brocot variants under docs", async () => {
    const build = await read("scripts/build-app.js");
    const generatedBuild = await read("scripts/build-stern-brocot-page.js");
    const nativePage = await read("src/stern-brocot.html");

    expect(build).toContain('path.join(output, "stern-brocot.html")');
    expect(build).toContain('path.join(output, "showcases.html")');
    expect(build).toContain('path.join(source, "stern-brocot-web.js")');
    expect(generatedBuild).toContain('"docs", "stern-brocot-rix"');
    expect(nativePage).toContain('src="./assets/stern-brocot-web.js"');
});
