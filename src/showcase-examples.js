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
