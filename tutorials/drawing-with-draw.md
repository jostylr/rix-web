---
number: 12d
title: Drawing with .Graphics
description: Build intrinsic portable scenes from paths, shapes, groups, transforms, and clips.
---

# Drawing with .Graphics

`.Graphics` is RiX's intrinsic, renderer-facing vocabulary for two-dimensional
scene nodes. It keeps common global names such as `Path`, `Group`, and `Circle`
available to other math domains while giving graphics a stable namespace:
`.Graphics.Path`, `.Graphics.Group`, and so on. Put the resulting nodes inside
`.Graphics.Graphic` to render them.

## Use `.draw` when a convenience is enough

`.draw` is the bundled authoring plugin. Load it with `.Plugin.Load("draw")`.
Its small helpers compile directly to
intrinsic graphics nodes: `Line` produces a path, `Polygon` produces a closed
path, `Label` produces text, and `Box` produces a rectangle.

```rix edu
.Plugin.Load("draw");
.Graphics.Graphic([250, 130], [
    .draw.Box([0, 0], [250, 130], {= fill="#f8fafc", stroke="#cbd5e1" }),
    .draw.Line([35, 95], [125, 25], {= stroke="#2563eb", width=3 }),
    .draw.Polygon([[125, 25], [108, 31], [118, 44]], {= fill="#2563eb" }),
    .draw.Label([125, 112], "convenience helpers", {= anchor=:middle, size=14 })
]) ;
```

Use `.Graphics` directly when you want exact control over scene hierarchy,
paths, transforms, clipping, and the renderer-facing representation.

## Draw a path and close a shape

Every path is an ordered list of `[x, y]` points. Add `closed=1` when the
last point should connect back to the first. Style maps use SVG-like names:
`stroke`, `fill`, `width`, `dash`, and `opacity`.

```rix edu
.Graphics.Graphic([300, 180], [
    .Graphics.Rectangle([0, 0], [300, 180],
        {= fill="#f8fafc", stroke="#cbd5e1" }),
    .Graphics.Path([[60, 140], [150, 35], [240, 140]],
        {= closed=1, fill="#bfdbfe", stroke="#2563eb", width=3 })
]) ;
```

The coordinates describe the graphic, not browser pixels. A host can scale the
scene to fit its available width while preserving its internal relationships.

## Add rectangles, circles, and text

`Rectangle` takes an upper-left origin and `[width, height]`. `Circle` takes a
center and radius. `.Graphics.Text` is positioned at its baseline; use
`anchor=:middle` to center it on the x coordinate.

```rix edu
.Graphics.Graphic([360, 190], [
    .Graphics.Rectangle([0, 0], [360, 190],
        {= fill="#fff", stroke="#cbd5e1" }),
    .Graphics.Circle([90, 90], 52,
        {= fill="#dbeafe", stroke="#2563eb", width=2 }),
    .Graphics.Rectangle([185, 45], [115, 90],
        {= fill="#fef3c7", stroke="#d97706", width=2 }),
    .Graphics.Text([90, 96], "circle",
        {= anchor=:middle, size=16, weight="bold" }),
    .Graphics.Text([242, 96], "box",
        {= anchor=:middle, size=16, weight="bold" })
]) ;
```

Colors, opacity, strokes, and text settings belong to the individual node's
style map. Use a group when several nodes should share a style or move together.

## Group related nodes

`.Graphics.Group` collects children into one scene subtree. A group may also carry
a style map, allowing a parent to set a common opacity or other shared SVG
style. This badge consists of a circle and a text mark.

```rix edu
badge := .Graphics.Group([
    .Graphics.Circle([0, 0], 34,
        {= fill="#4f46e5", stroke="#312e81", width=2 }),
    .Graphics.Text([0, 6], "RiX",
        {= anchor=:middle, size=18, weight="bold", fill="#fff" })
]);

.Graphics.Graphic([260, 140], [
    .Graphics.Rectangle([0, 0], [260, 140], {= fill="#eef2ff" }),
    .Graphics.Transform([badge], {= translate=[130, 70] })
]) ;
```

Notice that the badge is designed around `[0, 0]`, then placed later. This
makes a small scene component reusable at several positions or scales.

## Transform a scene without changing its children

`.Graphics.Transform` applies translation, rotation, and scale to a subtree. Its
second argument is a transform map; `origin` sets the center for rotation.
Transforms happen in the order shown by the renderer: translate, rotate, then
scale.

```rix edu
arrow := .Graphics.Group([
    .Graphics.Path([[0, 0], [70, 0]], {= stroke="#0f766e", width=5 }),
    .Graphics.Path([[70, 0], [48, -14], [48, 14]],
        {= closed=1, fill="#0f766e" })
]);

.Graphics.Graphic([320, 200], [
    .Graphics.Rectangle([0, 0], [320, 200], {= fill="#f0fdfa" }),
    .Graphics.Transform([arrow], {= translate=[75, 100], rotate=-25, scale=1.6 })
]) ;
```

Because the arrow was defined around the origin, its transformation is easy to
read. If you prefer, `Transform` also accepts one map containing `children`,
`translate`, `rotate`, `scale`, and `origin`.

## Limit a subtree with a clip

`.Graphics.Clip(children, [x, y, width, height])` keeps only the part of its
children inside the specified rectangle. Clipping is useful for viewports,
cropped diagrams, and decorations that intentionally extend beyond a panel.

```rix edu
stripes := .Graphics.Group([
    .Graphics.Path([[-30, 160], [170, -40]],
        {= stroke="#7c3aed", width=18, opacity=1 / 3 }),
    .Graphics.Path([[20, 200], [220, 0]],
        {= stroke="#db2777", width=18, opacity=1 / 3 })
]);

.Graphics.Graphic([300, 190], [
    .Graphics.Rectangle([0, 0], [300, 190], {= fill="#fff" }),
    .Graphics.Clip([stripes], [55, 35, 190, 120]),
    .Graphics.Rectangle([55, 35], [190, 120],
        {= fill="none", stroke="#475569", width=2 }),
    .Graphics.Text([150, 105], "clipped view",
        {= anchor=:middle, size=16, weight="bold" })
]) ;
```

The final rectangle is not part of the clip: it draws the visible border after
the clipped artwork. Ordering children is therefore also the paint order.

:::challenge Build a labeled marker
Make a `240` by `160` graphic with a background rectangle, one circle, and a
centered `.Graphics.Text` label. Then place both the circle and text in a group and
move that group with `.Graphics.Transform`.
:::
