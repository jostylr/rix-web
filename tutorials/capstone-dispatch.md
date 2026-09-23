---
number: 5f
title: Capstone: rule dispatcher
description: Compose functions, scope, and variants into one task.
---

## The problem

A pricing rule gives a small discount to positive quantities, rejects zero with a distinct result, and converts a negative quantity to its magnitude before pricing. Multifunction variants let each condition remain close to the expression it selects.

Prerequisites: [Define and call](function-basics.html), basic [Ternaries and cases](ternaries.html), and [Multifunctions](multifunctions.html). Predict the positive, zero and negative results before running the example.

## Build the solution

```rix edu
Price(q) ?- [q > 0] => q * 9 / 10;
Price(q) ?- [q == 0] => 0;
Price(q) => Price(-q);
{: Price(10), Price(0), Price(-5) } ;
```

## How the pieces fit

Variants are tried in order. A prep clause that returns false causes dispatch to continue. The fallback has no prep and recursively calls the same multifunction with a positive value. The result is a concise rule table whose control flow is still explicit.

## Read dispatch as a policy table

The prepared variants state when a pricing policy applies; their bodies state what it produces. The unprepared catch-all normalizes negative input before redispatching. Ordering matters: a general fallback placed first would hide the specialized cases.

The recursive fallback terminates because negating a negative quantity produces a positive one, which the first variant accepts. Test Price(-5) beside Price(5) to verify the normalization. A bulk-discount variant then becomes an explicit ordering decision instead of another deeply nested conditional.

Prepared variants express a policy table. This is a case where guarded dispatch helps: each accepted input family has its own rule.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add a first variant for quantities greater than 20 with a larger discount, then test the boundary values 20 and 21.
:::

## Review questions

- What does `Price(0)` return, and why does it not reach the fallback?
- Why does `Price(-5)` eventually terminate?
- What happens if the catch-all variant is moved before the positive and zero variants?
