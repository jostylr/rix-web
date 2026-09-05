import { expect, test } from "bun:test";

import { createRixRepl } from "../src/repl-runtime.js";

test("CAS Collect stays on the synchronous method path", async () => {
    const repl = createRixRepl({ autoLoadPlugins: false });
    try {
        const response = await repl.runAsync(`
            .Plugin.Load("cas");
            x := .calculus.Variable(:x);
            source := (x+1)*(x-1);
            .cas.Collect(source,:x)[:coefficients];
        `);
        expect(response.type).toBe("result");
        expect(response.text).toBe("[-1, 0, 1]");
    } finally {
        await repl.dispose();
    }
}, 10_000);
