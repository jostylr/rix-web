---
number: 1a
title: Capstone: exact recipe scaling
description: Combine variables, fractions, intervals, and calculator workflow.
---

## The problem

A baker has a formula written for one batch, but today needs three halves of a batch. Flour is known exactly; water has a small acceptable range. The goal is to scale both quantities without turning either into an early decimal approximation.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

```rix edu
batches := 3 / 2;
flourPerBatch := 2..1/4;
waterPerBatch := 1:1..1/8;
flour := batches * flourPerBatch;
water := batches * waterPerBatch;
{: flour, water } ;
```

## How the pieces fit

The first three names are inputs. The next two are derived values. Because every number is rational, flour stays a single exact value. Because water starts as an interval, its uncertainty is propagated through multiplication. The final tuple keeps the two answers together without pretending they have the same kind of certainty.

## Audit the calculation

Start with flour: the mixed number is nine quarters, and three halves of it is twenty-seven eighths. RatCalc prints the exact mixed value rather than a rounded decimal. Water follows a different path: multiplying both endpoints by a positive batch count preserves their order and produces another exact interval.

This distinction is the point of the model. Exactness does not require every input to be a point; it requires the program not to discard what is known. An exact interval records exact uncertainty. Run .vars after the cell to inspect assumptions and derived values, then change only batches and compare.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add exact sugar and interval-valued milk quantities. Return a map whose keys explain each scaled result.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
