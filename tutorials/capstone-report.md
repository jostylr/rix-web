---
number: 6e
title: Capstone: transform a report
description: Turn a small collection into a derived result.
---

## The problem

A short measurement report should discard nonpositive readings, square the remaining values, and preserve exact fractions. Pipes make the sequence of transformations read from left to right.

Prerequisites: [Arrays](arrays.html), [Pipes](pipes.html), and [Functions](functions.html). Predict which inputs survive the filter before running the cell.

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

The two intermediate names let you inspect selection before transformation. That order preserves the meaning of “positive reading.”

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add a reduce step that totals the squared values. Keep the intermediate positive and squared collections visible.
:::

## Review questions

- Which measurement is removed before squaring, and why?
- What are the exact squares of `1/2` and `3/2`?
- What exact total does the added reduction produce?
