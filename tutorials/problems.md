---
number: 11
title: Problems in four languages
description: Compare familiar JavaScript, Python, Julia, and RiX solutions.
---

## Why compare?

A new language becomes easier to understand when it solves recognizable problems. This section presents each task in JavaScript, Python, Julia, and RiX. The first three listings are landmarks, not lessons: read them only far enough to recognize the algorithm. The RiX version is runnable and receives the explanation because this tutorial is about learning RiX.

The examples grow deliberately. Newton square root, FizzBuzz, and the Collatz test are small enough to hold in your head. Prime filtering and matrix multiplication require more structure. Symbolic differentiation uses a capability that ordinary general-purpose languages need an additional library to provide.

## What to watch for

Across the six problems, look for recurring RiX choices:

- exact division produces rational values instead of silently switching to binary floating point;
- uppercase names identify callables, while lowercase names hold ordinary values;
- conditional expressions keep decisions inside value-producing expressions;
- map and filter pipes transform collections without hiding the data flow;
- tuples and tensors give results an explicit shape;
- symbolic specifications preserve mathematical structure instead of immediately reducing it to a number.

The comparisons are not intended to prove that one language is universally shorter or better. They show where RiX makes exactness, mathematical structure, and data transformation visible.

## A productive route

Run the RiX cell on each page before editing it. Change one input, predict the result, and run it again. Then attempt the challenge without copying the supplied solution. A challenge box shares the tutorial session with cells you already ran on that page.

The final example is intentionally advanced. It demonstrates how a symbolic specification becomes both a callable polynomial and a derived callable—a glimpse of RiX as a host for mathematical objects, not only calculator syntax.

:::challenge Warm-up
Write a RiX function named Twice that doubles its input, then map it over [1, 2, 3, 4].
:::

