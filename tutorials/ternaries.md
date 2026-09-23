---
number: 4a
title: Ternaries and cases
description: Choose values with branches, prepared trials, and ordered recovery.
---

## Choose between two values

The decision markers read as `condition ?: true-branch ?_ false-branch ?? undecided-branch`.
The false and undecided branches are optional; each branch can be an expression or a code block.

```rix edu
x := 7;
x % 2 == 0 ?: "even" ?_ "odd";
```

The result is `odd`. Change `x` to 8 and predict the other branch. Both branches produce values; neither changes a variable.

## Choose among several answers

Case containers are useful when several guarded alternatives need to stay together.

```rix edu
score := -2;
{?
    score > 0 ? "positive";
    score < 0 ? "negative";
    "zero"
} ;
```

The case returns `negative`. Try zero and a positive score. This is enough branching for most first programs. The sections below are deeper reading for uncertain values, recovery and validation; they are not prerequisites for [Define and call](function-basics.html).

## Undecided is a third result (advanced)

An uncertain numeric comparison does not pretend that overlap means false.
When the available enclosure supports both outcomes it returns standalone `?`,
and `??` selects the corresponding branch:

```rix edu
x := 23.456?789;
relation := x < 23.4565;
[
    relation,
    relation
        ?: "certainly less"
        ?_ "certainly not less"
        ?? "not decided by this enclosure"
];
```

The undecided value is not simply contagious. Strong three-state logic still
uses decisive later operands when possible: `? && _` is false, while `? || 1`
is true. Otherwise uncertainty remains:

```rix edu
[
    ! ?,
    ? && _,
    ? && 1,
    ? || 1,
    ? || _
];
```

Predicates, cases, assertions, loops, and guards never accept `?` as ordinary
truth. They either expose an unresolved result or stop at a defined
side-effect boundary.

## Advanced: try a computed value

A prepared trial evaluates a candidate once, gives it a temporary name, and
checks that name from left to right:

```rix edu
ReadScore = x -> x;
ReadScore(7) ?- value: [value ? :Integer, value > 0] ;
```

On success, the result is the original candidate. If candidate evaluation,
binding, or a check fails decisively, soft `?-` returns `_`. An undecided check
returns `?` instead. The temporary `value` binding does not escape the trial.

Prepared trials become ordered alternatives inside a case container. A soft
failure advances to the next arm:

```rix edu
ReadScore = x -> x;
{?
    ReadScore(-3) ?- value: [value > 0];
    ReadScore(4) ?- value: [value > 0];
    5
} ;
```

Use `?!-` for a fact that must hold. Gates can be mixed on the same candidate;
the first gate also decides what happens if evaluating the candidate throws:

```rix edu
ReadScore = x -> x;
ReadScore(4)
    ?- value: [value ? :Integer]
    ?!- value: [value > 0] ;
```

Here a non-integer is a recoverable failure, while an integer that is not
positive is an error. Destructuring patterns work too, and a structural mismatch
follows the gate's soft or strict policy:

```rix edu
pair := {: 2, -1 };
pair ?- {: x, y }: [x + y == 1] ;
```

Assignments use the same expression directly. A soft failure assigns `_`; a
strict failure throws before the assignment commits:

```rix edu
ReadScore = x -> x;
accepted := ReadScore(6) ?!- value: [value ? :Integer, value > 0];
accepted ;
```

Two additional markers control undecided checks. `??-` makes undecided a soft
no-match, so an ordered case advances; `??!-` requires a decided check and
throws otherwise:

```rix edu
ReadScore = x -> x;
[
    {? ReadScore(0.5?) ??- value: [value < 0.55]; :fallback },
    ReadScore(0.5?) ?- value: [value < 0.55]
];
```

The first element is `:fallback`; the second remains `?`. Replace `??-` by
`??!-` to turn inadequate refinement into an error. This is especially useful
with a halo guard such as `value < {~ 0.55, 0.001, {= timeout=1 } }`.

Before exploring prepared trials, test the simple parity and score examples at their boundary values.

:::challenge Ternaries and cases practice
Return the larger of two values with a ternary.
:::

## Keep going

Continue with [Functions](functions.html) for reusable rules or [Multifunctions](multifunctions.html) for guarded variants.
