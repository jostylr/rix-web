---
number: 2b
title: Maps
description: Use named entries when a collection reads more like a compact record.
---

## Give values a name

A map is written with the `{=` sigil. Each entry has a key and an exact RiX value.

```rix
recipe := {= flour=3 / 2, water=1, salt=1 / 40 }
recipe.Get("flour")
```

Maps make it clear what each value represents, even when several values have the same numeric type.

## Inspect the shape

Use `Keys` and `Values` to see the two sides of a map.

```rix
recipe := {= flour=3 / 2, water=1 }
recipe.Keys()
```

:::challenge Add a named entry
Create a map named `point` with x=3 and y=5. Use `Set` to create `point3d` with z=7, then return it.
:::
