// Tutorials check themselves: every h2 section runs in a fresh REPL, stated
// results are guarded by `##@ == value` checks in the cells (a failed check is
// an error), and indented :::challenge starters run after their section.
//   bun run test:tutorials            # all published tutorials
//   TUTORIAL=control-panels bun run test:tutorials
import { expect, test } from "bun:test";
import { createRixRepl } from "../src/repl-runtime.js";
import { tutorials } from "../src/tutorial-index.js";

const CELL = /```rix(?:[ \t]+[^\n]*)?[ \t]*\n([\s\S]*?)\n```/g;
const CHALLENGE = /^:::challenge[^\n]*\n([\s\S]*?)^:::\s*$/gm;

// Indented (four-space) code runs inside a challenge, joined into starters.
export function challengeStarters(section) {
    const starters = [];
    for (const [, body] of section.matchAll(CHALLENGE)) {
        let current = [];
        // Blank lines continue an indented block, as in Markdown.
        for (const line of [...body.split("\n"), "end"]) {
            if (/^ {4}/.test(line)) current.push(line.slice(4));
            else if (line.trim() === "" && current.length) current.push("");
            else if (current.length) {
                starters.push(current.join("\n").trim());
                current = [];
            }
        }
    }
    // Starters marked `## lint-problem` are deliberately broken lint exercises.
    return starters.filter((code) => code && !code.includes("## lint-problem"));
}

export function tutorialSections(source) {
    return source.split(/^##\s+/m).map((section, index) => ({
        index,
        title: index === 0 ? "(intro)" : section.split("\n", 1)[0].trim(),
        cells: [...section.matchAll(CELL)].map(([, code]) => code).filter((code) => !code.includes("## lint-problem")),
        starters: challengeStarters(section),
    }));
}

async function tutorialSource(tutorial) {
    const url = tutorial.pluginTutorial
        ? new URL(tutorial.sourcePath, new URL("../", import.meta.url))
        : new URL(`../tutorials/${tutorial.file.replace(/\.html$/, ".md")}`, import.meta.url);
    return Bun.file(url).text();
}

const only = process.env.TUTORIAL;
const published = tutorials.filter(({ pluginGroup, status, file, sourcePath }) =>
    !pluginGroup && status !== "proposed" && (!only || String(sourcePath ?? file).includes(only)));

for (const tutorial of published) {
    test(`tutorial ${tutorial.number} (${tutorial.file}) runs, checks its stated results and its challenge starters`, async () => {
        const failures = [];
        for (const section of tutorialSections(await tutorialSource(tutorial))) {
            if (section.cells.length === 0 && section.starters.length === 0) continue;
            const repl = createRixRepl({ autoLoadPlugins: false });
            try {
                for (const [kind, code] of [...section.cells.map((c) => ["cell", c]), ...section.starters.map((c) => ["challenge starter", c])]) {
                    const response = await repl.runAsync(code);
                    if (response.type !== "result") {
                        failures.push(`section "${section.title}" ${kind}: ${response.text}\n${code.split("\n").slice(0, 3).join("\n")}`);
                        break;
                    }
                }
            } finally {
                await repl.dispose();
            }
        }
        expect(failures, failures.join("\n\n")).toEqual([]);
    }, 120_000);
}
