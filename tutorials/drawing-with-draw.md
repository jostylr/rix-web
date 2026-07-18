---
number: 12d
title: Drawing with .Draw
description: Build diagrams from paths, shapes, groups, transforms, and clips.
---

# Drawing with .Draw

`.Draw` is RiX's compact vocabulary for two-dimensional scene nodes. It keeps
common global names such as `Path`, `Group`, and `Circle` available to other
math domains, while giving graphics a stable namespace: `.Draw.Path`,
`.Draw.Group`, and so on. Put the resulting nodes inside `.Graphic` to render
them.

## Draw a path and close a shape

Every path is an ordered list of `[x, y]` points. Add `closed=1` when the
last point should connect back to the first. Style maps use SVG-like names:
`stroke`, `fill`, `width`, `dash`, and `opacity`.

~~~rix
.Graphic([300, 180], [
    .Draw.Rectangle([0, 0], [300, 180],
        {= fill="#f8fafc", stroke="#cbd5e1" }),
    .Draw.Path([[60, 140], [150, 35], [240, 140]],
        {= closed=1, fill="#bfdbfe", stroke="#2563eb", width=3 })
])
~~~

The coordinates describe the graphic, not browser pixels. A host can scale the
scene to fit its available width while preserving its internal relationships.

## Add rectangles, circles, and text

`Rectangle` takes an upper-left origin and `[width, height]`. `Circle` takes a
center and radius. `.Draw.Text` is positioned at its baseline; use
`anchor=:middle` to center it on the x coordinate.

~~~rix
.Graphic([360, 190], [
    .Draw.Rectangle([0, 0], [360, 190],
        {= fill="#fff", stroke="#cbd5e1" }),
    .Draw.Circle([90, 90], 52,
        {= fill="#dbeafe", stroke="#2563eb", width=2 }),
    .Draw.Rectangle([185, 45], [115, 90],
        {= fill="#fef3c7", stroke="#d97706", width=2 }),
    .Draw.Text([90, 96], "circle",
        {= anchor=:middle, size=16, weight="bold" }),
    .Draw.Text([242, 96], "box",
        {= anchor=:middle, size=16, weight="bold" })
])
~~~

Colors, opacity, strokes, and text settings belong to the individual node's
style map. Use a group when several nodes should share a style or move together.

## Group related nodes

`.Draw.Group` collects children into one scene subtree. A group may also carry
a style map, allowing a parent to set a common opacity or other shared SVG
style. This badge consists of a circle and a text mark.

~~~rix
badge := .Draw.Group([
    .Draw.Circle([0, 0], 34,
        {= fill="#4f46e5", stroke="#312e81", width=2 }),
    .Draw.Text([0, 6], "RiX",
        {= anchor=:middle, size=18, weight="bold", fill="#fff" })
])

.Graphic([260, 140], [
    .Draw.Rectangle([0, 0], [260, 140], {= fill="#eef2ff" }),
    .Draw.Transform([badge], {= translate=[130, 70] })
])
~~~

Notice that the badge is designed around `[0, 0]`, then placed later. This
makes a small scene component reusable at several positions or scales.

## Transform a scene without changing its children

`.Draw.Transform` applies translation, rotation, and scale to a subtree. Its
second argument is a transform map; `origin` sets the center for rotation.
Transforms happen in the order shown by the renderer: translate, rotate, then
scale.

~~~rix
arrow := .Draw.Group([
    .Draw.Path([[0, 0], [70, 0]], {= stroke="#0f766e", width=5 }),
    .Draw.Path([[70, 0], [48, -14], [48, 14]],
        {= closed=1, fill="#0f766e" })
])

.Graphic([320, 200], [
    .Draw.Rectangle([0, 0], [320, 200], {= fill="#f0fdfa" }),
    .Draw.Transform([arrow], {= translate=[75, 100], rotate=-25, scale=1.6 })
])
~~~

Because the arrow was defined around the origin, its transformation is easy to
read. If you prefer, `Transform` also accepts one map containing `children`,
`translate`, `rotate`, `scale`, and `origin`.

## Limit a subtree with a clip

`.Draw.Clip(children, [x, y, width, height])` keeps only the part of its
children inside the specified rectangle. Clipping is useful for viewports,
cropped diagrams, and decorations that intentionally extend beyond a panel.

~~~rix
stripes := .Draw.Group([
    .Draw.Path([[-30, 160], [170, -40]],
        {= stroke="#7c3aed", width=18, opacity=1 / 3 }),
    .Draw.Path([[20, 200], [220, 0]],
        {= stroke="#db2777", width=18, opacity=1 / 3 })
])

.Graphic([300, 190], [
    .Draw.Rectangle([0, 0], [300, 190], {= fill="#fff" }),
    .Draw.Clip([stripes], [55, 35, 190, 120]),
    .Draw.Rectangle([55, 35], [190, 120],
        {= fill="none", stroke="#475569", width=2 }),
    .Draw.Text([150, 105], "clipped view",
        {= anchor=:middle, size=16, weight="bold" })
])
~~~

The final rectangle is not part of the clip: it draws the visible border after
the clipped artwork. Ordering children is therefore also the paint order.

:::challenge Build a labeled marker
Make a `240` by `160` graphic with a background rectangle, one circle, and a
centered `.Draw.Text` label. Then place both the circle and text in a group and
move that group with `.Draw.Transform`.
:::
