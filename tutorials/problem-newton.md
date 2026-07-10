---
number: 11a
title: Newton square root
description: Approximate a root to a supplied tolerance.
---

## The problem

Given a positive number and a tolerance, approximate its square root. Newton's method repeatedly replaces a guess with the average of the guess and the number divided by that guess. Stop when the square of the guess differs from the target by less than the requested tolerance.

## JavaScript

~~~javascript
function newtonSqrt(n, tolerance, guess = 1) {
  const next = (guess + n / guess) / 2;
  return Math.abs(next * next - n) < tolerance
    ? next : newtonSqrt(n, tolerance, next);
}
console.log(newtonSqrt(2, 1e-6));
~~~

## Python

~~~python
def newton_sqrt(n, tolerance, guess=1):
    next_guess = (guess + n / guess) / 2
    if abs(next_guess * next_guess - n) < tolerance:
        return next_guess
    return newton_sqrt(n, tolerance, next_guess)

print(newton_sqrt(2, 1e-6))
~~~

## Julia

~~~julia
function newton_sqrt(n, tolerance, guess=1)
    next_guess = (guess + n / guess) / 2
    abs(next_guess^2 - n) < tolerance && return next_guess
    newton_sqrt(n, tolerance, next_guess)
end
println(newton_sqrt(2, 1e-6))
~~~

## RiX

~~~rix
Gap(n, x) -> x * x > n ?? x * x - n ?: n - x * x
NewtonStep(n, x) -> (x + n / x) / 2
NewtonSqrt(n, tolerance, guess) ->
    Gap(n, guess) < tolerance ??
        guess ?:
        NewtonSqrt(n, tolerance, NewtonStep(n, guess))

NewtonSqrt(2, 1 / 1000000, 1)
~~~

## Reading the RiX solution

Gap computes an absolute difference using a conditional expression, while NewtonStep expresses the mathematical recurrence directly. Naming both ideas leaves NewtonSqrt responsible only for deciding whether to stop or recur.

The tolerance is the exact rational 1 / 1000000. Every intermediate guess is rational too. The printed answer may be a sizable fraction, but its square is within the exact requested bound. Decimal formatting can happen at the presentation boundary rather than contaminating the calculation.

A production version should validate positive inputs and impose an iteration limit. The compact version keeps the recurrence visible for study. Run Gap and NewtonStep separately to see how a larger function can be investigated one exact piece at a time.

:::challenge A safer square root
Define SafeNewtonSqrt with a fourth parameter for remaining steps. Return _ if the steps reach zero before the tolerance is met.
:::

