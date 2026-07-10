# RatCalc / RiX Tutorial Plan

## Purpose

Build a complete, runnable learning path for RiX that starts as a friendly exact
calculator and gradually exposes the language's scripting, semantic, and
extension features. Every lesson is a Markdown source in `tutorials/`, is built
to a static page in `docs/learn/`, and has one persistent RiX context per page.

This plan is based on the user-facing introduction, the evaluator syntax and
methods guides, the types-and-traits guide, the parser documentation, and the
RiX rationale log. Implementation-oriented parser records should inform
examples, but should not be presented as a primary learner path.

## Lesson format and navigation

- A numbered **overview** introduces a topic in 5–10 minutes and links down to
  focused subpages (`2`, then `2a`, `2b`, and so on).
- Every code sample is editable and runs in place. Every lesson ends with at
  least one blank challenge cell.
- Overview pages navigate among overview siblings. Subpages navigate among
  sibling subpages. An overview with details has a **Details ↓** link to its
  first subpage.
- The left table of contents shows all overviews, expands the current overview,
  and lists its subpages. RatCalc's **Tutorials** button opens the same tree.
- Subpages for an object type end with generated method chips. A chip opens a
  full help panel with signature, behavior, mutation rules, and examples.
- Every advanced lesson carries a short prerequisite and a browser-runtime note
  where a feature needs a host capability that RatCalc does not expose yet.

## Curriculum map

### 1. Exact calculation with RatCalc

**Status:** implemented as `getting-started.md`.

Cover integers, exact fractions, mixed numbers, intervals, persistent names,
`:=`, `=`, `~=`, calculator history, `.help`, `.Help("topic")`, `.vars`, and
script-entry mode. Introduce the distinction between a calculator command and
RiX source.

### 2. Collections

**Status:** overview plus Arrays, Maps, and Sets are implemented.

- **2a Arrays** — one-based and negative indexing, slices, rest/spread,
  immutable versus bang methods, array generators, and array pipes.
- **2b Maps** — map syntax, keys, values, lookup, `.key` identity, map
  destructuring, and map-aware pipes.
- **2c Sets** — membership, uniqueness, `Add`, `Remove`, union,
  intersection, difference, and set/interval algebra.
- **2d Tuples and strings** — tuple syntax and positional use, colon-strings,
  string indexing/slicing, joining/splitting, and string methods.
- **2e Tensors** — tensor literals, semicolon dimensions, indexing, slicing,
  views, assignment, transpose, and generators.

### 3. Expressions, values, and exact notation

- **3a Operators and precedence** — arithmetic, comparisons, logic, implicit
  multiplication, and adjacency-based callable application.
- **3b Number notation** — decimals, repeating decimals (`#`), continued
  fractions (`.~`), radix shift (`_^`), bases, mixed numbers, and number-base
  literals.
- **3c Intervals and uncertainty** — interval construction, betweenness,
  interval arithmetic, and the division variants.
- **3d Nulls and holes** — `_`, holes versus null, hole coalescing (`?|`),
  omitted arguments, defaults (`?=`), and holes in collections and pipes.

### 4. Binding, cells, and patterns

- **4a The cell model** — alias, fresh-copy, deep-copy, update, deep-update,
  combo assignments, equality (`==`) versus identity (`===`), and protections.
- **4b Destructuring** — arrays, tuples, maps, tensors, rest captures, missing
  entries, per-entry assignment modes, and target headers.
- **4c Indexed destructuring** — source selectors, overlapping extraction,
  nested patterns, slices, and tensor selectors.
- **4d Metadata and properties** — property/index read and write, `.key`,
  metadata merge, mutability/freeze flags, and receiver-first methods.

### 5. Functions and scope

- **5a Define and call** — uppercase callable names, lambdas, parameter forms,
  rest parameters, spread calls, lexical scope, and `@` outer references.
- **5b Function preparation and multifunctions** — `?-`, `?!-`, variants,
  named variants, dispatch order, `$`, `$$`, recursion, and tail-self patterns.
- **5c Closures and block imports** — isolated scope, import/copy/alias
  headers, outer updates, and shared scope in construct positions.
- **5d Partial application** — operator aliases, placeholders, argument
  reordering, arity-capped callable views, and the interaction with pipes.

### 6. Control, blocks, and deferred work

- **6a Ternaries and cases** — `??` / `?:`, nested conditionals, and case
  containers.
- **6b Brace sigils** — plain blocks; map, set, tuple, loop, mutation, case,
  and system containers; the space-after-sigil rule.
- **6c Loops and break blocks** — loop headers, setup/body/update slots,
  stopping conditions, and scoped code blocks.
- **6d Deferred execution** — deferred values, `@@` dynamic evaluation,
  caller-scope behavior, and when deferred code is appropriate.

### 7. Transforming data

- **7a Pipes** — plain pipe, map/filter/reduce forms, callback contract,
  locator/source parameters, maps, strings, tensors, and lazy/early-stop
  behavior.
- **7b Sequences and generators** — sequence syntax, generator operators,
  filters, limits, and composing generated values with pipes.
- **7c Regexes and embedded values** — regex literal modes, match objects,
  iterator use, colon-strings, and embedded-language/backtick parsing.

### 8. Semantics, types, and units

- **8a Semantic inquiry and conversion** — `? :type`, soft/strict conversion,
  built-in numeric semantics, and conversion diagnostics.
- **8b Headers, capture, and traits** — semantic headers, sticky versus
  ephemeral metadata, capture modes, semantic names, and trait checks.
- **8c Define a type or trait** — registry concepts, prototypes, method
  installation, type export/import, and protocol-style trait bundles.
- **8d Units** — scientific and algebraic unit notation, dimensions, and the
  distinction between units and semantic types.

### 9. System capabilities and symbolic work

- **9a The system object** — `.` calls, `@_` syntax, capability groups,
  operator aliases, and the boundary between user and system scope.
- **9b Assertions and symbolic specs** — assertions, solve-style expressions,
  system specs, symbolic polynomial operations, and safe examples of `Poly`
  and `Deriv`.
- **9c Diagnostics and tests** — `.Warn`, `.Info`, `.Error`, `.Stop`,
  `.Debug`, `.Trace`, `.Test`, `.TestError`, `.TestStop`, and the CLI test
  runner. This is the capstone for writing maintainable RiX programs.

### 10. Scripts, packages, and extensions

- **10a RiX scripts** — script interface headers, input/output bindings,
  capability modifiers, local imports, and import-cycle errors.
- **10b JavaScript modules** — `.ImportJS` / `.JSCall` concepts, package
  boundaries, and RatCalc's explicit browser trust policy. Keep this marked as
  a host-dependent feature until browser module loading is implemented.
- **10c Extend the language** — parser/system-loader architecture, keywords,
  custom operators, system functions, three-tier roles, and sandboxing. This
  is an advanced maintainer/tutorial track, not a prerequisite for using RiX.

## Cross-cutting reference work

1. Generate method reference data from `rix/src/runtime/methods.js` rather
   than maintaining hand-written method lists. The current Array/Map/Set chips
   are the first slice of that work.
2. Build a capability reference from the default system context and attach a
   browser-availability badge to each capability.
3. Add per-lesson tests: every runnable starter cell must execute in a fresh
   RiX context; every challenge must be syntactically well-described; every
   navigation edge must resolve to a generated page.
4. Add a lightweight progress marker in browser storage only after the lesson
   tree is stable. It should never affect a tutorial's executable state.
5. Keep design rationale links beside the advanced lessons on cells,
   multifunctions, conversion, method mutation, diagnostics, and dynamic
   evaluation so learners can discover *why* RiX differs from conventional
   expression languages.

## Capstones and comparative problems

Every top-level section now ends with a Markdown capstone that combines the
ideas introduced up to that point into one inspectable task. The capstones are
numbered as the last subsection in their section and appear in the generated
sidebar and previous/next sequence.

Section 11 adds six comparative problems. Three introductory problems cover
Newton square root, FizzBuzz, and a bounded Collatz test. Prime filtering and
matrix multiplication provide moderate collection and structure exercises.
Symbolic differentiation is the advanced problem. Each page shows static
JavaScript, Python, and Julia landmarks, followed by an explained, runnable
RiX solution and a blank RiX challenge.

## Source material coverage checklist

- `rix/docs/introduction.md`: the main learner path, including cells, scopes,
  collections, sigils, system calls, pipes, notation, regexes, units, and
  diagnostics.
- `rix/docs/eval/syntax-guide.md`: operator-level reference, special forms,
  script imports, properties, comments, testing, and the complete system
  function catalog.
- `rix/docs/eval/methods-guide.md`: object-specific lesson references and
  generated method help for arrays, maps, sets, strings, tuples, and tensors.
- `rix/docs/eval/types-and-traits-guide.md`: lessons 8a–8c.
- `rix/docs/parser/*.md`: learner-facing syntax clarifications plus the
  advanced extension track; parser architecture remains supplementary.
- `rix/docs/rix-rationales.md`: rationale callouts, especially where semantics
  are surprising.
- `rix/docs/design/*` and `rix/docs/report-2026-04-02.md`: maintenance notes
  and implementation-status warnings, not default tutorial prose.
