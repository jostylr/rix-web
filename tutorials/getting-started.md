---
number: 1
title: Getting started: build your first RiX program
description: Run exact calculations, make decisions, and build FizzBuzz from small pieces.
---

In this lesson you will label the numbers from 1 to 15: multiples of three become `Fizz`, multiples of five become `Buzz`, and multiples of both become `FizzBuzz`. Other numbers stay numbers. You will build and test each piece before running the complete program.

## Run a calculation

Press **Run cell** below. The result appears immediately beneath the editor. RiX keeps integer division exact: the answer is `1/2`, not a rounded decimal. The final expression supplies the result; the semicolon ends the statement.

```rix edu
1 / 3 + 1 / 6;
```

Change `1 / 6` to `1 / 3`, predict the answer, and press **Re-Run Cell**. See [Expressions](expressions.html) and [Number notation](number-notation.html) for more exact calculations.

### Give inputs names

The `:=` sign gives a fresh value a name. Lowercase names such as `first` and `second` hold values. The last line uses both names and displays `1/2`.

```rix edu
first := 1 / 3;
second := 1 / 6;
first + second;
```

Change `second` to `1 / 3` and run this cell again. The plain `=` sign has a different job in RiX; [Cells and assignment](cells.html) explains it when you need shared state.

## Ask a question and choose a result

FizzBuzz needs to ask whether a number is divisible by three. `%` gives the remainder, while `==` asks whether two values are equal. The result below is `[1, _]`: `1` means true and `_` means false or null in this setting.

```rix edu
[6 % 3 == 0, 7 % 3 == 0];
```

Write the whole comparison. Zero itself is truthy in RiX, so a bare `n % 3` is not a divisibility test. See [Operators and precedence](operators.html) for more comparisons.

### Choose between two answers

`condition ?: yes ?_ no` chooses one value. Quotation marks make `"Fizz"` a text value. This cell returns `Fizz`; changing `n` to `7` makes it return `7`.

```rix edu
n := 6;
n % 3 == 0 ?: "Fizz" ?_ n;
```

See [Ternaries and cases](ternaries.html) for more decisions and [Tuples and strings](tuples-and-strings.html) for text. Comparisons involving uncertain values can also return `?`; exact integer inputs here give decided answers.

## Give the rule a name

An uppercase name can define a callable. In `Fizz(n) -> ...`, `n` is the parameter, and the expression after `->` is the body. `Fizz(6)` calls it with the argument `6`.

```rix edu
Fizz(n) -> n % 3 == 0 ?: "Fizz" ?_ n;
Fizz(6);
```

Try `Fizz(7)` in the last line. The [Define and call](function-basics.html) lesson develops functions further.

### Add the overlapping rules

Test the combined case first. Otherwise 15 would match the three rule and return `Fizz` before reaching `Buzz`. This cell checks four useful cases: 2, 3, 5 and 15.

```rix edu
FizzBuzz(n) ->
    n % 15 == 0 ?: "FizzBuzz" ?_
    n % 3 == 0 ?: "Fizz" ?_
    n % 5 == 0 ?: "Buzz" ?_
    n;
[FizzBuzz(2), FizzBuzz(3), FizzBuzz(5), FizzBuzz(15)];
```

The expected result is `[2, Fizz, Buzz, FizzBuzz]`. The array display omits quotation marks around strings; `Fizz`, `Buzz` and `FizzBuzz` are still text values.

## Apply the rule to several numbers

Square brackets make an array. RiX arrays start at index `1`, so the second item of `[2, 3, 5, 15]` is `3`.

```rix edu
numbers := [2, 3, 5, 15];
numbers[2];
```

The map pipe `|>>` applies a callback to every item. `(n) -> FizzBuzz(n)` describes what to do with each input. This cell has all its own setup because this topic begins with a fresh context.

```rix edu
FizzBuzz(n) ->
    n % 15 == 0 ?: "FizzBuzz" ?_
    n % 3 == 0 ?: "Fizz" ?_
    n % 5 == 0 ?: "Buzz" ?_
    n;
numbers := [2, 3, 5, 15];
numbers |>> (n) -> FizzBuzz(n);
```

See [Arrays](arrays.html) for indexing and [Pipes](pipes.html) for mapping and filtering.

### Make the input list

`[1 |+ 1 |; 15]` starts at 1, adds 1 each time and produces 15 values in total. The starting value counts as the first result. The last item is 15. This is a finite, eager array, so you can inspect it at once.

```rix edu
limit := 15;
numbers := [1 |+ 1 |; limit];
numbers[15];
```

See [Generators](generators.html) for other finite patterns. Lazy generators are a later option when you want values on demand.

## Run the complete program

This cell stands on its own. It defines the rule, names the output count, builds the inputs and transforms them. The final expression displays the answer; no printing function is needed in the tutorial.

```rix edu
FizzBuzz(n) ->
    n % 15 == 0 ?: "FizzBuzz" ?_
    n % 3 == 0 ?: "Fizz" ?_
    n % 5 == 0 ?: "Buzz" ?_
    n;

limit := 15;
numbers := [1 |+ 1 |; limit];
numbers |>> (n) -> FizzBuzz(n);
```

Read the result from left to right: `1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz`. Change `limit` to `30` and rerun. There should be 30 items, with `FizzBuzz` at positions 15 and 30.

:::challenge Change the program
Change the program above to produce 30 values. Predict its final three items before running it. As an optional extension, replace the rules with words for multiples of two and seven; the combined word should appear at 14. Keep the combined test first. Include the full rule and input list in your answer so it also runs on its own.
:::

If a cell reports an error, check the spelling and capitalization of names, whether its setup is inside the current topic, and whether you used `:=` to name a value or `==` to compare. Editing an earlier cell changes the source replayed with later cells in the same level-two topic; rerun the later cell to see the new result.

Continue with [Expressions and exact values](expressions.html) for the short beginner route. [Recipe scaling](capstone-exact-recipe.html) is a mathematical follow-up after you have met intervals. [FizzBuzz in four languages](problem-fizzbuzz.html) revisits this program from the comparison section, and the [JavaScript-to-RiX gotchas](gotcha-tutorial.html) page is optional help for experienced programmers.
