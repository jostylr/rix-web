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
mutate the original. This is distinct from a context-local equality assumption.

## A mathematical context is not a loop

```rix edu
visits := 0;
context := {& :::t | 1:0; :::t > 0 &
    visits ~= visits+1;
    :::t^2 * ::parameter;
};
{: visits,context[:domains][1][:domain][:orientation],context[:domains][1][:domain][:lowerclosed] };
```

The body runs once, in the same programming scope. The returned record retains
its result, fresh bound symbols, domains, and assumptions. `:::t` is local to
this mathematical context; `::parameter` is an ordinary scoped free symbol.
Descending traversal is retained independently of sorted bounds. The strict
positive assumption removes zero from the normalized domain.

```rix edu
rectangle := {& (:::u,:::v) | (0:1,2:3) & :::u+:::v };
{: .SameSymbol(rectangle[:binders][1],rectangle[:binders][2]),rectangle[:result] };
```

Tuple declarations give each binder its own domain. An endpoint object such
as `{= start=0,end=1,lowerclosed=_ }` makes inclusion explicit, and
`(0:1,:desc)` explicitly selects traversal. Compatible later constraints
intersect; a header demanding both positive and negative values errors before
running its body. Dependent symbolic endpoints are not supported yet.

```rix edu
assumed := {& ::beta == ::alpha-0 & ::beta==::alpha };
{: assumed[:consistency],.ExpressionDefinition(::beta),assumed[:result] };
```

An equality assumption is retained, not installed as a definition. The body
comparison remains undecided: assumption-aware reasoning is a subsequent
stage. Inspect `assumed[:assumptions]` to see the relation as expression data.
This context does not yet prove or simplify that relation.

## Constants keep their mathematical guarantees

```rix edu
enclosed := ::position + (0:1);
{: .ExpressionConstantInfo(enclosed.Operands()[2])[:denotation],
   .ExpressionConstant(0:1)==(0:1),.ExpressionConstant(0:1)==(2:3),
   .ExpressionConstant(1:1)==1 };
```

An interval is a set enclosure, not a secretly selected real number. Overlap
does not establish equality: the second result is `?`. Disjoint enclosures
can establish inequality, while point intervals can establish equality.
Construction does not perform numerical evaluation or refinement.

```rix edu
exactPi := 1~{pi};
withPi := ::position + exactPi;
{: withPi.Kind(),.ExpressionConstantInfo(exactPi)[:provider],
   .ExpressionConstant(exactPi)==exactPi };
```

Core exact scalars also promote, using generator identities rather than their
display names. This is exact symbolic pi, not a refinable numerical pi. The
provider record exposes algebraic laws; exact polynomial quotients do not
automatically promise cancellation. Physical quantities and quaternion/octonion
adapters remain future work.

## Retaining a real's refinement procedure

```rix edu
.Plugin.Load("numerics");
realRoot := .ExpressionReal(.numerics.Sqrt(2),{= absoluteWidth=1/10,maxWork=30 });
rootKey := .ExpressionKey(realRoot);
rootCopy ::= realRoot;
rootResult := .ExpressionRefine(rootCopy,{= absoluteWidth=1/10000,maxWork=100 });
{: rootResult[:goalMet],rootKey==.ExpressionKey(realRoot),realRoot==rootCopy,
   .ExpressionConstantInfo(realRoot)[:provider],(::position+realRoot).Kind() };
```

The constant retains one real's identity, its enclosure, and its procedure.
Copies share that identity. Refining a copy narrows their shared knowledge,
but never changes the expression key. Construction makes one bounded protocol
call; inspection, arithmetic construction, and equality do not refine.
Separate adaptations remain distinct identities with undecided equality.

```rix edu
.Plugin.Load("numerics");
coarseRoot := .ExpressionReal(.numerics.Sqrt(2),{= absoluteWidth=1/100000,maxWork=1 });
coarseResult := .ExpressionRefine(coarseRoot,{= absoluteWidth=1/100000,maxWork=1 });
{: coarseResult[:status],coarseResult[:certified],coarseResult[:goalMet] };
```

Budget exhaustion can still return a certified enclosure. Check `goalMet`
before claiming the requested width was reached. Protocol checks validate
the reported contract, not arbitrary provider code; the evidence level remains
the provider's claim. Procedures stay in memory; saved reals become snapshots.

## Saving a graph without saving a programming scope

```rix edu
::savedY = ::savedX-0;
savedGraph := .MathEncodeJSON((::savedX,::savedY,::savedX));
loadedGraph := .MathDecodeJSON(savedGraph);
{: .SameSymbol(loadedGraph[1],loadedGraph[3]),loadedGraph[1]==loadedGraph[2],
   .SameSymbol(::savedX,loadedGraph[1]) };
```

Shared identities and definitions survive, but imported symbols are fresh.
Names never overwrite your programming scope. `savedGraph` is ordinary JSON
text with exact scalar tags and a document-local node table—not executable code.

```rix edu
graphLines := .MathEncodeJSONL([::savedX,::savedX]);
graphRows := .MathDecodeJSONL(graphLines);
savedContext := .MathDecodeJSON(.MathEncodeJSON({& :::t | 1:0 & :::t*::savedX }));
{: .SameSymbol(graphRows[1],graphRows[2]),savedContext[:validation],
   savedContext[:domains][1][:domain][:orientation] };
```

Each JSONL line has an independent identity table. Put related values in one
tuple or map document to preserve shared identity. Context claims load as
unverified data; their assumptions are retained, not automatically proved.

```rix edu
.Plugin.Load("numerics");
portableRoot := .MathDecodeJSON(.MathEncodeJSON(.ExpressionReal(.numerics.Sqrt(2))));
{: .ExpressionConstantInfo(portableRoot)[:provider],
   .ExpressionConstantInfo(portableRoot)[:refinable],
   .ExpressionConstantInfo(portableRoot)[:validation] };
```

The singleton and its enclosure survive as a frozen snapshot. The procedure
does not: calling `ExpressionRefine` on this loaded value reports that no
recipe is installed. Loading never runs source code or loads plugins. Safe
recipe restoration is a later increment. JSONL helpers here are bounded,
in-memory text APIs; they do not claim unlimited streaming capacity.

### Current implementation boundary

Scoped symbols support core construction, arithmetic, identity, keys, and
conservative equality. The existing name-based calculus, CAS, range, and
specification and certified range consumers still reject scoped expressions; symbolic
calculus differentiation and CAS integration/simplification now preserve identities
(see below). Their algorithmic constant support remains rational-only. The first section's constructor-based examples
remain usable with those consumers. Bounded free substitution and core-provider evaluation
are now available below, as is explicit binder instantiation. General domain reasoning, remaining numeric
adapters, and safe refinement-recipe restoration remain pending. Context-argument
evaluation below supports exact equalities and rational point-domain checks. Graph serialization
and frozen snapshots are available now.

:::challenge Build and inspect
Construct `(x+1)^3` without loading a plugin, then inspect its operands.
:::
## Localizing an expression without losing its conditions

Bindings use symbol identities, not names. They are simultaneous and do not modify
definitions or programming variables. Evaluation begins with exact rational arithmetic;
additional supported providers are demonstrated below. Unsupported functions and provider
combinations remain explicit unresolved work.
Each example uses a fresh block scope so `::x` is independent of its definition
earlier in this worksheet.

```rix edu
{;
    expr := ::x^2+1;
    ans := expr.Eval([(::x,3)]);
    (ans[:status],ans[:value]);
};
```

`expr.Eval(bindings)` is the method form of
`.MathEvaluate(expr,bindings)`; `expr.Substitute(bindings)` likewise replaces
`.MathSubstitute(expr,bindings)`. Both methods leave the expression unchanged.
A mathematical context is more than its result expression. Conditions remain attached
to the report. The positive-domain check now succeeds for 2, producing a complete
value of 3. A negative replacement contradicts the retained assumption.

```rix edu
{;
    ctx := {& ::x>0 & ::x+1 };
    good := .MathEvaluate(ctx,[(::x,2)]);
    bad := .MathEvaluate(ctx,[(::x,-2)]);
    (good[:status],good[:value],good[:candidate],bad[:status]);
};
```

Same-spelled bound and free symbols remain different. Free substitution cannot replace
a binder or insert a bound symbol. Use the separate `Instantiate` method below.

```rix edu
{;
    ctx := {& :::x | 0:1 & :::x+::x };
    changed := .MathSubstitute(ctx,[(::x,7)]);
    (.SameSymbol(ctx[:binders][1],changed[:result].Operands()[1]),
     .MathEvaluate(changed)[:status]);
};
```
## Evaluating under local mathematical facts

Use capitalized expression methods, just like functions. `Substitute` explicitly
replaces symbols; `Eval` can instead use a mathematical context containing local
facts. Semicolons separate the header assumptions. Its body can be empty.

```rix edu
{;
    expr := ::x^2+::y;
    ctx := {& ::x==3; ::y==7 & };
    ans := expr.Eval(ctx);
    changed := expr.Substitute([(::y,::x)]);
    (ans[:status],ans[:value],changed==::x^2+::x,.ExpressionDefinition(::x));
};
```

The values are local to evaluation, not definitions installed on the symbols.
Exact points are checked against the retained rational domains. Merely saying
x is positive does not pick a numerical value for x.

```rix edu
{;
    expr := ::x+1;
    ans := expr.Eval({& ::x>0; ::x==3 & });
    (ans[:value],expr.Eval({& ::x>0 & })[:status],expr.Eval()[:status]);
};
```

Equalities between symbols remain relationships, not instructions to solve a
system. Once exact values are supplied, incompatible relationships are diagnosed.
A complete result means evaluation succeeded under its retained assumptions;
it is not a proof that those assumptions hold universally.

```rix edu
{;
    expr := ::x+1;
    unknown := expr.Eval({& ::x==::y; ::y==7 & });
    conflict := expr.Eval({& ::x==3; ::y==7; ::x==::y & });
    (unknown[:status],conflict[:status],conflict[:value]);
};
```
## Instantiating a bound parameter

Choose the actual binder identity from a context. Instantiation produces a new
context and retains its conditions, including open endpoints and traversal direction.
It selects a parameter value; it does not perform an integral or a sum.

```rix edu
{;
    ctx := {& :::t | 1:0; :::t>0 & :::t^2 };
    t := ctx[:binders][1];
    point := ctx.Instantiate([(t,1/2)]);
    bad := ctx.Instantiate([(t,0)]);
    (point.Eval()[:value],bad.Eval()[:status],ctx[:binders].Len(),
     point[:domains][1][:domain][:orientation]);
};
```

Free symbols in a replacement remain free. They can be evaluated later, while
any unselected binders remain local. Bound symbols cannot be inserted as replacements.

```rix edu
{;
    ctx := {& :::t | 0:1 & :::t+1 };
    point := ctx.Instantiate([(ctx[:binders][1],::x/2)]);
    (point.Eval()[:status],point.Eval([(::x,1)])[:value],point[:instantiations].Len());
};
```
## Evaluating with intervals and exact scalars

Interval arithmetic keeps conservative bounds, not a guessed midpoint. A completed
set-enclosure calculation need not be the exact range: repeated uses of a variable
can widen the enclosure. Domain overlap stays conditional rather than being assumed valid.

```rix edu
{;
    ans := (::x^2+1).Eval([(::x,-1:2)]);
    ctx := {& :::t>0 & :::t+1 };
    overlap := ctx.Instantiate([(ctx[:binders][1],0:2)]).Eval();
    (ans[:status],ans[:resultKind],ans[:enclosure].Start(),ans[:enclosure].End(),overlap[:status]);
};
```

Exact generators retain their identities and algebraic rules. Supported arithmetic
includes positive powers and division by nonzero rationals. Division by arbitrary
exact expressions is not presumed safe, nor is an exact-to-interval approximation guessed.

```rix edu
{;
    p := 1~{pi};
    ans := ((::x+1)^2/2).Eval([(::x,p)]);
    (ans[:status],ans[:resultKind],
     .ExpressionConstant(ans[:value])==.ExpressionConstant((p+1)^2/2));
};
```

## Evaluating a certified real enclosure

Real evaluation reads the stored enclosure; it does not call the refinement procedure.
An `enclosed` result has no exact `value`. Refine explicitly, then evaluate again for
tighter bounds. A saved real retains its enclosure but unverified evidence keeps its
evaluation conditional. Live provider evidence is protocol-checked, not independently proved.

```rix edu
.Plugin.Load("numerics");
{;
    r := .ExpressionReal(.numerics.Sqrt(2),{= absoluteWidth=1/10,maxWork=30 });
    loose := (r^2).Eval();
    .ExpressionRefine(r,{= absoluteWidth=1/1000,maxWork=100 });
    tight := (r^2).Eval();
    a := loose[:enclosure]; b := tight[:enclosure];
    saved := .MathDecodeJSON(.MathEncodeJSON(r));
    (tight[:status],tight[:resultKind],tight[:value],
     b.End()-b.Start()<a.End()-a.Start(),saved.Eval()[:status]);
};
```
## Choosing a work budget

Raise or lower a budget for one call without changing the worksheet's defaults.
`MathBudgets` lists the effective settings, and each evaluation report records them.
Here a larger input-term-product budget permits an exact expansion that exceeds
the default. Larger budgets can require much more time and memory.

```rix edu
{;
    expr := (::x+1)^64;
    ans := expr.Eval([(::x,1~{pi})],{= maxProductPairs=2048 });
    (ans[:status],ans[:budgets][:maxProductPairs],.MathBudgets()[:maxProductPairs]);
};
```

The same final options map works with `Substitute` and `Instantiate`. Traversal
depth retains a host-safety ceiling of 512; JSON import limits and real refinement
budgets are separate. Raising a work budget never disables mathematical domain checks.
## Evaluating a mathematical function by its meaning

Real absolute value and principal real square root now have trusted core evaluation
kernels. This small constructor makes a symbolic root without loading a plugin.
Its semantic ID specifies the meaning; the display name does not select executable code.

```rix edu
{;
    Root(x) -> .ExpressionApply("rix.function.sqrt.real-principal@1",:Sqrt,[x]);
    ans := Root(::x).Eval([(::x,2)]);
    (ans[:status],ans[:resultKind],
     .ExpressionConstant(ans[:value]^2)==.ExpressionConstant(2),Root(9/4).Eval()[:value]);
};
```

Intervals use certified endpoint enclosures. `rootBits` controls endpoint precision,
not the width of the input interval. A partially negative domain is not silently clipped.

```rix edu
{;
    Root(x) -> .ExpressionApply("rix.function.sqrt.real-principal@1",:Sqrt,[x]);
    expr := Root(::x);
    a := expr.Eval([(::x,2:3)],{= rootBits=8 })[:enclosure];
    b := expr.Eval([(::x,2:3)],{= rootBits=32 })[:enclosure];
    (b.Start()^2<=2,b.End()^2>=3,
     b.End()-b.Start()<a.End()-a.Start(),Root(-1:2).Eval()[:status]);
};
```

The same evaluation works under local facts. Saving an expression retains its
semantic ID; loading never runs it. Only a subsequent explicit evaluation uses
the allowlisted kernel. Unknown semantics remain unresolved.

```rix edu
{;
    expr := .ExpressionApply("rix.function.abs.real@1",:Abs,[::x]);
    ans := expr.Eval({& ::x == -3 & });
    saved := .MathDecodeJSON(.MathEncodeJSON(expr.Substitute([(::x,-4)])));
    (ans[:value],saved.Eval()[:value],ans[:semantics][1]);
};
```
## Calculus and CAS with scoped symbols

Select the actual mathematical variable. A second x from a nested scope remains
independent, even though both symbols have the same display name.

```rix edu
.Plugin.Load("cas");
{;
    a := ::x; b := {; ::x };
    expr := a^2+b;
    da := .calculus.Differentiate(expr,a);
    db := .calculus.Differentiate(expr,b);
    primitive := .cas.Integrate(a*b,a);
    (da.Eval([(a,3)])[:value],db.Eval()[:value],
     primitive[:antiderivative].Eval([(a,2),(b,3)])[:value],
     .cas.CheckIntegral(primitive)[:accepted]);
};
```

Evaluate an entire derivative transformation to preserve its conditions. Here the
logarithm's positive-real condition remains relevant even though its derivative is
just a reciprocal. Unsupported branch conditions remain conditional.

```rix edu
.Plugin.Load("calculus");
{;
    d := .calculus.DifferentiateResult(.calculus.Log()(::x),::x);
    good := .calculus.EvaluateResult(d,[(::x,2)]);
    bad := .calculus.EvaluateResult(d,[(::x,-2)]);
    (good[:value],bad[:status],good[:obligations].Len());
};
```
## Scoped polynomial forms

Collection and factoring preserve the selected symbol inside their polynomial objects.
Those objects can be evaluated, combined with polynomials in the same identity, and
integrated. A distinct same-named symbol is not an interchangeable polynomial variable.

```rix edu
.Plugin.Load("cas");
{;
    collected := .cas.Collect((::x+1)^3,::x);
    p := collected[:polynomial];
    primitive := .cas.Integrate(p);
    factored := .cas.Factor(::x^2-1,::x);
    (.SameSymbol(p.Variable(),::x),p.Evaluate(2),
     primitive[:antiderivative].Eval([(::x,1)])[:value],factored[:status],
     .cas.Expand((::x+1)^3,::x)[:expression].Eval([(::x,0)])[:value]);
};
```

The coefficient compiler has explicit per-call work budgets. It rejects foreign
symbols and operations with variable-dependent undefined points rather than silently
converting them into a different polynomial.

```rix edu
.Plugin.Load("poly");
{;
    coefficients := .MathPolynomialCoefficients((::x+1)^32,::x,{= maxProductPairs=4096 });
    p := .poly({= coefficients=coefficients,order=:ascending,variable=::x });
    (p.Degree(),.SameSymbol(p.Variable(),::x),p.Evaluate(0));
};
```

## From symbols to executable specifications

Give the explicit input order when compiling a scoped expression. Here the two
symbols both print as `x`, but remain distinct. The compiled function takes `b`
first and `a` second; restoring its expression recovers the original identities.

```rix edu
{;
    a := ::x; b := {; ::x };
    spec := .SpecFromExpression(a^2+b,[b,a]);
    F := .Poly(spec);
    expr := .ExpressionFromSpec(F);
    (F(2,3),expr.Eval([(a,3),(b,2)])[:value],
     .InspectSpec(spec)[:symbolBindings].Len());
};
```

Specification composition also retains identities. Capitalize callable names:
`P(Q)` substitutes a specification, whereas lowercase juxtaposition means multiplication.

```rix edu
{;
    P := .SpecFromExpression(::x^2,[::x],{= maxVisits=100 });
    Q := .SpecFromExpression(::y+1,[::y]);
    expr := .ExpressionFromSpec(P(Q));
    d := .ExpressionFromSpec(.Deriv(P,::x));
    (expr.Eval([(::y,3)])[:value],d.Eval([(::x,3)])[:value]);
};
```

This bridge currently accepts rational arithmetic, not mathematical contexts or
semantic calls. Use `Eval` for assumption-aware and provider-aware evaluation.
Conversion traversal budgets are configurable; they do not limit later callable
execution. Private slot names shown by spec inspection are not portable source:
save expressions and their symbols together using mathematical JSON/JSONL.
