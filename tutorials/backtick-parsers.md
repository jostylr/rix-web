---
number: 9e
title: Backtick parsers and functions
description: Select notation parsers and turn free symbols into callables.
---

## Select a parser with a leading dot

Unnamed backticks use `.SArith`. A header of the form
`.Name.modifier.modifier:` selects another object from the system or plugin
registry and calls its `.Parse` method.

```rix edu
{: `x^2 + 1`, `.SArith:x^2 + 1`, `:raw backtick text` } ;
```

PascalCase roots belong to RiX core. CamelCase roots belong to host or plugin
capabilities. Parser-specific modifiers follow the root in their written
order.

Multiple backticks allow a secondary language to contain shorter backtick
runs without escaping:

```rix edu
text := ``:A `single` backtick can live here``;
text ;
```

## Make a structural function

`.Fun` collects free structural symbols as parameters. Parameter order is
alphabetical, not first appearance.

```rix edu
F := `.SArith.Fun:z + a * 10`;
F(2, 3) ;
```

Give `Fun` an argument list when order or unused parameters are intentional:

```rix edu
Ordered := `.SArith.Fun(y,x,unused):y - x`;
Ordered(5, 2, 99) ;
```

All free symbols must be listed, but additional unused names are allowed.

`F` receives parameters `(a, z)`, so this returns `23`. A structural backtick
assigned directly to an uppercase identifier infers the same conversion:

```rix edu
G := `z + a * 10`;
G(2, 3) ;
```

Captured names do not become parameters:

```rix edu
coefficient := 4;
Scaled := `x * @(coefficient + 1)`;
Scaled(3) ;
```

If a function form has no free symbols, RiX creates a zero-argument constant
function:

```rix edu
Constant := `6/4 + 2/4`;
Constant() ;
```

## Compile polynomial notation

`.Poly` implements the same `.Parse` protocol. It reads structural arithmetic,
alphabetizes the free inputs, converts the supported expression to exact
symbolic IR, and returns an executable polynomial.

```rix edu
P := `.Poly:x^2 + 3/4 x^5 - 7`;
P(2) ;
```

Unsupported polynomial forms fail explicitly rather than switching to an
approximate calculation.

Host applications and plugins can register camelCase parser objects exposing
`.Parse(body, modifiers, parseInfo)`. The parse-info map tells the parser when
an uppercase assignment requested a function and supplies the inferred name.

RiX code can construct that protocol object without host JavaScript:

```rix edu
parser := .NotationParser((body, modifiers, info) -> body);
parser.Parse("kept as text", [], {= }) ;
```

A trusted package can register the returned object as a system or plugin
capability. `.SArith.Configure(...)` similarly creates structural parsers with
custom infix, prefix, or postfix glyphs, precedence, associativity, heads, and
optional operational callables.

:::challenge Build from free symbols
Create a structural function whose source mentions `z`, `a`, and a captured
RiX expression. Predict the alphabetical argument order, then call it.

    shift := 5;
    H := `.SArith.Fun:z + a * 10 + @(shift)`;
    H(2, 3);
:::

## Keep the layers distinct

Use structural arithmetic when the written form matters. Use ordinary RiX
operators for normal program calculation, and use symbolic specs when you need
the broader exact transformation and calculus system.
