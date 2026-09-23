---
number: 7e
title: Capstone: bounded simulation
description: Use branches, blocks, and loops to model a process.
---

## The problem

A savings simulation starts with an exact balance and applies a fixed contribution four times. A loop is appropriate because the same state transition repeats and the stopping condition is known.

Prerequisites: [Cells and assignment](cells.html) for updates, [Scope and imports](scope.html) for `@balance`, and the block introduction in [Brace containers](brace-containers.html). Predict the balance after one contribution before running the loop.

## Build the solution

In `{@ i = 0; i < 4; body }`, `i = 0` initializes a loop-local counter, `i < 4` checks the stopping bound before each pass, and the block is the body. Inside it, `@balance += 3 / 4` updates the balance in the surrounding scope and `i += 1` advances the counter. Together they guarantee four passes.

```rix edu
balance := 5 / 2;
{@ i = 0; i < 4; {; @balance += 3 / 4; i += 1 } };
balance ;
```

## How the pieces fit

The loop initializes i, checks a bound, and executes a block that updates both the outer balance and the local counter. The @ prefix states that balance belongs to an outer scope. Because all contributions are rational, the final result is exact and reproducible.

## Separate state, transition, and budget

A simulation is easier to trust when these concerns remain visible. State is the modeled value, the transition describes one change, and the budget caps how often it may happen. Even if a future rule cycles unexpectedly, the bound protects the browser session.

Run one transition before the complete simulation and check both branches, especially their boundary. Then alter the budget and look for convergence or oscillation. Because values remain exact, fractional updates do not accumulate binary rounding noise; an interval state could likewise produce exact bounds on the outcome.

The explicit bound matters: without the counter update, this loop would never satisfy its stopping condition. The `@` prefix makes the outer balance update visible.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add a ternary inside the loop that contributes 1 on even iterations and 1/2 on odd iterations.
:::

## Review questions

- What is the final balance after four contributions, and how does it change after five?
- Why does `@balance` refer to a different scope than `i`?
- Which update enforces the loop's four-pass bound?
