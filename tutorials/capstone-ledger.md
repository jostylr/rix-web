---
number: 4d
title: Capstone: shared ledger
description: Use cells, destructuring, and updates in a small model.
---

## The problem

A tiny ledger entry contains an account and an amount. A live balance and a display binding should intentionally share updates, while an archived value should remain independent. This is a compact demonstration of why RiX has several assignment forms.

This capstone deliberately reuses ideas from every lesson in its section. Read the setup first, predict the last value, and only then run the cell. If the result surprises you, inspect each named intermediate rather than changing several lines at once.

## Build the solution

~~~rix
entry := {= account="cash", amount=7 / 2 }
{= account, amount } := entry
balance := amount
display = balance
archive := balance
balance += 1 / 2
{: display, archive }
~~~

## How the pieces fit

Destructuring extracts the map entries. The display name aliases balance because plain equals shares a cell. The archive uses fresh-copy assignment, so it keeps the earlier value. Updating balance therefore changes display but not archive. The final tuple makes the contrast easy to inspect.

## Trace identity, not only value

When the snapshot is created, it prints the same number as the live balance, yet the names mean different things. An alias follows updates to the shared cell; a fresh value records history. A ledger needs both: the live account answers what is true now, while the snapshot supports audit.

Destructuring gives the transaction a readable boundary instead of scattering positional lookups through the update. Inspect alias, snapshot, and balance individually after running the cell. Their differing behavior makes RiX identity observable even when two printed values began equal.

The important design choice is visible in the notation: collection shape, assignment mode, scope marker, or system boundary communicates an intention that would otherwise have to live in a comment.

## Extend the model

Once the first version works, change one input and observe which outputs change. Then add one intermediate name so the next reader can inspect the new rule without mentally executing the entire program.

:::challenge Capstone extension
Add a second transaction and a second archive. Predict all four values before running the final report.
:::

## Review questions

- Which values are exact points, and which preserve uncertainty?
- Which names introduce fresh values, aliases, or outer-scope updates?
- Where would an assertion or diagnostic make this model safer?
