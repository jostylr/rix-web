---
number: 6d
title: Capstone: bounded simulation
description: Use branches, blocks, and loops to model a process.
---

## The problem

A savings simulation starts with an exact balance and applies a fixed contribution four times. A loop is appropriate because the same state transition repeats and the stopping condition is known.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
balance := 5 / 2
{@ i = 0; i < 4; {; @balance += 3 / 4; i += 1 } }
balance
~~~

## How the pieces fit

The loop initializes i, checks a bound, and executes a block that updates both the outer balance and the local counter. The @ prefix states that balance belongs to an outer scope. Because all contributions are rational, the final result is exact and reproducible.

## Separate state, transition, and budget

A simulation is easier to trust when these concerns remain visible. State is the modeled value, the transition describes one change, and the budget caps how often it may happen. Even if a future rule cycles unexpectedly, the bound protects the browser session.

Run one transition before the complete simulation and check both branches, especially their boundary. Then alter the budget and look for convergence or oscillation. Because values remain exact, fractional updates do not accumulate binary rounding noise; an interval state could likewise produce exact bounds on the outcome.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add a ternary inside the loop that contributes 1 on even iterations and 1/2 on odd iterations.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
