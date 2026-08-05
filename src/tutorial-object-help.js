export const objectHelp = {
    array: {
        title: "Array functions",
        intro: "Arrays are ordered, one-based sequences. Non-bang methods return a new value; bang methods update a mutable target.",
        functions: [
            ["Len", "values.Len()", "Return the number of elements.", "[3, 5, 8].Len()"],
            ["Get", "values.Get(index)", "Read an item by one-based index.", "[3, 5, 8].Get(2)"],
            ["Push", "values.Push(value)", "Return a new array with values appended.", "[1, 2].Push(3)"],
            ["Set", "values.Set(index, value)", "Return an array with one position replaced.", "[1, 2].Set(2, 9)"],
            ["RemoveAt", "values.RemoveAt(index)", "Return an array without one position.", "[1, 2, 3].RemoveAt(2)"],
            ["Join", "values.Join(separator)", "Join string-like values into a string.", "[\"a\", \"b\"].Join(\"-\")"],
            ["Iterator", "values.Iterator()", "Create a cursor that can move and peek without changing the array.", "[10, 20, 30].Iterator().Next(2)"],
        ],
    },
    map: {
        title: "Map functions",
        intro: "Maps hold named values. Use non-bang methods for a returned copy and bang methods when deliberately mutating a mutable map.",
        functions: [
            ["Len", "record.Len()", "Return the number of entries.", "{= a=3, b=5 }.Len()"],
            ["Has", "record.Has(key)", "Check whether a key is present.", "{= a=3 }.Has(\"a\")"],
            ["Get", "record.Get(key)", "Read an entry by key.", "{= a=3 }.Get(\"a\")"],
            ["Keys", "record.Keys()", "Return an array of keys.", "{= a=3, b=5 }.Keys()"],
            ["Values", "record.Values()", "Return an array of values.", "{= a=3, b=5 }.Values()"],
            ["Set", "record.Set(key, value)", "Return a copy with an entry added or replaced.", "{= a=3 }.Set(\"b\", 5)"],
            ["Iterator", "record.Iterator()", "Create a cursor over map values in entry order.", "{= a=3, b=5 }.Iterator().Next()"],
        ],
    },
    set: {
        title: "Set functions",
        intro: "Sets keep one copy of each value. Their collection methods make it easy to test membership and compose exact sets.",
        functions: [
            ["Len", "items.Len()", "Return the count of unique members.", "{| 1, 2, 2 |}.Len()"],
            ["Has", "items.Has(value)", "Test whether a member is present.", "{| 1, 2 |}.Has(2)"],
            ["Values", "items.Values()", "Return the set members as a sequence.", "{| 1, 2 |}.Values()"],
            ["Add", "items.Add(value)", "Return a set containing a new value.", "{| 1, 2 |}.Add(3)"],
            ["Remove", "items.Remove(value)", "Return a set without a member.", "{| 1, 2 |}.Remove(1)"],
            ["Union", "items.Union(other)", "Combine the members of two sets.", "{| 1, 2 |}.Union({| 2, 3 |})"],
            ["Iterator", "items.Iterator()", "Create a cursor over set members in iteration order.", "{| 1, 2 |}.Iterator().Next()"],
        ],
    },
};
