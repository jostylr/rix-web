---
number: 11d
title: Prime filtering
description: Moderate example: generate and filter candidates.
---

## The problem

List primes through thirty. A candidate is prime when no integer from two through its square root divides it. This direct divisor search keeps the condition visible; for a large bound, a true sieve would be more efficient.

## JavaScript

~~~javascript
function hasDivisor(n, d = 2) {
  if (d * d > n) return false;
  return n % d === 0 || hasDivisor(n, d + 1);
}
console.log(Array.from({ length: 29 }, (_, i) => i + 2)
  .filter(n => !hasDivisor(n)));
~~~

## Python

~~~python
def has_divisor(n, d=2):
    if d * d > n: return False
    return n % d == 0 or has_divisor(n, d + 1)

print([n for n in range(2, 31) if not has_divisor(n)])
~~~

## Julia

~~~julia
function has_divisor(n, d=2)
    d * d > n && return false
    n % d == 0 || has_divisor(n, d + 1)
end
println(filter(n -> !has_divisor(n), 2:30))
~~~

## RiX

```rix edu
HasDivisor(n, d) ->
    d * d > n ?? 0 ?:
    n % d == 0 ?? 1 ?:
    HasDivisor(n, d + 1);

IsPrime(n) -> n >= 2 && HasDivisor(n, 2) == 0;

[2, |+1, |; 29] |>? (n) -> IsPrime(n) ;
```

## Reading the RiX solution

HasDivisor answers the useful internal question. Once d squared exceeds n, every possible factor pair is ruled out, so it returns zero. Clean division returns one; otherwise the search continues.

IsPrime adds the domain rule that primes begin at two and interprets “no divisor found” as success. The filter pipe retains candidates for which that predicate succeeds. The eager generator starts at two and creates twenty-nine values, ending at thirty.

Three layers cooperate here: recursive search, public predicate, and collection pipeline. Run each layer independently. The title says filtering rather than sieve because candidates are tested separately; a Sieve of Eratosthenes would maintain a shrinking candidate collection.

:::challenge Prime pairs
Find primes p through 30 for which p + 2 is also prime. Return tuples {: p, p + 2 }.
:::
