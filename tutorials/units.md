---
number: 8c
title: Physical units and quantities
description: Compose units as values, convert exactly, and catch dimensional mistakes.
---

## Units are ordinary values

RiX loads its standard units into the `.Units` map. A unit can be retrieved,
assigned, passed around, multiplied, or divided like another value:

```rix edu
m := .Units[:m];
s := .Units[:s];
distance := 120 * m;
elapsed := 10 * s;
distance / elapsed ;
```

The result is `12~[m/s]`. Internally RiX keeps an exact magnitude, a physical
dimension vector, and a display unit.

## Concise scientific notation

The bracket form is lookup-and-multiply sugar over the same `.Units` values:

```rix edu
explicit := 9 * .Units[:m] / .Units[:s]^2;
concise := 9~[m/s^2];
explicit == concise ;
```

Unknown names inside `~[...]` are errors rather than silently becoming labels.

## Compatible addition

Compatible quantities are normalized before arithmetic. Addition preserves the
left operand's display unit:

```rix edu
inSeconds := 30~[s] + 2~[min];
inMinutes := 2~[min] + 30~[s];
{: inSeconds, inMinutes } ;
```

The values describe the same duration but display as `150~[s]` and
`2..1/2~[min]`. Trying `1~[m] + 1~[s]` raises a dimensional error.

## Explicit conversion

The quantity already knows its source unit, so conversion only needs a target:

```rix edu
speed := 36~[km/h];
.ConvertUnit(speed, .Units[:m] / .Units[:s]) ;
```

Target strings are also accepted: `.ConvertUnit(speed, "m/s")`.

## Affine temperature coordinates

Units double as one-argument constructors. This matters for Celsius and
Fahrenheit because their zero points differ:

```rix edu
roomC := .Units[:degC](20);
.ConvertUnit(roomC, .Units[:degF]) ;
```

Subtracting two temperature points produces a linear difference:

```rix edu
.Units[:degC](20) - .Units[:degC](12) ;
```

Adding two temperature points or compounding an affine coordinate is rejected.

## Extend the active collection

`.DefineUnit` returns a unit value. Put it in an ordinary map overlay named
`Units`; the sugar checks that lexical map before the system default:

```rix edu
fortnight := .DefineUnit(:fortnight, 14 * .Units[:day]);
Units := .Units.Merge({= fortnight=fortnight });
.ConvertUnit(1~[fortnight], .Units[:day]) ;
```

:::challenge Unit conversion practice
Compute a 10-kilometre race pace in minutes per kilometre when the elapsed time is 50 minutes.
:::

## Next

The next lesson uses the parallel `.Exact` collection for π, `i`, and algebraic
generators. Physical units and exact symbolic magnitudes can be composed.
