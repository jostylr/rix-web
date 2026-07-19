# Bundled browser plugins

Place browser-approved plugin entry files directly in this folder or a nested
folder below it:

- `name.plugin.rix` is embedded as RiX source and can be loaded on demand.
- `name.plugin.rix.js` is bundled as JavaScript and must export `install`.

Every entry begins with a `/** YAML **/` catalog header. `bun run build:app`
scans this folder without executing the entries and writes
`src/generated/bundled-plugin-catalog.js`. The generated module statically
imports JavaScript installers, so a browser never reads arbitrary local files
or dynamically imports discovered JavaScript.

Do not put user/project plugins here. Browser users can only load the plugins
that were deliberately included in the deployed build.

## Small JavaScript plugin

This complete `example.plugin.rix.js` entry exposes both `.example(x)` and
`.example.Double(x)`. It accepts RiX exact integers, returns an exact RiX
integer, and returns a RiX map assembled from ordinary JavaScript values:

```js
/**
id: example-js
description: Small example of a browser-approved JavaScript RiX plugin.
kind: host
mount: example
exports: [Double, Summary]
groups: [Examples]
permissions: []
defaultEnabled: false
**/

import { Integer, Rational } from "@ratmath/core";

function requireInteger(value) {
  if (!(value instanceof Integer)) throw new Error("example.Double expects a RiX integer");
  // RiX Integer wraps JavaScript BigInt in .value.
  return value.value;
}

function double(value) {
  return new Integer(requireInteger(value) * 2n);
}

function summary(value) {
  const kind = value instanceof Integer ? "Integer"
    : value instanceof Rational ? "Rational"
      : value?.type === "string" ? "String"
        : value?.type === "sequence" ? "Sequence"
          : value?.type === "map" ? "Map" : "Other";
  return {
    type: "map",
    entries: new Map([
      ["kind", { type: "string", value: kind }],
      ["isExactInteger", value instanceof Integer ? new Integer(1n) : null],
    ]),
  };
}

export function install({ systemContext }) {
  const methods = new Map();
  const extensions = new Map();
  for (const [name, fn] of [["Double", double], ["Summary", summary]]) {
    const method = {
      type: "method_builtin",
      name,
      // args[0] is the `.example` namespace; method arguments begin at args[1].
      impl(args) { return fn(args[1]); },
    };
    methods.set(name, method);
    extensions.set(name.toUpperCase(), method);
  }
  const namespace = { type: "map", entries: methods, _ext: extensions };

  systemContext.registerHostCallableValue("example", namespace, {
    // The callable root has no namespace receiver, so its first argument is args[0].
    impl(args) { return double(args[0]); },
  }, {
    doc: "Example JavaScript plugin namespace",
    groups: ["Examples"],
  });
}
```

After rebuilding and loading it, these are ordinary RiX calls:

```rix
.Plugin.Load("example-js")
.example(21)             # 42
.example.Double(21)      # 42
.example.Summary(3/7)    # {= kind=Rational, isExactInteger=_ }
```

RiX exact numbers cross the boundary as `Integer` and `Rational` instances;
their fields are `BigInt` numerator/denominator values. Strings use
`{ type: "string", value }`, sequences use `{ type: "sequence", values }`,
and maps use `{ type: "map", entries: Map }`. Return those same RiX runtime
representations (or `null` for RiX `_`) rather than JSON strings, so RiX can
continue to operate on the result structurally.
