import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const source = path.join(root, "src");
const output = path.join(root, "docs");

const browserNodeShims = {
    name: "browser-node-shims",
    setup(build) {
        build.onResolve({ filter: /^node:fs$/ }, () => ({ path: "fs", namespace: "rix-web-shim" }));
        build.onResolve({ filter: /^node:path$/ }, () => ({ path: "path", namespace: "rix-web-shim" }));
        build.onResolve({ filter: /^node:module$/ }, () => ({ path: "module", namespace: "rix-web-shim" }));
        build.onLoad({ filter: /.*/, namespace: "rix-web-shim" }, ({ path: shim }) => {
            if (shim === "fs") return { contents: `const unavailable = () => { throw new Error("File-system imports are unavailable in the browser REPL."); }; export default { readFileSync: unavailable };`, loader: "js" };
            if (shim === "path") return { contents: `const unavailable = () => { throw new Error("Local path imports are unavailable in the browser REPL."); }; export default { isAbsolute: unavailable, resolve: unavailable, dirname: unavailable };`, loader: "js" };
            return { contents: `export function createRequire() { return () => { throw new Error("JavaScript module imports need an explicit browser trust policy."); }; }`, loader: "js" };
        });
    },
};

await mkdir(path.join(output, "assets"), { recursive: true });
await Bun.write(path.join(output, "index.html"), await readFile(path.join(source, "index.html")));
await Bun.write(path.join(output, ".nojekyll"), "");
await Bun.write(path.join(output, "assets", "app.css"), await readFile(path.join(source, "app.css")));
const result = await Bun.build({
    entrypoints: [path.join(source, "main.js")],
    outdir: path.join(output, "assets"),
    target: "browser",
    format: "esm",
    sourcemap: "linked",
    plugins: [browserNodeShims],
});
if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
}
