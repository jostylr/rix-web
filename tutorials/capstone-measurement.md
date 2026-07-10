---
number: 8d
title: Capstone: semantic measurement
description: Attach meaning to an exact measurement workflow.
---

## The problem

A measurement is more than a number: it has a stable conceptual name and may participate in type or trait protocols. The example begins with a semantic name while preserving an exact underlying value.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
reading := {^ /#roomTemperature/ 21 }
adjusted := reading + 1 / 2
{: reading, adjusted }
~~~

## How the pieces fit

The header gives the first value a sticky semantic name. Arithmetic still works through its exact numeric representation. In a host with a registered temperature type and unit protocol, the same pattern can add conversion and validation without changing the cell model learned earlier.

## Meaning is part of the interface

The semantic header documents what the raw twenty-one represents. That differs from merely naming a variable: a variable name belongs to one scope, while supported semantic metadata can travel with a value and guide validation or dispatch.

The exact half-unit adjustment separates meaning from representation. RatCalc demonstrates that core honestly without inventing a complete temperature conversion system. A host package can explicitly register dimensions, conversion rules, and traits at its trust boundary, leaving the underlying calculation inspectable.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Create named lower and upper readings and return an interval from their exact numeric values.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
