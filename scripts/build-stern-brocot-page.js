import path from "node:path";

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
await Bun.write(
    indexPath,
    generatedHtml
        .replaceAll(serializedProgramPath, publicSourcePath)
        .replace("<title>index</title>", "<title>RiX Stern–Brocot explorer</title>")
        .replace('"title":"index"', '"title":"RiX Stern–Brocot explorer"'),
);
