import { mkdir, readFile, readdir, unlink } from "node:fs/promises";
import path from "node:path";

await import("./generate-plugin-catalog.js");
await import("./generate-plugin-tutorial-index.js");

const root = path.resolve(import.meta.dir, "..");
const source = path.join(root, "src");
const output = path.join(root, "docs");
const outputWidgetStyles = path.resolve(root, "../rix/styles/output-widgets.css");

const assets = path.join(output, "assets");
await mkdir(assets, { recursive: true });
for (const name of await readdir(assets)) {
    if (/^chunk-[a-z0-9]+\.js(?:\.map)?$/.test(name)) await unlink(path.join(assets, name));
}
await Bun.write(path.join(output, "index.html"), await readFile(path.join(source, "index.html")));
await Bun.write(path.join(output, "showcases.html"), await readFile(path.join(source, "showcases.html")));
await Bun.write(path.join(output, ".nojekyll"), "");
await Bun.write(
    path.join(output, "assets", "app.css"),
    `${await readFile(outputWidgetStyles, "utf8")}\n${await readFile(path.join(source, "app.css"), "utf8")}`,
);
await Bun.write(path.join(output, "assets", "showcases.css"), await readFile(path.join(source, "showcases.css")));
await Bun.write(path.join(output, "stern-brocot.html"), await readFile(path.join(source, "stern-brocot.html")));
await Bun.write(path.join(output, "assets", "stern-brocot.css"), await readFile(path.join(source, "stern-brocot.css")));
const {inspectNumeral,NUMERAL_EXAMPLES}=await import("../src/numeral-playground-model.js");
const initialNumeral=inspectNumeral(NUMERAL_EXAMPLES.ordinary,NUMERAL_EXAMPLES.ordinary.source);
const numeralPage=(await readFile(path.join(source,"numeral-playground.html"),"utf8")).replace("<!--INITIAL-->",initialNumeral.html);
await Bun.write(path.join(output,"numeral-playground.html"),numeralPage);
await Bun.write(path.join(assets,"numeral-playground.css"),await readFile(path.join(source,"numeral-playground.css")));
await import("./publish-schemas.js");
const result = await Bun.build({
    entrypoints: [
        path.join(source, "main.js"),
        path.join(source, "numeral-playground.js"),
        path.join(source, "stern-brocot-web.js"),
        path.join(source, "tutorial-runner.js"),
        path.join(source, "tutorial-worker.js"),
        path.join(source, "tutorial-navigation-client.js"),
    ],
    outdir: assets,
    target: "browser",
    format: "esm",
    sourcemap: "linked",
    splitting: true,
});
if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
}

await import("./build-stern-brocot-page.js");
