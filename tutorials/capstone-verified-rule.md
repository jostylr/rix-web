---
number: 9d
title: Capstone: verified rule
description: Build a small rule and validate it with system helpers.
---

## The problem

A reusable rule should have an example that demonstrates its expected behavior and a diagnostic label that gives failures context. This capstone keeps the arithmetic simple so the verification structure remains visible.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
ClampPositive(x) -> x > 0 ?? x ?: 0
actual := ClampPositive(-3)
expected := 0
actual == expected
~~~

## How the pieces fit

The user function contains the domain rule. The next names make the observed and expected values inspectable, and the final equality is a minimal assertion. In a script, the same comparison can be placed inside .Test or paired with .Debug and .Trace when more context is needed.

## Test properties and boundaries

Examples should cover below the lower bound, exactly at each bound, inside the range, and above the upper bound. Those cases expose reversed comparisons and boundary mistakes that one comfortable example misses.

Diagnostics live at the system boundary because reporting, tracing, and stopping are capabilities rather than arithmetic. The visible system call makes that authority apparent. Keeping the rule pure and its expectations nearby lets the same logic run in a calculator, script, or package while preserving a readable contract.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add three cases—negative, zero, and positive—and return a map from case labels to comparison results.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
