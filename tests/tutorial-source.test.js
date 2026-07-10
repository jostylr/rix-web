import { expect, test } from "bun:test";

test("tutorial sources use runnable RiX blocks and a challenge", async () => {
    const source = await Bun.file(new URL("../tutorials/getting-started.md", import.meta.url)).text();
    expect(source).toContain("```rix");
    expect(source).toContain(":::challenge");
});
