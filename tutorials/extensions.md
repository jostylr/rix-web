---
number: 10c
title: Language extensions
description: System loaders, keywords, and custom operators.
---

## Orientation

RiX extensions use the runtime plugin catalog and capability context. Parser
syntax remains static except for explicitly declared, delimited custom infix
operators.

This is a host-facing topic. Read the working syntax and the registration boundary together before trying an extension.

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

```rix edu
##OPS##
:<o+>: Mediant :infix :additive :none
##OPS##

Mediant(a, b) -> a + b;
1 :<o+>: 2;
```

Plugin manifests can name `operator-files`, while a script YAML header can
preload `plugins` and project-local `operator-files`. There are no current
plans for custom prefix, postfix, or n-ary notation: functions cover most unary
uses, the custom delimiter weakens postfix notation, and n-ary notation needs a
full mixfix grammar rather than an operator token.

## Read the result

Prefer ordinary plugin methods when punctuation does not materially improve the
notation. Study the custom-operator documentation when a domain benefits from
dedicated infix syntax.

Keep a registration example next to its host requirement; a browser cell alone cannot grant capabilities.

:::challenge Language extensions practice
Write a short note describing a domain operation you would expose as a system capability.
:::

## Keep going

Continue with [Method extensions](method-extensions.html) for a narrower way to extend behavior.
