# RiX Lab

RatCalc is a static browser calculator and learning site for the Rational
Interval Expression Language. It uses the actual RiX parser and evaluator, so
values and a workspace persist across executed commands and tutorial cells.

Each RiX-Web session applies the curated
[standard calculator profile](STANDARD_PROFILE.md). Its checked-in RiX prelude
loads common exact numerics, certified elementary and special functions,
algebra, statistics, graphics,
geometry, linear algebra, solving, tables, and radix tools, and selectively
imports their calculator-facing names. The rest of the browser-approved catalog
remains available through `.Plugin.Load(...)`. Embedded or diagnostic callers
can create a restricted runtime with `createRixRepl({ autoLoadPlugins: false })`.

The calculator includes responsive command/keypad controls, exact number-view
presets (decimal, fraction, mixed, continued fraction, scientific, binary, and
hexadecimal), and an exact number explorer. Rational and interval results use
portable number-line Graphics, exact-step editing, bounded nested arithmetic
provenance, and linked Farey parents, mediants, Stern–Brocot paths, continued
fractions, and exact convergent errors. Values can be reinserted or exported as
SVG, HTML, or text. The visual uses approximate pixels while retained text
preserves exact values and interval orientation. Unsupported operations and
exhausted work budgets remain visible; opening a view does not replay calls
or assignments. See [the interaction guide](tutorials/graphics-interaction-guide.md)
and the [shared helper contracts](../rix/documentation/eval/exact-exploration.md).

The Reactive Dashboard discovers session `$$` identities, renders derived
values and dependency information live, and mounts explicit controls for
editable inputs. Pin/group settings are presentation state saved with the
session. History charts retain up to 64 distinct observations for the first 128
identities, with exact tables, source reinsertion, and SVG export. Older
observations are discarded visibly; histories are not saved or collected as an
unlimited graph event log. RiX-Web provides concise `.Slider`, `.Input`, `.Choice`,
`.Toggle`, `.Range`, `.Reset`, `.Action`, and `.Hold` shortcuts; the portable
language forms remain available under `.Controls`.

The workspace menu's **New geometry board** command opens a live construction
workbench with point, line, circle, intersection, measurement, translation,
constrained-move, undo, and redo tools. Every invocation uses independent RiX
bindings, so multiple boards can remain live in the same session. Construction
records and canonical reconstruction source can both be exported from the
workbench; source export fails closed if a custom derived node has no portable
recipe.

The value controls can declare an input and its dashboard UI together. For
example, `$$width := .Slider(3, 0:10, 1/2, "Width")` creates `width` with the
exact initial value `3`, returns that value, and registers its labelled slider.
The same declarative form works for `.Input`, `.Choice`, `.Toggle`, and
`.Range`. Passing an existing identity, as in `.Slider($$width, ...)`, remains
available when control attachment needs to be separate from declaration.

The Help dialog includes a searchable, one-click showcase gallery. Its examples
range from tiny exact-number calculations and static structured output to live
financial and graphical models, reactive polynomial coefficients, and a cubic
recentered by repeated synthetic division. Every gallery program is executed in
a fresh RiX-Web session by the test suite.

## Develop and build

From this directory:

```sh
bun run build
bun run serve
```

Use `bun run test:short` for browser contracts affected by ordinary RiX-Web
work, `bun run test:ten` for the medium/full browser set, and
`bun run test:suite` (or `bun run test`) before integration. The repository
uses the umbrella's current `../rix` checkout when generating the approved
plugin catalog, tutorial index, and published schemas; run `bun run build:app`
after changing those RiX inputs.

`bun run build` (or `bun run build:dynamic`) uses manifest-loaded navigation
for low-churn development. `bun run build:static` restores fully pre-rendered
tutorial indexes, sidebars, and previous/next links for release builds.

`bun run build` bundles the browser application and turns the markdown files in
`tutorials/` into runnable lesson pages. The complete static site is written to
`docs/`, ready for a docs-folder static host.

The tutorial build also discovers `../rix/plugins/*/tutorial.md`. Plugin lessons
are appended after the core language walkthrough and grouped by their
frontmatter `theme`. Lessons marked `status: implemented` are checked and
runnable against the browser's approved plugin catalog; `status: proposed`
publishes acceptance documentation without misleading Run buttons.

Tutorial ordering and grouping live in `src/tutorial-index.js`. The build writes
that catalog once to `docs/tutorial/navigation.json`; the tutorial landing page,
sidebars, and previous/next links load it in the browser in dynamic mode. Adding
or removing a lesson therefore changes the manifest and that lesson's output
instead of embedding a changed table of contents in every generated tutorial
page. Static mode uses the same catalog, so switching modes does not introduce a
second navigation source of truth.

The calculator accepts `.rix` files directly. Selecting a `.js` module shows an
intentional notice: browser module execution is held behind an explicit trust
boundary until RiX module permissions are designed.

## Stern–Brocot showcases

The site publishes two explorers from the same exact RiX model:

- `docs/stern-brocot.html` keeps the established HTML/SVG interaction layer and
  uses RiX for node, tree, and formula computation.
- `docs/stern-brocot-rix/` is generated from the RiX program in
  `../rix/examples/stern-brocot/stern-brocot-page.rix`.

Both are produced by `bun run build:app` and linked from the main page.

## Portable media bundles

Embedding hosts can create a REPL with an explicit `assetStore` and call
`exportOutputBundle(value)` or `importOutputBundle(json)`. The shared output
codec keeps exact values, captions, transcripts, and content-addressed files.
Import is inert and performs no file/network access; external video/image
references remain links. These APIs return portable HTML/text and a file map;
the current calculator UI does not add a separate bundle-export button.
See `../rix/documentation/eval/output-assets.md` for grants, limits, and formats.

## Exact numeral playground

`numeral-playground.html` (linked from Showcases) compares ordinary, multi-token,
balanced and negative-base positional systems through public RiX Radix services.
It shows exact place/carry tables, bounded repeating expansions and canonical
backtick round trips. Save static HTML, text or inert exact-source snapshots;
the generated initial example remains readable with JavaScript disabled.
