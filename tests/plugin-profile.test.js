import { expect, test } from "bun:test";
import {
    pluginProfileFromUrl,
    resolvePluginProfile,
    STANDARD_PLUGIN_IDS,
    stripMarkedPluginProfile,
} from "../src/plugin-profile.js";
import { createBundledPluginCatalog } from "../src/generated/bundled-plugin-catalog.js";

test("the browser catalog publishes Draw, Plot, and Geometry Phase 2", () => {
    const catalog = createBundledPluginCatalog();
    expect(catalog.info("draw").exports).toContain("Viewport");
    expect(catalog.info("draw").exports).toContain("Dimension");
    expect(catalog.info("plot").exports).toEqual(expect.arrayContaining(["Function", "Parametric", "Scatter", "Bar"]));
    expect(catalog.info("geometry")).toMatchObject({
        requires: ["rix.numerics@1", "rix.polynomial.algorithms@1"],
        provides: expect.arrayContaining(["rix.geometry.constraint@1", "rix.geometry.refinement@1"]),
    });
    expect(catalog.info("geometry").exports).toEqual(expect.arrayContaining(["Conic", "Projective", "Constraint", "Refine"]));
});

test("the checked-in standard profile is selective and imports calculator names", () => {
    expect(createBundledPluginCatalog().info("bessel")).toMatchObject({
        mount: "bessel",
        requires: ["rix.numerics@1"],
    });
    const profile = resolvePluginProfile({}, STANDARD_PLUGIN_IDS);
    expect(profile.plugins).toContain("numerics");
    expect(profile.plugins).toContain("bessel");
    expect(profile.plugins).toContain("stats");
    expect(profile.plugins).not.toContain("document");
    expect(profile.source).toContain(".numerics[:Pow, :Sqrt");
    expect(profile.source).toContain(":NthRoot, :Hypot");
    expect(profile.source).toContain(":Pi, :EulerGamma, :Sin, :Cos, :Tan");
    expect(profile.source).toContain(":Sinh, :Cosh, :Tanh");
    expect(profile.source).toContain(":Atan, :Atan2");
    expect(profile.source).toContain(":Gamma, :LogGamma, :Beta, :LogBeta, :Digamma, :Trigamma");
    expect(profile.source).toContain(":Erf, :Erfc, :LambertW");
    expect(profile.source).toContain(":LambertW, :Zeta, :Refine");
    expect(profile.source).toContain('.Plugin.Load("bessel")');
    expect(profile.source).not.toContain(":J0");
    expect(profile.source).toContain(":NormalPDF, :NormalCDF, :NormalQuantile");
    expect(profile.source).not.toContain(".float[:Sin");
    expect(profile.source).toContain(":LinearSolve=:Solve");
});

test("URL profile controls support fresh, additions, removals, repeats, and unknown warnings", () => {
    const request = pluginProfileFromUrl("https://rix.example/?plugins=fresh&plugins-add=numerics,plot&plugins-add=stats&plugins-remove=plot");
    const profile = resolvePluginProfile(request, ["numerics", "plot", "stats"]);
    expect(profile.name).toBe("fresh");
    expect(profile.plugins).toEqual(["numerics", "plot", "stats"]);

    const changed = resolvePluginProfile(pluginProfileFromUrl("https://rix.example/?plugins-remove=stats&plugins-add=document,missing"), [...STANDARD_PLUGIN_IDS, "document"]);
    expect(changed.plugins).not.toContain("stats");
    expect(changed.plugins).toContain("document");
    expect(changed.warnings).toEqual(["Unknown RiX-Web plugin 'missing' was ignored."]);
});

test("a marked RiX-Web profile can be stripped before replay", () => {
    const source = `/**\nplugins: [numerics]\n**/\n## RIX-WEB-PROFILE-BEGIN standard-v1\n.Plugin.Load("numerics");\n## RIX-WEB-PROFILE-END\nx := 3;\n`;
    expect(stripMarkedPluginProfile(source)).not.toContain("Plugin.Load");
    expect(stripMarkedPluginProfile(source)).toContain("x := 3;");
    expect(stripMarkedPluginProfile(source, '.Plugin.Load("numerics");')).not.toContain("Plugin.Load");
    expect(stripMarkedPluginProfile(source, '.Plugin.Load("stats");')).toBe(source);
});
