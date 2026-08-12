import path from "node:path";
import { createHash } from "node:crypto";

const webRoot = path.resolve(import.meta.dir, "..");
const repositoryRoot = path.resolve(webRoot, "..");
const output = path.join(webRoot, "docs", "stern-brocot-rix");
const program = path.join(
    repositoryRoot,
    "rix",
    "examples",
    "stern-brocot",
    "stern-brocot-page.rix",
);
const cli = path.join(repositoryRoot, "rix", "bin", "rix.js");

const child = Bun.spawn(
    [process.execPath, cli, `--out=${output}`, program],
    {
        cwd: repositoryRoot,
        stdout: "inherit",
        stderr: "inherit",
    },
);

const exitCode = await child.exited;
if (exitCode !== 0) process.exit(exitCode);

const indexPath = path.join(output, "index.html");
const generatedHtml = await Bun.file(indexPath).text();
const serializedProgramPath = JSON.stringify(program).slice(1, -1);
const publicSourcePath = "rix/examples/stern-brocot/stern-brocot-page.rix";
const assetVersion = async (filename) => createHash("sha256")
    .update(new Uint8Array(await Bun.file(path.join(output, "assets", filename)).arrayBuffer()))
    .digest("hex")
    .slice(0, 12);
const cssVersion = await assetVersion("rix-page.css");
const jsVersion = await assetVersion("rix-page.js");
await Bun.write(
    indexPath,
    generatedHtml
        .replaceAll(serializedProgramPath, publicSourcePath)
        .replace("<title>index</title>", "<title>RiX Stern–Brocot explorer</title>")
        .replace('"title":"index"', '"title":"RiX Stern–Brocot explorer"')
        .replace('href="assets/rix-page.css"', `href="assets/rix-page.css?v=${cssVersion}"`)
        .replace('src="assets/rix-page.js"', `src="assets/rix-page.js?v=${jsVersion}"`),
);
