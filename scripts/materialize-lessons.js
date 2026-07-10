import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { tutorials } from "../src/tutorial-index.js";
import { lessonContent } from "../src/lesson-content.js";

const root = path.resolve(import.meta.dir, "..");
const target = path.join(root, "tutorials");

function chapter(lesson, content) {
    const [idea, example, notice, challenge] = content;
    return `---
number: ${lesson.number}
title: ${lesson.title}
description: ${lesson.description}
---

## Orientation

${idea}

Read this chapter with RatCalc open. Predict the result before running an
example, then change a single part and run it again. That small loop of
prediction, execution, and inspection is the fastest way to make RiX syntax
feel like a language rather than a table of symbols.

## A worked example

```rix
${example}
```

The final line is the displayed value; the earlier lines set up the experiment.
Keep the setup visible so you can tell whether a name, a cell, or a collection
is being reused when the expression changes.

## Read the result

${notice}

Try a second value of your own. When an advanced feature depends on files,
JavaScript, or extension registration, RatCalc explains the concept but does
not grant browser permissions implicitly. Use the detail pages and the help
panel to connect this experiment to the broader language rules.

:::challenge ${lesson.title} practice
${challenge}
:::

## Keep going

Return to the overview when you need context, or continue to the next sibling
lesson for a focused variation. Collection chapters also end with method help
that includes signatures and examples.
`;
}

for (const lesson of tutorials) {
    const content = lessonContent[lesson.number];
    if (!content) continue;
    const destination = path.join(target, lesson.file.replace(/\.html$/, ".md"));
    if (!existsSync(destination)) await writeFile(destination, chapter(lesson, content));
}
