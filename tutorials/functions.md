---
number: 5
title: Functions and scope
description: Callables, multifunctions, closures, and partials.
---

## Orientation

Uppercase names are callable. RiX supports ordinary functions, lambdas, multifunctions, lexical scope, and partial application without leaving expression syntax.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix edu
Square(x) -> x ^ 2;
Square(12) ;
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

The detail pages explain dispatch and closure behavior before using those features in larger programs.

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Functions and scope practice
Define a function that returns the area of a rectangle.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
