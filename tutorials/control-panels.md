---
number: 12g
title: Reactive control panels
description: Build exact interactive controls on ordinary dollar-reactive RiX values.
---

# Reactive control panels

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
