export const tutorials = [
    { number: "1", file: "getting-started.html", title: "Start with exact numbers", description: "Variables, fractions, and a persistent RiX session." },
    { number: "2", file: "collections.html", title: "Collections", description: "A high-level tour of arrays, maps, and sets." },
    { number: "2a", parent: "2", file: "arrays.html", title: "Arrays", description: "Ordered values, one-based indexes, and immutable updates.", object: "array" },
    { number: "2b", parent: "2", file: "maps.html", title: "Maps", description: "Named entries and record-like data.", object: "map" },
    { number: "2c", parent: "2", file: "sets.html", title: "Sets", description: "Unique values and set algebra.", object: "set" },
];

export const rootTutorials = tutorials.filter((tutorial) => !tutorial.parent);
export const tutorialByNumber = (number) => tutorials.find((tutorial) => tutorial.number === String(number));
export const childrenOf = (number) => tutorials.filter((tutorial) => tutorial.parent === String(number));

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
        ],
    },
};
