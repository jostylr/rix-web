# RiX Lab

RatCalc is a static browser calculator and learning site for the Rational
Interval Expression Language. It uses the actual RiX parser and evaluator, so
values and a workspace persist across executed commands and tutorial cells.

## Develop and build

From this directory:

```sh
bun run build
bun run serve
```

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
