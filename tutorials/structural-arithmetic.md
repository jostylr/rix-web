---
number: 9d
title: Structural arithmetic
description: Use spacing to preserve forms, combine structures, and splice RiX values.
---

## Mathematics as a form

Backticks enter RiX's structural-arithmetic notation. Inside this fence,
spacing is meaningful: an operator touching both operands records the written
form, while an operator separated from both operands applies structural
algebra.

```rix edu
{: `6/4+2/4`, `6/4 + 2/4` } ;
```

The first value is a `Sum` of two unreduced fractions. The second combines
their equal denominators and returns `8/4`, deliberately not reduced to `2`.
Unequal denominators use a least common denominator while staying fractions:

```rix edu
`1/2 + 1/3` ;
```

The distinction remains useful with symbols:

```rix edu
{: `x+0`, `x + 0`, `3/4 + x` } ;
```

The tight sum preserves `x+0`. The spaced sum applies the zero identity.
Adding a fraction to an unknown symbol cannot finish numerically, so it stays a
structural `Sum`.

## Resolve collisions explicitly

Half-spaced binary operators are rejected. RiX also refuses to guess when a
tight prefix, power, fraction, or postfix form collides:

```text
`a+ b`   `a +b`   `-x^2`   `1/2!`
```

Use spacing or parentheses to state the intended form:

```rix edu
{: `- x^2`, `-x ^ 2`, `(-x)^2`, `(1/2)!`, `1/(2!)` } ;
```

## Capture surrounding RiX values

`@name` snapshots one surrounding binding. `@(expression)` evaluates an
ordinary RiX expression in the current scope and lifts its result into the
structural form.

```rix edu
offset := 3;
{: `@offset+x`, `@(offset^2 + 1)/4`, `@(.Add(offset, 2)) + y` } ;
```

The names inside `@(…)` belong to ordinary RiX and are evaluated immediately.
Only structural symbols outside the splice, such as `x` and `y`, remain free.
Nested parentheses and system calls work normally inside the splice.

`@(…)` is real evaluation, so an effectful RiX expression would perform its
effect when the structural form is created. Keep captures small and visible
when preserving notation is the main goal.

## Exact RiX presentations

The structural parser shares RiX's exact-number spellings. Mixed numbers,
continued fractions, and based numbers retain the notation that introduced
them:

```rix edu
{: `1..3/4`, `1.~2~3`, `~1.~2~3`, `0xFF`, `0z[7]123` } ;
```

Intervals demonstrate the attachment rule directly:

```rix edu
{: `1:3`, `1 : 3` } ;
```

The tight colon records `Interval(1, 3)`. The spaced colon applies interval
construction and returns the exact interval `1:3`.

Line comments use `##`; block comments use `/* ... */`. Since comments
separate tokens, they cannot be inserted into a tight operator without
changing its attachment.

## Inspect and transform a form

Structural values have a small method surface:

```rix edu
form := `x*2/x`;
{:
  form.Head(),
  form.Arguments(),
  form.Render(),
  form.Inspect(),
  form.Simplify(:x)
} ;
```

The `:x` argument states that `x` is nonzero, making cancellation sound.
Without that assumption, symbolic cancellation is deliberately withheld.
`Collapse()` forgets preserved presentation and computes the ordinary exact
value; `SourceSpan()` reports where a node came from in the backtick body.

:::challenge Preserve and combine
Create two structural fractions with the same denominator. Show their tight
sum beside their spaced sum, then use `@(…)` to provide one numerator from an
ordinary RiX calculation.

    n := 2 + 3;
    {: `@(n)/7+2/7`, `@(n)/7 + 2/7` };
:::

## Next

Continue to **Backtick parsers and functions** to select named notation
parsers and convert free structural symbols into callable parameters.
