---
number: 3e
title: Capstone: bounds check
description: Use exact notation, intervals, and safe defaults together.
---

## The problem

A sensor pipeline sometimes receives no reading. When that happens, it should preserve an agreed safe range rather than inventing a point value. When a reading is present, it should classify that exact reading against the safe bounds.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
reading := [,,][1]
permitted := 18:22
effective := reading ?| permitted
effective
~~~

## How the pieces fit

The first line extracts an unfilled array slot, producing a hole that represents missing information. This is distinct from the explicit null value `_`. Hole coalescing chooses the interval only because the reading is a hole. The fallback is itself an exact value with two bounds, so downstream work can see what is known. Replace the first line with `reading := 20` and the same expression keeps the reading instead.

## Distinguish three states

This program separates a point reading, a hole, and explicit null. A point means the sensor supplied a value. A hole means a position exists but was unfilled. Null, written _, is a value and is therefore not replaced by hole coalescing.

Run _ ?| 18:22 and compare it with [,,][1] ?| 18:22. The first remains null; the second selects the range. Preserving that range also avoids false precision: substituting its midpoint would manufacture knowledge that the sensor never supplied.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add lower and upper names, supply an exact reading, and return whether it lies between the two bounds.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
