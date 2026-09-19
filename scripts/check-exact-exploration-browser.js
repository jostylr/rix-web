#!/usr/bin/env bun
/** Real calculator acceptance. Uses locally supplied Chromium/Playwright; no downloads. */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const artifacts = path.join(root, "tmp", "exact-exploration-browser");
await mkdir(path.join(artifacts, "assets"), { recursive: true });
const build = await Bun.build({ entrypoints: [path.join(root, "src/main.js")], outdir: path.join(artifacts, "assets"), target: "browser" });
if (!build.success) throw new AggregateError(build.logs, "Calculator build failed");
await Bun.write(path.join(artifacts, "index.html"), await readFile(path.join(root, "src/index.html")));
await Bun.write(path.join(artifacts, "assets/app.css"), `${await readFile(path.join(root, "../rix/styles/output-widgets.css"), "utf8")}\n${await readFile(path.join(root, "src/app.css"), "utf8")}`);
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(request) {
    const pathname = new URL(request.url).pathname;
    const allowed = { "/": "index.html", "/assets/main.js": "assets/main.js", "/assets/app.css": "assets/app.css" };
    const file = allowed[pathname];
    return file ? new Response(Bun.file(path.join(artifacts, file))) : new Response("Not found", { status: 404 });
} });
let browser;
try {
    const { chromium } = await import(process.env.RIX_PLAYWRIGHT_MODULE || "playwright");
    browser = await chromium.launch({ headless: true, ...(process.env.RIX_CHROME_EXECUTABLE ? { executablePath: process.env.RIX_CHROME_EXECUTABLE } : {}) });
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => { errors.push(error.message); console.error("Browser error:", error.message); });
    await page.goto(`http://127.0.0.1:${server.port}/`);
    const input = page.locator("#calculator-input");
    await input.waitFor();
    await page.locator(".welcome").waitFor();
    const run = async (source) => {
        await input.fill(source);
        await page.locator(".input-section [data-action=run]").click();
        await page.waitForFunction(() => document.querySelector("#calculator-input").value === "").catch((error) => { throw new Error(`Command did not complete: ${source}; browser errors: ${errors.join("; ")}`, { cause: error }); });
        assert.equal(await page.locator("#output-history > :last-child .error-line").count(), 0, source);
    };
    const dialog = page.locator("#interval-dialog");
    const openLatest = async () => { await page.locator(".interval-explore-button").last().click(); assert.equal(await dialog.evaluate((element) => element.open), true); };
    const close = async () => page.locator('[data-action="close-interval"]').click();
    const download = async (action, name) => {
        const ready = page.waitForEvent("download");
        await page.locator(`[data-action="${action}"]`).click();
        const saved = await ready;
        const file = path.join(artifacts, name);
        await saved.saveAs(file);
        return readFile(file, "utf8");
    };

    await run("355/113");
    await openLatest();
    await page.locator(".interval-number-links > summary").focus();
    await page.keyboard.press("Enter");
    assert.match(await page.locator(".interval-number-links").innerText(), /333\/106/);
    assert.match(await page.locator(".interval-number-links").innerText(), /-1\/791/);
    await page.screenshot({ path: path.join(artifacts, "linked-value.png") });
    const svg = await download("interval-export-svg", "linked-value.svg");
    const html = await download("interval-export-html", "linked-value.html");
    const text = await download("interval-export-text", "linked-value.txt");
    for (const content of [svg, html, text]) { assert.match(content, /355\/113/); assert.match(content, /-1\/791/); }
    await page.locator('[data-exact-use="-1/791"]').click();
    assert.equal(await input.inputValue(), "-1/791", "Linked error is inserted without execution");
    await page.locator('[data-exact-inspect="22/7"]').first().focus();
    await page.keyboard.press("Enter");
    assert.match(await page.locator("#interval-table").innerText(), /22\/7/);
    await close();

    await run("(1:2) * ((3:4) + 1)");
    await openLatest();
    const trace = page.locator(".interval-trace");
    await trace.locator("summary").focus(); await page.keyboard.press("Enter");
    assert.match(await trace.innerText(), /Interval width grew/);
    assert.match(await trace.innerText(), /4:10/);
    const start = page.locator('svg [data-rix-semantic-id="interval-0:start"]');
    await start.focus(); await page.keyboard.press("ArrowRight");
    assert.equal(await start.evaluate((element) => element === document.activeElement), true, "Endpoint focus survives exact rerender");
    assert.match(await page.locator("#interval-table").innerText(), /11\/10/);
    await page.locator('[data-action="interval-use"]').click();
    assert.equal(await input.inputValue(), "22/5:10");

    await run("(1:2)/(3:4)"); await openLatest();
    await page.locator("#interval-selection").selectOption("1");
    await page.locator("#interval-start").fill("-1"); await page.locator("#interval-start").press("Enter");
    assert.match(await page.locator("#interval-provenance").innerText(), /Current result is undefined/);
    const undefinedSvg = await download("interval-export-svg", "undefined-current.svg");
    assert.match(undefinedSvg, /Current result undefined/);
    await page.locator('[data-action="interval-use"]').click();
    assert.equal(await dialog.evaluate((element) => element.open), true, "An undefined result cannot be reinserted as valid");
    await close();

    await run("$$x := 1/3"); await page.locator("#reactive-dashboard-toggle").click();
    const card = page.locator('[data-dashboard-name="x"]');
    await card.locator("[data-dashboard-pin]").focus(); await page.keyboard.press("Enter");
    assert.equal(await card.locator("[data-dashboard-pin]").getAttribute("aria-pressed"), "true");
    assert.equal(await card.locator("[data-dashboard-pin]").evaluate((element) => element === document.activeElement), true);
    await card.locator("[data-dashboard-group]").fill("Measurements"); await card.locator("[data-dashboard-group]").press("Tab");
    await card.locator(".reactive-history > summary").click();
    for (let i = 1; i <= 66; i += 1) await run(`$x := ${i}/7`);
    assert.match(await card.locator(".reactive-history > summary").innerText(), /64\/64/);
    assert.match(await card.locator(".reactive-history").innerText(), /3 older changes discarded/);
    assert.equal(await card.locator(".reactive-history").evaluate((element) => element.open), true);
    const retained = card.locator(".reactive-history > table tbody tr").first().locator("button");
    const retainedSource = await retained.innerText(); await retained.click();
    assert.equal(await input.inputValue(), retainedSource);
    const historyReady = page.waitForEvent("download"); await card.locator("[data-dashboard-history-export]").click();
    const historyDownload = await historyReady; await historyDownload.saveAs(path.join(artifacts, "history.svg"));
    assert.match(await readFile(path.join(artifacts, "history.svg"), "utf8"), /66\/7/);
    const session = JSON.parse(await download("save", "workspace.rix-session"));
    assert.deepEqual(session.dashboardPresentation.pinned, ["x"]);
    assert.equal(session.dashboardPresentation.groups.x, "Measurements");
    assert.equal("histories" in session, false);
    await card.locator("[data-dashboard-pin]").click();
    await card.locator("[data-dashboard-group]").fill("Changed"); await card.locator("[data-dashboard-group]").press("Tab");
    await page.locator("#file-input").setInputFiles(path.join(artifacts, "workspace.rix-session"));
    await page.waitForFunction(() => document.querySelector('[data-dashboard-pin="x"]')?.getAttribute("aria-pressed") === "true");
    assert.equal(await card.locator("[data-dashboard-group]").inputValue(), "Measurements");
    await page.screenshot({ path: path.join(artifacts, "dashboard.png") });

    await page.locator('[data-action="close-reactive-dashboard"]').click();
    await run("2/10^400:1/10^400"); await openLatest();
    assert.match(await page.locator("#interval-table").innerText(), /reversed/);
    assert.match(await download("interval-export-svg", "tiny-reversed.svg"), /reversed/);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.evaluate(() => { document.body.style.zoom = "2"; });
    await dialog.evaluate((element) => { element.scrollTop = 0; element.querySelector(".interval-body").scrollTop = 0; });
    await page.screenshot({ path: path.join(artifacts, "narrow-zoom.png") });
    const layout = await dialog.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth,
        overflow: [...element.querySelectorAll("*")].filter((child) => child.getBoundingClientRect().right > element.getBoundingClientRect().right + 1).slice(0, 12).map((child) => [child.tagName, child.className?.baseVal ?? child.className, child.getBoundingClientRect().width]) }));
    assert.ok(layout.scroll <= layout.client + 1, `Dialog must avoid whole-view overflow at 200% zoom: ${JSON.stringify(layout)}`);
    assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
    assert.deepEqual(errors, []);
    await Bun.write(path.join(artifacts, "accessibility.txt"), await dialog.ariaSnapshot());
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.evaluate(() => { document.body.style.zoom = "1"; });
    await close(); await run("2^17000"); await openLatest();
    assert.match(await page.locator("#interval-status").innerText(), /16384-bit/);
    assert.equal(await page.locator("#interval-graphic svg").count(), 0);
    const limitedText = await download("interval-export-text", "over-budget.txt");
    assert.match(limitedText, /original exact value is unchanged/);
    assert.ok(limitedText.length > 5000);
    await page.locator('[data-action="interval-use"]').click();
    assert.ok((await input.inputValue()).length > 5000, "Work limits preserve original-value reinsertion");
    assert.deepEqual(errors, []);
    console.log(`Exact workspace browser acceptance passed: actual calculator, linked exact errors, SVG/HTML/text, keyboard reinsertion/edit focus, undefined-region disclosure, pin/group session persistence, 64-sample history, narrow 200% zoom and reduced motion. Artifacts: ${artifacts}`);
} finally { await browser?.close(); server.stop(true); }
