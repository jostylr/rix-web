---
number: 13b
title: Lazy structural forms
description: Build assignments, maps, and lambdas from explicit core forms.
---

## Why selected arguments stay as structure

Most core calls evaluate their arguments and then do work with the values.
That cannot be right for every operation. In `.Assign(:x, 7)`, the first
argument names a place to bind; it is not the current value of `x`. In a
lambda, the body must remain unevaluated until someone calls the function.

The core registry therefore marks those arguments as lazy IR where needed.
The evaluator still uses the same assignment and function machinery as the
surface syntax.

```rix edu
{; .Assign(:x, 7); .AssignCopy(:copy, x); x ~= 9; {: x, copy } } ;
```

`Assign`, `AssignCopy`, `AssignUpdate`, `AssignDeepCopy`, and
`AssignDeepUpdate` correspond to the different cell/assignment modes. The
colon name is an explicit name value, which lets generated code identify a
target without using assignment punctuation.

## Maps are data built from pairs

`.Map` receives `.Pair` values. Each pair keeps its key/value relationship
while the enclosing map constructor preserves the normal map semantics.

```rix edu
.Map(.Pair(:sum, .Add(2, 3)), .Pair(:magnitude, .Abs(-7))) ;
```

This is especially useful for a tool that is constructing a record from a
list of fields. In hand-written RiX, `{= sum = 2 + 3, magnitude = | -7 | }`
is usually the friendlier spelling.

## Lambdas and named definitions

`.Params` produces a positional parameter descriptor. `.Lambda` captures its
body lazily, and `.Define` gives the resulting function a callable name. In
the current evaluator, uppercase user names are callable.

```rix edu
{; .Assign(:F, .Lambda(.Params(:x), .Add(x, 1))); F(4) } ;
```

```rix edu
{; .Define(:DOUBLE, .Params(:x), .Mul(x, 2)); DOUBLE(4) } ;
```

The public `.Params` form currently expresses positional parameters. More
elaborate parameter features—defaults, keywords, destructuring, and
preparation—remain represented by their richer syntax-level IR descriptors.

:::challenge Make a named core function
Use `.Define`, `.Params`, and `.Mul` to define `TRIPLE`, then call `TRIPLE(9)`.
:::

## Next

Now that the forms are concrete, trace why their lazy pieces survive lowering
instead of being evaluated during argument collection.
