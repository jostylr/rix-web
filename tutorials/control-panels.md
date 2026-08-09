---
number: 12g
title: Reactive control panels
description: Build exact interactive controls on ordinary dollar-reactive RiX values.
---

A control panel is a portable output value that lets a host edit ordinary
reactive RiX state. There is no separate form model: declare a value with
`$$name := ...`, pass its identity as `$$name`, and read it everywhere else as
`$name`. A committed control edit has the same meaning as `$name := value`.

## Start with an exact slider

The slider moves through integer positions, but every position maps back to an
exact RiX number. This example therefore keeps halves as rationals rather than
turning them into JavaScript decimals.

```rix edu
$$x := 2;

$$view := .Fragment([
    .ControlPanel([
        .Controls.Slider($$x, 0:5, 1/2, "x")
    ], "Parameters"),
    .Text(@"x² = @{$x^2}")
]);

$view ;
```

The control receives `$$x`, the stable reactive identity. The text reads `$x`
through its interpolation, so it is rebuilt after each committed move.

## Choose how exact numbers are displayed

Formatting is separate from stored value. Supply a `format` map whose keys name
displayed fields and whose values are ordinary RiX functions. The slider below
shows its current value as a mixed number, its bounds as decimals, and its step
as a continued fraction. Moving it still stores an exact rational.

```rix edu
Mixed(x) -> x _> "..";
Continued(x) -> x _> ".~";
Decimal(x) -> x _> ".12";

$$x := 3/2;

$$view := .Fragment([
    .ControlPanel([
        .Controls.Slider({=
            target=$$x,
            interval=0:3,
            step=1/2,
            label="formatted x",
            format={=
                value=Mixed,
                low=Decimal,
                high=Decimal,
                step=Continued
            }
        })
    ], "Display notation"),
    .Text(@"The stored exact value still computes: 2x = @{2 * $x}")
]);

$view ;
```

The available names follow the control’s visible values: sliders accept
`value`, `low`, `high`, and `step`; ranges additionally accept `start` and
`end`; choices accept `value` and `option`; toggles accept `value`, `off`, and
`on`; resets accept `value` and `initial`. An explicit choice-option label wins
over the `option` formatter.

## Evaluate an exact RiX expression

`.Controls.Input` accepts source text such as `7/9`, `2..1/3`, or an expression
using names available in the current topic. Press Enter or choose Set. The host
evaluates that text as RiX and gives the exact result to the same reactive
identity.

```rix edu
base := 3/7;
$$amount := 1/2;

$$view := .Fragment([
    .ControlPanel([
        .Controls.Input({=
            target=$$amount,
            label="amount",
            help="Try base * 5 or 7/9",
            placeholder="RiX expression"
        })
    ], "Exact input"),
    .Text(@"amount = @{$amount}; doubled = @{2 * $amount}")
]);

$view ;
```

Source evaluation remains a host responsibility. The portable control stores
the target identity and current value, not a browser parser or floating-point
copy.

## Validate or lock a control

A validator returns `_` for an accepted value or a string explaining why a
candidate is invalid. `disabled=1` removes a control from interaction, while
`readOnly=1` keeps its value inspectable without allowing commits.

```rix edu
Positive(x) -> x > 0 ?: _ ?_ "amount must be positive";
$$amount := 3/4;
$$fixed := 2;

$$view := .Fragment([
    .ControlPanel([
        .Controls.Input({=
            target=$$amount,
            label="positive amount",
            help="Try -1, then 7/9",
            validate=Positive,
            format={= value=(x -> x _> "..") }
        }),
        .Controls.Slider({=
            target=$$fixed,
            interval=0:5,
            step=1,
            label="read-only reference",
            readOnly=1
        })
    ], "Policies"),
    .Text(@"amount = @{$amount}")
]);

$view ;
```

Rejected input leaves the reactive identity unchanged and reports the
validator’s message in the panel’s live status area.

## Choose among RiX values

Choice options retain their RiX values. A display label is optional; use a map
when the human-readable label should differ from the value.

```rix edu
$$scale := 1;

$$view := .Fragment([
    .ControlPanel([
        .Controls.Choice($$scale, [
            {= value=1/2, label="half" },
            {= value=1, label="one" },
            {= value=2, label="double" }
        ], "scale")
    ], "Preset"),
    .Text(@"12 × scale = @{12 * $scale}")
]);

$view ;
```

Selecting “half” writes the rational `1/2`; it does not write the label or a
stringified decimal.

## Toggle between explicit values

A toggle does not assume JavaScript `true` and `false`. Supply the exact off
and on values that make sense for the model.

```rix edu
$$multiplier := 1;

$$view := .Fragment([
    .ControlPanel([
        .Controls.Toggle($$multiplier, 1, -1, "flip sign")
    ], "Direction"),
    .Text(@"result = @{5 * $multiplier}")
]);

$view ;
```

Here unchecked means `1` and checked means `-1`. Strings, exact numbers, and
other retained RiX option values can be used when they match the initial value.

## Edit an exact interval

`.Controls.Range` targets one interval-valued reactive identity. Its two
handles choose exact endpoints on the requested step grid.

```rix edu
$$window := 2:5;

$$view := .Fragment([
    .ControlPanel([
        .Controls.Range($$window, 0:10, 1/2, "window")
    ], "Interval"),
    .Text(@"selected interval = @{$window}")
]);

$view ;
```

The lower endpoint cannot pass the upper endpoint. A valid commit replaces
`$window` with a new exact RiX interval.

## Reset to an explicit snapshot

Reset is intentionally explicit about the value it restores. RiX does not hide
an initial-value registry behind the panel: pass the snapshot alongside the
same reactive identity.

```rix edu
initial := 3;
$$count := initial;

$$view := .Fragment([
    .ControlPanel([
        .Controls.Slider($$count, 0:10, 1, "count"),
        .Controls.Reset($$count, initial, "restore count")
    ], "Reset example"),
    .Text(@"count = @{$count}")
]);

$view ;
```

Move the slider, then choose Reset. Both controls target `$$count`; their
distinct control IDs let the host apply the correct value rule.

## Combine controls into one live result

Controls can share a panel while the result remains an ordinary reactive
Fragment. Each control still updates only its own `$$` identity.

```rix edu
$$quantity := 3;
$$price := 5/2;
$$discount := 1;
$$band := 5:15;

$$view := .Fragment([
    .ControlPanel({=
        title="Quote controls",
        description="Every edit stays exact",
        controls=[
            .Controls.Slider($$quantity, 1:10, 1, "quantity"),
            .Controls.Input($$price, "unit price", "Try 11/4"),
            .Controls.Choice($$discount, [1, 4/5], "discount"),
            .Controls.Toggle($$discount, 1, 4/5, "apply 20%"),
            .Controls.Range($$band, 0:20, 1, "target band"),
            .Controls.Reset($$price, 5/2, "reset price")
        ]
    }),
    .Text(@"quote = @{$quantity * $price * $discount}; band = @{$band}")
]);

$view ;
```

The choice and toggle intentionally target the same identity here. A reactive
rerender keeps both controls synchronized with the newly committed value.

## Apply several edits atomically

Use `mode=:staged` when an expensive view should update only after a group of
edits is ready. The controls preview their candidates locally; Apply changes
replaces every affected `$` definition in one reactive transaction. Discard
restores the last committed values without running the graph.

```rix edu
$$width := 3;
$$height := 2;

$$view := .Fragment([
    .ControlPanel({=
        title="Rectangle",
        description="Move both sliders, then apply once",
        mode=:staged,
        submitLabel="Resize",
        controls=[
            .Controls.Slider($$width, 1:10, 1, "width"),
            .Controls.Slider($$height, 1:10, 1, "height")
        ]
    }),
    .Text(@"area = @{$width * $height}")
]);

$view ;
```

This uses the same transaction semantics as `${ ... }`; it does not introduce
a form-owned copy of reactive state. Validation happens before the transaction,
so one invalid candidate prevents every staged target from changing.

## Static and portable snapshots

Interactive panels can be detached from their runtime identities for saved
HTML and document export. `panel.Snapshot()` retains each target ID, exact
current value, labels, formatting snapshots, and help text, while removing the
reactive target and validator handles. The resulting native controls are
disabled and require no JavaScript.

```rix edu
$$rate := 3/4;
panel := .ControlPanel([
    .Controls.Slider({=
        target=$$rate,
        interval=0:2,
        step=1/4,
        label="saved rate",
        format={= value=(x -> x _> "..") }
    })
], "Exported parameters");

panel.Snapshot() ;
```

Hosts can also serialize the snapshot with the versioned
`rix.control-panel` JSON schema. The Markdown renderer emits the same exact
value summary for plain Markdown, Quarto HTML, and Quarto PDF pipelines.

## Controls, a table, and a draggable graphic

This final example exercises both interaction protocols in one reactive
Fragment. The panel changes an exact scale; the draggable point changes an
exact tuple. Both rebuild the table and graphic through ordinary `$` reads.

```rix edu
$$scale := 1;
$$point := {: 90,70};

$$view := {;
    p := $point;
    .Fragment([
        .ControlPanel([
            .Controls.Slider($$scale, 1/2:2, 1/4, "scale")
        ], "Model controls"),
        .Table(
            ["quantity", "exact value"],
            [
                ["x", p[1]],
                ["y", p[2]],
                ["scaled x", $scale * p[1]]
            ],
            {= caption="Reactive values" }
        ),
        .Graphics.Graphic([360,220], [
            .Graphics.Rectangle([0,0], [360,220],
                {= fill="#f8fafc", stroke="#cbd5e1" }),
            .Graphics.Circle(p, 18 * $scale,
                {= fill="#bfdbfe", stroke="#2563eb", width=2 }),
            .Graphics.DragPoint($$point, 9,
                {= fill="#7c3aed" }, "Move the reactive point")
        ])
    ])
};

$view ;
```

:::challenge Build a small exact control panel
Declare an exact reactive rate and interval, then make a panel with an input
for the rate and a range for the interval. Add reactive text that uses both.

    $$rate := 3/4;
    $$window := 2:6;
    $$view := .Fragment([
        .ControlPanel([
            .Controls.Input($$rate, "rate"),
            .Controls.Range($$window, 0:10, 1, "window")
        ], "Model"),
        .Text(@"rate = @{$rate}; window = @{$window}")
    ]);
    $view ;
:::
