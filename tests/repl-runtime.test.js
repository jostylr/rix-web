import { expect, test } from "bun:test";
import {
    Context,
    createDefaultRegistry,
    createDefaultSystemContext,
    createWidgetSession,
    formatValue,
    parseAndEvaluate,
} from "../../rix/src/index.js";
import { normalizeReplSource } from "../src/repl-source.js";
import { replayTutorialSources, replayTutorialSourcesAsync, tutorialSectionCells } from "../src/tutorial-replay.js";
import { createRixRepl } from "../src/repl-runtime.js";
import { tutorials } from "../src/tutorial-index.js";
import { paintCanvasPlan } from "../../rix/plugins/render-canvas/canvas-plan.js";
import { formatCertifiedIntervalDecimal } from "../src/certified-decimal-display.js";

test("the web REPL runtime keeps its RiX context between cells", () => {
    const context = new Context();
    const options = {
        context,
        registry: createDefaultRegistry(),
        systemContext: createDefaultSystemContext(),
    };

    const result = parseAndEvaluate(normalizeReplSource(`radius := 7
area := radius ^ 2 * 22 / 7
area`), options);

    expect(formatValue(result)).toBe("154");
    expect(context.getAllNames()).toContain("radius");
    expect(context.getAllNames()).toContain("area");
});

test("the web REPL automatically presents refinable function results as certified decimal balls", () => {
    const repl = createRixRepl({
        pluginProfile: {
            name: "automatic-real-display-test",
            plugins: ["numerics"],
            source: '.Plugin.Load("numerics"); .numerics[:Exp];',
        },
    });
    const response = repl.run("Exp(3)");

    expect(response.type).toBe("result");
    expect(response.value.entries.get("schema").value).toBe("rix.numerics.algorithm-real@1");
    expect(response.text).toMatch(/^20\.\d+\[\+\-\d{1,2}\]$/);
    const errorDigits = response.text.match(/\[\+\-(\d+)\]$/)[1];
    expect(errorDigits.length).toBeLessThanOrEqual(2);

    const displayedInterval = parseAndEvaluate(response.text, {
        context: new Context(),
        registry: createDefaultRegistry(),
        systemContext: createDefaultSystemContext(),
    });
    const explicitEnclosure = repl.run(".numerics.Refine(Exp(3), {= absoluteWidth=1/1000, maxWork=50 })")
        .value.entries.get("interval");
    expect(displayedInterval.contains(explicitEnclosure)).toBe(true);

    // Presentation does not replace the reusable exact-real value in session.
    repl.run("growth := Exp(3)");
    const explicit = repl.run(".numerics.Refine(growth, {= absoluteWidth=1/10000, maxWork=50 })");
    expect(explicit.type).toBe("result");
    expect(explicit.value.entries.get("schema").value).toBe("rix.numerics.enclosure@1");
    expect(explicit.text).toContain(":");
});

test("certified decimal balls round outward with at most two error digits", () => {
    const interval = parseAndEvaluate("1/3:2/3", {
        context: new Context(),
        registry: createDefaultRegistry(),
        systemContext: createDefaultSystemContext(),
    });
    const displayed = formatCertifiedIntervalDecimal(interval);
    expect(displayed).toBe("0.50[+-17]");
    expect(parseAndEvaluate(displayed, {
        context: new Context(),
        registry: createDefaultRegistry(),
        systemContext: createDefaultSystemContext(),
    }).contains(interval)).toBe(true);
});

test("tutorial replay preserves earlier dependencies without stale removed names", () => {
    const dependent = replayTutorialSources(["x := 3", "x + 1"], 1, createRixRepl);
    expect(dependent.type).toBe("result");
    expect(dependent.text).toBe("4");

    const renamed = replayTutorialSources(["matrix := 3", "grid + 1"], 1, createRixRepl);
    expect(renamed.type).toBe("error");
    expect(renamed.text).toContain("grid");
});

test("the web REPL and tutorial replay await async RiX scopes", async () => {
    const repl = createRixRepl();
    const response = await repl.runAsync("{$:2$ [1 + 1, 2 + 2] };");
    expect(response.type).toBe("result");
    expect(response.text).toBe("[2, 4]");

    const replayed = await replayTutorialSourcesAsync(
        ["x := 3", "{$ <x> [x, x + 1] };"],
        1,
        createRixRepl,
    );
    expect(replayed.type).toBe("result");
    expect(replayed.text).toBe("[3, 4]");
});

test("the web REPL awaits stream terminals and disposes retained streams on reset", async () => {
    const repl = createRixRepl();
    const collected = await repl.runAsync(".Stream([1,2,3]).Collect()");
    expect(collected.type).toBe("result");
    expect(collected.text).toBe("[1, 2, 3]");

    const retained = await repl.runAsync("stream := .Stream([4,5])");
    expect(retained.value._stream.root.status).toBe("open");
    await repl.reset();
    expect(retained.value._stream.root.status).toBe("closed");
    expect(retained.value._stream.root.closeCount).toBe(1);
});

test("the web REPL runs async drain, expected-value recovery, and Retry", async () => {
    const repl = createRixRepl();
    const drained = await repl.runAsync(".Stream([1,2,3]) |>_ ((value) -> value^2)");
    expect(drained.type).toBe("result");
    expect(drained.value).toBeNull();

    const recovered = await repl.runAsync(
        "[1, {: :error, :missing, 2}, {: :error, :drop, 9}] "
        + "|>! ((kind, fallback) -> kind == :missing ?: fallback ?_ _)",
    );
    expect(recovered.type).toBe("result");
    expect(recovered.text).toBe("[1, 2]");

    const retried = await repl.runAsync(
        ".Retry(2, @{ {: :error, :timeout, :offline } }) "
        + "|>! ((kind, status) -> status)",
    );
    expect(retried.type).toBe("result");
    expect(retried.value.value).toBe("offline");
});

test("tutorial replay state is scoped to the target h2 section", () => {
    const entries = [
        { type: "heading", value: "first heading" },
        { type: "cell", value: "first setup" },
        { type: "cell", value: "first result" },
        { type: "heading", value: "second heading" },
        { type: "cell", value: "second setup" },
        { type: "cell", value: "second result" },
    ];
    expect(tutorialSectionCells(entries, "first result")).toEqual(["first setup", "first result"]);
    expect(tutorialSectionCells(entries, "second result")).toEqual(["second setup", "second result"]);
});

test("the web REPL returns structured HTML for portable output values", () => {
    const repl = createRixRepl();
    const response = repl.run(".Algebra.SyntheticDivision(1, [2, -6, 2, -1])");

    expect(response.type).toBe("result");
    expect(response.html).toContain("rix-output-grid");
    expect(response.html).toContain("rix-grid-rule-top");
    expect(response.text).toContain("-3");
});

test("the browser-safe renderer plugins produce their text and source targets", () => {
    const graphic = `.Graphics.Graphic([120, 80], [
        .Graphics.Circle([60, 40], 24, {= fill="#0c7b7f" }),
        .Graphics.Text([60, 44], "RiX", {= fill="white", anchor="middle" })
    ])`;
    const document = `.Fragment([
        .Heading(1, "Renderer report"),
        .Paragraph("One portable document.")
    ])`;
    const cases = [
        ["svg", `.svg.Render(${graphic}).Get("content")`, "<svg"],
        ["terminal-ascii", `.terminalAscii.Render(.Table(["x"], [[1]])).Get("content")`, "+---+"],
        ["canvas", `.canvas.Render(${graphic}).Get("content")`, "rix.canvas-plan@1"],
        ["tikz", `.tikz.Render(${graphic}).Get("content")`, "\\begin{tikzpicture}"],
        ["markdown", `.markdown.Render(${document}).Get("content")`, "# Renderer report"],
        ["html", `.html.Render(${document}).Get("content")`, "<!doctype html>"],
        ["quarto", `.quarto.Render(${document}).Get("content")`, "---\nformat: html"],
        ["latex", `.latex.Render(${document}).Get("content")`, "\\documentclass{article}"],
    ];

    for (const [plugin, expression, expected] of cases) {
        const response = createRixRepl().run(`.Plugin.Load("${plugin}"); ${expression};`);
        expect(response.type, plugin).toBe("result");
        expect(response.value.value, plugin).toContain(expected);
    }
});

test("the browser Canvas executor repaints a serialized plugin plan", () => {
    const response = createRixRepl().run(`
        .Plugin.Load("canvas");
        .canvas.Render(.Graphics.Graphic([80, 60], [
            .Graphics.Rectangle([5, 6], [20, 10], {= fill="#2563eb" }),
            .Graphics.Circle([50, 30], 8, {= stroke="#111827" })
        ])).Get("content");
    `);
    expect(response.type).toBe("result");
    const plan = JSON.parse(response.value.value);
    const calls = [];
    const PreviousPath2D = globalThis.Path2D;
    globalThis.Path2D = class {
        rect(...args) { calls.push(["rect", ...args]); }
        arc(...args) { calls.push(["arc", ...args]); }
    };
    const context = {
        save: () => calls.push(["save"]), restore: () => calls.push(["restore"]),
        fill: () => calls.push(["fill"]), stroke: () => calls.push(["stroke"]),
        setLineDash: () => {},
    };
    try {
        expect(paintCanvasPlan(context, plan)).toBe(context);
    } finally {
        globalThis.Path2D = PreviousPath2D;
    }
    expect(calls.some(([name]) => name === "rect")).toBe(true);
    expect(calls.some(([name]) => name === "arc")).toBe(true);
    expect(calls.filter(([name]) => name === "fill")).toHaveLength(1);
    expect(calls.filter(([name]) => name === "stroke")).toHaveLength(1);
});

test("PNG and PDF expose browser contracts without pretending to have host tools", () => {
    const png = createRixRepl().run(`
        .Plugin.Load("png");
        .png.Render(.Graphics.Graphic([20, 20], [.Graphics.Circle([10, 10], 5)]));
    `);
    expect(png.type).toBe("error");
    expect(png.text).toContain("png-rasterizer-unavailable");

    const pdf = createRixRepl().run(`
        .Plugin.Load("pdf");
        .pdf.Render(.Fragment([.Paragraph("portable")]));
    `);
    expect(pdf.type).toBe("error");
    expect(pdf.text).toContain("pdf-toolchain-unavailable");
});

test("the browser projects exact 4D geometry to Scene3D, Graphics, and glTF", () => {
    const response = createRixRepl().run(`
        .Plugin.Load("nd"); .Plugin.Load("scene3d"); .Plugin.Load("gltf");
        cube := .nd.Hypercube(4, 2);
        rotation := .nd.CayleyRotation(4, 1, 4, 1/3);
        projection := .nd.Compose(.nd.CoordinateProjection(4, [1,2,3]), rotation);
        scene := .nd.ToScene3D(.nd.Project(cube, projection));
        snapshot := .scene3d.Snapshot(scene, {= size=[320,240] });
        [snapshot["value"], .gltf.Render(scene).Get("content")];
    `);
    expect(response.type).toBe("result");
    expect(response.value.values[0]).toMatchObject({ type: "output", kind: "graphic" });
    const gltf = JSON.parse(response.value.values[1].value);
    expect(gltf.asset.version).toBe("2.0");
    expect(gltf.extras.rix.sourceCoordinates).toBe("right-handed Z-up");
});

test("the browser runs the first Scene3D Phase 2 retained contracts", () => {
    const response = createRixRepl().run(`
        .Plugin.Load("scene3d");
        curve := .scene3d.ParametricCurve(t -> [t,t^2,0], 0:1, {=
            samples=5, id="curve", label="parabola"
        });
        note := .scene3d.Annotation([1,1,0], "endpoint", {= id="endpoint" });
        camera := .scene3d.OrbitCamera([0,0,0], {=
            radius=4, height=2, turn=1/3, projection="orthographic", scale=4
        });
        scene := .scene3d.Scene([.scene3d.Axes({= id="basis" }),curve,note], {= camera=camera });
        snapshot := .scene3d.Snapshot(scene, {= size=[320,240] });
        [snapshot["value"],camera["orbit"]["schema"],snapshot["picking"]["curve"]["indices"].Len(),snapshot["work"]["annotations"]];
    `);
    expect(response.type).toBe("result");
    expect(response.value.values[0]).toMatchObject({ type: "output", kind: "graphic" });
    expect(response.value.values[1].value).toBe("rix.scene3d.orbit@1");
    expect(response.value.values[2].value).toBe(4n);
    expect(response.value.values[3].value).toBe(4n);
});

test("the web REPL returns address-aware Sheet HTML", () => {
    const repl = createRixRepl();
    const response = repl.run(".Sheet({:2x3: 1, 2, 3; 4, 5, 6})");

    expect(response.type).toBe("result");
    expect(response.html).toContain("rix-output-sheet");
    expect(response.html).toContain('data-rix-display-address="C2"');
    expect(response.html).toContain('data-rix-address="grid[2,3]"');
    expect(response.text).toContain("shape 2×3");
});

test("the web REPL retains live Binding values for host-owned Sheet widgets", () => {
    const repl = createRixRepl();
    const response = repl.run(`
        matrix := {:1x2: 1, 2};
        .Sheet(.Bind(matrix))
    `);

    expect(response.type).toBe("result");
    expect(response.value.editable).toBe(true);
    expect(response.value.addressBase).toBe("matrix");
    expect(response.html).toContain('data-rix-editable="true"');
    expect(response.html).toContain("rix-output-sheet-editor");
});

test("formula sheets and their dependent LiveViews retain interactive metadata", () => {
    const repl = createRixRepl();
    const sheet = repl.run(`
        model := .FormulaSheet([[@{1}, @{ grid[1,1] + 1 }]]);
        .Sheet(model)
    `);
    expect(sheet.type).toBe("result");
    expect(sheet.value.editMode).toBe("formula");
    expect(sheet.html).toContain('data-rix-formula-source="grid[1,1] + 1"');
    expect(sheet.html).toContain('aria-label="RiX formula"');
    expect(sheet.html).toContain('aria-label="Formula assignment mode"');
    expect(sheet.html).toContain('data-rix-edit-value');

    const live = repl.run(`
        .LiveView(model, @{ .Sheet(source, {= title="Reactive copy" }) })
    `);
    expect(live.value.kind).toBe("live_view");
    expect(live.html).toContain("rix-output-live-view");
    expect(live.html).toContain("Reactive copy");
});

test("a named reactive Fragment is observable and redraws after FormulaSheet edits", () => {
    const repl = createRixRepl();
    const response = repl.run(`
        values := .FormulaSheet([[@{120}, @{40}, @{8}]]);
        $$average := ($values[1,1] + $values[1,2]) / 2;
        $$functionvalue := {;
            Scale(x) -> x * $values[1,3];
            Scale($values[1,1])
        };
        $$frag := .Fragment([
            .Sheet($values, {= title="Editable inputs" }),
            .Table(
                ["quantity", "value"],
                [
                    ["Average of first and second", $average],
                    ["Scale(first), where Scale(x) = x * third", $functionvalue]
                ]
            ),
            .Graphics.Graphic([260,140], [
                .Graphics.Circle(
                    [$values[1,1], $values[1,2]],
                    $values[1,3]
                )
            ])
        ]);
        $frag
    `);

    expect(response.type).toBe("result");
    expect(response.observe).toBeFunction();
    expect(formatValue(response.value)).toMatch(/Average of first and second\s+80/u);
    expect(formatValue(response.value)).toMatch(/Scale\(first\), where Scale\(x\) = x \* third\s+960/u);

    const updates = [];
    const dispose = response.observe((next) => updates.push(next));
    repl.run("$values[1,1] := @{200}");
    expect(updates).toHaveLength(1);
    expect(formatValue(updates[0].value)).toMatch(/Average of first and second\s+120/u);
    expect(formatValue(updates[0].value)).toMatch(/Scale\(first\), where Scale\(x\) = x \* third\s+1600/u);
    dispose();
    repl.run("$values[1,1] := @{300}");
    expect(updates).toHaveLength(1);
});

test("a semantic Graphic position event redraws a reactive Fragment", () => {
    const repl = createRixRepl();
    const response = repl.run(`
        $$point := {: 20,30};
        $$total := {; p := $point; p[1] + p[2] };
        $$view := {;
            p := $point;
            .Fragment([
                .Table(["quantity", "value"], [["total", $total]]),
                .Graphics.Graphic([200,120], [
                    .Graphics.Path([[0,120], p], {= stroke="#2563eb" }),
                    .Graphics.DragPoint($$point, 8, {= fill="#7c3aed" })
                ])
            ])
        };
        $view
    `);

    expect(response.type).toBe("result");
    expect(response.observe).toBeFunction();
    const graphic = response.value.children.find((child) => child.kind === "graphic");
    const targetId = graphic.children.find((child) => child.kind === "drag_point").targetId;
    const updates = [];
    const stop = response.observe((next) => updates.push(next));
    const widget = createWidgetSession(graphic);
    widget.dispatch({ type: "graphic:position", targetId, position: [70, 40] });

    expect(updates).toHaveLength(1);
    expect(formatValue(updates[0].value)).toMatch(/total\s+110/u);
    const nextGraphic = updates[0].value.children.find((child) => child.kind === "graphic");
    expect(nextGraphic.children.find((child) => child.kind === "drag_point").center.map(formatValue))
        .toEqual(["70", "40"]);
    widget.dispose();
    stop();
});

test("the web REPL returns interactive tensor-plane controls", () => {
    const repl = createRixRepl();
    const response = repl.run(`
        cube := {:2x3x2: 1, 2, 3; 4, 5, 6 ;; 7, 8, 9; 10, 11, 12};
        .Sheet(cube, {=
            axes=["region", "measure", "scenario"],
            axisLabels=[
                ["North", "South"],
                ["Revenue", "Cost", "Margin"],
                ["Actual", "Forecast"]
            ],
            slice=[_, _, 2],
            address="cube"
        })
    `);

    expect(response.type).toBe("result");
    expect(response.html).toContain('data-rix-sheet-axis="3"');
    expect(response.html).toContain('data-rix-plane-key="3:1"');
    expect(response.html).toContain('data-rix-plane-key="3:2"');
    expect(response.html).toContain('data-rix-address="cube[1,3,2]"');
    expect(response.html).toContain('<option value="2" selected>Forecast · 2</option>');
    expect(response.html).toContain('data-rix-coordinate-label="North / Margin / Forecast"');
});

test("the web REPL automatically loads its curated calculator profile", () => {
    const repl = createRixRepl();

    const available = repl.run('.Plugin.List()').text;
    expect(available).toContain("float");
    expect(available).toContain("ball");
    expect(available).toContain("cauchy");
    expect(available).toContain("numerics");
    expect(available).toContain("oracle");
    expect(available).toContain("radix");
    expect(available).toContain("algebra");
    expect(available).toContain("draw");
    expect(available).toContain("plot");
    expect(available).toContain("geometry");
    expect(available).toContain("data");
    expect(available).toContain("stats");
    expect(available).toContain("document");
    expect(available).toContain("complex-viz");
    expect(available).toContain("terminal-ascii");
    expect(available).toContain("csv");
    expect(available).toContain("gif");
    expect(repl.run('.Plugin.Info("float").Get("loaded")').value.value).toBe(1n);
    expect(repl.run('.Plugin.Info("ball").Get("loaded")').value).toBeNull();
    expect(repl.run('.Plugin.Info("example-array-js").Get("loaded")').value).toBeNull();
    expect(repl.run('.stats.Mean([1/3, 2/3])').text).toBe("1/2");
    expect(repl.run('Mean([1/3, 2/3])').text).toBe("1/2");
    expect(repl.run('Exp(3, 4)').text).toBe("64");
    expect(repl.run('Refine(Sin(1), {= absoluteWidth=1/1000, maxWork=100 })[:status]').text).toBe("enclosed");
    expect(repl.run('Refine(Asin(1/2), {= absoluteWidth=1/1000, maxWork=160 })[:status]').text).toBe("enclosed");
    expect(repl.run('.float.Sin(1)').type).toBe("result");
    expect(repl.run('.Plugin.Load("ball"); .Plugin.Load("cauchy"); .Plugin.Load("complex-viz"); .Plugin.Load("csv"); .Plugin.Load("document")').type).toBe("result");
    expect(repl.run('.complexViz.Color(.Complex.FromParts(1, 0))').text).toBe("#ef4444");
    expect(repl.run('.numerics[:E=:Exp]; E(3, 4)').text).toBe("64");
    expect(repl.run(".float(1 / 3)").text).toBe("0.3333333333333333");
    expect(repl.run(".float(1 / 3) * .float(3)").text).toBe("1");
    expect(repl.run(".float(1 / 2) + 2").type).toBe("error");
    expect(repl.run(".float(1 / 2) + .float(2)").text).toBe("2.5");
    expect(repl.run(".Min(.float(1 / 2), 2)").type).toBe("error");
    expect(repl.run(".Min(.float(1 / 2), .float(2))").text).toBe("0.5");
    expect(repl.run(".Max(.float(1 / 2), 2)").type).toBe("error");
    expect(repl.run(".Max(.float(1 / 2), .float(2))").text).toBe("2");
    expect(repl.run(".float.Round(.float(1 / 3), 2)").text).toBe("33/100");
    expect(repl.run('.ball(3 / 2, 1 / 4).Interval()').text).toBe("1..1/4:1..3/4");
    expect(repl.run('.ball.Sqrt(2) < {~ 3 / 2, 1 / 1000 }').text).toBe("1");
    expect(repl.run('.cauchy.Geometric(1, 1 / 2).Term(3)').text).toBe("1..7/8");
    const certified = repl.run('.numerics.Refine(.oracle.Rational(3 / 7), {= absoluteWidth=1/1000, maxWork=20 })');
    expect(certified.text).toBe(formatValue(certified.value.entries.get("interval")));
    expect(certified.sourceText).toContain("schema=rix.numerics.enclosure@1");
    expect(repl.run('.numerics.Refine(.oracle.Rational(3 / 7), {= absoluteWidth=1/1000, maxWork=20 })[:status]').text)
        .toBe("enclosed");
    expect(repl.run('.numerics.Refine(.ball.Sqrt(2), {= absoluteWidth=1/1000, maxWork=20 })[:status]').text)
        .toBe("enclosed");
    expect(repl.run('.numerics.Refine(.cauchy.Geometric(1, 1/2), {= absoluteWidth=1/1000, maxWork=20 })[:status]').text)
        .toBe("enclosed");
    expect(repl.run('.numerics.Sample(.float(1 / 3), {= maxWork=20 })[:status]').text)
        .toBe("approximate");
    expect(repl.run('(1/7).PeriodLength(10)').text).toBe("6");

    const polynomial = repl.run(`
        p := .algebra.Polynomial([1,-6,11,-6]);
        .algebra.Grid(.algebra.SyntheticDivide(p,2))
    `);
    expect(polynomial.type).toBe("result");
    expect(polynomial.html).toContain("rix-output-grid");

    expect(repl.run(".draw.Circle([10, 10], 4)").text).toContain("circle");

    const plot = repl.run(".plot.Polynomial([1, 0, -1], [-2, 2])");
    expect(plot.type).toBe("result");
    expect(plot.html).toContain("<svg");
    expect(plot.html).toContain("<path");

    const construction = repl.run(`
        a := .geometry.Point(0,0);
        b := .geometry.Point(4,0);
        .geometry.Draw([a,b,.geometry.Circle(a,b)], {= view=[-1,-1,5,5], size=[240,240] })
    `);
    expect(construction.type).toBe("result");
    expect(construction.html).toContain("<svg");
    expect(construction.html).toContain("<circle");

    expect(repl.run('.csv.Render(.data.Relation(["name", "value"], [["half", 1/2]])).Get("content")').text)
        .toBe("name,value\nhalf,1/2\n");
    expect(repl.run('.document.Report("Web report", [.Heading(2, "Result", "result")])').html)
        .toContain('id="result"');
});

test("automatic browser plugins survive reset and can be disabled explicitly", async () => {
    const repl = createRixRepl();
    expect(repl.run(".stats.Mean([1, 2, 3])").text).toBe("2");
    await repl.reset();
    expect(repl.run(".stats.Mean([1, 2, 3])").text).toBe("2");

    const restricted = createRixRepl({ autoLoadPlugins: false });
    expect(restricted.run(".stats.Mean([1, 2, 3])").type).toBe("error");
    expect(restricted.run('.Plugin.Load("stats"); .stats.Mean([1, 2, 3])').text).toBe("2");
});

test("profile overrides can start fresh, add plugins, and restore saved lexical imports", async () => {
    const fresh = createRixRepl({ pluginProfile: { fresh: true, add: ["numerics"] } });
    expect(fresh.run(".numerics.Exp(3, 4)").text).toBe("64");
    expect(fresh.run("Exp(3, 4)").type).toBe("error");

    await fresh.reset({
        pluginProfile: {
            name: "saved-test",
            plugins: ["stats"],
            source: '.Plugin.Load("stats"); .stats[:Mean];',
        },
    });
    expect(fresh.run("Mean([1, 2, 3])").text).toBe("2");
    expect(fresh.run(".numerics.Exp(3, 4)").type).toBe("error");
    await fresh.dispose();
});

test("notebook newlines leave nested and continued expressions alone", () => {
    const source = `values := [
  1,
  2
]
total := 3 +
  4
total`;

    expect(normalizeReplSource(source)).toBe(`values := [
  1,
  2
];
total := 3 +
  4;
total`);
});

test("automatic top-level line separation can be disabled for script parity", () => {
    const repl = createRixRepl({ autoSeparateLines: false });
    const source = `value := 2
value`;

    expect(repl.run(source).type).toBe("error");

    repl.setAutoSeparateLines(true);
    expect(repl.run(source).text).toBe("2");
});

test("notebook newlines separate statements following a sigil container", () => {
    const repl = createRixRepl();
    const response = repl.run(`warm := {| 1, 2 |}
cool := {| 2, 3 |}
warm.Union(cool)`);
    expect(response.type).toBe("result");
    expect(response.text).toBe("{| 1, 2, 3 |}");
});

test("a standalone null ends a notebook statement", () => {
    const repl = createRixRepl();
    const response = repl.run(`reading := _
bounds := 18:22
bounds`);

    expect(response.type).toBe("result");
    expect(response.text).toBe("18:22");
});

test("a dot-prefixed system call starts a new notebook statement", () => {
    const repl = createRixRepl();
    const response = repl.run(`grid := 0:1 :: 5
.RNG(:default, {= seed=7 })
0:1 :% (1, 1000)`);

    expect(response.type).toBe("result");
    expect(response.text).toBe("3/10");
});

test(".Help(topic) returns matching inline RiX REPL help", () => {
    const repl = createRixRepl();
    const response = repl.run('.Help("interval")');

    expect(response.type).toBe("help");
    expect(response.groups.flatMap((group) => group.items).some(([syntax]) => syntax === "2:5")).toBe(true);
});

test("a fresh RatCalc session does not expose host symbolic bindings as variables", () => {
    const repl = createRixRepl();
    expect(repl.variables()).toEqual([]);
    repl.run("radius := 7");
    expect(repl.variables().map(({ name }) => name)).toEqual(["radius"]);
});

test("the web REPL exposes contextual completion without evaluating the draft", () => {
    const repl = createRixRepl();
    repl.run("values := [1, 2, 3]");
    const result = repl.complete("values.");

    expect(result.candidates.some((candidate) => candidate.kind === "method")).toBe(true);
    expect(result.candidates.map((candidate) => candidate.insertText)).toContain("_proto");
});

test("number settings control # input and multi-view output", () => {
    const repl = createRixRepl();
    expect(repl.setNumberConfig({ input: "b", display: ".[12],b,.." })).toEqual({
        input: "b",
        display: ".[12],b,..",
    });
    expect(repl.run("#111").text).toBe("7 · 111 · 7");
    expect(repl.run("7/4").text).toBe("1.75 · 1.11 · 1..3/4");
});

test("number settings expose continued-fraction and scientific presets for scalars and intervals", () => {
    const repl = createRixRepl();
    repl.setNumberConfig({ display: "cf,sci[6]" });
    expect(repl.run("7/4").text).toBe("1.~1~3 · 1.75E0");
    expect(repl.run("1/3:2/3").text).toBe("0.~3:0.~1~2 · 3.#3E-1:6.#6E-1");
    expect(repl.run("2:1").text).toBe("2.~0:1.~0 · 2E0:1E0");
    expect(() => repl.setNumberConfig({ display: "sci[0]" })).toThrow("positive safe integer");
});

test("quick help exposes the calculator's number and interval surfaces", () => {
    const repl = createRixRepl();
    const intervalHelp = repl.run('.Help("interval")');
    const scientificHelp = repl.run('.Help("scientific")');
    expect(intervalHelp.groups.flatMap(({ items }) => items).map(([syntax]) => syntax)).toContain("Explore interval");
    expect(scientificHelp.groups.flatMap(({ items }) => items).map(([syntax]) => syntax)).toContain('*> "sci[10]"');
});

test("RiX-Web discovers reactive values and concise dashboard controls", () => {
    const repl = createRixRepl();
    expect(repl.run(`
        $$width := 3;
        $$height := 2;
        widthSlider := .Slider($$width, 0:10, 1/2, "Width");
        heightInput := .Input($$height, "Height");
        $$area := $width * $height;
        $area
    `).text).toBe("6");

    let descriptors = repl.reactiveVariables();
    const width = descriptors.find(({ name }) => name === "width");
    const area = descriptors.find(({ name }) => name === "area");
    expect(width.controls.map(({ kind }) => kind)).toEqual(["control_slider"]);
    expect(width.dependencies).toEqual([]);
    expect(area.valueText).toBe("6");
    expect(area.formulaSource).toBe("$width * $height");
    expect(area.dependencies).toEqual(["height", "width"]);
    expect(area.controls).toEqual([]);

    let commits = 0;
    const unsubscribe = repl.subscribeReactive(() => { commits += 1; });
    expect(repl.run("$width := 4").text).toBe("4");
    descriptors = repl.reactiveVariables();
    expect(descriptors.find(({ name }) => name === "area").valueText).toBe("8");
    expect(commits).toBe(1);
    unsubscribe();

    expect(repl.complete(".Slider").candidates.find(({ insertText }) => insertText === ".Slider")?.detail)
        .toContain(".Controls.Slider");

    repl.run(`
        Positive(value) -> value > 0 ?: _ ?_ "must be positive";
        $$amount := 1;
        amountInput := .Input({= target=$$amount, validate=Positive, label="Amount" })
    `);
    const amountControl = repl.reactiveVariables()
        .find(({ name }) => name === "amount").controls[0];
    expect(amountControl.validateCandidate(repl.run("-1").value)).toBe("must be positive");
});

test("RiX-Web value controls can declare and return their reactive cells", async () => {
    const repl = createRixRepl();
    const declared = repl.run('$$width := .Slider(3, 0:10, 1/2, "Width")');
    expect(declared.type).toBe("result");
    expect(declared.text).toBe("3");

    expect(repl.run(`
        $$entry := .Input(7, "Entry");
        $$choice := .Choice("medium", ["small", "medium", "large"], "Size");
        $$enabled := .Toggle("on", "off", "on", "Enabled");
        $$window := .Range(2:4, 0:10, 1, "Window");
        $$area := $width * $entry;
        $area
    `).text).toBe("21");

    let descriptors = repl.reactiveVariables();
    const controlKinds = Object.fromEntries(descriptors.map(({ name, controls }) => [
        name,
        controls.map(({ kind }) => kind),
    ]));
    expect(controlKinds.width).toEqual(["control_slider"]);
    expect(controlKinds.entry).toEqual(["control_input"]);
    expect(controlKinds.choice).toEqual(["control_choice"]);
    expect(controlKinds.enabled).toEqual(["control_toggle"]);
    expect(controlKinds.window).toEqual(["control_range"]);
    expect(controlKinds.area).toEqual([]);

    expect(repl.run("$width := 4").text).toBe("4");
    descriptors = repl.reactiveVariables();
    expect(descriptors.find(({ name }) => name === "width").controls[0].index).toBe(8);
    expect(descriptors.find(({ name }) => name === "area").valueText).toBe("28");

    const compound = repl.run('$$compound := .Slider(3, 0:10, 1, "Compound") + 1');
    expect(compound.type).toBe("error");
    expect(compound.text).toContain("target must be a reactive");
    expect(repl.reactiveVariables().some(({ name }) => name === "compound")).toBe(false);

    await repl.reset();
    expect(repl.reactiveVariables()).toEqual([]);
});

test("presentation text is separate from lossless injection source", () => {
    const repl = createRixRepl();
    repl.setNumberConfig({ display: ".[3]" });
    const response = repl.run("1/7");
    expect(response.text).toBe("0.142…");
    expect(response.sourceText).toBe("1/7");
    expect(repl.run(response.sourceText).sourceText).toBe("1/7");
});

test("every indexed tutorial has a Markdown source file", async () => {
    for (const tutorial of tutorials) {
        if (tutorial.pluginGroup) continue;
        const source = tutorial.pluginTutorial
            ? Bun.file(new URL(tutorial.sourcePath, new URL("../", import.meta.url)))
            : Bun.file(new URL(`../tutorials/${tutorial.file.replace(/\.html$/, ".md")}`, import.meta.url));
        expect(await source.exists(), `lesson ${tutorial.number}`).toBe(true);
    }
});

test("every published RiX tutorial h2 section executes in fresh state", async () => {
    for (const tutorial of tutorials) {
        if (tutorial.pluginGroup || tutorial.status === "proposed") continue;
        const source = tutorial.pluginTutorial
            ? await Bun.file(new URL(tutorial.sourcePath, new URL("../", import.meta.url))).text()
            : await Bun.file(new URL(`../tutorials/${tutorial.file.replace(/\.html$/, ".md")}`, import.meta.url)).text();
        for (const [sectionIndex, section] of source.split(/^##\s+/m).entries()) {
            const repl = createRixRepl({ autoLoadPlugins: false });
            const cells = section.matchAll(/```rix(?:[ \t]+[^\n]*)?[ \t]*\n([\s\S]*?)\n```/g);
            for (const [, code] of cells) {
                if (code.includes("## lint-problem")) continue;
                const response = await repl.runAsync(code);
                expect(response.type, `lesson ${tutorial.number}, section ${sectionIndex}: ${response.text}`).toBe("result");
            }
        }
    }
}, 30_000);
