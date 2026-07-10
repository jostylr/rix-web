import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { childrenOf, objectHelp, rootTutorials, tutorialByNumber, tutorials } from "../src/tutorial-index.js";

const root = path.resolve(import.meta.dir, "..");
const tutorialsDir = path.join(root, "tutorials");
const outDir = path.join(root, "docs", "learn");
const assetsDir = path.join(root, "docs", "assets");
await mkdir(outDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });
await Bun.write(path.join(assetsDir, "tutorial.css"), await readFile(path.join(root, "src", "tutorial.css")));

function escapeHtml(text) {
    return String(text).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
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
    let challenge = null;
    const flushParagraph = () => {
        if (!paragraph.length) return;
        html.push(`<p>${escapeHtml(paragraph.join(" "))}</p>`);
        paragraph = [];
    };
    const flushCode = () => {
        if (code === null) return;
        html.push(`<section class="tutorial-cell"><header><span>Runnable RiX</span><button type="button" data-tutorial-run>Run cell</button></header><textarea class="tutorial-source" data-tutorial-source spellcheck="false">${escapeHtml(code)}</textarea><div class="tutorial-output" data-tutorial-output></div></section>`);
        code = null;
    };
    const flushChallenge = () => {
        if (!challenge) return;
        const challengeCode = challenge.code || "";
        html.push(`<aside class="challenge"><p class="eyebrow">Challenge</p><h3>${escapeHtml(challenge.title || "Make it yours")}</h3><p>${escapeHtml(challenge.body.join(" "))}</p><section class="tutorial-cell"><header><span>Your RiX answer</span><button type="button" data-tutorial-run>Run answer</button></header><textarea class="tutorial-source" data-tutorial-source spellcheck="false" placeholder="# Write your RiX solution here">${escapeHtml(challengeCode)}</textarea><div class="tutorial-output" data-tutorial-output></div></section></aside>`);
        challenge = null;
    };
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (line.startsWith("```")) {
            if (code !== null) flushCode();
            else { flushParagraph(); code = ""; }
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
        if (heading) { flushParagraph(); const level = heading[1].length; html.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`); continue; }
        if (line.startsWith("- ")) { flushParagraph(); const list = []; while (index < lines.length && lines[index].startsWith("- ")) { list.push(`<li>${escapeHtml(lines[index].slice(2))}</li>`); index += 1; } index -= 1; html.push(`<ul>${list.join("")}</ul>`); continue; }
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
    return `<aside class="lesson-sidebar"><p>Contents</p>${rootTutorials.map((root) => {
        const children = childrenOf(root.number);
        if (!children.length) return `<a class="${current.number === root.number ? "current" : ""}" href="./${root.file}">${escapeHtml(root.number)} · ${escapeHtml(root.title)}</a>`;
        return `<details ${activeRoot === root.number ? "open" : ""}><summary>${escapeHtml(root.number)} · ${escapeHtml(root.title)}</summary><a class="overview ${current.number === root.number ? "current" : ""}" href="./${root.file}">Overview</a>${children.map((child) => `<a class="${current.number === child.number ? "current" : ""}" href="./${child.file}">${escapeHtml(child.number)} · ${escapeHtml(child.title)}</a>`).join("")}</details>`;
    }).join("")}</aside>`;
}

function navigation(current) {
    const siblings = current.parent ? childrenOf(current.parent) : rootTutorials;
    const position = siblings.findIndex((item) => item.number === current.number);
    const previous = siblings[position - 1];
    const next = siblings[position + 1];
    const details = !current.parent ? childrenOf(current.number)[0] : null;
    return `<nav class="lesson-navigation" aria-label="Lesson navigation"><span>${previous ? `<a href="./${previous.file}">← ${escapeHtml(previous.number)} Previous</a>` : ""}</span>${details ? `<a class="details-link" href="./${details.file}">Details ↓</a>` : ""}<span>${next ? `<a href="./${next.file}">Next ${escapeHtml(next.number)} →</a>` : ""}</span></nav>`;
}

function relatedFunctions(current) {
    if (!current.object) return "";
    const methods = objectHelp[current.object]?.functions || [];
    return `<section class="related-functions"><h2>${escapeHtml(current.title)} reference</h2><p>Open a method for its full description and RiX examples.</p><ul>${methods.map(([name]) => `<li><button type="button" data-object-help="${escapeHtml(current.object)}" data-object-function="${escapeHtml(name)}"><code>${escapeHtml(name)}</code></button></li>`).join("")}</ul></section>`;
}

function pageTemplate(meta, body) {
    const current = tutorialByNumber(normalizedNumber(meta.number)) || { number: normalizedNumber(meta.number), title: meta.title, file: "", parent: null };
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="${escapeHtml(meta.description || "A runnable RiX lesson")}" /><title>${escapeHtml(meta.title || "RiX tutorial")} — RatCalc</title><link rel="stylesheet" href="../assets/app.css" /><link rel="stylesheet" href="../assets/tutorial.css" /></head><body><main class="tutorial-page"><div class="tutorial-shell"><header class="tutorial-header"><a class="brand" href="../" aria-label="RatCalc home"><span class="rm-mark">R/M</span><span><b>RatCalc</b><small>powered by RiX</small></span></a><a href="../">Open calculator</a></header><div class="lesson-layout">${sidebar(current)}<article class="lesson-card"><p class="lesson-kicker">RiX walkthrough · ${escapeHtml(current.number)}</p><h1>${escapeHtml(meta.title || "RiX tutorial")}</h1><p class="deck">${escapeHtml(meta.description || "Read, run, then change the next line.")}</p><div class="lesson-content">${body}</div>${relatedFunctions(current)}${navigation(current)}<footer class="lesson-footer">Every cell above runs in this page and shares one RiX session. <a href="../">Open a fresh RatCalc session →</a></footer></article></div></div></main><dialog id="object-help-dialog" class="object-help-dialog"></dialog><script type="module" src="../assets/tutorial-runner.js"></script></body></html>`;
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
