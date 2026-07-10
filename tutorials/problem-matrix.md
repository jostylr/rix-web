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

~~~rix
a := {:2x2: 1, 2; 3, 4 }
b := {:2x2: 5, 6; 7, 8 }

Mat2Mul(left, right) -> {:2x2:
    left[1,1] * right[1,1] + left[1,2] * right[2,1],
    left[1,1] * right[1,2] + left[1,2] * right[2,2];
    left[2,1] * right[1,1] + left[2,2] * right[2,1],
    left[2,1] * right[1,2] + left[2,2] * right[2,2]
}

Mat2Mul(a, b)
~~~

## Reading the RiX solution

These are tensor literals, not arrays of arrays. The 2x2 header records the shape and semicolons separate rows. RiX indexes from one, matching mathematical subscripts: left[1,2] means row one, column two.

Every output entry is a two-term dot product. The fixed-size implementation is repetitive by design; it exposes the invariant a general implementation must capture. For output (i, j), multiply left[i, k] by right[k, j] and add over valid k.

Exact arithmetic is preserved element by element. Replace one entry with 1 / 3 and the affected outputs remain rational. A general library would validate dimensions and express the repeated reduction once.

:::challenge Matrix-vector product
Define Mat2Vec(matrix, vector) for a two-by-two tensor and a two-item array.
:::

