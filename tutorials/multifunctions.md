---
number: 5b
title: Multifunctions
description: Prepared variants, inline dispatch, composition, and recursion.
---

## Orientation

A multifunction holds ordered variants. Preparation clauses decide whether a variant accepts an input; `$` refers to the active variant and `$$` to the parent multifunction.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
Abs(x) ?- [x >= 0] /Positive/ => x
Abs(x) /Negative/ => -x
Abs(-7)
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Use a soft prep clause to skip a variant and a strict one when failure should stop evaluation.

## Explicit and inline multifunctions

`{> ... }` creates a multifunction value directly. This makes quick pipe dispatch readable without first choosing a name:

```rix
[-3, 0, 4] |>> {>
  (x) ?- [x < 0] /Negative/ -> -x,
  (x) ?- [x > 0] /Positive/ -> x^2,
  (x) /Zero/ -> 0
}
```

The result is `[3, 0, 16]`. Variants are tried in order and only prep failure falls through.

Entries can also be existing functions or whole multifunctions. Whole multifunctions flatten in the order written:

```rix
Small = {> (x) /Increment/ -> x + 1 }
Large = {> (x) /Scale/ -> x * 10 }
Combined = {> Small, Large }
Combined[2](3)
```

A named variant is an ordinary function value. Select it with `F[:Name]`, call it directly, pass it to a pipe, or insert it into another multifunction:

```rix
Abs = {>
  (x) ?- [x >= 0] /Positive/ -> x,
  (x) /Negative/ -> -x
}
PositiveOnly = {> Abs[:Positive] }
PositiveOnly(7)
```

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Multifunctions practice
Create a two-variant function that treats zero differently from other values.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
