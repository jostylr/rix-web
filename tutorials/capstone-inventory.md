---
number: 2f
title: Capstone: exact inventory
description: Model a small inventory with arrays, maps, and sets.
---

## The problem

A workshop needs to represent stock counts, an ordered pick list, and the distinct part names involved in an order. One collection type could hold all three, but using the collection that matches each question makes the model easier to read.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
stock := {= bolts=24, nuts=18, washers=30 }
pickList := ["bolts", "washers", "bolts"]
requested := {| "bolts", "washers", "bolts" |}
boltCount := stock.Get("bolts")
{: boltCount, pickList, requested }
~~~

## How the pieces fit

The map answers a keyed lookup, the array preserves order and repetition, and the set collapses duplicate requests. The tuple returned at the end is only a report: it groups three results without giving them new keys. Notice that collection choice is part of the program's meaning, not merely presentation.

## Follow the data shapes

The same business fact appears in three shapes because each answers a different question. The event array can answer “what happened third?” The stock map can answer “how many washers remain?” The set can answer “which item names occurred at least once?” Forcing all three questions through one collection would make at least one awkward.

Duplicate bolts survive in the array but collapse in the set. That is not data loss: the set is a derived uniqueness index, and the original sequence still preserves frequency and order. The same map could later hold rational package weights or interval-valued estimates without changing its keys.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add nuts to the request, create a new stock map with two fewer nuts, and report the old and new maps to demonstrate immutable updates.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
