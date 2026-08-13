---
number: 10f
title: Live RiX lint laboratory
description: Find and repair scope, control-flow, reactive, mathematical, and plugin mistakes without running them.
lint: true
lintProfile: all
lintLevel: pedantic
---

## How to use this laboratory

Every cell on this page has two independent actions. **Lint cell** runs the
same static analyzer as the RiX command-line tool and never executes or edits
the source. **Run cell** evaluates it normally. Lint the problem, read the rule
code and hint, then lint the correction. You can edit either cell to test a
variation.

The page uses the `all` profile at `pedantic` level so the full catalog is
visible. In ordinary work, begin with `essential`, move through `standard` and
`thorough`, and enable `pedantic` when you want advisory style findings too.

## Scope ownership: RX1001, RX1002, and RX1003

Lazy blocks own a scope. A bare name means this scope, while `@name` explicitly
requests an enclosing scope. This deliberately differs from JavaScript's
implicit closure lookup.

Problem:

```rix edu
## lint-problem
outer = 4;
{;
    local = 2;
    outer + @local + @missing;
};
```

Correction:

```rix edu
outer = 4;
{;
    local = 2;
    @outer + local;
};
```

## Decisions: RX1101, RX1102, and RX1703

RiX has exactly one falsy value, `_`. Zero is truthy, uncertain comparisons can
produce `?`, and empty strings or collections are not JavaScript-style false.

Problem:

```rix edu
## lint-problem
Choose = (value, subtract ?= 0) -> subtract ?: -value ?_ value;
approx := 0.5?;
label = "RiX";
[
    Choose(2),
    approx < 0.55 ?: :below ?_ :above,
    label ?: :present ?_ :empty
];
```

Correction:

```rix edu
Choose = (value, subtract ?= _) -> subtract ?: -value ?_ value;
approx := 0.5?;
label = "RiX";
[
    Choose(2),
    approx < 0.55 ?: :below ?_ :above ?? :refine,
    label.Len() > 0 ?: :present ?_ :empty
];
```

## Cell and value semantics: RX1201, RX1202, and RX1203

`=` can share a mutable cell, `:=` makes an independent copy, and non-mutating
collection methods return replacements. Immutable mathematical values cannot
be refreshed in place with `~=`.

Problem:

```rix edu
## lint-problem
items = [1];
shared = items;
shared.Push(2);
p := `x^2`.P();
p ~= `x`.P();
0;
```

Correction:

```rix edu
.Plugin.Load("poly");
items := [1];
shared := items;
shared ~= shared.Push(2);
p := `x^2`.P();
p = `x`.P();
{: shared, p };
```

## Bindings across paths: RX1302 and RX1303

A lazy branch may accidentally shadow an outer binding, while a name created in
only one branch is not initialized on every path.

Problem:

```rix edu
## lint-problem
choice = 1;
choice ?: {; choice = 2; choice; } ?_ _;
choice ?: (result = 10) ?_ _;
```

Correction:

```rix edu
choice = 1;
result := _;
choice ?: {; localChoice = 2; localChoice; } ?_ _;
choice ?: (result ~= 10) ?_ (result ~= 0);
result;
```

## Loop progress and retained closures: RX1401, RX1402, and RX1403

The first loop's condition cannot change, although it is initially false and
therefore safe to run. The second advances twice and retains a function that
reads a loop-local binding.

Problem:

```rix edu
## lint-problem
{@ stalled = 3; stalled < 3; 1; _ };
{@ index = 1; index <= 3; {;
    callback = () -> index;
    index += 1;
}; index += 1 };
```

Correction:

```rix edu
MakeConstant = value -> () -> @value;
callbacks := [];
{@ index = 1; index <= 3; {;
    callback = MakeConstant(index);
    @callbacks ~= @callbacks.Push(callback);
}; index += 1 };
callbacks;
```

## Recursion depth: RX1501

The recursive result below is multiplied after the self-call returns, so the
call is not in tail position. A bounded loop makes stack use explicit.

Problem:

```rix edu
## lint-problem
Factorial(n) -> n == 0 ?: 1 ?_ n * Factorial(n - 1);
Factorial(6);
```

Correction:

```rix edu
Factorial(n) -> {;
    result := 1;
    {@ index = 2; index <= @n; @result *= index; index += 1 };
    result;
};
Factorial(6);
```

## Reactive ownership: RX1601, RX1602, RX1603, and RX1604

Reactive formulas read tracked values with `$name`; `$$name` is cell identity.
Deep mutation must publish a new epoch, and dependency cycles cannot settle.

Problem:

```rix edu
## lint-problem
$$source := 1;
$$snapshot := source + 1;
identity := $$source;
$$items := [1];
$items.Push!(2);
$$left := $right + 1;
$$right := $left + 1;
identity;
```

Correction:

```rix edu
$$source := 1;
$$derived := $source + 1;
$$items := [1];
nextItems := items.Push(2);
$items := nextItems;
{: $derived, $items };
```

## Translation syntax: RX1701, RX1702, and RX1704 through RX1707

Lowercase `f(2)` is implicit multiplication, collections are one-based, braces
create scope, and a bare uppercase callable can mean the function value rather
than a call. Dense nested ternaries are valid but difficult to audit. Active
base fractions must not accidentally mix `#` input with ordinary decimal
input.

Problem:

```rix edu
## lint-problem
f = x -> x + 1;
values = [10];
x = 2;
F(value) -> value + 1;
<* "b";
[
    f(2),
    values[0],
    1 ?: 2 ?_ 1 ?: 3 ?_ 1 ?: 4 ?_ 5,
    {; @x + 1; },
    F,
    #101/11
];
```

Correction:

```rix edu
F(value) -> value + 1;
values = [10];
x = 2;
<* "b";
[
    F(2),
    values[1],
    {? x == 1 ? 2; x == 2 ? 3; 5 },
    x + 1,
    F(3),
    #101/#11
];
```

## Mathematical intent: RX1801 through RX1806

Exact division, structural fractions, approximate conversion, zero divisors,
polynomial division, and refinement budgets each carry different contracts.

Problem:

```rix edu
## lint-problem
left = 6;
right = 8;
first := `6/8`.F();
second := `3/4`.F();
p := `x^2 + 1`.P();
q := `x + 1`.P();
Divide(divisor) -> 1 / divisor;
approx := .Float(2);
refined = approx.Refine();
{: left / right, first == second, p / q, Divide(2), refined };
```

Correction:

```rix edu
.Plugin.Load("fraction");
.Plugin.Load("poly");
Truncate = (left, right) -> right == 0 ?: .Error("nonzero divisor required") ?_ left // right;
first := `6/8`.F();
second := `3/4`.F();
p := `x^2 + 1`.P();
q := `x + 1`.P();
sameShape = first.SamePair(second);
sameValue = first.Equivalent(second);
quotient = p // q;
remainder = p % q;
RefineWithin = (real, request) -> real.Refine(request);
{: Truncate(6, 8), sameShape, sameValue, quotient, remainder };
```

## Plugin headers: RX1901

Plugin cells receive header validation before the ordinary source analyzer. The
following header is missing its required description.

Problem:

```rix edu
/**
id: broken-demo
kind: rix
mount: brokenDemo
**/
## lint-problem
1;
```

Correction:

```rix edu
/**
id: valid-demo
description: A small portable demonstration plugin.
kind: rix
mount: validDemo
exports: [DemoValue]
groups: [Demo]
provides: [rix.demo@1]
schemas: [rix.demo.Value@1]
**/
DemoValue = 1;
validDemo = {= DemoValue=DemoValue };
.Host.RegisterValue("validDemo", validDemo, "valid-demo", ["Demo"]);
validDemo;
```

## Plugin implementation contracts: RX1902, RX1903, and RX1905 through RX1910

This deliberately inconsistent plugin declares an unused export, registers the
wrong mount and group, asks a portable RiX plugin for host permission, omits
portable contracts, duplicates a method, disguises mutation, and registers a
type without an idempotence guard.

Problem:

```rix edu
/**
id: lint-demo
description: An intentionally inconsistent plugin.
kind: rix
mount: expectedMount
exports: [Missing]
groups: [Expected]
permissions: [files]
**/
## lint-problem
MutateArray(value) -> value;
.Host.RegisterValue("actualMount", {= }, "lint-demo", ["Other"]);
.Host.RegisterMethod("Array", "Change", MutateArray, "lint-demo", "actualMount");
.Host.RegisterMethod("Array", "Change", MutateArray, "lint-demo", "actualMount");
.TypeRegister({= name=:DemoValue });
0;
```

Correction:

```rix edu
/**
id: lint-demo
description: A portable and repeatable demonstration plugin.
kind: rix
mount: lintDemo
exports: [DemoValue]
groups: [Demo]
provides: [rix.demo@1]
schemas: [rix.demo.Value@1]
**/
DemoValue = 1;
lintDemo = {= DemoValue=DemoValue };
.Host.RegisterValue("lintDemo", lintDemo, "lint-demo", ["Demo"]);
lintDemo;
```

`RX1904` is the one catalog-level rule that cannot be truthfully decided from a
single browser cell: it reports a dependency that is absent from the set of
plugins being linted together. Use `rix lint --profile plugin path/to/plugins`
to check it across files. Adding the required plugin to that lint target or
correcting the header's `requires` entry is the fix.

## Maintainability: RX2001 and RX2002

Large implicit capture sets make lazy code hard to move or test. Suppressions
are escape hatches, so they must record why the exception is intentional.

Problem:

```rix edu
## lint-problem
a = 1;
b = 2;
c = 3;
d = 4;
1 ?: {; @a + @b + @c + @d + @a; } ?_ _;
## rix-lint-disable-next-line RX1702
[1][0];
```

Correction:

```rix edu
Combine = (a, b, c, d) -> a + b + c + d + a;
a = 1;
b = 2;
c = 3;
d = 4;
a == 1 ?: Combine(a, b, c, d) ?_ _;
## rix-lint-disable-next-line RX1702 -- foreign object uses a documented zero-based index
foreign[0];
```

## Choose a lint level deliberately

Levels are cumulative: `essential` is level 1, `standard` adds level 2,
`thorough` adds level 3, and `pedantic` adds level 4. Profiles select domains:
`default`, `reactive`, `math`, `plugin`, `teaching`, `pedantic`, or `all`.
Neither this page nor the CLI edits code by default. Any future automated edit
path must remain behind an explicit edit flag.

:::challenge Repair a mixed translation
Lint this cell, repair every finding, and lint it again before running it.
    values = [1, 2, 3];
    total = 0;
    {@ index = 1; index <= values.Len(); {;
        total += @values[index];
    }; index += 1 };
    values[0];
:::

## Keep going

Use the JavaScript-to-RiX gotcha lesson for the underlying semantic model, then
return to the package-design capstone to apply these checks at an extension
boundary.
