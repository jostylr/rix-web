---
number: 1
title: Start with exact numbers
description: Fractions stay fractions, names persist, and every example runs directly in this lesson.
---

## A workspace that remembers

The editor is one persistent RiX context. Run a line once, then use its name in the next cell. RiX keeps arithmetic exact, so no rounding is introduced just because you divided two integers.

```rix edu
portion := 3 / 8;
whole := 2;
whole + portion ;
```

The result is the mixed rational number `2 3/8`, not a floating-point approximation. Change `portion` to another fraction and run the cell again.

## Name an idea

Lowercase names are values in your workspace. Uppercase names are callables. Here is a small function with a name worth reusing.

```rix edu
Square(x) -> x ^ 2;
side := 12;
Square(side) ;
```

Every time you run a cell, its final value appears in the trail below the editor. The variables panel gives you a compact view of the names that have accumulated.

:::challenge Make a rectangle helper
Write a function named `Area` that accepts `width` and `height`, then use it to find the area of a 7 by 11 rectangle. A function name begins with an uppercase letter.
:::

## One distinction that matters

Use `:=` when you want a fresh value. The plain equals sign, `=`, lets two names share a cell. That is particularly useful when you are deliberately updating a shared value with `~=`.

```rix edu
x := 5;
y = x;
x ~= x + 1;
y ;
```

The final result is `6`, because `x` and `y` share the same cell. The reference panel in the workspace has more on assignment modes when you are ready.
