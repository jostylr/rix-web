import { expect, test } from "bun:test";
import { RIX_LINT_RULES } from "../../rix/src/index.js";
import { lintTutorialSource } from "../src/tutorial-lint.js";

async function lintTutorialCells() {
    const source = await Bun.file(new URL("../tutorials/linting.md", import.meta.url)).text();
    return [...source.matchAll(/^```rix edu\n([\s\S]*?)^```[ \t]*$/gim)]
        .map(([, cell]) => lintTutorialSource(cell));
}

test("live lint tutorial problem cells exercise the browser analyzer and fixes are clean", async () => {
    const cells = await lintTutorialCells();
    expect(cells).toHaveLength(24);

    const demonstrated = new Set();
    cells.forEach((diagnostics, index) => {
        if (index % 2 === 0) diagnostics.forEach(({ code }) => demonstrated.add(code));
        else expect(diagnostics, `correction cell ${(index + 1) / 2}`).toEqual([]);
    });

    const singleCellRules = Object.keys(RIX_LINT_RULES).filter((code) => code !== "RX1904");
    expect([...demonstrated].sort()).toEqual(singleCellRules.sort());
});

test("browser lint reports plugin header validation as RX1901", () => {
    const diagnostics = lintTutorialSource("/**\nid: incomplete\nkind: rix\n**/\n1;");
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ code: "RX1901", severity: "error", line: 1, column: 1 });
});
