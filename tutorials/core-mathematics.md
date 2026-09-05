---
title: Core mathematical expressions
---

## Expressions without a plugin

Expression construction is part of RiX. Calculus and CAS supply algorithms
over the expression; they are not needed to construct it.

```rix edu
x := .ExpressionVariable(:x);
expression := x^2 + 3*x + 1;
{: .IsExpression(expression), expression.Kind(), x.Record()[:name] };
```

Exact scalar operands become constant nodes when combined with expressions.
Ordinary numerical arithmetic remains numerical.

```rix edu
{: 2+3, .ExpressionConstant(5).Kind() };
```

## Algorithms remain plugins

```rix edu
.Plugin.Load("cas");
t := .ExpressionVariable(:t);
integral := .cas.Integrate(t^2,:t);
.cas.CheckIntegral(integral)[:accepted];
```

The constructors do not automatically simplify, integrate, or approximate.

## Scoped symbolic names

`::x` creates or retrieves the mathematical symbol named x in the current
programming scope. It does not retrieve the ordinary binding named x.

```rix edu
x := 7;
symbol := ::x;
copy ::= symbol;
{: x, .SameSymbol(symbol,::x), .SameSymbol(copy,symbol), ::x+1 };
```

Copies preserve identity. Each nested programming scope has its own symbolic
names, and `@::x` explicitly captures an already introduced enclosing symbol.

```rix edu
outer := ::x;
{;
    inner := ::x;
    {: .SameSymbol(inner,@::x), .SameSymbol(@outer,@::x), inner==@::x };
};
```

The results are `_`, `1`, and `?`: the inner symbol has a different identity,
but that does not prove its mathematical value differs. `SameSymbol` asks
identity; `==` asks mathematical equality. Currently equality establishes
identical trees and exact constant comparisons; other cases stay undecided.

```rix edu
Fresh()->::t;
{: .SameSymbol(Fresh(),Fresh()), ::x==::x, .ExpressionKey(::x+1) };
```

Function invocations get fresh local symbols. Repeated top-level cells in the
same session share symbols; resetting the session starts a new namespace.
Use spaces around assignment (`x := ::x`): adjacent `:=::` overlaps the old
reserved `:=:` token. Index-leading `::` stays reserved for slicing, not a
symbolic literal; `( ::x )` makes an expression boundary explicit if needed.

## Definitions without losing identity

```rix edu
::dependent = ::x - 0;
{: ::dependent==::x, .SameSymbol(::dependent,::x), .ExpressionExpand(::dependent) };
```

The definition makes the expressions mathematically equal, but `dependent`
and `x` are still distinct symbols. Definitions are immutable in their scope.
Assigning a second definition or creating a direct/indirect cycle errors.

```rix edu
::x = 2;
{: ::dependent==2, .ExpressionDefinition(::x) };
```

Earlier expressions retain symbol references and can use a later once-only
definition. Expansion substitutes definitions known at the time; it does not
mutate the original. This is distinct from a context-local equality assumption,
which will be introduced with mathematical context blocks.

### Current implementation boundary

Scoped symbols support core construction, arithmetic, identity, keys, and
conservative equality. The existing name-based calculus, CAS, range, and
specification consumers reject scoped expressions until their identity-aware
conversion is implemented. The first section's constructor-based examples
remain usable with those consumers. `:::x` and `{& header & body }` are still pending.

:::challenge Build and inspect
Construct `(x+1)^3` without loading a plugin, then inspect its operands.
:::
