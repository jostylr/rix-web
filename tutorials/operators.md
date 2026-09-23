---
number: 2a
title: Operators and precedence
description: Group arithmetic, test divisibility, and compare exact values.
---

## Group an expression

Powers run before multiplication, then addition. `2 + 3 * 4 ^ 2` therefore returns `50`. Parentheses let you make a different grouping explicit.

```rix edu
[2 + 3 * 4 ^ 2, (2 + 3) * 4 ^ 2];
```

The second result is `80`. Change the exponent and predict both results.

## Ask about a number

`%` returns a remainder. Test it against zero with `==` to ask about divisibility. The first answer is true (`1`); the second is false (`_`).

```rix edu
n := 14;
[n % 7 == 0, n % 3 == 0];
```

`n := 14` names a value; `n == 14` compares it. Zero itself is truthy, so always make the test explicit in a conditional.

:::challenge Operators and precedence practice
Find the result of `(3 + 2) * 4`, then test whether that result is a multiple of five. Expect 20 and true.
:::

## Call a function explicitly

Parentheses make arguments unambiguous. You can explore RiX's adjacent application later, after ordinary calls are comfortable.

```rix edu
Double(x) -> x * 2;
[Double(3) + 1, Double(3 + 1)];
```

The results are 7 and 8. Continue with [Collections and text](collections.html), or read [Define and call](function-basics.html) for more function examples.
