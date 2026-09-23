---
number: 3c
title: Maps
description: Named entries and record-like data.
---

## Give values a name

A map is written with the `{=` sigil. Each entry has a key and an exact RiX value.

```rix edu
recipe := {= flour=3 / 2, water=1, salt=1 / 40 };
recipe.Get("flour") ;
```

Maps make it clear what each value represents, even when several values have the same numeric type.

Keys are strings at runtime. The identifier-like spelling inside the literal is a convenient record notation, while `Get("flour")` makes dynamic lookup explicit. Use `Has` when absence is materially different from a stored hole or other value.

## Inspect the shape

Use `Keys` and `Values` to see the two sides of a map.

```rix edu
recipe := {= flour=3 / 2, water=1 };
recipe.Keys() ;
```

Map order is not a programming guarantee. Keys, values, and entries are useful for inspection and transformation, but code should not assign meaning to the order in which a map happens to print. Use an array of tuples when order is part of the data.

## Build a revised record

Like array methods, ordinary map methods return a new value. `Set`, `Remove`, `Merge`, and `Update` let a program name each revision without losing the previous record.

```rix edu
base := {= flour=3 / 2, water=1 };
finished := base.Set("salt", 1 / 20);
{: base, finished };
```

`base` remains unchanged; `finished` has one more key. The tuple displays both records side by side. Once you have read [Pipes](pipes.html), you can map a map's values with `|>>`; the callback receives value first and key second, and the map keeps its keys.

Use `Merge` when an entire patch map is already available, and `Update` when the replacement depends on the existing value. Their bang forms mutate a deliberately mutable receiver; the non-bang forms are easier to reason about in tutorial and calculation work.

The method chips below are the page's API doorway. Open one when you need the exact signature rather than guessing how a record operation treats a missing key.

:::challenge Add a named entry
Create a map named `point` with x=3 and y=5. Use `Set` to create `point3d` with z=7, then return it.
:::
