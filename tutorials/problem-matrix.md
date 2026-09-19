---
number: 11e
title: Matrix product
description: Moderate example: structured numeric data.
---

## The problem

Multiply two two-by-two matrices. Each output position is the dot product of one row from the left matrix and one column from the right matrix.

## JavaScript

~~~javascript
function mat2Mul(a, b) {
  return [
    [a[0][0]*b[0][0] + a[0][1]*b[1][0],
     a[0][0]*b[0][1] + a[0][1]*b[1][1]],
    [a[1][0]*b[0][0] + a[1][1]*b[1][0],
     a[1][0]*b[0][1] + a[1][1]*b[1][1]]
  ];
}
console.log(mat2Mul([[1,2],[3,4]], [[5,6],[7,8]]));
~~~

## Python

~~~python
def mat2_mul(a, b):
    return [
        [a[0][0]*b[0][0] + a[0][1]*b[1][0],
         a[0][0]*b[0][1] + a[0][1]*b[1][1]],
        [a[1][0]*b[0][0] + a[1][1]*b[1][0],
         a[1][0]*b[0][1] + a[1][1]*b[1][1]]
    ]
print(mat2_mul([[1,2],[3,4]], [[5,6],[7,8]]))
~~~

## Julia

~~~julia
a = [1 2; 3 4]
b = [5 6; 7 8]
println(a * b)
~~~

## RiX

```rix edu
a := {:2x2: /Matrix/ 1, 2; 3, 4 };
b := {:2x2: /Matrix/ 5, 6; 7, 8 };
a * b ;
```

## Reading the RiX solution

The `/Matrix/` interpretation selects matrix algebra for the rectangular
components. Without this header, the literal is `Shaped` storage and `*`
multiplies matching entries. RiX indexes from one: `a[1,2]` means row one,
column two.

The product is `{:2x2: /Matrix/ 19, 22; 43, 50 }`. Each output entry is the
sum of products `a[i,k] * b[k,j]`. Matrix multiplication checks the contracted
dimensions; `a.Hadamard(b)` explicitly requests entrywise multiplication.

Exact arithmetic is preserved. Replace one entry with `1/3` and give both
matrices the same declared scalar domain before multiplying, for example
`a.WithScalarDomain(:Rational)` and `b.WithScalarDomain(:Rational)`.

:::challenge Matrix-vector product
Use an explicit 2x1 Matrix for the column `[5; 6]` and multiply it by `a`.
:::
