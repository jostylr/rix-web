---
number: 2
title: Expressions and exact values
description: Calculate and compare exact values before exploring advanced notation.
---

## Calculate exactly

An expression produces a value. Integer division keeps a rational answer instead of silently rounding it. `third + third + third` is exactly `1`.

```rix edu
third := 1 / 3;
third + third + third;
```

Use parentheses to choose a grouping. The second value below is `20`, while the first is `14`.

```rix edu
[2 + 3 * 4, (2 + 3) * 4];
```

## Compare values

The remainder `%` lets you ask about divisibility. `==` compares values; `:=` binds a fresh name. The result below is `[1, _]`, meaning true and false/null here.

```rix edu
value := 12;
[value % 3 == 0, value % 5 == 0];
```

Zero is truthy in RiX, so write the full comparison rather than using a bare remainder as a condition. [Operators and precedence](operators.html) develops these rules.

:::challenge Check a multiple
Bind `value` to 15, then return a comparison that is true exactly when it is divisible by five. Try 16 as well; the answers should differ.
:::

## Continue by goal

Read [Number notation](number-notation.html) for mixed and repeating numbers; [Intervals](intervals.html) for exact bounds; [Nulls and holes](holes.html) for missing values. [Recipe scaling](capstone-exact-recipe.html) combines exact fractions and bounds. Continue the short beginner route with [Collections and text](collections.html).
