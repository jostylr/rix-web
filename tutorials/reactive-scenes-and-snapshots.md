---
number: 12h
title: Reactive scenes and snapshots
description: Use actions, explicit collection publication, snapshots, and timelines in reusable output.
---

Portable output, graphics, and controls can form a live reactive view. The same
scene can also be materialized as a comparison grid or timeline.

## Build one live output value

Declare editable state with `$$name := ...`. Read it as `$name` inside another
reactive definition, and that definition rebuilds after a control commits a new
exact value. An Action is a button whose callable receives its target’s current
value and returns the exact replacement value.

```rix edu
$$a := 1;
$$b := -3;
$$center := 1/2;
$$saved := [];

$$slope := $b + 2 * $a * $center;
$$view := .Fragment([
    .ControlPanel([
        .Controls.Slider($$a, -5:5, 1, "a"),
        .Controls.Slider($$b, -8:8, 1, "b"),
        .Controls.Slider($$center, -3:3, 1/2, "center"),
        .Controls.Action({=
            id="save",
            target=$$saved,
            action=states -> states ++ [{= a=$a, b=$b, center=$center }],
            label="Save this quadratic"
        })
    ], "Quadratic parameters"),
    .Paragraph(@"slope at center = @{$slope}"),
    .Paragraph(@"saved states = @{$saved.Len()}")
]);

$view ;
```

Move a slider, then choose **Save this quadratic**. The action changes only
`$$saved`; because the Fragment reads `$saved`, its count updates with the
same reactive refresh as the control value.

## Publish an intentional in-place mutation

Prefer returning a replacement collection, as the Action above does. For a
large or interop-owned collection, an in-place mutation is sometimes necessary.
Deep collection mutations are deliberately not observed automatically. After a
coherent batch, call `Touch()` on the `$$` identity to publish the existing
object and recompute its dependents once.

```rix edu
$$elements := [1];
$$count := $elements.Len();

$elements.Push!(2);
before := $count;
$$elements.Touch();

{: before, after=$count } ;
```

The result is `{:= 1, after=2}`. `Touch()` neither copies nor validates the
collection; it is an explicit publication boundary, not a substitute for normal
value replacement.

## Reuse a scene for an ordered comparison

A scene is an ordinary callable from one exact state to block output.
`.Snapshots` takes entries of the form `{: scene, states}` and materializes
them into an ordered list. Each entry may use a different scene. The optional
second argument is immutable provenance: `entry` is the input entry position,
`state` is that entry's state position, and `ordinal` is the position in the
complete list. All three are one-based.

```rix edu
CenterCard(center, origin) -> .Fragment([
    .Heading(3, @"snapshot @{origin[:ordinal]}; center = @{center}"),
    .Paragraph(@"For x² - 3x, the tangent slope is @{2 * center - 3}.")
]);

.Snapshots({=
    title="Three centers",
    entries=[{: CenterCard, [-2, 0, 2]}]
}) ;
```

Snapshots are ordinary structured output. Put one in a Fragment, Figure,
Slide, or report without teaching each host about a special-purpose comic
format. A later grid or print renderer can group the linear list by
`origin["entry"]` and `origin["state"]`.

## Sequence the same scene states

`.Timeline.Sequence` accepts the same scene-entry shape and retains the exact,
already materialized frames. `.Timeline.Render` selects a one-based frame for a
static renderer; a future animation or video host can use the same sequence
without changing the RiX program.

```rix edu
CenterCard(center, origin) -> .Paragraph(@"frame @{origin[:ordinal]}; center = @{center}");

motion := .Timeline.Sequence({=
    title="Move the center",
    duration=2,
    entries=[{: CenterCard, [-2, 0, 2]}]
});

.Timeline.Render(motion, 2) ;
```

The bundled browser currently renders the selected frame. Playback and PDF
export are host extensions rather than properties of the scene data.

:::challenge Save and compare states
Make a reactive scalar and a `$$history := []` identity. Add a ControlPanel
Action that appends the current scalar to the history. Then write a scene that
turns one saved scalar into a Paragraph and pass several values to Snapshots.

    $$x := 1;
    $$history := [];
    .ControlPanel([
        .Controls.Action({=
            target=$$history,
            action=values -> values ++ [$x],
            label="Save x"
        })
    ], "History")
:::
