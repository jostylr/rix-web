---
number: 3b
title: Strings and tuples
description: Work with text and small groups of positional values.
---

## Read a text value

Quotation marks make text. Like arrays, RiX strings use one-based indexes. A negative index counts back from the end.

```rix edu
word := "Fizz";
[word[1], word[-1]];
```

The result contains `F` and `z`. These are text values even though the display omits quotation marks. Try a different word and predict its first and last characters.

## Group positions

Use a tuple when the first and second positions have specific meanings. The `{: ... }` form makes those positions visible; the second value below is 5.

```rix edu
pair := {: 3, 5 };
pair[2];
```

An array is better for a sequence of interchangeable items. A [map](maps.html) is better when names such as `x` and `y` should label the values.

:::challenge Read two positions
Make a tuple with the exact measurements 1/2, 3/4 and 5/4. Return its last value using index 3. Then make a short text value and return its first character.
:::

## Keep going

Continue with [Maps](maps.html) for named entries or [Arrays](arrays.html) for longer ordered collections.
