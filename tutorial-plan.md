# RiX tutorial coverage and maintenance map

Reconciled 2026-09-23 for the introductory path update. This is a map of shipped
sources, not a list of unimplemented lessons. `src/tutorial-index.js` owns numbering/navigation;
`src/generated/plugin-tutorial-index.js` is generated from plugin tutorials.
Do not maintain competing handwritten method catalogs: the method chips and
capability help use runtime metadata.

## Learner path

The beginner route is 1 → 2 → 3 → 4 → 5 → 6 → 7; deeper child pages are optional
where stated. Each source below builds to the same basename under `docs/tutorial/`
with an `.html` extension. Running a cell creates a fresh session and replays earlier cells within its
current level-two heading section. Bindings do not carry across sections, and
removed code cannot leave stale bindings behind. Keep section setup explicit.
Editable cells are complete RiX scripts. Challenges are exercises, not claims
that arbitrary edited input is safe or guaranteed to terminate.

| Section | Shipped overview and focused coverage |
| --- | --- |
| 1 | [1: Getting started: build your first RiX program](tutorials/getting-started.md) |
| 2 | [2: Expressions and exact values](tutorials/expressions.md); [2a: Operators and precedence](tutorials/operators.md); [2b: Number notation](tutorials/number-notation.md); [2c: Intervals](tutorials/intervals.md); [2d: Interval generation and sampling](tutorials/interval-generation.md); [2e: Nulls and holes](tutorials/holes.md); [2f: Capstone: bounds check](tutorials/capstone-bounds.md); [2g: Capstone: exact recipe scaling](tutorials/capstone-exact-recipe.md) |
| 3 | [3: Collections and text](tutorials/collections.md); [3a: Arrays](tutorials/arrays.md); [3b: Strings and tuples](tutorials/tuples-and-strings.md); [3c: Maps](tutorials/maps.md); [3d: Sets](tutorials/sets.md); [3e: Capstone: exact inventory](tutorials/capstone-inventory.md); [3f: Shaped values](tutorials/tensors.md) |
| 4 | [4: Decisions and blocks](tutorials/control.md); [4a: Ternaries and cases](tutorials/ternaries.md); [4b: Brace containers](tutorials/brace-containers.md); [4c: Deferred execution](tutorials/deferred.md) |
| 5 | [5: Functions and scope](tutorials/functions.md); [5a: Define and call](tutorials/function-basics.md); [5b: Scope and imports](tutorials/scope.md); [5c: Multifunctions](tutorials/multifunctions.md); [5d: Scoped reproducible randomness](tutorials/scoped-randomness.md); [5e: Partial application](tutorials/partials.md); [5f: Capstone: rule dispatcher](tutorials/capstone-dispatch.md) |
| 6 | [6: Transforming data](tutorials/transformations.md); [6a: Pipes](tutorials/pipes.md); [6b: Generators](tutorials/generators.md); [6c: Lazy generators](tutorials/lazy-generators.md); [6d: Regexes and strings](tutorials/regex-and-strings.md); [6e: Capstone: transform a report](tutorials/capstone-report.md); [6f: Async and concurrency](tutorials/async-concurrency.md); [6g: Async streams](tutorials/async-streams.md) |
| 7 | [7: Cells, shared state and patterns](tutorials/binding.md); [7a: Cells and assignment](tutorials/cells.md); [7b: Destructuring](tutorials/destructuring.md); [7c: Properties and metadata](tutorials/properties.md); [7d: Capstone: shared ledger](tutorials/capstone-ledger.md); [7e: Capstone: bounded simulation](tutorials/capstone-simulation.md) |
| 8 | [8: Semantics, types, and units](tutorials/semantics.md); [8a: Conversions](tutorials/conversions.md); [8b: Headers and traits](tutorials/headers-and-traits.md); [8c: Physical units and quantities](tutorials/units.md); [8d: Exact constants and algebraic generators](tutorials/exact-generators.md); [8d1: Core mathematical expressions](tutorials/core-mathematics.md); [8e: Exact complex numbers](tutorials/complex-numbers.md); [8f: Exact Cayley polar form](tutorials/cayley-polar.md); [8g: Capstone: exact measurement](tutorials/capstone-measurement.md) |
| 9 | [9: System and symbolic work](tutorials/system.md); [9a: System capabilities](tutorials/system-context.md); [9b: Assertions and symbolic specs](tutorials/assertions-and-symbols.md); [9c: Exact symbolic calculus](tutorials/symbolic-calculus.md); [9d: Structural arithmetic](tutorials/structural-arithmetic.md); [9e: Backtick parsers and functions](tutorials/backtick-parsers.md); [9f: Diagnostics and tests](tutorials/diagnostics.md); [9g: Capstone: verified rule](tutorials/capstone-verified-rule.md) |
| 10 | [10: Scripts and extensions](tutorials/scripts.md); [10a: RiX scripts](tutorials/rix-scripts.md); [10b: JavaScript modules](tutorials/javascript-modules.md); [10c: Language extensions](tutorials/extensions.md); [10d: Extend existing types](tutorials/method-extensions.md); [10e: JavaScript-to-RiX gotchas](tutorials/gotcha-tutorial.md); [10f: Live lint laboratory](tutorials/linting.md); [10g: Capstone: package design](tutorials/capstone-package-design.md) |
| 11 | [11: Problems in four languages](tutorials/problems.md); [11a: FizzBuzz](tutorials/problem-fizzbuzz.md); [11b: Collatz test](tutorials/problem-collatz.md); [11c: Newton square root](tutorials/problem-newton.md); [11d: Prime filtering](tutorials/problem-primes.md); [11e: Matrix product](tutorials/problem-matrix.md); [11f: Symbolic differentiation](tutorials/problem-symbolic.md) |
| 12 | [12: Structured output](tutorials/structured-output.md); [12a: Tables and mathematical grids](tutorials/tables-and-grids.md); [12b: Documents and slides](tutorials/documents-and-slides.md); [12c: Plots and graphics](tutorials/plots-and-graphics.md); [12d: Drawing with .Graphics](tutorials/drawing-with-draw.md); [12e: Sheets and shaped views](tutorials/sheets-and-tensor-views.md); [12f: Interactive graphics](tutorials/interactive-graphics.md); [12g: Reactive control panels](tutorials/control-panels.md); [12h: Reactive scenes and snapshots](tutorials/reactive-scenes-and-snapshots.md); [12i: Graphics interaction guide](tutorials/graphics-interaction-guide.md) |
| 13 | [13: Core, host, and lowering](tutorials/core-host-lowering.md); [13a: Core operations](tutorials/core-operations.md); [13b: Lazy structural forms](tutorials/lazy-core-forms.md); [13c: Lowering syntax](tutorials/lowering-and-ir.md); [13d: Host objects and plugins](tutorials/host-and-plugins.md); [13e: Capstone: explicit core](tutorials/capstone-explicit-core.md) |

Plugin sections 14–23 cover numbers/numerics, algebra/analysis, graphics,
data/documents, renderer/exporters, higher-dimensional views, algorithms,
analysis, fractals, and probability. Each generated page links to its actual
`rix/plugins/*/tutorial.md` source. Proposed plugin examples are rendered as
non-runnable acceptance documentation; they are not an implementation promise.

## Delivered pipeline coverage

| Pipeline | Start here | Continuation and limits |
| --- | --- | --- |
| Publication / LaTeX / SVG / images | [Documents](tutorials/documents-and-slides.md), [graphics](tutorials/plots-and-graphics.md) | Document and renderer plugin tutorials; static assets remain useful without interaction. External PDF/TeX tooling needs a configured host. |
| Certified nonlinear and ODE exploration | [Graphics interaction](tutorials/graphics-interaction-guide.md) | Numerics, ODE, Ball and Plot tutorials retain certified/approximate/unresolved labels and bounded work; a sampled picture is not a proof. |
| Exact-number views | [Notation](tutorials/number-notation.md), [core mathematics](tutorials/core-mathematics.md) | Radix, continued-fraction and Stern–Brocot plugin tutorials; formatted digits do not replace exact values. |
| Tensor coordinates | [Shaped values](tutorials/tensors.md), [sheet views](tutorials/sheets-and-tensor-views.md) | Linalg tutorial covers Frames, sparse coordinates, projections and exact support; Float tutorial covers explicitly approximate typed adapters. |
| Async cancellation | [Async](tutorials/async-concurrency.md), [streams](tutorials/async-streams.md) | Cooperative cancellation, cleanup, host capability policy and transferable values; concurrency is not hard isolation. |
| RiXCel interchange | [Sheet foundation](tutorials/sheets-and-tensor-views.md) | Workbook namespaces, history, explicit tensor regions and XLSX values belong to the Cel host; a browser Sheet is not the whole workbook application. |

The [end-to-end capstones](../rix/documentation/tutorial/capstones.md) and
[executable source guide](../rix/examples/capstones/README.md) connect these six
pipelines without duplicating the introductory pages. Host-specific code is
labeled; unavailable-host behavior and static alternatives are part of the
exercise, not hidden setup.

## Verification and updates

- `tests/tutorial-source.test.js` verifies source/index coverage, complete script
  syntax, generated plugin contracts and source conventions.
- `tests/recent-feature-tutorial.test.js` executes the shaped/Float/sparse and
  bounded plotting additions in both sync and async browser-catalog contexts,
  and checks invalid-budget behavior and retained output disclosures.
- `tests/repl-runtime.test.js` executes every implemented core/plugin tutorial
  section through the actual async browser REPL with a fresh section context.
- `tests/core-mathematics-tutorial.test.js`, `tests/trajectory-tutorial.test.js`
  and `tests/ode-higher-order-tutorial.test.js` execute deeper numerical lessons.
- `bun run build:tutorials` publishes navigation and lesson pages; `bun test`
  verifies generated-page contracts too. Regenerate after changing sources.
- New advanced lessons should name prerequisites, host requirements, bounded
  failure behavior, exact/approximate distinctions and a static alternative.
- Historical implementation plans live with design/archive material. Use the
  current `rix/documentation/` sources for published references; old `rix/docs/`
  source paths and the former curriculum numbering are obsolete.

Browser-local progress tracking is optional UI work, not a missing language
lesson. RiX-Ed curriculum and decision-dependent features remain outside this
coverage audit. Follow `../WORK_PLAN.md` for delivery status.
