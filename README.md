# RiX Lab

RiX Lab is a static browser REPL and learning site for the Rational Interval
Expression Language. It uses the actual RiX parser and evaluator, so values
and a workspace persist across executed cells.

## Develop and build

From this directory:

```sh
bun run build
bun run serve
```

`bun run build` bundles the browser application and turns the markdown files in
`tutorials/` into runnable lesson pages. The complete static site is written to
`docs/`, ready for a docs-folder static host.

The workspace accepts `.rix` files directly. Selecting a `.js` module opens an
intentional preview: browser module execution is held behind an explicit trust
boundary until RiX module permissions are designed.
