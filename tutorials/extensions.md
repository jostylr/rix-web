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

## What is not end-to-end yet

`SystemLoader.registerOperator(symbol, metadata)` currently records and exports
operator metadata, but the tokenizer and Pratt parser do not consume that
registry for new symbolic glyphs. A registered uppercase operator keyword can
affect parsing, but lowering produces a generic operation unless core knows its
mapping, and evaluation then reports an unrecognized operator. Thus custom
operator execution is not currently implemented for users or plugins.

An end-to-end operator facility still needs a coordinated contract for token
recognition, fixity/precedence, AST lowering, runtime capability dispatch,
conflict detection, sandbox groups, and unload behavior. Adding only a parser
entry would create syntax that cannot execute.

## Read the result

Use ordinary plugin capabilities unless a future operator contract explicitly
connects every stage. Study the parser and three-tier system documentation when
working on that language-level facility.

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
