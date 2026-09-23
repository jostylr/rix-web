---
number: 8a
title: Conversions
description: Ask and convert semantic types.
---

## Orientation

Use `? :name` to inquire about semantic membership, `~:` for a soft conversion, and `~!:` for a strict conversion that reports failure.

Ask which semantic type a value satisfies before changing its representation.

## A worked example

```rix edu
value := 7;
value ? :integer ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

A conversion does not mutate a binding unless you assign the converted result back.

Try the same question with a fraction and an integer; the distinction matters before choosing a conversion.

:::challenge Conversions practice
Try a type inquiry on an integer and on a fraction.
:::

## Keep going

Continue with [Headers and traits](headers-and-traits.html) for protocol metadata or [Physical units](units.html) for dimensions.
