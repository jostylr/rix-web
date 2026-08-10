---
number: 10e
title: JavaScript-to-RiX gotchas
description: Translate truth, lazy branches, captures, loops, and immutable values deliberately.
---

## Is this a good design?

Mostly—but it is a deliberately sharp design. RiX makes an enclosing binding
visible with `@name` instead of silently capturing every name. That is useful in
reactive and mathematical code because a read or update clearly says which
scope owns the cell. Lazy branches also avoid performing work that was not
selected, and treating `0` as truthy preserves zero as an ordinary mathematical
result rather than a disguised failure.

The cost is translation friction. A `{; ... }` block introduces a scope even
when it is only grouping a lazy branch. Adding that block can therefore require
`name` to become `@name`. JavaScript programmers must also translate boolean
intent, not merely replace punctuation. These rules are coherent, but RiX
benefits from better diagnostics and linting around them.

The examples below use the same rhythm each time: familiar JavaScript, a
tempting but incorrect RiX translation, and a corrected runnable version.

## Gotcha 1: zero is not false

JavaScript commonly uses `false`, `0`, and missing values interchangeably in
flags:

```javascript
function signedIncoming(right, subtract = false) {
    return subtract ? -right : right;
}
```

A mechanical translation silently changes addition into subtraction because
`0` is truthy in RiX:

```text
SignedIncoming = (right, subtract ?= 0) ->
    subtract ?: -right ?_ right;

SignedIncoming(3);  ## produces -3, not 3
```

Use `_` for a decided negative/null flag. Comparisons already produce the right
kind of decision value: truth, `_`, or sometimes undecided `?`.

```rix edu
SignedIncoming = (right, subtract ?= _) ->
    subtract ?: -right ?_ right;
[
    SignedIncoming(3),
    SignedIncoming(3, 1),
    0 ?: "zero is truthy" ?_ "not selected",
    _ ?: "not selected" ?_ "null selects this branch"
];
```

This was the fraction-port bug: a subtraction flag defaulted to `0`, so the
subtraction arm was selected even for ordinary addition.

## Gotcha 2: a branch block has its own scope

JavaScript blocks can read surrounding locals without annotation:

```javascript
function reducePair(numerator, denominator) {
    if (denominator === 0) return [Math.sign(numerator), 0];
    const common = gcd(numerator, denominator);
    return [numerator / common, denominator / common];
}
```

In RiX, the false arm below is lazy and its `{; ... }` creates a nested scope.
The bare reads of `numerator` and `denominator` therefore fail only when that arm
is selected:

```text
ReducePair = (numerator, denominator) ->
    denominator == 0
        ?: {: numerator < 0 ?: -1 ?_ 1, 0 }
        ?_ {;
            common = PairGcd(numerator, denominator);
            {: numerator // common, denominator // common };
        };
```

Capture the function bindings explicitly inside the branch block:

```rix edu
PairGcd = (left, right) -> {;
    a := left.Abs();
    b := right.Abs();
    {@ step = 1; @b != 0; {;
        remainder = @a % @b;
        @a ~= @b;
        @b ~= remainder;
    }; step += 1 };
    a;
};

ReducePair = (numerator, denominator) ->
    denominator == 0
        ?: {: numerator < 0 ?: -1 ?_ 1, 0 }
        ?_ {;
            common = PairGcd(@numerator, @denominator);
            {: @numerator // common, @denominator // common };
        };

ReducePair(6, 8);
```

Notice that `common` stays bare: it belongs to the current branch block.

## Gotcha 3: not every name in a loop needs `@`

The opposite mistake is to prefix every loop-body name. JavaScript does not
force the distinction:

```javascript
function weightedSum(values) {
    let total = 0;
    for (let index = 0; index < values.length; index += 1) {
        const item = values[index];
        total += item * (index + 1);
    }
    return total;
}
```

This RiX translation mixes the two directions up:

```text
WeightedSum = values -> {;
    total := 0;
    {@ index = 1; index <= values.Len(); {;
        item = @values[@index];
        @total += @item * @index;
    }; index += 1 };
    total;
};
```

`values` and `total` come from the enclosing function scope, so the loop must
capture them. `index` belongs to the loop scope, while `item` is introduced in
the current body, so both remain bare.

```rix edu
WeightedSum = values -> {;
    total := 0;
    {@ index = 1; index <= @values.Len(); {;
        item = @values[index];
        @total += item * index;
    }; index += 1 };
    total;
};

WeightedSum([1, 2, 3]);
```

This distinction mattered in radix loops: remainder arrays and function
parameters needed `@`, but loop counters and freshly computed digits did not.
An error naming an undefined outer variable often means an `@` was added to a
current-scope name; an ordinary undefined-variable error inside a block often
means the reverse.

## Gotcha 4: extract recursive branch helpers

Recursive JavaScript often puts several statements directly in a branch:

```javascript
function recursiveSum(values) {
    if (values.length === 1) return values[0];
    const half = values.length / 2;
    return recursiveSum(values.slice(0, half))
        + recursiveSum(values.slice(half));
}
```

Adding a lazy RiX branch block makes every use of `values` inside that block an
outer capture. Missing even one produces a path-dependent failure:

```text
RecursiveSum = values ->
    values.Len() == 1
        ?: values[1]
        ?_ {;
            half = values.Len() // 2;
            RecursiveSum(values.Slice(1, half + 1))
                + RecursiveSum(values.Slice(half + 1));
        };
```

For recursive algebra, a small helper is often clearer than an `@`-dense
branch. Its arguments are local to the helper:

```rix edu
RecursiveSum = values ->
    values.Len() == 1
        ?: values[1]
        ?_ RecursiveSumSplit(values);

RecursiveSumSplit = values -> {;
    half = values.Len() // 2;
    RecursiveSum(values.Slice(1, half + 1))
        + RecursiveSum(values.Slice(half + 1));
};

RecursiveSum([1, 2, 3, 4]);
```

The Cayley–Dickson implementation now uses this pattern for conjugation and
multiplication: the decision remains compact, while the recursive split owns a
fresh, unsurprising parameter scope.

## Gotcha 5: `~=` is not JavaScript assignment

JavaScript uses `=` both to bind a local and to replace its current reference:

```javascript
let current = leftPolynomial;
current = nextPolynomial;
```

RiX distinguishes aliasing assignment `=`, value-copy assignment `:=`, and an
identity-preserving value update `~=`. Translating replacement as `~=` can fail
when `current` holds an immutable semantic value such as a Polynomial:

```text
current := leftPolynomial;
@current ~= nextPolynomial;  ## Cannot update value: cell is immutable
```

For loop-carried immutable values, put the changing references in a mutable
holder. Replace the holder, not the semantic object:

```rix edu
AdvancePair = (left, right) -> {;
    state := [left, right];
    {@ step = 1; step <= 3; {;
        next = @state[1] + @state[2];
        @state ~= [@state[2], next];
    }; step += 1 };
    state;
};

AdvancePair(1, 1);
```

This also makes ownership obvious: the array is algorithm state; the values it
contains may remain immutable mathematical objects.

## Gotcha 6: JavaScript has no undecided branch

A JavaScript comparison eventually chooses true or false. RiX comparisons over
certified approximations and halo neighborhoods can instead return `?`, meaning
the available information does not decide the relation.

```javascript
function classify(value) {
    return value < 0.55 ? "below" : "at or above";
}
```

Omitting `??` does not choose the null branch when the comparison is undecided:

```text
Classify = value ->
    value < 0.55 ?: "below" ?_ "at or above";

Classify(0.5?);  ## remains undecided
```

Handle that third outcome explicitly when translating code that consumes
uncertain values:

```rix edu
Classify = value ->
    value < 0.55
        ?: "below"
        ?_ "at or above"
        ?? "needs refinement";

Classify(0.5?);
```

## A compact translation checklist

- Translate JavaScript boolean intent: `_` is RiX's only falsy value, while `0`,
  empty text, and empty collections are truthy.
- In a `{; ... }` or loop scope, use `@name` only for a binding owned by an
  enclosing scope. Keep current-scope locals bare.
- Remember that lazy errors are path-dependent. Test both selected branches and
  enough loop iterations to enter the body.
- Choose `=`, `:=`, and `~=` from RiX cell semantics rather than copying a
  JavaScript `=` mechanically.
- Add `??` whenever an uncertain comparison can reach control flow.
- Extract a helper when a recursive lazy branch becomes crowded with captures.

## Check a translation without running it

The RiX command-line linter checks these ownership and decision rules without
loading or evaluating the program:

```text
rix lint --level=essential translated.rix
rix lint --level=standard translated.rix
rix lint --profile=plugin --strict --json plugins/my-plugin/my-plugin.plugin.rix
rix explain-scope plugins/my-plugin/my-plugin.plugin.rix:42
```

Levels are cumulative: `essential` starts with correctness hazards,
`standard` adds common mistakes, `thorough` adds intent-sensitive checks, and
`pedantic` includes style information. Profiles add focused reactive, math,
teaching, or plugin checks.

Linting never edits a file by default. A safe capture correction is applied
only when you explicitly run `rix lint --fix file.rix`; larger refactors remain
suggestions. Suppress an intentional finding locally and explain why:

```text
## rix-lint-disable-next-line RX1601 -- freeze the initial source on purpose
$$frozen := source + 1;
```

`RX1001` suggests a missing `@`; `RX1002` suggests removing one, and `RX1003`
catches an explicit capture with no enclosing owner. Further rules cover loop
progress, alias/copy intent, lowercase call-like multiplication, one-based
indexing, reactive dependency boundaries, exact division, refinement budgets,
and plugin contracts. Runtime failures carry the same capture hints and name
the selected ternary branch or loop iteration when evaluation reaches a bad
path.

:::challenge Capture practice
The code is correct as written. Predict why `values`, `total`, and `item` have
different capture markings, run it, then add a second nested branch that counts
the positive items.
    SumPositive = values -> {;
        total := 0;
        {@ index = 1; index <= @values.Len(); {;
            item = @values[index];
            item > 0 ?: {; @total += @item; } ?_ _;
        }; index += 1 };
        total;
    };
    SumPositive([-2, 3, 4]);
:::

## Keep going

Review Scope and imports for the general capture rule, Cells and assignment for
`=`, `:=`, and `~=`, and Ternaries and cases for the full three-state decision
model.
