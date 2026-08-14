import { expect, test } from "bun:test";
import { parseAndEvaluate } from "../../rix/src/index.js";
import { createSternBrocotRixBridge } from "../src/rix-stern-brocot-bridge.js";

const read = (relativePath) => Bun.file(
    new URL(`../${relativePath}`, import.meta.url),
).text();

test("the tidy main page links the showcase catalog", async () => {
    const source = await read("src/index.html");
    expect(source).toContain('href="./showcases.html"');
    expect(source).not.toContain('class="showcase-links"');
    expect(source).not.toContain('href="./stern-brocot.html"');
    expect(source).toContain('id="mobile-keypad"');
    expect(source).toContain('id="interval-dialog"');
    expect(source).toContain('id="reactive-dashboard-panel"');
    expect(source).toContain('data-action="reactive-dashboard"');
    expect(source).toContain('data-number-preset="cf"');
});

test("the showcase catalog links both Stern-Brocot variants", async () => {
    const source = await read("src/showcases.html");
    expect(source).toContain('href="./stern-brocot.html"');
    expect(source).toContain('href="./stern-brocot-rix/"');
});

test("the native explorer passes scientific precision in the supported argument position", async () => {
    const source = await read("src/stern-brocot-web.js");
    expect(source).toContain("exactDistance.toScientificNotation(true, 3)");
    expect(source).toMatch(/case 'scientific':[\s\S]*toScientificNotation\(\s*true,\s*Math\.min/);
    expect(source).not.toContain("exactDistance.toScientificNotation(3)");
});

test("the app build publishes both Stern-Brocot variants under docs", async () => {
    const build = await read("scripts/build-app.js");
    const generatedBuild = await read("scripts/build-stern-brocot-page.js");
    const nativePage = await read("src/stern-brocot.html");

    expect(build).toContain('path.join(output, "stern-brocot.html")');
    expect(build).toContain('path.join(output, "showcases.html")');
    expect(build).toContain('path.join(source, "stern-brocot-web.js")');
    expect(generatedBuild).toContain('"docs", "stern-brocot-rix"');
    expect(generatedBuild).toContain('createHash("sha256")');
    expect(nativePage).toContain('src="./assets/stern-brocot-web.js"');
});

test("the generated Stern-Brocot page declares its layout, keys, and scene actions in RiX", async () => {
    const source = await Bun.file(new URL(
        "../../rix/examples/stern-brocot/stern-brocot-page.rix",
        import.meta.url,
    )).text();
    const generated = await read("docs/stern-brocot-rix/index.html");
    const runtime = await read("docs/stern-brocot-rix/assets/rix-page.js");

    expect(source).toContain('layout="grid"');
    expect(source).toContain("parent={= row=1, column=2 }");
    expect(source).toContain("left={= row=2, column=1 }");
    expect(source).toContain("right={= row=2, column=3 }");
    expect(source).toContain("root={= row=3, column=2");
    expect(source).toContain('shortcut="ArrowUp"');
    expect(source).toContain('shortcut="ArrowLeft"');
    expect(source).toContain('shortcut="ArrowRight"');
    expect(source).not.toContain('shortcut="ArrowDown"');
    expect(source).toContain('.Controls.Hold({=');
    expect(source).toContain('key="ArrowDown"');
    expect(source).toContain('target=$$decimalPreview');
    expect(source).toContain('label="Maximum decimal digits"');
    expect(source).toContain('ToRepeatingDecimal({=');
    expect(source).toContain('onLimit="trunc"');
    expect(source.match(/\.Graphics\.Action/g)).toHaveLength(3);
    expect(source).toContain("SternBrocotBoxWidth(text)");
    expect(source).toContain("graphicWidth := {>>");
    expect(source).not.toContain("[116, 46]");
    expect(source).toContain("SternBrocotFormulaGlyph(formulaDisplay, centerX, 362)");
    expect(source).toContain('"FORMULA RESULT"');
    expect(generated).toContain("scene-left");
    expect(generated).toContain("FORMULA RESULT");
    expect(generated).toMatch(/href="assets\/rix-page\.css\?v=[a-f0-9]{12}"/);
    expect(generated).toMatch(/src="assets\/rix-page\.js\?v=[a-f0-9]{12}"/);
    expect(runtime).toContain('type: "graphic:action"');
    expect(runtime).toContain("enhanceControlShortcuts(root)");
    expect(runtime).toContain("activeHolds: new Map");
    expect(runtime).toContain("data-rix-control-hold");
});

test("the generated-page decimal formatter keeps natural endings and short periods", async () => {
    const source = await Bun.file(new URL(
        "../../rix/examples/stern-brocot/stern-brocot-page.rix",
        import.meta.url,
    )).text();
    const bridge = createSternBrocotRixBridge();
    bridge.context.setEnv("__output_sink__", () => {});
    parseAndEvaluate(source, { ...bridge.runtime, file: "<decimal-page-test>" });
    const before = parseAndEvaluate("$current", bridge.runtime);
    const heldView = parseAndEvaluate("$decimalPreview := 1; $view", {
        ...bridge.runtime,
        file: "<decimal-held-test>",
    });
    const after = parseAndEvaluate("$current", bridge.runtime);
    const values = parseAndEvaluate(`[
        SternBrocotFractionText(.frac(1, 8), 1, 5),
        SternBrocotFractionText(.frac(1, 3), 1, 5),
        SternBrocotFractionText(.frac(1, 7), 1, 5),
        SternBrocotFractionText(.frac(1, 1), 1, 5)
    ]`, bridge.runtime);
    expect(heldView.kind).toBe("fragment");
    expect(String(after)).toBe(String(before));
    expect(values.values.map((value) => value.value)).toEqual([
        "0.125",
        "0.#3",
        "0.#14285...",
        "1",
    ]);
});
