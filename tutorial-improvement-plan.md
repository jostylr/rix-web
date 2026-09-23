# RiX tutorial improvement plan

Status: implemented 2026-09-23. This document retains the original review and
implementation rationale; [tutorial-plan.md](tutorial-plan.md) records the shipped
lesson inventory. The review began against `rix-web` revision `1eb00fd` and RiX
revision `cf6a29d`.

The implementation rewrote lesson 1 as a guided FizzBuzz program, improved its
early destination lessons and capstones, reordered the beginner route, added
local tutorial links to the page renderer, and updated generated navigation.
Automated section execution, exact starter outputs, metadata, local links and
both navigation modes are checked. A fresh-reader usability study remains a
useful editorial follow-up, since it cannot be established by automated tests.

## Recommendation

Turn the first lesson into **Getting started: build your first RiX program**.
Keep a short exact-arithmetic demonstration, then progressively build FizzBuzz.
Teach every piece used in the final program, put a named link to the relevant
deeper lesson beside each introduction, and finish with a complete runnable
script, expected results, and a small modification exercise.

Reorganize the early learning path around expressions, collections, decisions,
functions, and finite transformations. Move shared-cell mechanics and advanced
features out of that first pass. Preserve the mathematical character of RiX
through exact examples and an optional recipe-scaling continuation.

Deliver the starter rewrite first. Improve its destination lessons next, then
change the course order in a coordinated navigation update. A numbering change
alone will not fix the prerequisite gaps.

## Scope and source of truth

The main target is the browser course in [tutorials/](tutorials/), whose order
comes from [src/tutorial-index.js](src/tutorial-index.js). This review closely
examined the early overviews and their supporting lessons, the recipe,
inventory, dispatch and simulation capstones, and the FizzBuzz comparison.
Later core sections were reviewed primarily for curriculum placement. This is
not an exhaustive correctness audit of every plugin lesson.

[tutorial-plan.md](tutorial-plan.md) is the existing **shipped coverage and
maintenance map**. Keep it factual; this document records proposed work. Put
planning documents outside `tutorials/`, since the source tests require every
Markdown file there to be an indexed lesson.

Use the current RiX implementation and executable examples when checking
syntax. Do not import conventions from the legacy calculator. Keep existing
source basenames and published URLs wherever possible.

## Findings that should drive the work

| Priority | Evidence | Learner impact and proposed response |
| --- | --- | --- |
| P0 | [Getting started](tutorials/getting-started.md) has three short examples: fractions, `Square`, and aliasing/mutation. | There is no coherent finished task or explanation of common programming needs. Replace the sequence with the staged program below. |
| P0 | The opener says the editor is one persistent context and refers to a trail and variables panel. [Tutorial replay](src/tutorial-replay.js) and the page footer instead scope replay to each level-two heading. | A learner can expect a name to exist where it does not. Describe the tutorial's actual controls and replay behavior separately from the standalone calculator. |
| P0 | The current opener has no inline links to later lessons. | “The reference panel has more” is not a learning path. Link each introduced concept to a named tutorial and provide a clear next step. |
| P1 | [Recipe scaling](tutorials/capstone-exact-recipe.md), currently 1a, uses mixed-number input, intervals and a tuple, then asks for a map. Those forms were not taught in lesson 1. | It is not yet a capstone of its preceding material. Move it after the necessary foundations and simplify or explain the remaining notation. |
| P1 | Collections precede expressions. [Arrays](tutorials/arrays.md) and [maps](tutorials/maps.md) use lambda callbacks and mapping before functions and pipes have been taught. | Put expressions first; explain the small callback pattern locally and mark fuller transformations as a later revisit. |
| P1 | [Expressions](tutorials/expressions.md), [operators](tutorials/operators.md), [function basics](tutorials/function-basics.md), [pipes](tutorials/pipes.md) and several siblings have one example surrounded by repeated generic orientation text. | Replace boilerplate with worked steps, concrete outputs and exercises supported by the text. Parsing successfully does not establish instructional completeness. |
| P1 | Function basics advertises lambdas, rest parameters and spread but only demonstrates `Add`. Pipes asks the reader to filter without showing filter syntax. Tuples and strings contains no worked string example. | Fulfill the advertised outcomes or narrow the description; do not put untaught syntax into required challenges. |
| P1 | [Generators](tutorials/generators.md) starts with `[1 |+ 2 |^ 5]`; [lazy generators](tutorials/lazy-generators.md) explains that `|^` is lazy while `|;` is eager. | Start the basic generator lesson with a visibly materialized finite result and explicitly distinguish the two forms. |
| P1 | [Shaped values](tutorials/tensors.md), currently 2e, progresses into sparse linear algebra, Float tensors, size budgets and worker transfer. | Keep the basic rectangular-data introduction short; move or clearly separate the numerical-representation material as an advanced continuation. Preserve its technical disclosures. |
| P1 | [Multifunctions](tutorials/multifunctions.md) precedes the main branch/guard lesson; [ternaries](tutorials/ternaries.md) progresses quickly from parity to prepared trials, strict gates and uncertain checks. | Teach ordinary decisions before dispatch. Divide first-use branching from advanced recovery and uncertainty policy. |
| P2 | Several capstones repeat the same general review questions about uncertainty, aliasing and diagnostics. | Replace these with checks about the actual program: output, boundaries, rule order and a justified change. |
| P2 | The comparison section begins with Newton square root; the compact [FizzBuzz](tutorials/problem-fizzbuzz.md) example comes second, at 11b. | Put FizzBuzz first among comparisons and link to it from the starter. Keep the multi-language treatment as a revisit, not required reading for beginners. |

Retain the strengths: runnable editable examples, exact arithmetic, method help
generated from runtime metadata, one-based indexing explanations, returned-copy
examples in the collection pages, and the existing problem/capstone format.

## First lesson specification

### Audience, promise and size

Assume the reader can recognize a number and a list but has never used RiX.
Prior experience with JavaScript, Python or Julia must not be required. Explain
FizzBuzz's rules even though the problem is familiar to many programmers.

The opening promise should be concrete: “Run and change exact calculations,
then build a program that labels the numbers from 1 to 15.” Show a short preview
of the result, not an unexplained finished listing. Aim for roughly 20–30 minutes
with 8–10 short worked cells and a final exercise; check the pacing with a fresh
reader rather than treating a word count as success.

FizzBuzz is the recommended main project because it combines inputs, values,
arithmetic, comparisons, text, decisions, reuse and traversal without plugins
or mutable state. It does not showcase rational arithmetic by itself, so retain
the fraction opening and offer recipe scaling as the mathematical continuation.
Do not add a second complete project to the first page.

### Proposed teaching sequence and links

The destinations below identify existing source pages. In published tutorial
prose, use their `.html` basenames as relative links, not `.md` paths or numeric
lesson labels alone.

| Step | Teach and demonstrate | Reader checkpoint | Deeper destination |
| --- | --- | --- | --- |
| 1. Run something | Point to **Run cell**, editable source, and the output immediately below it. Run `1 / 3 + 1 / 6;`. Explain the final expression and semicolon. | Predict and obtain `1/2`; change one operand and rerun. | [Expressions](tutorials/expressions.md), [number notation](tutorials/number-notation.md) |
| 2. Name inputs | Introduce `:=` with two small exact values and a calculation. Explain lowercase value names and that editing an input requires rerunning the calculation. | Change a named input and predict the new result. | [Cells and assignment](tutorials/cells.md) for later assignment details |
| 3. Ask a question | Introduce `%` as remainder and `==` as equality. Try `6 % 3 == 0` and `7 % 3 == 0`. | Recognize the displayed `1` and `_` as true and false/null in these examples. | [Operators](tutorials/operators.md) |
| 4. Choose an answer | Introduce quoted text and `condition ?: yes ?_ no`. Label one multiple of three; preserve the original number otherwise. | Change `n` between 6 and 7 and explain which value is returned. | [Ternaries and cases](tutorials/ternaries.md), [tuples and strings](tutorials/tuples-and-strings.md) |
| 5. Reuse the rule | Introduce `FizzBuzz(n) -> ...;`, parameter, argument, body and call. Build from one rule to the three ordered rules. | Check 2, 3, 5 and 15; explain why the 15 rule must come first. | [Define and call](tutorials/function-basics.md) |
| 6. Work with several inputs | Start with `[2, 3, 5, 15]`. Explain an array, one-based indexing and mixed number/text results. Show `|>>` with `(n) -> FizzBuzz(n)`. | Predict the four mapped results; explain that the callback runs for each input. | [Arrays](tutorials/arrays.md), [pipes](tutorials/pipes.md) |
| 7. Generate a finite list | Replace the hand-written input with `[1 |+ 1 |; limit]`. Label start, step and output count, including that the seed counts. | With `limit := 15`, obtain exactly 15 inputs, ending at 15. | [Generators](tutorials/generators.md); lazy sequences are optional later reading |
| 8. Put it together | Provide the complete script below, a plain-language walkthrough and explicit expected results. | Run it from fresh state, then increase `limit` to 30. | [FizzBuzz comparison](tutorials/problem-fizzbuzz.md) |
| 9. Make it yours | Give a small required edit plus one optional extension, with hints and checkable expected results. | For 30 inputs, positions 15 and 30 are both `FizzBuzz`; optional divisors 2 and 7 overlap at 14. | [Functions](tutorials/functions.md), [transforming data](tutorials/transformations.md) |

Explain the three assignment/comparison symbols only as needed: `:=` names a
fresh value, `==` compares values, and plain `=` has distinct binding semantics
covered later. Remove the alias-and-mutate worked example from the opener.
Do not teach `~=` or deep-copy forms there.

Mention the important truth difference at the comparison step: zero is truthy
in RiX, so divisibility must be written as `n % 3 == 0`, not as a bare remainder
condition. Briefly acknowledge that uncertain comparisons can return `?`, with
a link to the deeper branch lesson; exact integer FizzBuzz needs no third branch.

Use one decision syntax throughout the starter. Ordered ternaries are already
used in the existing FizzBuzz page and represent alternate computed answers.
Do not introduce multifunction dispatch, prepared guards or diagnostic returns
merely to express these ordinary alternatives.

### Proposed final program

This is a concrete implementation target, not a replacement tutorial draft:

```rix
FizzBuzz(n) ->
    n % 15 == 0 ?: "FizzBuzz" ?_
    n % 3 == 0 ?: "Fizz" ?_
    n % 5 == 0 ?: "Buzz" ?_
    n;

limit := 15;
numbers := [1 |+ 1 |; limit];
numbers |>> (n) -> FizzBuzz(n);
```

Expected values are `1, 2, "Fizz", 4, "Buzz", "Fizz", 7, 8, "Fizz", "Buzz",
11, "Fizz", 13, 14, "FizzBuzz"`, in that order. The current text renderer shows
array strings without quotation marks. Explain that distinction instead of
implying the printed output is necessarily source code.

The program, the remainder comparisons, the one-rule conditional, and the eager
generator were run successfully during this review using
`createRixRepl({ autoLoadPlugins: false }).runAsync(...)`. The current generator
lesson's `[1 |+ 2 |^ 5]` returned `[LazySequence; length 5: …]`, confirming that
the early lesson should explicitly teach the eager/lazy distinction. The old
opener's fraction example returned `2..3/8`, so verify displayed notation rather
than copying its prose spelling verbatim.

No console-output function is necessary: evaluating the final array is the
program's output in this host. Keep the first task about computing a result.

### Cell organization and recovery

- Each level-two heading starts a fresh tutorial context. Make every such topic
  self-contained; repeat the short setup when needed.
- Multiple worked cells inside one topic can build on one another. Running a
  later cell replays earlier source in that topic in a fresh session; it does
  not depend on the order in which the learner clicked buttons.
- Use level-three subheadings for stages that deliberately share setup, or put
  all required definitions in the later cell. Do not solve this editorial task
  by changing the runner's state semantics.
- A challenge in a new topic must include its own setup or explicitly ask the
  learner to write the complete program. An earlier edited challenge can also
  affect subsequent replay in its topic; place challenges after worked cells
  or isolate the next worked example in a new topic.
- Include one short troubleshooting paragraph about spelling/capitalization,
  missing setup, `:=` versus `==`, and editing an earlier input then rerunning.
  Describe the actual error/output location; do not promise a nonexistent reset
  button or require the standalone calculator's variables panel.
- The final complete program must run independently. Do not rely on definitions
  from earlier headings or another tutorial page.

## Recommended curriculum order

### First-pass route

Use this explicit route while the broader navigation migration is pending:

Getting started → Expressions / Operators → Collections / Arrays / text basics
→ simple Ternaries → Define and call → Pipes / finite Generators → a small
report or inventory exercise. Exact notation and intervals form a mathematical
side route; cell identity and mutation are a subsequent programming topic.

Every overview should identify its short required route and its optional
deep dives. A beginner should not have to read every child page before using
the next core concept. Put a named “Continue with …” link at the end of the
required part; keep the full contents available for reference.

### Target top-level order

These are proposed display numbers, not instructions to rename source files.

| Proposed | Existing source / current number | Rationale and required adjustment |
| --- | --- | --- |
| 1. Getting started | `getting-started.md` / 1 | Guided end-to-end FizzBuzz introduction, with no required child capstone. |
| 2. Expressions and exact values | `expressions.md` / 3 | Arithmetic and comparisons before richer data structures. Required: expressions and operators. Exact notation, intervals, holes and sampling are named continuations. |
| 3. Collections and text | `collections.md` / 2 | Arrays and strings first, then tuples, maps and sets. Basic rectangular data is optional; advanced numerical representations are a later route. |
| 4. Decisions and blocks | `control.md` / 6 | Ordinary branches before multifunction guards. Teach simple cases and value-producing blocks; keep advanced trials and deferred evaluation out of the required path. |
| 5. Functions and scope | `functions.md` / 5 | Define/call, anonymous callbacks and simple scope before partial application and dispatch. Advanced capture/import modes link forward to cells. |
| 6. Transforming data | `transformations.md` / 7 | Pipes and finite generators can now rely on functions and arrays. Lazy sequences, regex detail, async and streams remain optional continuations. |
| 7. Cells, shared state and patterns | `binding.md` / 4 | Aliasing, updates and destructuring now answer problems the reader has seen. Stateful loops and the simulation capstone follow this material. |
| 8–10. Existing later core groups | Semantics; system/symbolic; scripts/extensions | Retain root order for this pass, but make prerequisites and routes explicit. |
| 11. Problems in four languages | `problems.md` / 11 | Order children FizzBuzz → Collatz → Newton → primes → matrix → symbolic. Link individual problems from the relevant earlier lessons. |
| 12–13 and plugins | Structured output; core/host/lowering; generated plugin groups | Retain organization in this pass. Add entry links by learner goal instead of making all earlier advanced pages mandatory. |

Within these groups, make the following dependency repairs:

- Move recipe scaling from 1a to the end of the expressions/exact-values group.
  Rewrite it so the first version uses only taught exact values and intervals;
  explain mixed-number notation locally or use ordinary fractions. Show scalar
  outputs separately, or use the array already introduced in the starter.
  Reserve the map extension for after collections and link there explicitly.
- In collections, introduce quoted strings before using them as keys or labels.
  Retain the `tuples-and-strings.md` URL, but teach strings first and provide
  actual examples for both types. Place inventory after arrays, tuples, maps
  and sets, not after advanced tensors as an apparent prerequisite.
- Keep number-notation's common inputs at the top and its full notation catalog
  as optional reference. Move scoped randomness to an advanced route after
  scope; sampling is not a prerequisite for ordinary arithmetic or branching.
- Teach simple scope before multifunction composition. Prerequisites for
  multifunctions include decisions, parameters and the meaning of a guard.
- Split the teaching order inside brace containers: simple blocks now, loop
  mechanics after cells and scope. Reparent the bounded-simulation capstone to
  the end of the shared-state group and teach every loop slot it uses first.
  Deferred execution can remain a linked advanced page, with scope prerequisites.
- Keep eager generators before lazy generators. Distinguish sequence generators
  from the algebraic meaning of “Exact generators”; consider displaying the
  latter as “Exact constants and algebraic generators” without changing its URL.
- Move the sparse/Float/transfer discussion from the early shaped-values path
  to its linalg/Float continuations, checking existing coverage before copying
  content. If retained on the page, clearly mark its prerequisite boundary and
  give beginners a continuation link before it.

### Broader course placement

Make the later catalog approachable through a few routes rather than another
large renumbering: exact mathematics (intervals, units, exact constants,
symbolic work), programs and packages (state, diagnostics, scripts, extensions),
and communicating results (tables, documents, graphics). Link the gotchas page
early as an optional guide for experienced programmers; it should not be a
required late discovery of zero truthiness or immutable collection updates.

Basic “predict, run, compare” verification belongs in lesson 1 even though the
formal diagnostic API remains later. Keep implementation/lowering and host
capability details in their specialist lessons. Preserve proposed-versus-runnable
plugin labels and exact/approximate distinctions throughout.

## Required improvements to the early destination lessons

| Pages | Minimum useful revision |
| --- | --- |
| Expressions, operators | Several small examples for grouping, `%`, `==`, comparison output and explicit calls. Give the actual result of each. Introduce implicit application only after ordinary calls. |
| Number notation, intervals | A short common-input path before the full catalog; explain interval bounds versus one scalar. Supply a worked betweenness test before the current challenge. |
| Collections, arrays | Explain construction, reading and returned copies before mapping/filtering. Define receiver-method notation on first use. Link advanced callbacks rather than assuming them. Remove the unrelated interval detour from the collections overview. |
| Tuples and strings, maps, sets | Demonstrate text literals and string indexing, then positional versus named data. Keep map/set operations concrete and avoid requiring the method catalog to solve the exercise. |
| Control, ternaries, braces | Separate basic choices, multiple cases, blocks, advanced trials and stateful loops. For each required form, show a worked result and boundary case. |
| Functions, function basics | Teach definition, parameters, arguments, result, repeated calls and a lambda. Demonstrate rest/spread in an optional section or remove that promise from the basic description. |
| Pipes, generators | Demonstrate map, then filter, then reduce separately, with expected arrays/scalars. Explain callback value before locator/source arguments. Start with finite eager generation and a visible count. |
| Binding, cells | Compare alias and copy side by side, showing values before and after update. Put nested/deep copying after the ordinary case. Explain the scope/update syntax needed by loops. |
| Early capstones | List actual prerequisites; use only taught forms; give expected outputs, boundary checks, a hint and a checkable extension. Replace generic review questions with task-specific ones. |

Use a consistent small lesson pattern: outcome → prerequisites → worked example
→ expected result and explanation → one deliberate edit → challenge with a hint
and verification target → named next/deeper links. An overview introduces and
routes; a focused lesson teaches; method help provides API detail. Avoid making
all three repeat the same paragraph.

## Implementation work packages

### A. Starter rewrite — highest priority, independently deliverable

Files: [getting-started.md](tutorials/getting-started.md), the lesson-1 title and
description in [tutorial-index.js](src/tutorial-index.js), and a backlink in
[problem-fizzbuzz.md](tutorials/problem-fizzbuzz.md).

Implement the specified progression, links, self-contained final script and
exercises. Label recipe scaling as a later mathematical continuation until its
prerequisite repair ships. Preserve lesson numbers in this first package.

Done when a new reader can run, explain and modify the final program without
opening another lesson, while every introduced topic offers a relevant deeper
link. The final cell and its challenge must work with fresh topic state.

### B. Early lesson and capstone repair

Files: the early pages listed above, especially every destination from the
starter. Rewrite examples and challenges together. Resolve eager/lazy wording,
string coverage, callback prerequisites and capstone setup. Add explicit
beginner/advanced boundaries before moving navigation.

Done when no required exercise asks for syntax that has neither been taught
locally nor named as a prerequisite, and early-page descriptions accurately
match their contents.

### C. Navigation and sequence migration

Apply the proposed root order and child moves as one coordinated change.
Create an old-number → new-number mapping for every moved page during that work.
Update frontmatter `number`, index `number`/`parent`, ordering, titles,
descriptions, numeric references in tests and prose, and the shipped coverage
map. Do not hand-edit generated plugin indexes or renumber plugin groups merely
because core pages moved.

Relevant implementation surfaces:

- [src/tutorial-index.js](src/tutorial-index.js): core order and parents.
- [scripts/build-tutorials.js](scripts/build-tutorials.js): static navigation,
  page metadata and generated output.
- [src/tutorial-navigation.js](src/tutorial-navigation.js): dynamic navigation.
- [tests/tutorial-source.test.js](tests/tutorial-source.test.js): index/source
  coverage and some number-specific expectations.
- [tutorial-plan.md](tutorial-plan.md): current published coverage.
- `docs/tutorial/`, `navigation.json` and generated assets: regenerate with the
  build, not manual edits.

Next/previous links currently follow index order, not a separate learning-path
model. Inline “Continue with …” links can provide the shorter beginner route
without a new navigation system. If a distinct “Next beginner lesson” control is
later desired, treat it as a separate UI task with static/dynamic parity tests.

The renderer currently does not assign IDs to lesson headings. Use page-level
links for this work; subsection deep links require an explicit renderer change
and tests. Likewise, use the renderer's supported headings, paragraphs, links,
lists and challenge blocks; do not assume arbitrary Markdown tables or
collapsible solution markup will work inside published lessons.

Done when source metadata, visible titles, sidebar placement and both navigation
modes agree, and all existing lesson URLs still resolve.

### D. Later-course consistency pass

Apply the lesson pattern to remaining template-heavy pages, add route and
prerequisite links, and align problem/capstone exercises with what precedes them.
Keep advanced correctness and host requirements intact. This can follow the
starter and early-order work; it should not hold them up.

## Verification and acceptance checklist

The review only executed the small candidate examples noted above. It did not
run the full suite or perform a browser usability test. The following checks
belong to implementation, not claims about work already completed.

- [ ] Run every revised section in the actual async browser REPL with plugins
  disabled unless the lesson explicitly loads one. Verify expected values, not
  only successful parsing or `response.type === "result"`.
- [ ] Verify FizzBuzz for 1, 3, 5, 15 and 30; verify exactly 15 outputs for the
  default count, unchanged numeric values for nonmultiples, and the overlap rule.
- [ ] Verify final scripts and challenge setup from fresh state. Exercise edits
  to an earlier cell, reruns, missing definitions and heading boundaries using
  the existing replay behavior.
- [ ] Extend existing tutorial tests with meaningful output/prerequisite checks
  for the new examples. Do not substitute assertions about paragraph wording
  for executable or learner-facing checks.
- [ ] From `rix-web/`, run focused checks:

  ```sh
  bun test tests/tutorial-source.test.js tests/tutorial-execution.test.js
  bun test tests/repl-runtime.test.js -t 'published RiX tutorial'
  bun run build:tutorials
  bun test
  ```

  Add the affected editor/lint tests if those interfaces change. For navigation
  work also run `bun run build:tutorials:static`, inspect static output, then
  restore the normal build with `bun run build:tutorials` and verify the final
  generated contracts. Do not treat a build as a substitute for execution tests.
- [ ] Open generated pages at desktop and narrow widths. Check Run/Run answer,
  output location, challenge usability, links, Contents and next/previous links.
  Confirm the starter's UI descriptions match what is actually visible.
- [ ] Check that every starter link resolves to the intended lesson and that
  old basenames still work after reordering. Check static and dynamic navigation.
- [ ] Ask a fresh reader to explain the final program line by line and change
  the count without coaching. They should distinguish `:=`, `==`, `->`, `?:`,
  `?_`, `|>>` and `|;`, and understand why 15 is checked before 3 and 5.

This handoff requires documentation and tutorial-maintenance work. It does not
require a language feature, plugin installation, automatic exercise grader,
progress-tracking system, or a redesign of the tutorial runner.
