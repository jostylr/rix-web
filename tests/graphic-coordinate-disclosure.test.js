import { expect, test } from "bun:test";
import { createRixRepl } from "../src/repl-runtime.js";

test("Web output exposes source orientation, exact tables and SVG snapshot disclosures", () => {
    const response = createRixRepl().run(`
        .Graphics.Graphic([10,10], [
            .Graphics.Circle([(5:4),1/3],1/3,{= id="reversed",fill="#2563eb" }),
            .Graphics.Text([1/3,1/3],"first",{= id="first",size=1/3 }),
            .Graphics.Text([3333334/10000000,1/3],"nearby",{= id="label",size=1/3 })
        ])
    `);
    expect(response.type).toBe("result");
    expect(response.html).toContain("Coordinate rounding and uncertainty");
    expect(response.html).toContain("5:4");
    expect(response.html).toContain("reversed source order");
    expect(response.html).toContain("Rounding collisions");
    expect(response.html).toContain('data-rix-graphic-detail="coordinates"');
    expect(response.html).toContain('data-rix-coordinate-lowering="rix.svg.coordinate-lowering@1"');
});
