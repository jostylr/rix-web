import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const schemaSource = path.join(root, "..", "rix", "schemas");
const schemaOutput = path.join(root, "docs", "schema");

export async function publishSchemas() {
    for (const name of await readdir(schemaSource)) {
        if (!name.endsWith(".json")) continue;
        const contents = await readFile(path.join(schemaSource, name), "utf8");
        const canonical = new URL(JSON.parse(contents).$id);
        if (canonical.origin !== "https://rix.ratmath.com" || !canonical.pathname.startsWith("/schema/")) {
            throw new Error(`Schema ${name} has a non-canonical RiX Web ID`);
        }
        const relativePath = canonical.pathname.slice("/schema/".length);
        if (!relativePath || path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
            throw new Error(`Schema ${name} has an unsafe publication path`);
        }
        const outputPath = path.join(schemaOutput, relativePath);
        await mkdir(path.dirname(outputPath), { recursive: true });
        await Bun.write(outputPath, contents);
    }
}

await publishSchemas();
