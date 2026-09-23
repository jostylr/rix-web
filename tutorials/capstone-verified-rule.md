---
number: 9g
title: Capstone: verified rule
description: Build a small rule and validate it with system helpers.
---

## The problem

A reusable rule should have an example that demonstrates its expected behavior and a diagnostic label that gives failures context. This capstone keeps the arithmetic simple so the verification structure remains visible.

Prerequisites: [Decisions](control.html), [Functions](functions.html), and [Diagnostics and tests](diagnostics.html). Predict the result for a negative input before running the cell.

## Build the solution

```rix edu
ClampPositive(x) -> x > 0 ?: x ?_ 0;
actual := ClampPositive(-3);
expected := 0;
actual == expected ;
```

## How the pieces fit

The user function contains the domain rule. The next names make the observed and expected values inspectable, and the final equality is a minimal assertion. In a script, the same comparison can be placed inside .Test or paired with .Debug and .Trace when more context is needed.

## Test properties and boundaries

For this rule, test a negative input, zero and a positive input. Those cases expose reversed comparisons and boundary mistakes that one comfortable example misses.

Diagnostics live at the system boundary because reporting, tracing, and stopping are capabilities rather than arithmetic. The visible system call makes that authority apparent. Keeping the rule pure and its expectations nearby lets the same logic run in a calculator, script, or package while preserving a readable contract.

Keep the decision rule pure and test its outputs separately. A diagnostic can then report a failed expectation with the input that caused it.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add three cases—negative, zero, and positive—and return a map from case labels to comparison results.
:::

## Review questions

- What should `ClampPositive(0)` and `ClampPositive(4)` return?
- Why is one negative case insufficient to verify the rule?
- Where would a diagnostic label help identify a failing input?
