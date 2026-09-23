---
number: 11a
title: FizzBuzz
description: Separate branching rules from iteration.
---

## The problem

For integers one through a limit, replace multiples of three with “Fizz,” multiples of five with “Buzz,” and multiples of both with “FizzBuzz.” Other values remain numbers.

If this is your first RiX program, build the rule step by step in [Getting started](getting-started.html) before comparing languages here. This page revisits the finished solution; its first three listings are landmarks for readers who know those languages.

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

```rix edu
FizzBuzz(n) ->
    n % 15 == 0 ?: "FizzBuzz" ?_
    n % 3 == 0 ?: "Fizz" ?_
    n % 5 == 0 ?: "Buzz" ?_
    n;

[1 |+ 1 |; 15] |>> (n) -> FizzBuzz(n);
```

## Reading the RiX solution

The function contains the rules; the final line contains the traversal. Testing divisibility by fifteen first handles the overlap before either more general rule matches. Each conditional produces a value, so the whole function is one expression.

The bracket form is RiX's eager arithmetic generator: start at one, add one, and make fifteen values. The seed counts as the first value. The map pipe applies FizzBuzz to every generated value and returns the transformed array. Because RiX collections may contain mixed values, unmatched numbers can remain numbers.

Change the start, step, and count independently. Those pieces describe a sequence rather than managing a loop counter, leaving the final line focused on the values being transformed.

## RiX with a multifunction

Once you know how functions and conditions work, the same rule can be written as ordered variants. Each `?-` preparation checks whether its variant applies. A false check tries the next variant; the final variant handles every remaining number.

```rix edu
FizzBuzz(n) ?- [n % 15 == 0] /Both/ => "FizzBuzz";
FizzBuzz(n) ?- [n % 3 == 0] /Three/ => "Fizz";
FizzBuzz(n) ?- [n % 5 == 0] /Five/ => "Buzz";
FizzBuzz(n) /Number/ => n;

[1 |+ 1 |; 15] |>> (n) -> FizzBuzz(n);
```

The order matters: fifteen must be checked before three and five. This form is useful when each rule deserves its own named branch. See [Multifunctions](multifunctions.html) for dispatch details, including what happens when a guard is undecided.

## Compact comparison

Here is the same program with the names and explanatory spacing pared down. Both expressions produce the fifteen FizzBuzz values.

~~~javascript
console.log(Array.from({length:15},(_,i)=>{let n=i+1;return n%15?n%3?n%5?n:"Buzz":"Fizz":"FizzBuzz"}));
~~~

```rix edu
[1 |+ 1 |; 15] |>> {>
    (n) ?- [n%15==0] -> "FizzBuzz",
    (n) ?- [n%3==0] -> "Fizz",
    (n) ?- [n%5==0] -> "Buzz",
    (n) -> n
};
```

The `{> ... }` group is an anonymous multifunction. The map pipe calls it for each number, so there is no need to repeat a function name or name the variants. As above, the first matching rule wins. The JavaScript expression uses nested ternaries for the same priority order.

## Case-block solution

Use `{? ... }` when one function should choose among several results without defining separate variants:

```rix edu
FizzBuzz(n) -> {?
    n % 15 == 0 ? "FizzBuzz";
    n % 3 == 0 ? "Fizz";
    n % 5 == 0 ? "Buzz";
    n
};

[1 |+ 1 |; 15] |>> FizzBuzz;
```

The case block checks each condition in order and returns the first matching value. Its final `n` is the fallback for numbers divisible by neither three nor five. Compare [Ternaries and cases](ternaries.html) for more on case-block behavior.

:::challenge Configurable words
Define ReplaceMultiples(n, divisor, word), then build a variant for multiples of two and seven.
:::
