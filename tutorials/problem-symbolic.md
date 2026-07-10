---
number: 11f
title: Symbolic differentiation
description: Advanced example: structured expressions and symbolic rules.
---

## The problem

Represent x squared times y plus z, differentiate with respect to x, compile both symbolic specifications into callables, and evaluate them at (2, 3, 4). The other languages use external packages; RatCalc exposes a focused RiX symbolic capability.

## JavaScript

~~~javascript
import nerdamer from "nerdamer/all.js";
const expression = nerdamer("x^2*y + z");
const derivative = nerdamer.diff(expression, "x");
console.log(expression.evaluate({x:2, y:3, z:4}).text());
console.log(derivative.evaluate({x:2, y:3, z:4}).text());
~~~

## Python

~~~python
import sympy as sp
x, y, z = sp.symbols("x y z")
expression = x**2 * y + z
derivative = sp.diff(expression, x)
print(expression.subs({x:2, y:3, z:4}))
print(derivative.subs({x:2, y:3, z:4}))
~~~

## Julia

~~~julia
using Symbolics
@variables x y z
expression = x^2 * y + z
derivative = Symbolics.derivative(expression, x)
println(Symbolics.substitute(expression, Dict(x=>2, y=>3, z=>4)))
println(Symbolics.substitute(derivative, Dict(x=>2, y=>3, z=>4)))
~~~

## RiX

~~~rix
spec := {#x,y,z:p# p = x^2 * y + z }
derivativeSpec := Deriv(spec, "x")
Polynomial := Poly(spec)
Derivative := Poly(derivativeSpec)

{: Polynomial(2, 3, 4), Derivative(2, 3, 4) }
~~~

## Reading the RiX solution

The symbolic-specification form names x, y, and z as symbolic inputs and p as the expression. RiX preserves an expression tree instead of trying to recover structure from a source string.

Deriv constructs another compatible symbolic specification. It transforms mathematics rather than evaluating at a point. Poly compiles either specification into a callable. The capitalized callable names follow RiX's visible naming convention for functions. The phases remain separate: inspect or transform structure first, and choose numeric inputs only when ready to evaluate.

At (2, 3, 4), the polynomial is sixteen and its x derivative is twelve. The tuple returns both. The current consumer intentionally supports a polynomial subset: constants, identifiers, addition, subtraction, multiplication, and nonnegative integer powers. Unsupported transcendental rules require future capabilities or a host module.

:::challenge A second derivative
Differentiate derivativeSpec with respect to x, compile it with Poly, and evaluate all three callables at (2, 3, 4).
:::
