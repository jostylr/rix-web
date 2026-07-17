import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { childrenOf, objectHelp, rootTutorials, tutorialByNumber, tutorials } from "../src/tutorial-index.js";

const root = path.resolve(import.meta.dir, "..");
const tutorialsDir = path.join(root, "tutorials");
const outDir = path.join(root, "docs", "tutorial");
const legacyOutDir = path.join(root, "docs", "learn");
const assetsDir = path.join(root, "docs", "assets");
await rm(legacyOutDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });
await Bun.write(path.join(assetsDir, "tutorial.css"), await readFile(path.join(root, "src", "tutorial.css")));
await Bun.write(path.join(assetsDir, "tutorial-extra.css"), await readFile(path.join(root, "src", "tutorial-extra.css")));

function escapeHtml(text) {
    return String(text).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

function renderInline(text) {
    let html = escapeHtml(text);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    return html;
}

function parseFrontmatter(source) {
    const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return [{}, source];
    const meta = Object.fromEntries(match[1].split("\n").map((line) => {
        const index = line.indexOf(":");
        return index === -1 ? [line, ""] : [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }));
    return [meta, match[2]];
}

function renderMarkdown(markdown) {
    const lines = markdown.split("\n");
    const html = [];
    let paragraph = [];
    let code = null;
    let codeLanguage = "";
    let challenge = null;
    const flushParagraph = () => {
        if (!paragraph.length) return;
        html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
        paragraph = [];
    };
    const flushCode = () => {
        if (code === null) return;
        if (codeLanguage.toLowerCase() === "rix") {
            html.push(`<section class="tutorial-cell"><header><span>Runnable RiX</span><button type="button" data-tutorial-run>Run cell</button></header><textarea class="tutorial-source" data-tutorial-source spellcheck="false">${escapeHtml(code)}</textarea><div class="tutorial-output" data-tutorial-output></div></section>`);
        } else {
            html.push(`<section class="comparison-code"><header>${escapeHtml(codeLanguage || "code")}</header><pre><code>${escapeHtml(code)}</code></pre></section>`);
        }
        code = null;
        codeLanguage = "";
    };
    const flushChallenge = () => {
        if (!challenge) return;
        const challengeCode = challenge.code || "";
        html.push(`<aside class="challenge"><p class="eyebrow">Challenge</p><h3>${renderInline(challenge.title || "Make it yours")}</h3><p>${renderInline(challenge.body.join(" "))}</p><section class="tutorial-cell"><header><span>Your RiX answer</span><button type="button" data-tutorial-run>Run answer</button></header><textarea class="tutorial-source" data-tutorial-source spellcheck="false" placeholder="# Write your RiX solution here">${escapeHtml(challengeCode)}</textarea><div class="tutorial-output" data-tutorial-output></div></section></aside>`);
        challenge = null;
    };
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (line.startsWith("```") || line.startsWith("~~~")) {
            if (code !== null) flushCode();
            else { flushParagraph(); code = ""; codeLanguage = line.slice(3).trim(); }
            continue;
        }
        if (code !== null) { code += `${code ? "\n" : ""}${line}`; continue; }
        if (line.startsWith(":::challenge")) { flushParagraph(); challenge = { title: line.replace(":::challenge", "").trim(), body: [], code: "" }; continue; }
        if (line === ":::") { flushChallenge(); continue; }
        if (challenge) {
            if (line.startsWith("    ")) challenge.code += `${challenge.code ? "\n" : ""}${line.slice(4)}`;
            else if (line.trim()) challenge.body.push(line.trim());
            continue;
        }
        if (!line.trim()) { flushParagraph(); continue; }
        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) { flushParagraph(); const level = heading[1].length; html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`); continue; }
        if (line.startsWith("- ")) { flushParagraph(); const list = []; while (index < lines.length && lines[index].startsWith("- ")) { list.push(`<li>${renderInline(lines[index].slice(2))}</li>`); index += 1; } index -= 1; html.push(`<ul>${list.join("")}</ul>`); continue; }
        paragraph.push(line.trim());
    }
    flushParagraph(); flushCode(); flushChallenge();
    return html.join("\n");
}

function normalizedNumber(number) {
    return String(number || "").replace(/^0+(\d)/, "$1");
}

function sidebar(current) {
    const activeRoot = current.parent || current.number;
    return `<aside id="lesson-sidebar" class="lesson-sidebar"><p>Contents</p>${rootTutorials.map((root) => {
        const children = childrenOf(root.number);
        if (!children.length) return `<a class="${current.number === root.number ? "current" : ""}" href="./${root.file}">${escapeHtml(root.number)} · ${escapeHtml(root.title)}</a>`;
        return `<details ${activeRoot === root.number ? "open" : ""}><summary>${escapeHtml(root.number)} · ${escapeHtml(root.title)}</summary><a class="overview ${current.number === root.number ? "current" : ""}" href="./${root.file}">Overview</a>${children.map((child) => `<a class="${current.number === child.number ? "current" : ""}" href="./${child.file}">${escapeHtml(child.number)} · ${escapeHtml(child.title)}</a>`).join("")}</details>`;
    }).join("")}</aside>`;
}

function navigation(current) {
    const position = tutorials.findIndex((item) => item.number === current.number);
    const previous = tutorials[position - 1];
    const next = tutorials[position + 1];
    const section = current.parent ? tutorialByNumber(current.parent) : current;
    const sectionHref = current.parent ? `./${section.file}#lesson-start` : "#lesson-start";
    const down = rootTutorials[rootTutorials.findIndex((item) => item.number === section.number) + 1];
    const label = (tutorial) => `${tutorial.number} ${tutorial.title.split(/\s+/)[0].replace(/[^\p{L}\p{N}]+$/u, "")}`;
    const sectionLink = `<a href="${sectionHref}">↑ ${escapeHtml(label(section))}</a>`;
    const downLink = down ? `<a href="./${down.file}">↓ ${escapeHtml(label(down))}</a>` : "";
    return `<nav class="lesson-navigation" aria-label="Lesson navigation"><span class="previous-link">${previous ? `<a href="./${previous.file}">← ${escapeHtml(label(previous))}</a>` : ""}</span><span class="section-links">${sectionLink}${downLink}</span><span class="next-link">${next ? `<a href="./${next.file}">${escapeHtml(label(next))} →</a>` : ""}</span></nav>`;
}

function relatedFunctions(current) {
    if (!current.object) return "";
    const methods = objectHelp[current.object]?.functions || [];
    return `<section class="related-functions"><h2>${escapeHtml(current.title)} reference</h2><p>Open a method for its full description and RiX examples.</p><ul>${methods.map(([name]) => `<li><button type="button" data-object-help="${escapeHtml(current.object)}" data-object-function="${escapeHtml(name)}"><code>${escapeHtml(name)}</code></button></li>`).join("")}</ul></section>`;
}

function referenceLinks(current) {
    const rootNumber = current.parent || current.number;
    const root = Number.parseInt(rootNumber, 10);
    const links = {
        1: [["RiX introduction", "https://docs.rix.ratmath.com/introduction.html"]],
        2: [["Methods API", "https://docs.rix.ratmath.com/eval/methods-guide.html"], ["Collection syntax", "https://docs.rix.ratmath.com/eval/syntax-guide.html#collection-syntax"]],
        3: [["Syntax and operators", "https://docs.rix.ratmath.com/eval/syntax-guide.html#operators"], ["Number notation", "https://docs.rix.ratmath.com/introduction.html#number-systems-and-notation"]],
        4: [["Cells and assignments", "https://docs.rix.ratmath.com/design/eval/cells-assignments.html"], ["Destructuring reference", "https://docs.rix.ratmath.com/eval/syntax-guide.html#left-hand-destructuring"]],
        5: [["Functions reference", "https://docs.rix.ratmath.com/eval/syntax-guide.html#assignment-definition"], ["Function rationale", "https://docs.rix.ratmath.com/rix-rationales.html#multifunctions-2026-04-01"]],
        6: [["Control-flow syntax", "https://docs.rix.ratmath.com/eval/syntax-guide.html#brace-containers"], ["Ternary reference", "https://docs.rix.ratmath.com/eval/syntax-guide.html#ternary-operator"]],
        7: [["Pipes API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#pipe-operators"], ["Generator reference", "https://docs.rix.ratmath.com/parser/array-generators-implementation.html"]],
        8: [["Units and exact generators", "https://docs.rix.ratmath.com/design/eval/units-and-exact-generators.html"], ["Cayley polar design", "https://docs.rix.ratmath.com/design/eval/cayley-polar.html"], ["Types and traits API", "https://docs.rix.ratmath.com/eval/types-and-traits-guide.html"]],
        9: [["System function API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#part-2-system-function-reference"], ["Diagnostics API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#part-4-diagnostics-testing-and-debugging"]],
        10: [["Script imports", "https://docs.rix.ratmath.com/eval/syntax-guide.html#script-import-expressions"], ["Adding extensions", "https://docs.rix.ratmath.com/developer-guide.html#adding-a-user-facing-capability"]],
        11: [["RiX at a glance", "https://docs.rix.ratmath.com/language-at-a-glance.html"], ["Evaluator syntax API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#part-1-syntax-system-function"]],
    }[root] || [];
    if (!links.length) return "";
    return `<section class="api-links"><h2>Reference</h2><ul>${links.map(([label, url]) => `<li><a href="${url}" data-doc-reference target="_blank" rel="noreferrer">${escapeHtml(label)} ↗</a></li>`).join("")}</ul></section>`;
}

function tutorialIndexTemplate() {
    const contents = rootTutorials.map((tutorial) => {
        const children = childrenOf(tutorial.number);
        return `<section class="tutorial-index-section"><a href="./${tutorial.file}"><b>${escapeHtml(tutorial.number)} · ${escapeHtml(tutorial.title)}</b><span>${escapeHtml(tutorial.description)}</span></a>${children.length ? `<div class="tutorial-index-children">${children.map((child) => `<a href="./${child.file}">${escapeHtml(child.number)} · ${escapeHtml(child.title)}</a>`).join("")}</div>` : ""}</section>`;
    }).join("");
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="An interactive introduction to the RiX language and RatCalc." /><title>RiX tutorials — RatCalc</title><link rel="stylesheet" href="../assets/app.css" /><link rel="stylesheet" href="../assets/tutorial.css" /></head><body><main class="tutorial-page"><div class="tutorial-shell"><header class="tutorial-header"><a class="brand" href="../" aria-label="RatCalc home"><span class="rm-mark">R/M</span><span><b>RatCalc</b><small>powered by RiX</small></span></a><a href="../">Open calculator</a></header><article class="lesson-card tutorial-index-card"><p class="lesson-kicker">RiX walkthroughs</p><h1>Learn RiX by running it.</h1><p class="deck">These tutorials introduce RiX one concept at a time. Each lesson has live examples in its own persistent session, so you can run a cell, change it, and see what happens.</p><p class="tutorial-index-intro">Start with exact numbers, then follow the topics that match what you want to build. Capstone lessons combine the material into a small practical exercise.</p><nav class="tutorial-index" aria-label="Tutorial table of contents">${contents}</nav><footer class="lesson-footer">Want to try an expression first? <a href="../">Open RatCalc →</a></footer></article></div></main></body></html>`;
}

function pageTemplate(meta, body) {
    const current = tutorialByNumber(normalizedNumber(meta.number)) || { number: normalizedNumber(meta.number), title: meta.title, file: "", parent: null };
    const section = current.parent ? tutorialByNumber(current.parent) : current;
    const sectionHref = current.parent ? `./${section.file}#lesson-start` : "#lesson-start";
    const suffix = current.parent ? current.number.slice(section.number.length) : "";
    const suffixLabel = suffix ? ` <span aria-hidden="true">·</span> <span>${escapeHtml(suffix)}</span>` : "";
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="${escapeHtml(meta.description || "A runnable RiX lesson")}" /><title>${escapeHtml(meta.title || "RiX tutorial")} — RatCalc</title><link rel="stylesheet" href="../assets/app.css" /><link rel="stylesheet" href="../assets/tutorial.css" /><link rel="stylesheet" href="../assets/tutorial-extra.css" /></head><body><main class="tutorial-page"><div class="tutorial-shell"><header class="tutorial-header"><a class="brand" href="../" aria-label="RatCalc home"><span class="rm-mark">R/M</span><span><b>RatCalc</b><small>powered by RiX</small></span></a><div class="tutorial-header-actions"><button id="tutorial-contents-toggle" type="button" data-toggle-contents aria-controls="lesson-sidebar" aria-expanded="false">Contents</button><a href="../">Open calculator</a></div></header><div class="lesson-layout">${sidebar(current)}<article id="lesson-start" class="lesson-card"><p class="lesson-kicker"><a href="./index.html">RiX walkthrough</a> <span aria-hidden="true">·</span> <a href="${sectionHref}" title="${escapeHtml(section.title)}">${escapeHtml(section.number)}</a>${suffixLabel}</p><h1>${escapeHtml(meta.title || "RiX tutorial")}</h1><p class="deck">${escapeHtml(meta.description || "Read, run, then change the next line.")}</p><div class="lesson-content">${body}</div>${relatedFunctions(current)}${referenceLinks(current)}${navigation(current)}<footer class="lesson-footer">Every RiX cell above runs in this page and shares one RiX session. <a href="../">Open a fresh RatCalc session →</a></footer></article><aside id="tutorial-docs-panel" class="tutorial-docs-panel" aria-label="RiX documentation" hidden><header><span id="tutorial-docs-title">RiX documentation</span><div><a id="tutorial-docs-external" href="https://docs.rix.ratmath.com/" target="_blank" rel="noreferrer">Open in new tab</a><button type="button" data-close-tutorial-docs aria-label="Close documentation">×</button></div></header><iframe id="tutorial-docs-frame" src="https://docs.rix.ratmath.com/" title="RiX documentation"></iframe></aside></div></div></main><dialog id="object-help-dialog" class="object-help-dialog"></dialog><script type="module" src="../assets/tutorial-runner.js"></script></body></html>`;
}

const markdownFiles = [];
for await (const file of new Bun.Glob("*.md").scan({ cwd: tutorialsDir })) markdownFiles.push(file);
const generatedFiles = new Set();
for (const filename of markdownFiles) {
    const [meta, markdown] = parseFrontmatter(await Bun.file(path.join(tutorialsDir, filename)).text());
    await Bun.write(path.join(outDir, `${path.basename(filename, ".md")}.html`), pageTemplate(meta, renderMarkdown(markdown)));
    generatedFiles.add(`${path.basename(filename, ".md")}.html`);
}
for (const lesson of tutorials) {
    if (!generatedFiles.has(lesson.file)) {
        throw new Error(`Missing Markdown source for tutorial ${lesson.number}: ${lesson.file.replace(/\.html$/, ".md")}`);
    }
}
await Bun.write(path.join(outDir, "index.html"), tutorialIndexTemplate());
