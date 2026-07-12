---
number: 8g
title: Capstone: semantic measurement
description: Attach meaning to an exact measurement workflow.
---

## The problem

A measurement has an exact magnitude, physical dimensions, and a chosen
display unit. This capstone combines quantities with an exact symbolic constant.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
radius := 5~[cm];
circumference := 2 * .Exact[:pi] * radius;
inMetres := .ConvertUnit(circumference, .Units[:m]);
{: radius, circumference, inMetres }
~~~

## How the pieces fit

The radius is a physical quantity, π remains an exact generator, and conversion
changes only the display unit. Nothing is forced through a floating approximation.

## Meaning is part of the interface

The quantity runtime enforces dimensional compatibility rather than relying on
a comment or sticky metadata. Display choice remains separate: centimetres and
metres share a Length dimension and an exact conversion factor.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Compute the area of the same circle in square centimetres and square metres.
:::

## Review questions

- Which layer records dimensions, and which records the exact π factor?
- Why does conversion not need the source unit as an argument?
- Which incompatible operation would you test to protect this model?
