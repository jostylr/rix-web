---
number: 8b
title: Headers and traits
description: Sticky semantics and protocol bundles.
---

## Orientation

Headers attach names, types, traits, and capture modes to constructed values. Traits describe protocols; types can supply conversion and method behavior.

Headers and traits describe protocol choices; read the header on the worked example before interpreting its result.

## A worked example

```rix edu
{^ /#answer/ 42} ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Sticky semantic headers persist through suitable updates, while ephemeral runtime facts are rebuilt.

Change one semantic choice at a time so its effect remains visible.

:::challenge Headers and traits practice
Create a headered value with a semantic name and inspect it.
:::

## Keep going

Continue with [Physical units](units.html) or [Exact generators](exact-generators.html) for mathematical meaning.
