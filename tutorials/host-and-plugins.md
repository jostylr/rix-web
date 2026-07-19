---
number: 13d
title: Host objects and plugins
description: Understand camelCase host roots, registration, and capability boundaries.
---

## Core is language; host is environment

Core capabilities are RiX-defined and have PascalCase dot roots, such as
`.Add`, `.Map`, and `.Core`. A host or plugin capability has a camelCase root,
such as `.float`, `.plot`, or `.draw`. The spelling tells a reader that it was
provided by an embedding environment rather than required by every RiX
implementation.

```text
.Add(2, 3)             # core operation
.Core.Register(...)    # core management operation
.float(1 / 3)          # optional host/plugin conversion
.plot.Render(scene)    # optional host/plugin operation
```

The second and later path segments use the normal convention: PascalCase is a
callable member and camelCase is a value/member. Thus `.float.Interval(x)` is
a callable operation, while `.float.precision` can be configuration data.

## Registration is a capability, not a side effect of import

RiX imports are ordinary user-code composition. Plugins augment a host
environment and are elevated because they register capabilities with it. The
host can grant registration to trusted code, withhold it from a sandbox, or
offer a narrow capability group instead of the entire host.

```text
.Core.Register(...)    # bootstrap-only core registration surface
.Host.Register(...)    # host registration surface, when granted
```

The `.Core` and `.Host` objects are management namespaces: they can support
registration, discovery, and listing. They are not prefixes for the ordinary
capabilities themselves—`.CoreStuff` remains a core root and `.hostStuff`
remains a host root.

## Discover before you load

Hosts can scan `plugins/` folders for `.plugin.rix` and `.plugin.rix.js`
files. Each file begins with a YAML doc-comment header, which is read without
executing the plugin. The header describes the plugin id, short description,
default camelCase mount, exports, and capability groups.

```text
.Plugin.List()
.Plugin.Info("approx-math-js")
.Plugin.Load("approx-math-js")
.Plugin("approx-math-js")       # short form for Load
```

A discovered mount can be visible to the static checker while still refusing
calls until loading is approved. JavaScript plugin files additionally require
an installer that the host explicitly trusts; discovering a file never imports
or runs arbitrary JavaScript. A load may choose another camelCase root for a
separate session or REPL experiment:

```text
.Plugin.Load("approx-math-js", {= as = "jsFloat" })
.jsFloat.Sin(x)
```

Because a complete RiX script is checked before its first expression runs,
choose renamed mounts in a host startup configuration or a plugin-selection
prelude when later source needs static checking against that name.

## Callable host objects

A host object may itself be callable and also expose members. The optional
approximate-math plugin is the intended model:

```text
.float(x)              # alias for .float.Float(x)
.float.Interval(x)     # exact rational interval containing that float
.float.Round(x, 2)     # exact rational rounded at a requested decimal place
.float.Sin(x)          # an optional approximate operation
```

Those calls are examples of a plugin contract, not promises that every RiX
host exposes floating-point computation. RatCalc keeps its default session
exact and does not load this optional plugin automatically.

## Display names and matching

The registry preserves the declared spelling for display: `PascalCase` core
names and `camelCase` host roots appear as registered. Lookup normalizes the
rest of a name, so call-site casing is forgiving after the first-letter role
has selected the core or host namespace. That first letter still matters: it
protects the visible core/host separation.

```rix edu
.Len([1, 2, 3]) ;
```

:::challenge Describe a plugin surface
In a comment, sketch a `camelCase` plugin root and two members: one PascalCase
callable and one camelCase value. Then use `.Len` to run a small core example.
:::

## Next

Finish by translating a small calculation into the explicit core surface. It
uses only portable, exact core capabilities, so it works in a fresh RatCalc
session.
