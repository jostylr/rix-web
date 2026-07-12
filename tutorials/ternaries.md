---
number: 6a
title: Ternaries and cases
description: Choose values without losing expression flow.
---

## Orientation

The `??` and `?:` pair reads as condition, true branch, false branch. Each branch can be an expression or a code block.

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
x := 7
x % 2 == 0 ?? "even" ?: "odd"
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

Case containers are useful when several guarded alternatives need to stay together.

```rix
score := -2
{?
    score > 0 ? "positive";
    score < 0 ? "negative";
    "zero"
}
```

## Try a computed value

A prepared trial evaluates a candidate once, gives it a temporary name, and
checks that name from left to right:

```rix
ReadScore = x -> x
ReadScore(7) ?- value: [value ? :Integer, value > 0]
```

On success, the result is the original candidate. If candidate evaluation,
binding, or a check fails, soft `?-` returns `_`. The temporary `value` binding
does not escape the trial.

Prepared trials become ordered alternatives inside a case container. A soft
failure advances to the next arm:

```rix
ReadScore = x -> x
{?
    ReadScore(-3) ?- value: [value > 0];
    ReadScore(4) ?- value: [value > 0];
    5
}
```

Use `?!-` for a fact that must hold. Gates can be mixed on the same candidate;
the first gate also decides what happens if evaluating the candidate throws:

```rix
ReadScore = x -> x
ReadScore(4)
    ?- value: [value ? :Integer]
    ?!- value: [value > 0]
```

Here a non-integer is a recoverable failure, while an integer that is not
positive is an error. Destructuring patterns work too, and a structural mismatch
follows the gate's soft or strict policy:

```rix
pair := {: 2, -1 }
pair ?- {: x, y }: [x + y == 1]
```

Assignments use the same expression directly. A soft failure assigns `_`; a
strict failure throws before the assignment commits:

```rix
ReadScore = x -> x
accepted := ReadScore(6) ?!- value: [value ? :Integer, value > 0]
accepted
```

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge Ternaries and cases practice
Return the larger of two values with a ternary.
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
