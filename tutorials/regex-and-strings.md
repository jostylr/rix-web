---
number: 6d
title: Regexes and strings
description: Pattern literals and text transformation.
---

## Slice text

Regex literals support matching modes, while strings support indexes, slices, and methods. Keep matching and replacement logic as small testable expressions.

```rix edu
text := "RatCalc";
text[1:3];
```

The slice is `Rat`: string positions begin at 1 and both endpoints are included. See [Strings and tuples](tuples-and-strings.html) for individual characters.

## Test a pattern

A regex literal is a callable pattern. The `?` mode asks only whether any digit occurs; it returns true (`1`) or false (`_`).

```rix edu
HasDigit := {/[0-9]+/?};
[HasDigit("a2"), HasDigit("abc")];
```

Without `?`, a matching regex returns a match object with text and position information. Use that when the match itself matters, then pass results through a [pipe](pipes.html) if several strings need testing.

:::challenge Regexes and strings practice
Retrieve the final character of `"RiX"` with a negative index, then test whether `"RiX7"` contains a digit. Expect `X` and true.
:::

Continue with [Transform a report](capstone-report.html) for a complete transformation task.
