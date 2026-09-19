import { expect, test } from "bun:test";
import { createRixRepl } from "../src/repl-runtime.js";

test("Web imports exact portable output through the bundled document plugin", async () => {
    const repl=createRixRepl({autoLoadPlugins:false});
    try {
        const response=await repl.runAsync(`
            .Plugin.Load("document");
            report := .Fragment([.Paragraph([.Strong("Exact"),1/3]),.Table(["oriented"],[[5:4]])]);
            saved := .document.EncodeJSON(report);
            imported := .document.DecodeJSON(saved);
            imported[:value];
        `);
        expect(response.type).toBe("result");
        expect(response.html).toContain('<strong class="rix-output-strong">Exact</strong>');
        expect(response.value.children[1].rows[0][0].start.toString()).toBe("5");
        expect(response.value.children[1].rows[0][0].end.toString()).toBe("4");
    } finally { await repl.dispose(); }
});
