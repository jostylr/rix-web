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

`bun run build` bundles the browser application and turns the markdown files in
`tutorials/` into runnable lesson pages. The complete static site is written to
`docs/`, ready for a docs-folder static host.

The calculator accepts `.rix` files directly. Selecting a `.js` module shows an
intentional notice: browser module execution is held behind an explicit trust
boundary until RiX module permissions are designed.
