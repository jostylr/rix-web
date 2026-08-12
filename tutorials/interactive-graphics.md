---
number: 12f
title: Interactive graphics
description: Drag a point through the shared widget protocol and watch reactive output change.
---

A Graphic can contain a small host-neutral interaction target without owning
browser state. `.Graphics.DragPoint` names a reactive node; the renderer
turns it into a draggable SVG handle, and the host publishes a semantic
`graphic:position` event back through the same widget-session boundary used by
Sheets.

## Drag one reactive value and update the whole document

The point below is an ordinary `$$point` reactive value. Drag the purple handle
and release it. The path, reflected circle, and table are rebuilt from the newly
committed point in one reactive epoch. Focus the handle and use the arrow keys
for repeated exact one-unit moves; hold Shift for ten units. Focus stays on the
replacement handle after each reactive redraw.

```rix edu
$$point := {: 90, 70};

$$score := {;
    p := $point;
    p[1] + 2 * p[2]
};

$$view := {;
    p := $point;
    .Fragment([
        .Table(
            ["quantity", "value"],
            [
                ["x", p[1]],
                ["y", p[2]],
                ["x + 2y", $score]
            ],
            {= caption="Reactive point values" }
        ),
        .Graphics.Graphic([360,220], [
            .Graphics.Rectangle(
                [0,0],
                [360,220],
                {= fill="#f8fafc", stroke="#cbd5e1" }
            ),
            .Graphics.Path(
                [[20,200], p],
                {= stroke="#2563eb", width=3 }
            ),
            .Graphics.Circle(
                [360 - p[1], p[2]],
                7,
                {= fill="#f97316" }
            ),
            .Graphics.Text(
                [14,20],
                "Drag purple; orange is reflected",
                {= fill="#475569", size=13 }
            ),
            .Graphics.DragPoint(
                $$point,
                9,
                {= fill="#7c3aed" },
                "Move the reactive point"
            )
        ])
    ])
};

$view ;
```

`.Graphics.DragPoint` accepts the raw reactive identity `$$point`, while its
constructor reads the current position. A committed drag behaves like
`$point := {: newX, newY}`: it keeps the node identity, replaces its current
definition with that literal point, and recomputes everything that depends on
it. If the point itself previously depended on other reactive values, dragging
severs those incoming dependencies; the widget displays that consequence
before the first edit.

## The protocol stays outside the scene

The retained Graphic stores its coordinate space, scene nodes, target ID, and
current exact position. It does not store a DOM node or pointer event. During a
drag the renderer previews the handle locally. On release it sends
`graphic:position` with the target ID and graphic coordinates to a host-owned
widget session. That session validates the target, converts the coordinates to
exact RiX rationals, and replaces the reactive definition. A host that cannot
provide interaction still renders the same Graphic as ordinary SVG.

This is the same architectural split as an editable Sheet: portable output
describes meaning, a host adapter owns interaction, and the reactive graph owns
recomputation.

## Make scene nodes dispatch RiX actions

`.Graphics.Action` wraps ordinary scene nodes. The wrapper names a reactive
target and a RiX callable that returns its replacement. Choose either circle,
or focus it and press Enter or Space; the selected exact value and the scene
update together.

```rix edu
$$choice := 1;

ChoiceNode(value, x, color) -> .Graphics.Action({=
    id=@"choice-@{value}",
    target=$$choice,
    action=current -> value,
    label=@"Choose exact value @{value}",
    children=[
        .Graphics.Circle([x,70], 34, {= fill=color, stroke="#4c1d95", width=2 }),
        .Graphics.Text([x,77], value, {= anchor="middle", size=20, weight="bold" })
    ]
});

$$view := .Fragment([
    .Paragraph(@"Selected exact value: @{$choice}"),
    .Graphics.Graphic([280,140], [
        ChoiceNode(1, 85, $choice == 1 ?: "#c4b5fd" ?_ "#ede9fe"),
        ChoiceNode(2, 195, $choice == 2 ?: "#c4b5fd" ?_ "#ede9fe")
    ])
]);

$view ;
```

The retained scene stores the action ID, target ID, children, and accessible
label—not a DOM event. The browser emits `graphic:action`; the widget session
runs the callback and performs the same reactive replacement used by controls.

:::challenge Add a reactive radius
Create a reactive point, a derived radius based on its y coordinate, and a
reactive Fragment containing a Graphic. Use `.Graphics.DragPoint($$point)` for
the handle and draw a second Circle whose radius changes after the point moves.

    $$point := {: 80, 50};
    $$radius := {; p := $point; 5 + p[2] / 10 };
    $$picture := {;
        p := $point;
        .Graphics.Graphic([240,150], [
            .Graphics.Circle([170,75], $radius,
                {= fill="#bfdbfe", stroke="#2563eb" }),
            .Graphics.DragPoint($$point, 8, {= fill="#7c3aed" })
        ])
    };
    $picture ;
:::
