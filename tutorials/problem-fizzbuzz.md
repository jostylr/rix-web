---
number: 11b
title: FizzBuzz
description: Separate branching rules from iteration.
---

## The problem

For integers one through a limit, replace multiples of three with “Fizz,” multiples of five with “Buzz,” and multiples of both with “FizzBuzz.” Other values remain numbers.

## JavaScript

~~~javascript
function fizzBuzz(n) {
  if (n % 15 === 0) return "FizzBuzz";
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return n;
}
console.log(Array.from({ length: 15 }, (_, i) => fizzBuzz(i + 1)));
~~~

## Python

~~~python
def fizz_buzz(n):
    if n % 15 == 0: return "FizzBuzz"
    if n % 3 == 0: return "Fizz"
    if n % 5 == 0: return "Buzz"
    return n

print([fizz_buzz(n) for n in range(1, 16)])
~~~

## Julia

~~~julia
function fizz_buzz(n)
    n % 15 == 0 && return "FizzBuzz"
    n % 3 == 0 && return "Fizz"
    n % 5 == 0 && return "Buzz"
    n
end
println(fizz_buzz.(1:15))
~~~

## RiX

~~~rix
FizzBuzz(n) ->
    n % 15 == 0 ?? "FizzBuzz" ?:
    n % 3 == 0 ?? "Fizz" ?:
    n % 5 == 0 ?? "Buzz" ?:
    n

[1, |+1, |; 15] |>> (n) -> FizzBuzz(n)
~~~

## Reading the RiX solution

The function contains the rules; the final line contains the traversal. Testing divisibility by fifteen first handles the overlap before either more general rule matches. Each conditional produces a value, so the whole function is one expression.

The bracket form is RiX's supported eager arithmetic generator: start at one, add one, and make fifteen values. The map pipe applies FizzBuzz to every generated value and returns the transformed array. Because RiX collections may contain mixed values, unmatched numbers can remain numbers.

Change the start, step, and count independently. Those pieces describe a sequence rather than managing a loop counter, leaving the final line focused on the values being transformed.

:::challenge Configurable words
Define ReplaceMultiples(n, divisor, word), then build a variant for multiples of two and seven.
:::

