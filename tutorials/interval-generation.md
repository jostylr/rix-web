---
number: 3d
title: Interval generation and sampling
description: Produce exact point ranges, partitions, mediants, and repeatable random samples.
---

## Intervals can produce points or subintervals

The ordinary value `a:b` retains two exact bounds. Generation operators use
those bounds to produce either a lazy point sequence or an eager collection of
touching subintervals.

## Step through an interval lazily

`:+` starts at the lower bound for a positive step and stops before crossing
the upper bound. The result is lazy and cached.

```rix edu
oddPoints := 1:10 :+ 2;
oddPoints[1:5] ;
```

A negative step starts at the upper bound and walks downward.

```rix edu
descending := 1:10 :+ -3;
descending[1:4] ;
```

The endpoint is included only when the chosen step lands on it exactly.

## Ask for exactly n points

`:: n` returns exactly `n` equally spaced points, including both endpoints.
The sequence is lazy even though its length is known.

```rix edu
grid := 0:1 :: 5;
grid[1:5] ;
```

Exact rational arithmetic keeps values such as `1/4` and `3/4` exact.

## Partition the whole interval

`:/: n` eagerly returns `n` touching equal-width intervals. No gaps or overlaps
are introduced.

```rix edu
0:12 :/: 4 ;
```

Use partitions for bins and regions; use `::` when you need representative
points.

## Explore mediants

The mediant of `a/b` and `c/d` is `(a+c)/(b+d)`. `:~ levels` returns a nested
array: the original endpoints, followed by the points inserted at each level.

```rix edu
1:2 :~ 2 ;
```

`:~/ levels` uses the same exact boundaries to return a flat sequence of
touching intervals. Level `n` creates `2^n` subintervals.

```rix edu
1:2 :~/ 2 ;
```

## Continue forever from one point

`::+` creates an unbounded lazy arithmetic sequence. Unlike `:+`, it has no
upper interval bound.

```rix edu
walk := 5::+2;
walk[8] ;
```

Negative steps work the same way.

```rix edu
countdown := 10::+ -3;
countdown[1:6] ;
```

## Sample a fixed rational grid

For `:% (count, denominator)`, RiX chooses integer numerators uniformly from
the requested denominator grid inside the interval. Returned rationals are
reduced, so `500/1000` displays as `1/2`.

```rix edu
.RandomSeed(7);
0:1 :% (5, 1000) ;
```

Seeding is local to the current RiX session. Run the cell again with the same
seed to reproduce the same sample; change the seed to obtain another stream.

## Sample with a tolerance

Without a denominator, RiX first samples a real-like point uniformly and then
returns the simplest rational within a small default tolerance.

```rix edu
.RandomSeed(21);
0:1 :% 4 ;
```

Supply `_` in the denominator position to override the tolerance explicitly.

```rix edu
.RandomSeed(21);
0:1 :% (4, _, 1/100) ;
```

A count of one returns one rational value; larger counts return a finite
sequence.

## Create random partitions

`:/%` chooses distinct interior points, sorts them, and returns touching
subintervals containing the original endpoints. With a denominator, selection
is without replacement on that rational grid.

```rix edu
.RandomSeed(12);
0:1 :/% (4, 1000) ;
```

The number is the number of resulting subintervals, so four partitions require
three distinct interior points.

## Keep interval and sequence types distinct

After `:+` or `::`, the result is a point sequence rather than another
interval. Partition operators therefore apply to the original interval, not to
an already generated sequence.

```rix edu
bounds := 0:10;
points := bounds :+ 2;
regions := bounds :/: 5;
[points[4], regions] ;
```

:::challenge Design a reproducible experiment
Create eleven exact points from `-1:1`, partition the same interval into four
equal regions, then seed the random stream and choose three points from a
denominator-100 grid.

    exactGrid := -1:1 :: 11
    regions := -1:1 :/: 4;
    .RandomSeed(42)
    samples := -1:1 :% (3, 100)
    [exactGrid[1:11], regions, samples]
:::

## Keep going

Return to lazy generators to map and filter these point sequences without
materializing more values than your calculation needs.
