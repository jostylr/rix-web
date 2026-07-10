---
number: 11c
title: Collatz test
description: Test a starting value up to a step limit.
---

## The problem

For a positive integer, repeatedly halve even values and replace odd values with three times the value plus one. Test whether the process reaches one before a supplied step limit. The limit turns an open-ended mathematical process into a bounded program.

## JavaScript

~~~javascript
function reachesOne(n, steps) {
  if (n === 1) return true;
  if (steps === 0) return false;
  const next = n % 2 === 0 ? n / 2 : 3 * n + 1;
  return reachesOne(next, steps - 1);
}
console.log(reachesOne(27, 120));
~~~

## Python

~~~python
def reaches_one(n, steps):
    if n == 1: return True
    if steps == 0: return False
    next_n = n // 2 if n % 2 == 0 else 3 * n + 1
    return reaches_one(next_n, steps - 1)

print(reaches_one(27, 120))
~~~

## Julia

~~~julia
function reaches_one(n, steps)
    n == 1 && return true
    steps == 0 && return false
    next_n = iseven(n) ? n ÷ 2 : 3n + 1
    reaches_one(next_n, steps - 1)
end
println(reaches_one(27, 120))
~~~

## RiX

~~~rix
NextCollatz(n) -> n % 2 == 0 ?? n / 2 ?: 3 * n + 1
CollatzWithin(n, steps) ->
    n == 1 ?? 1 ?:
    steps == 0 ?? 0 ?:
    CollatzWithin(NextCollatz(n), steps - 1)

CollatzWithin(27, 120)
~~~

## Reading the RiX solution

NextCollatz owns the mathematical transition. CollatzWithin owns termination. The first base case succeeds at one; it appears before the exhausted-step case so reaching one on the last permitted transition succeeds.

Division remains exact, and every recursive call reduces steps. That supplies a structural reason the program terminates even though the Collatz conjecture remains unresolved. A zero result means only “not reached under this budget,” not “the conjecture is false.”

Run NextCollatz on a few values before testing the recursive function. That mirrors the RatCalc workflow: establish a small rule, inspect it, and then compose it into a bounded computation.

:::challenge Include the stopping time
Define CollatzSteps(n, remaining, used). Return used at one and _ when the budget is exhausted.
:::

