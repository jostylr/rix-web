---
number: 2g
title: Capstone: exact recipe scaling
description: Scale an exact fraction and an interval without rounding either one.
---

## The problem

A baker has a formula written for one batch, but today needs three halves of a batch. Flour is known exactly; water has a small acceptable range. The goal is to scale both quantities without rounding either one.

Before starting, read [Expressions](expressions.html), the common inputs in [Number notation](number-notation.html), and [Intervals](intervals.html). The first version needs only named values, multiplication and an interval; no map or tuple is required.

## Build the solution

```rix edu
batches := 3 / 2;
flourPerBatch := 9 / 4;
waterPerBatch := 1:9/8;
flour := batches * flourPerBatch;
water := batches * waterPerBatch;
[flour, water];
```

## How the pieces fit

The first three names are inputs. The next two are derived values. Flour stays a single exact rational; water stays an interval. The final array shows both answers without pretending they have the same kind of certainty. The bounds are exact even though the water amount is uncertain.

## Audit the calculation

Start with flour: three halves of nine quarters is twenty-seven eighths. RatCalc may print a mixed form rather than a rounded decimal. Water follows a different path: multiplying its exact bounds by a positive batch count produces the interval `3/2:27/16`.

Change `batches` to 2 and predict both results before rerunning. To inspect the parts separately, replace the last line with `flour;` or `water;` and run the cell again.

The key modeling choice is visible: a single fraction represents known flour, while a colon interval preserves the water range.

## Extend the model

Add exact sugar at `1/4` per batch. Keep the calculation as a named intermediate so each quantity can be inspected. After [Maps](maps.html), you can report named quantities in a map instead of an array.

:::challenge Capstone extension
Add sugar at `1/4` per batch and another interval-valued ingredient at `1/2:3/4` per batch. At three halves of a batch, sugar should be `3/8` and the added interval should be `3/4:9/8`. Return the four results in an array.
:::

## Review questions

- What are the scaled flour and water values at three halves of a batch?
- Why is the water result still an interval?
- Which output changes if only the water range changes?
