---
number: 8
title: Semantics, types, and units
description: Conversions, traits, headers, and dimensions.
---

## Orientation

RiX has two complementary kinds of meaning. Semantic types and traits describe
runtime protocols; physical quantities carry enforced dimensions and exact unit
conversions. Neither requires erasing the underlying exact representation.

Prerequisites: [Expressions](expressions.html) and [Functions](functions.html).
For an exact-mathematics route, begin with [Physical units and quantities](units.html),
then [Exact generators](exact-generators.html) and [Exact complex numbers](complex-numbers.html).
For language protocols, begin with [Conversions](conversions.html) and
[Headers and traits](headers-and-traits.html). The routes are independent.

Read the type question and unit conversion as separate operations on exact values.

## A worked example

```rix edu
value := 7;
elapsed := 90~[s];
{: value ? :integer, .ConvertUnit(elapsed, .Units[:min]) } ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

The first result asks a semantic question. The second performs a physical unit
conversion. Continue through headers and traits for protocol metadata, then use
the units, exact-generator, and complex-number pages for mathematical meaning.

Change the elapsed seconds and check the converted minutes before changing the semantic test.

:::challenge Semantics, types, and units practice
Ask whether an exact fraction satisfies the rational semantic type, then create a compatible physical quantity.
:::

## Keep going

Continue with [Conversions](conversions.html) for semantic types or [Physical units](units.html) for quantities.
