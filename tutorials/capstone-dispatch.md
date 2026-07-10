---
number: 5e
title: Capstone: rule dispatcher
description: Compose functions, scope, and variants into one task.
---

## The problem

A pricing rule gives a small discount to positive quantities, rejects zero with a distinct result, and converts a negative quantity to its magnitude before pricing. Multifunction variants let each condition remain close to the expression it selects.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
Price(q) ?- [q > 0] => q * 9 / 10
Price(q) ?- [q == 0] => 0
Price(q) => Price(-q)
{: Price(10), Price(0), Price(-5) }
~~~

## How the pieces fit

Variants are tried in order. A prep clause that returns false causes dispatch to continue. The fallback has no prep and recursively calls the same multifunction with a positive value. The result is a concise rule table whose control flow is still explicit.

## Read dispatch as a policy table

The prepared variants state when a pricing policy applies; their bodies state what it produces. The unprepared catch-all normalizes negative input before redispatching. Ordering matters: a general fallback placed first would hide the specialized cases.

The recursive fallback terminates because negating a negative quantity produces a positive one, which the first variant accepts. Test Price(-5) beside Price(5) to verify the normalization. A bulk-discount variant then becomes an explicit ordering decision instead of another deeply nested conditional.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add a first variant for quantities greater than 20 with a larger discount, then test the boundary values 20 and 21.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
