---
number: 7e
title: Capstone: transform a report
description: Turn a small collection into a derived result.
---

## The problem

A short measurement report should discard nonpositive readings, square the remaining values, and preserve exact fractions. Pipes make the sequence of transformations read from left to right.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

```rix edu
measurements := [-1, 1 / 2, 3 / 2, 2];
positive := measurements |>? (x) -> x > 0;
squares := positive |>> (x) -> x ^ 2;
squares ;
```

## How the pieces fit

The filter pipe keeps only values whose callback succeeds. The map pipe then transforms every retained value. Each intermediate collection has a useful name, which makes the report inspectable and gives errors a meaningful boundary.

## Preserve the pipeline story

The intermediate names are explanation points. A reader can verify that filtering happens before squaring, an order that matters whenever transformation might erase information needed by selection.

Array callbacks receive value, then an optional one-based position, then the source. This report needs only values, so it states one parameter. A position-aware version could retain each measurement's original location. The fractional square also remains exact, making the final reduction an exact summary; decimal formatting belongs at the presentation boundary.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add a reduce step that totals the squared values. Keep the intermediate positive and squared collections visible.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
