import { expect, test } from "bun:test";
import { reactiveVariableCardsHtml } from "../src/reactive-dashboard.js";

test("reactive dashboard cards distinguish controlled and derived values safely", () => {
    const html = reactiveVariableCardsHtml([
        {
            name: "area",
            aliases: ["area"],
            state: "clean",
            valueText: "6 < 7",
            sourceText: "6",
            formulaSource: "$width * $height",
            dependencies: ["height", "width"],
            dependents: [],
            diagnostics: [],
            controls: [],
        },
        {
            name: "width",
            aliases: ["width", "w"],
            state: "clean",
            valueText: "3",
            sourceText: "3",
            formulaSource: "3",
            dependencies: [],
            dependents: ["area"],
            diagnostics: [],
            controls: [{ kind: "control_slider" }],
        },
    ]);
    expect(html).toContain('class="reactive-role derived"');
    expect(html).toContain('class="reactive-role controlled"');
    expect(html).toContain("$width * $height");
    expect(html).toContain("6 &lt; 7");
    expect(html).not.toContain("6 < 7");
    expect(html).toContain("aliases: w");
});
