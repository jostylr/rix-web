---
number: 10g
title: Capstone: package design
description: Design a safe RiX package boundary.
---

## The problem

Imagine a package that converts a list of exact prices into taxed prices. Before writing an import header, prototype the pure calculation and identify the smallest capability surface the package needs.

Prerequisites: [RiX scripts](rix-scripts.html), [Functions](functions.html), and [Pipes](pipes.html). Predict the first taxed price before running the cell.

## Build the solution

```rix edu
ApplyTax(price, rate) -> price * (1 + rate);
prices := [3 / 2, 2, 9 / 4];
taxed := prices |>> (price) -> ApplyTax(price, 1 / 20);
taxed ;
```

## How the pieces fit

The computational core needs only arithmetic, functions, arrays, and a map pipe. It does not need file, network, or JavaScript permissions. A package interface can later declare prices and rate as inputs and taxed as an output while withholding unrelated capabilities.

## Design from the pure core outward

The runnable cell is host-independent: it accepts values, transforms them, and returns values. File loading, tax-table fetching, and currency formatting should wrap this core instead of becoming hidden dependencies. That keeps it testable in RatCalc and reusable in other hosts.

A package interface can name required inputs and exports, then grant only capabilities the implementation actually uses. Adding a JavaScript formatter later becomes a visible trust decision. Exact prices also postpone rounding until presentation or settlement, avoiding order-dependent results from rounding every intermediate amount.

The pure calculation needs no host capability beyond the ordinary language operations shown. Any later file or JavaScript dependency should appear in the package interface.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Write a short interface design in comments, then add a discount function and compose it with ApplyTax.
:::

## Review questions

- What is the exact first taxed price at a rate of `1/20`?
- Which inputs and outputs should a package interface name?
- What capability would be required only after adding file or JavaScript integration?
