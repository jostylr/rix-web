---
number: 2c
title: Sets
description: Keep unique values and combine groups with precise set operations.
---

## Keep only one of each value

Sets use the `{|` sigil. Repeated entries collapse to one member.

```rix
choices := {| 1, 2, 2, 3 |}
choices
```

The result contains each value once. That makes sets a strong fit for membership and combination questions.

Unlike an array, a set does not promise meaningful order or preserve duplicates. Choose it when the question is “which distinct values occur?” rather than “in what sequence did values occur?” `Has` answers membership directly, and `Values` converts the members when a later operation specifically needs a traversable sequence.

## Combine two sets

`Union` returns all unique values from both inputs.

```rix
warm := {| 1, 2 |}
cool := {| 2, 3 |}
warm.Union(cool)
```

Union keeps values present in either set. Intersection keeps only values present in both, while difference keeps values from the receiver that are absent from the other set.

```rix
required := {| "read", "write", "share" |}
granted := {| "read", "share", "admin" |}
{: required.Intersect(granted), required.Diff(granted) }
```

Read the direction of `Diff` carefully: the example reports required permissions that are not granted. Reversing receiver and argument instead reports granted permissions that were not requested.

## Prefer returned sets

`Add`, `Remove`, `Union`, `Intersect`, and `Diff` return new sets. Their bang counterparts update a mutable receiver. Returned sets make comparisons clearer because both “before” and “after” remain available.

```rix
original := {| 2, 3, 5 |}
extended := original.Add(7)
{: original, extended, extended.Has(7) }
```

Exact numeric equality governs membership, so equivalent rational spellings denote the same set member. The function chips below link the central set operations to their API descriptions and examples.

:::challenge Test membership
Create a set called `primes` containing 2, 3, and 5. Use `Has` to test whether 3 is present.
:::
