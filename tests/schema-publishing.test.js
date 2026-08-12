import { expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import path from "node:path";

const webRoot = path.resolve(import.meta.dir, "..");
const schemaRoot = path.resolve(webRoot, "../rix/schemas");

test("workspace schemas are published at their canonical RiX Web paths", async () => {
    for (const name of await readdir(schemaRoot)) {
        if (!name.endsWith(".json")) continue;
        const source = await Bun.file(path.join(schemaRoot, name)).text();
        const schema = JSON.parse(source);
        const canonical = new URL(schema.$id);

        expect(canonical.origin).toBe("https://rix.ratmath.com");
        expect(canonical.pathname.startsWith("/schema/")).toBe(true);
        expect(await Bun.file(path.join(webRoot, "docs", canonical.pathname)).text()).toBe(source);
    }
});
