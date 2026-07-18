---
number: 13
title: Core, host, and lowering
description: See how RiX syntax reaches named operations and capability owners.
---

## One language, several useful surfaces

RiX lets ordinary expression syntax stay pleasant to read while keeping a
named core surface available to programs, tools, and language experiments.
For example, `2 + 3` and `.Add(2, 3)` reach the same core arithmetic operation.
The first is the notation most people write; the second is a useful explicit
form when code is being generated, inspected, or taught.

```rix
{; ordinary = 2 + 3; explicit = .Add(2, 3); ordinary == explicit }
```

This is not a second evaluator. Source is parsed, lowered to an internal
representation (IR), and dispatched through the core registry. The public
PascalCase forms are another route into that same registry operation.

## Who owns a dot name?

The first segment after `.` communicates ownership. A core name begins with a
capital letter: `.Add`, `.Map`, `.Lambda`, and `.Core`. A host or plugin root
begins with a lower-case letter: `.float`, `.plot`, or another capability that
the host chose to expose. This makes the core/host boundary visible in source.

After the root, the ordinary naming convention resumes: PascalCase segments
are callable operations and camelCase segments are values or objects. Thus a
float plugin can offer `.float.Sin(x)` while retaining data such as
`.float.precision`.

```text
.Add(2, 3)           # core callable
.Core.Register(...)  # core management namespace
.float(1 / 3)        # callable host/plugin object, if granted
.float.Interval(x)   # callable member of that host object
.float.precision     # host value
```

RatCalc deliberately does not grant plugin registration or optional math
plugins to every browser session. The examples in this chapter therefore use
the portable core surface; the host page explains the boundary without
silently acquiring more authority.

## The route through the implementation

Think of a RiX expression as taking this route:

```text
source spelling  →  parser/AST  →  lowered IR operation  →  core registry  →  value
2 + 3            →  ...         →  ADD                   →  arithmetic     →  5
.Add(2, 3)       →  ...         →  ADD                   →  arithmetic     →  5
```

Some operations are **lazy**: the evaluator receives their targets or bodies
as IR, rather than evaluating every argument first. Assignment needs the name
of its target; a lambda needs its body to wait until the function is called.
Those forms are the focus of the next two pages.

:::challenge Two spellings, one result
Make a block that compares `| -12 |` with its explicit `.Abs` form.
:::

## Keep going

Start with the practical core names, then examine the structural forms that
need lazy arguments. The final capstone writes a small useful program entirely
through explicit core calls.
