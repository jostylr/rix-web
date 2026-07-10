---
number: 10d
title: Capstone: package design
description: Design a safe RiX package boundary.
---

## The problem

Imagine a package that converts a list of exact prices into taxed prices. Before writing an import header, prototype the pure calculation and identify the smallest capability surface the package needs.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
ApplyTax(price, rate) -> price * (1 + rate)
prices := [3 / 2, 2, 9 / 4]
taxed := prices |>> (price) -> ApplyTax(price, 1 / 20)
taxed
~~~

## How the pieces fit

The computational core needs only arithmetic, functions, arrays, and a map pipe. It does not need file, network, or JavaScript permissions. A package interface can later declare prices and rate as inputs and taxed as an output while withholding unrelated capabilities.

## Design from the pure core outward

The runnable cell is host-independent: it accepts values, transforms them, and returns values. File loading, tax-table fetching, and currency formatting should wrap this core instead of becoming hidden dependencies. That keeps it testable in RatCalc and reusable in other hosts.

A package interface can name required inputs and exports, then grant only capabilities the implementation actually uses. Adding a JavaScript formatter later becomes a visible trust decision. Exact prices also postpone rounding until presentation or settlement, avoiding order-dependent results from rounding every intermediate amount.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Write a short interface design in comments, then add a discount function and compose it with ApplyTax.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
