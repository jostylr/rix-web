---
number: 10c
title: Language extensions
description: What the SystemLoader configures today, and the current boundary for custom syntax.
---

## Orientation

The legacy `SystemLoader` supplies parser metadata for uppercase identifiers.
It can make a registered keyword parse with operator precedence, but this is
only the parser half of an extension. Pure RiX users receive only the surface a
trusted host configures.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## What works today

```rix edu
## Extension registration belongs to a trusted host
1 + 1 ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

Plugins can already add system capabilities, callable values, method/operator
variants for existing operations, and backtick parser objects. Those routes
connect to runtime dispatch and are the recommended extension points.

## Delimited custom operators

An `##OPS##` header can declare a custom infix operator before executable code.
Fields are unordered and the callable can be an ordinary RiX function or a
method on a preloaded plugin object:

```rix
##OPS##
:<o+>: Mediant :infix :additive :none
##OPS##

Mediant(a, b) -> a + b
1 :<o+>: 2
```

Plugin manifests can name `operator-files`, while a script YAML header can
preload `plugins` and project-local `operator-files`. Prefix and postfix custom
operators remain future work.

## Read the result

Prefer ordinary plugin methods when punctuation does not materially improve the
notation. Study the custom-operator and three-tier system documentation when a
domain benefits from dedicated infix syntax.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Language extensions practice
Write a short note describing a domain operation you would expose as a system capability.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
