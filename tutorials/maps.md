---
number: 2b
title: Maps
description: Use named entries when a collection reads more like a compact record.
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
scaled := base |>> (amount, ingredient) -> amount * 2;
finished := scaled.Set("salt", 1 / 20);
{: base, finished } ;
```

The map form of the mapping pipe preserves the existing keys and transforms only values. Its callback receives value first and key second. That same receiver-first convention is used throughout collection traversal, although the locator changes shape: an array supplies a one-based position and a map supplies its key.

Use `Merge` when an entire patch map is already available, and `Update` when the replacement depends on the existing value. Their bang forms mutate a deliberately mutable receiver; the non-bang forms are easier to reason about in tutorial and calculation work.

The method chips below are the page's API doorway. Open one when you need the exact signature rather than guessing how a record operation treats a missing key.

:::challenge Add a named entry
Create a map named `point` with x=3 and y=5. Use `Set` to create `point3d` with z=7, then return it.
:::
