---
number: 10d
title: Extend existing types
description: Add collision-safe receiver methods without patching individual values.
---

## Register a receiver-first method

`.RegisterMethod` is a trusted system capability for extending an existing
semantic or runtime type. The registered function receives the method's value
as its first argument:

```rix edu
.RegisterMethod(:Rational, :Twice, (self) -> self * 2);
{: (3/7).Twice(), (5/11).Twice() };
```

The registration changes method lookup, not either rational value or the
RatMath JavaScript class behind it. `obj.Method(arg)` is receiver-first sugar
for calling the registered function with `obj` followed by `arg`.

## Accept ordinary method arguments

Arguments after the receiver are passed through in order. This extension wraps
an existing exact rational operation in domain-specific vocabulary:

```rix edu
.RegisterMethod(
    :Rational,
    :WithDenominatorLimit,
    (self, limit) -> self.BestApproximation(limit)
);
(355/113).WithDenominatorLimit(100);
```

Use symbols such as `:Rational` and `:Integer` to name the target type. Choose
a target narrowly enough that the method's contract is true for every matching
receiver.

## Treat collisions as errors

Built-in prototypes are frozen. Registering `Numerator` on `Rational`, for
example, is rejected because that method already exists. A second registration
of the same type and name is also rejected instead of letting plugin load order
silently change behavior.

That means extension names are part of a plugin's public API. Prefer a precise
name, and let a collision stop plugin loading so the conflict can be resolved
explicitly.

## Use plugin-owned extensions

Plugins normally perform registration while their mount is loading. Their
methods are available only where that owning plugin mount is visible. The
bundled `radix` plugin, for example, adds exact-number methods:

```rix edu
.Plugin.Load("radix");
{: (1/7).PeriodLength(10), (1/6).RadixString(10) };
```

The `float` plugin similarly adds the explicit `Float()` conversion to
integers and rationals. Loading a plugin therefore makes both its command
namespace and its documented receiver methods available together.

:::challenge Add a domain method
Register `AddTax(rate)` on rationals, then add ten percent to `19/2`. The
method should return a new exact rational and leave its receiver unchanged.

    .RegisterMethod(:Rational, :AddTax, (self, rate) -> self * (1 + rate));
    (19/2).AddTax(1/10);
:::

## Keep going

Open the plugin tutorials to see method registration used behind public APIs,
or return to the package-design capstone to plan capability and trust
boundaries for a larger extension.
