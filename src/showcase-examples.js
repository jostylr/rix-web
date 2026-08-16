const program = (source) => source.trim();

export const showcaseExamples = Object.freeze([
    {
        id: "fraction-sum",
        category: "Exact numbers",
        complexity: "Short",
        output: "Array",
        title: "Three exact fractions",
        summary: "Add familiar fractions without introducing floating-point rounding.",
        source: "1/2 + 1/3 + 1/7",
        keywords: "rational fraction arithmetic sum",
    },
    {
        id: "pi-views",
        category: "Exact numbers",
        complexity: "Tiny",
        output: "Number",
        title: "One value, three notations",
        summary: "Inspect the classic 355/113 approximation as decimal, fraction, and continued fraction.",
        source: 'q := 355/113; [q _> ".18", q _> "/", q _> ".~"]',
        keywords: "decimal format continued fraction pi notation",
    },
    {
        id: "interval-product",
        category: "Exact numbers",
        complexity: "Tiny",
        output: "Interval",
        title: "Multiply two uncertainties",
        summary: "Propagate two exact rational intervals and retain their exact endpoints.",
        source: "(9/10:11/10) * (3/2:7/4)",
        keywords: "interval uncertainty bounds product",
    },
    {
        id: "harmonic-mean",
        category: "Calculator programs",
        complexity: "Short",
        output: "Number",
        title: "Define an exact function",
        summary: "Create a reusable harmonic mean and call it with two rational inputs.",
        source: program(`
HarmonicMean(a, b) -> 2 * a * b / (a + b);
HarmonicMean(3/4, 5/6)
        `),
        keywords: "function exact harmonic mean non-reactive",
    },
    {
        id: "fraction-table",
        category: "Calculator programs",
        complexity: "Short",
        output: "Table",
        title: "A small exact-value table",
        summary: "Compose fractions and their squares into portable structured output.",
        source: program(`
.Table(
    ["n", "fraction", "square"],
    [
        [1, 1/2, 1/4],
        [2, 2/3, 4/9],
        [3, 3/4, 9/16],
        [4, 4/5, 16/25]
    ],
    {= caption="Exact fractions and squares" }
)
        `),
        keywords: "table structured output fraction square non-reactive",
    },
    {
        id: "static-geometry",
        category: "Calculator programs",
        complexity: "Medium",
        output: "Graphic",
        title: "Draw a geometric postcard",
        summary: "Build a portable vector scene from paths, circles, rectangles, and text.",
        source: program(`
.Graphics.Graphic([360, 190], [
    .Graphics.Rectangle([0, 0], [360, 190],
        {= fill="#f0fdfa" }),
    .Graphics.Path([[45, 145], [180, 30], [315, 145], [45, 145]],
        {= stroke="#0f766e", width=4, fill="#ccfbf1" }),
    .Graphics.Circle([180, 95], 34,
        {= fill="#7c3aed", stroke="#ffffff", width=3 }),
    .Graphics.Text([180, 103], "RiX",
        {= fill="#ffffff", anchor="middle", size=20, weight="bold" })
])
        `),
        keywords: "graphic drawing geometry path circle vector non-reactive",
    },
    {
        id: "triangular-number",
        category: "Reactive models",
        complexity: "Short",
        output: "Number",
        title: "A live triangular number",
        summary: "Move one exact slider and watch a derived numerical value update.",
        source: program(`
$$n := .Slider(5, 1:20, 1, "n");
$$triangular := $n * ($n + 1) / 2;
$triangular
        `),
        keywords: "reactive slider number sequence triangular dashboard",
    },
    {
        id: "simple-interest",
        category: "Reactive models",
        complexity: "Medium",
        output: "Table",
        title: "Exact simple-interest model",
        summary: "Combine a direct expression input with exact rate and duration sliders.",
        source: program(`
$$principal := .Input(1200, "Principal");
$$rate := .Slider(1/20, 0:1/5, 1/100, "Annual rate");
$$years := .Slider(5, 1:20, 1, "Years");

$$interestReport := {;
    interest := $principal * $rate * $years;
    total := $principal + interest;
    .Table(
        ["Quantity", "Exact value"],
        [
            ["Principal", $principal],
            ["Rate", $rate],
            ["Years", $years],
            ["Interest", interest],
            ["Total", total]
        ],
        {= caption="Simple interest, with no rounded cents" }
    )
};
$interestReport
        `),
        keywords: "reactive input slider financial interest numerical table dashboard",
    },
    {
        id: "reactive-circle",
        category: "Reactive models",
        complexity: "Medium",
        output: "Graphic",
        title: "Reactive circle studio",
        summary: "Control exact geometry and color while a portable graphic redraws live.",
        source: program(`
$$radius := .Slider(42, 10:80, 2, "Radius");
$$fill := .Choice("#0f766e", [
    {= value="#0f766e", label="teal" },
    {= value="#7c3aed", label="violet" },
    {= value="#be123c", label="crimson" }
], "Fill color");

$$circleStudio := .Graphics.Graphic([360, 220], [
    .Graphics.Rectangle([0, 0], [360, 220], {= fill="#f8fafc" }),
    .Graphics.Path([[40, 110], [320, 110]],
        {= stroke="#cbd5e1", width=1 }),
    .Graphics.Path([[180, 25], [180, 195]],
        {= stroke="#cbd5e1", width=1 }),
    .Graphics.Circle([180, 110], $radius,
        {= fill=$fill, stroke="#ffffff", width=4 }),
    .Graphics.Text([180, 116], @"r = @{$radius}",
        {= fill="#ffffff", anchor="middle", size=18, weight="bold" })
]);
$circleStudio
        `),
        keywords: "reactive graphic circle slider choice color geometry dashboard",
    },
    {
        id: "reactive-quadratic",
        category: "Polynomial labs",
        complexity: "Long",
        output: "Plot",
        title: "Reactive quadratic coefficients",
        summary: "Explore an exact quadratic whose three coefficients are dashboard controls.",
        source: program(`
.Plugin.Load("plot");

$$a := .Choice(1, [-2, -1, 1, 2], "x² coefficient");
$$b := .Slider(-2, -8:8, 1, "x coefficient");
$$c := .Slider(-1, -8:8, 1, "constant");

$$quadraticLab := {;
    coefficients := [$a, $b, $c];
    discriminant := $b^2 - 4 * $a * $c;
    graph := .plot.Polynomial(coefficients, [-5, 5], {=
        size=[620, 340],
        yDomain=[-24, 24],
        stroke="#2563eb",
        width=3,
        label="f(x)"
    });
    .Fragment([
        .Heading(2, "Reactive quadratic"),
        .Paragraph(@"f(x) = @{$a}x² + @{$b}x + @{$c}"),
        graph,
        .Table(
            ["Quantity", "Exact value"],
            [
                ["Coefficients", coefficients],
                ["Discriminant", discriminant],
                ["f(0)", $c]
            ]
        )
    ])
};
$quadraticLab
        `),
        keywords: "reactive polynomial quadratic coefficients discriminant plot graph dashboard",
    },
    {
        id: "synthetic-recenter",
        category: "Polynomial labs",
        complexity: "Extended",
        output: "Plot + grids",
        title: "Recenter a cubic by synthetic division",
        summary: "Repeated synthetic division derives the coefficients of P(h + u) and plots the recentered cubic.",
        source: program(`
.Plugin.Load("algebra");
.Plugin.Load("plot");

$$a := .Choice(1, [-2, -1, 1, 2], "x³ coefficient");
$$b := .Slider(-3, -8:8, 1, "x² coefficient");
$$c := .Slider(2, -8:8, 1, "x coefficient");
$$d := .Slider(4, -8:8, 1, "constant");
$$center := .Slider(2, -3:3, 1/2, "Center h");

$$recenteredCubic := {;
    original := [$a, $b, $c, $d];
    polynomial := .algebra.Polynomial(original);

    first := .algebra.SyntheticDivide(polynomial, $center);
    second := .algebra.SyntheticDivide(first.Quotient(), $center);
    third := .algebra.SyntheticDivide(second.Quotient(), $center);

    constantInU := first.Remainder().Evaluate(0);
    linearInU := second.Remainder().Evaluate(0);
    quadraticInU := third.Remainder().Evaluate(0);
    shifted := [$a, quadraticInU, linearInU, constantInU];

    shiftedPlot := .plot.Polynomial(shifted, [-4, 4], {=
        size=[620, 340],
        yDomain=[-80, 80],
        stroke="#7c3aed",
        width=3,
        label="P(h + u)"
    });

    .Fragment([
        .Heading(2, "Synthetic recentering"),
        .Paragraph(@"Set u = x - @{$center}, so x = u + @{$center}."),
        .Table(
            ["Basis", "Descending coefficients"],
            [
                ["P(x)", original],
                ["P(h + u)", shifted]
            ],
            {= caption="Repeated remainders become the new coefficients" }
        ),
        .Heading(3, "Divide P(x) by x - h"),
        first.Grid(),
        .Heading(3, "Divide the quotient again"),
        second.Grid(),
        .Heading(3, "One final synthetic division"),
        third.Grid(),
        .Heading(3, "The same curve in u-coordinates"),
        shiftedPlot
    ])
};
$recenteredCubic
        `),
        keywords: "reactive polynomial cubic coefficients synthetic division recenter shift horner plot graph dashboard",
    },
    {
        id: "scene3d-camera-studio",
        category: "Spatial labs",
        complexity: "Extended",
        output: "Interactive 3D snapshot",
        title: "Orbit an exact 3D scene",
        summary: "Drive a retained mesh, rational camera orbit, lights, and lit/wireframe snapshots from exact controls.",
        source: program(`
.Plugin.Load("scene3d");

Cayley(t) -> {= c=(1-t^2)/(1+t^2), s=2*t/(1+t^2) };
vertices := [
    [-1,-1,0], [1,-1,0], [1,1,0], [-1,1,0],
    [-1,-1,2], [1,-1,2], [1,1,2], [-1,1,2]
];
triangles := [
    [1,3,2], [1,4,3], [5,6,7], [5,7,8],
    [1,2,6], [1,6,5], [2,3,7], [2,7,6],
    [3,4,8], [3,8,7], [4,1,5], [4,5,8]
];
cube := .scene3d.Mesh(vertices, triangles, {= color="#2563eb", width=2 });
axes := .scene3d.Group([
    .scene3d.Polyline([[-3,0,0],[3,0,0]], {= color="#dc2626", width=3 }),
    .scene3d.Polyline([[0,-3,0],[0,3,0]], {= color="#16a34a", width=3 }),
    .scene3d.Polyline([[0,0,0],[0,0,3]], {= color="#2563eb", width=3 }),
    .scene3d.PointCloud([[0,0,0],[3,0,0],[0,3,0],[0,0,3]], {= color="#111827", radius=4 })
]);

$$orbit := 1/3;
$$spin := 1/4;
$$height := 7/2;
$$projection := "perspective";
$$mode := "lit";

$$view := {;
    cameraPair := Cayley($orbit);
    spinPair := Cayley($spin);
    position := [6*cameraPair[:c], 6*cameraPair[:s], $height];
    camera := $projection == "perspective"
      ?: .scene3d.PerspectiveCamera(position, [0,0,1])
      ?_ .scene3d.OrthographicCamera(position, [0,0,1], {= scale=6 });
    matrix := [spinPair[:c],-spinPair[:s],0,0, spinPair[:s],spinPair[:c],0,0, 0,0,1,0, 0,0,0,1];
    scene := .scene3d.Scene([
        @axes,
        .scene3d.Transform([@cube], {= matrix=matrix })
    ], {=
        camera=camera,
        lights=[
            .scene3d.AmbientLight("#ffffff", 1/4),
            .scene3d.DirectionalLight([2,-3,-4], {= intensity=3/4 })
        ]
    });
    snapshot := .scene3d.Snapshot(scene, {= size=[680,440], mode=$mode });
    .Fragment([
        .Heading(2, "Exact Scene3D camera studio"),
        .ControlPanel([
            .Controls.Slider($$orbit, -2:2, 1/12, "camera orbit"),
            .Controls.Slider($$spin, -2:2, 1/12, "cube rotation"),
            .Controls.Slider($$height, 2:7, 1/4, "camera height"),
            .Controls.Choice($$projection, ["perspective","orthographic"], "projection"),
            .Controls.Choice($$mode, ["lit","wireframe"], "snapshot mode")
        ]),
        .Figure(snapshot[:value], "Exact retained geometry; approximation starts at the selected camera snapshot."),
        .Table(["Stage","Value"], [
            ["scene", scene[:schema]],
            ["realized", scene[:realized][:schema]],
            ["projected", snapshot[:projected][:schema]],
            ["work", snapshot[:work]]
        ])
    ])
};
$view
        `),
        keywords: "scene3d 3d reactive camera orbit mesh lights lit wireframe retained exact cayley",
    },
    {
        id: "nd-hypercube-lab",
        category: "Spatial labs",
        complexity: "Extended",
        output: "Interactive nD projection",
        title: "Project a live nD hypercube",
        summary: "Compare 4D, 5D, and 6D hypercubes after exact hidden-plane rotations and explicit projection to Scene3D.",
        source: program(`
.Plugin.Load("scene3d");
.Plugin.Load("nd");

Cayley(t) -> {= c=(1-t^2)/(1+t^2), s=2*t/(1+t^2) };
HiddenRotation(dimension, turn) -> {;
    combined := .nd.CayleyRotation(dimension, 1, 2, 0);
    {@ hidden=4; hidden<=@dimension; {;
        visible := hidden-3;
        parameter := hidden%2 == 0 ?: @turn ?_ 0-@turn;
        next := .nd.CayleyRotation(@dimension, visible, hidden, parameter);
        @combined ~= .nd.Compose(next, @combined);
    }; hidden+=1 };
    combined
};

$$dimension := 4;
$$hiddenTurn := 1/3;
$$cameraTurn := 1/4;
$$color := "#7c3aed";

$$view := {;
    source := .nd.Hypercube($dimension, 2);
    rotation := HiddenRotation($dimension, $hiddenTurn);
    xyz := .nd.CoordinateProjection($dimension, [1,2,3]);
    projected := .nd.Project(source, .nd.Compose(xyz, rotation));
    orbit := Cayley($cameraTurn);
    camera := .scene3d.OrthographicCamera([6*orbit[:c],6*orbit[:s],4], [0,0,0], {= scale=6 });
    scene := .nd.ToScene3D(projected, {= camera=camera, style={= color=$color, width=2, opacity=4/5 } });
    graphic := .scene3d.Snapshot(scene, {= size=[680,460] })[:value];
    .Fragment([
        .Heading(2, "Exact nD hypercube lab"),
        .ControlPanel([
            .Controls.Choice($$dimension, [4,5,6], "dimension"),
            .Controls.Slider($$hiddenTurn, -1:1, 1/12, "hidden-plane turn"),
            .Controls.Slider($$cameraTurn, -2:2, 1/12, "3D camera orbit"),
            .Controls.Choice($$color, ["#7c3aed","#0891b2","#be123c"], "edge color")
        ]),
        .Figure(graphic, "Every hidden dimension is mixed into x/y/z before the explicit coordinate projection."),
        .Table(["Quantity","Value"], [
            ["dimension", source[:dimension]],
            ["vertices", source[:vertices].Len()],
            ["edges", source[:edges].Len()],
            ["nD schema", source[:schema]],
            ["projection schema", xyz[:schema]]
        ])
    ])
};
$view
        `),
        keywords: "nd n-dimensional hypercube tesseract 4d 5d 6d exact cayley projection scene3d reactive",
    },
    {
        id: "nd-slice-sweep",
        category: "Spatial labs",
        complexity: "Extended",
        output: "Interactive 4D section",
        title: "Sweep a tesseract slice",
        summary: "Intersect rotated 4D edges with w = level exactly, then compare the section points with an affine wireframe projection.",
        source: program(`
.Plugin.Load("scene3d");
.Plugin.Load("nd");

SlicePoints(polytope, level) -> {;
    points := [];
    {@ edgeIndex=1; edgeIndex<=@polytope[:edges].Len(); {;
        edge := @polytope[:edges][edgeIndex];
        first := @polytope[:vertices][edge[1]];
        second := @polytope[:vertices][edge[2]];
        crosses := (first[4]<@level && second[4]>@level) || (second[4]<@level && first[4]>@level);
        crosses ?: {;
            amount := (@level-@first[4])/(@second[4]-@first[4]);
            point := [1,2,3].Map(axis -> @first[axis]+@amount*(@second[axis]-@first[axis]));
            @points ~= @points.Push(point);
        } ?_ _;
    }; edgeIndex+=1 };
    points
};

source := .nd.Hypercube(4, 2);
rotated := .nd.Project(source, .nd.Compose(
    .nd.CayleyRotation(4,2,4,-1/3),
    .nd.CayleyRotation(4,1,4,1/2)
));
wire3d := .nd.Project(rotated, .nd.CoordinateProjection(4,[1,2,3]));
wire := .nd.ToScene3D(wire3d, {= style={= color="#94a3b8", width=1, opacity=1/3 } });
$$level := 0;

$$view := {;
    points := SlicePoints(@rotated, $level);
    scene := .scene3d.Scene([
        @wire[:children][1],
        .scene3d.PointCloud(points, {= color="#e11d48", radius=6 })
    ], {= camera=.scene3d.OrthographicCamera([5,5,4],[0,0,0],{= scale=5 }) });
    graphic := .scene3d.Snapshot(scene, {= size=[680,460] })[:value];
    .Fragment([
        .Heading(2, "Exact tesseract edge/plane section"),
        .Paragraph("Grey is affine projection; red points are exact intersections computed before w is discarded."),
        .ControlPanel([.Controls.Slider($$level, -6/5:6/5, 1/5, "w level")]),
        .Figure(graphic, @"w = @{$level}; @{points.Len()} intersections"),
        .Table(["Property","Value"], [["slice axis",4],["level",$level],["intersections",points.Len()]])
    ])
};
$view
        `),
        keywords: "nd tesseract 4d slice section hyperplane intersection animation scene3d reactive exact",
    },
].map((example) => Object.freeze(example)));

export function findShowcaseExamples(query = "") {
    const needle = String(query).trim().toLowerCase();
    if (!needle) return showcaseExamples;
    return showcaseExamples.filter((example) => [
        example.title,
        example.summary,
        example.category,
        example.complexity,
        example.output,
        example.keywords,
        example.source,
    ].join(" ").toLowerCase().includes(needle));
}

export function showcaseExample(id) {
    return showcaseExamples.find((example) => example.id === id) || null;
}
