---
number: 3
title: Collections and text
description: Choose arrays, strings, tuples, maps, and sets for different kinds of data.
---

## Start with a list

An array holds values in order. Its first item has index `1`, and duplicate values remain separate.

```rix edu
measurements := [3 / 2, 7 / 4, 2];
measurements[2];
```

The answer is the exact rational `7/4`, which the browser may display as a mixed number. Change the second entry and rerun the cell. [Arrays](arrays.html) explains reading and making a revised array.

## Choose a shape

Text values use quotation marks. A tuple uses `{: ... }` for a small positional group. A map names entries. A set retains distinct values.

```rix edu
name := "bolt";
pair := {: name, 3 };
stock := {= bolts=24, nuts=18 };
choices := {| "bolt", "nut", "bolt" |};
[name[1], pair[2], stock.Get("bolts"), choices.Has("nut")];
```


The result reads as `b`, `3`, `24`, and true. The set stores `bolt` once even though it appears twice in the literal. Read [Strings and tuples](tuples-and-strings.html), [Maps](maps.html), and [Sets](sets.html) when you need each form.


For a first program, arrays and strings are enough; maps, sets and shaped values can wait until a task calls for them. [Shaped values](tensors.html) handles rectangular data, and [Exact inventory](capstone-inventory.html) combines several collection shapes after you have tried their focused lessons.

:::challenge Find the middle value
Make an array called `scores` containing 4, 9, and 16. Return the middle item using RiX's one-based index.
:::

Continue with [Decisions and blocks](control.html) to choose what to do with a value.
