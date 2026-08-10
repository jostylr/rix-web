import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

await import("./generate-plugin-tutorial-index.js");
const { childrenOf, rootTutorials, tutorialByNumber, tutorials } = await import("../src/tutorial-index.js");
const { objectHelp } = await import("../src/tutorial-object-help.js");

const navigationOption = process.argv.find((argument) => argument.startsWith("--navigation="));
const navigationMode = navigationOption?.slice("--navigation=".length) || "dynamic";
if (!new Set(["dynamic", "static"]).has(navigationMode)) {
    throw new Error(`Unknown tutorial navigation mode: ${navigationMode}`);
}

const root = path.resolve(import.meta.dir, "..");
const tutorialsDir = path.join(root, "tutorials");
const outDir = path.join(root, "docs", "tutorial");
const tutorialAssetsDir = path.join(tutorialsDir, "assets");
const outTutorialAssetsDir = path.join(outDir, "assets");
const legacyOutDir = path.join(root, "docs", "learn");
const assetsDir = path.join(root, "docs", "assets");
await rm(legacyOutDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await mkdir(outTutorialAssetsDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });
await Bun.write(path.join(assetsDir, "tutorial.css"), await readFile(path.join(root, "src", "tutorial.css")));
await Bun.write(path.join(assetsDir, "tutorial-extra.css"), await readFile(path.join(root, "src", "tutorial-extra.css")));
await Bun.write(path.join(outTutorialAssetsDir, "exact-proof.svg"), await readFile(path.join(tutorialAssetsDir, "exact-proof.svg")));

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

function textareaRows(source, minimum = 5) {
    return Math.max(minimum, source.split("\n").length);
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

function renderMarkdown(markdown, {
    runnable = true,
    lint = false,
    lintProfile = "all",
    lintLevel = "pedantic",
} = {}) {
    const lines = markdown.split("\n");
    const html = [];
    let paragraph = [];
    let code = null;
    let codeLanguage = "";
    let challenge = null;
    const cellActions = (runLabel) => lint
        ? `<div class="tutorial-cell-actions"><button class="tutorial-lint-button" type="button" data-tutorial-lint data-lint-profile="${escapeHtml(lintProfile)}" data-lint-level="${escapeHtml(lintLevel)}">Lint cell</button><button type="button" data-tutorial-run>${runLabel}</button></div>`
        : `<button type="button" data-tutorial-run>${runLabel}</button>`;
    const flushParagraph = () => {
        if (!paragraph.length) return;
        html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
        paragraph = [];
    };
    const flushCode = () => {
        if (code === null) return;
        if (codeLanguage.split(/\s+/, 1)[0].toLowerCase() === "rix" && runnable) {
            html.push(`<section class="tutorial-cell${lint ? " tutorial-lint-cell" : ""}"><header><span>${lint ? "Live RiX lint" : "Runnable RiX"}</span>${cellActions("Run cell")}</header><textarea class="tutorial-source" data-tutorial-source rows="${textareaRows(code)}" spellcheck="false">${escapeHtml(code)}</textarea><div class="tutorial-output" data-tutorial-output${lint ? ' aria-live="polite"' : ""}></div></section>`);
        } else {
            const label = !runnable && codeLanguage.split(/\s+/, 1)[0].toLowerCase() === "rix" ? "Proposed RiX API" : codeLanguage || "code";
            html.push(`<section class="comparison-code"><header>${escapeHtml(label)}</header><pre><code>${escapeHtml(code)}</code></pre></section>`);
        }
        code = null;
        codeLanguage = "";
    };
    const flushChallenge = () => {
        if (!challenge) return;
        const challengeCode = challenge.code || "";
        html.push(`<aside class="challenge"><p class="eyebrow">Challenge</p><h3>${renderInline(challenge.title || "Make it yours")}</h3><p>${renderInline(challenge.body.join(" "))}</p><section class="tutorial-cell${lint ? " tutorial-lint-cell" : ""}"><header><span>Your RiX answer</span>${cellActions("Run answer")}</header><textarea class="tutorial-source" data-tutorial-source rows="${textareaRows(challengeCode)}" spellcheck="false" placeholder="# Write your RiX solution here">${escapeHtml(challengeCode)}</textarea><div class="tutorial-output" data-tutorial-output${lint ? ' aria-live="polite"' : ""}></div></section></aside>`);
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

function sidebarPlaceholder() {
    return `<aside id="lesson-sidebar" class="lesson-sidebar" data-tutorial-sidebar><p>Contents</p><a href="./index.html">Browse the tutorial index</a></aside>`;
}

function navigationPlaceholder() {
    return `<nav class="lesson-navigation" aria-label="Lesson navigation" data-tutorial-page-navigation><span class="previous-link"></span><span class="section-links"><a href="./index.html">Tutorial index</a></span><span class="next-link"></span></nav>`;
}

function staticSidebar(current) {
    const activeRoot = current.parent || current.number;
    return `<aside id="lesson-sidebar" class="lesson-sidebar"><p>Contents</p>${rootTutorials.map((root) => {
        const children = childrenOf(root.number);
        if (!children.length) return `<a class="${current.number === root.number ? "current" : ""}" href="./${root.file}">${escapeHtml(root.number)} · ${escapeHtml(root.title)}</a>`;
        return `<details ${activeRoot === root.number ? "open" : ""}><summary>${escapeHtml(root.number)} · ${escapeHtml(root.title)}</summary><a class="overview ${current.number === root.number ? "current" : ""}" href="./${root.file}">Overview</a>${children.map((child) => `<a class="${current.number === child.number ? "current" : ""}" href="./${child.file}">${escapeHtml(child.number)} · ${escapeHtml(child.title)}</a>`).join("")}</details>`;
    }).join("")}</aside>`;
}

function staticNavigation(current) {
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

function sidebar(current) {
    return navigationMode === "static" ? staticSidebar(current) : sidebarPlaceholder();
}

function pageNavigation(current) {
    return navigationMode === "static" ? staticNavigation(current) : navigationPlaceholder();
}

function relatedFunctions(current) {
    if (!current.object) return "";
    const methods = objectHelp[current.object]?.functions || [];
    return `<section class="related-functions"><h2>${escapeHtml(current.title)} reference</h2><p>Open a method for its full description and RiX examples.</p><ul>${methods.map(([name]) => `<li><button type="button" data-object-help="${escapeHtml(current.object)}" data-object-function="${escapeHtml(name)}"><code>${escapeHtml(name)}</code></button></li>`).join("")}</ul></section>`;
}

function referenceLinks(current) {
    const rootNumber = current.parent || current.number;
    const root = Number.parseInt(rootNumber, 10);
    const links = current.theme === "Renderers and exporters"
        ? [["Renderer plugin reference", "https://docs.rix.ratmath.com/eval/renderer-guide.html"]]
        : ({
        1: [["RiX introduction", "https://docs.rix.ratmath.com/introduction.html"]],
        2: [["Methods API", "https://docs.rix.ratmath.com/eval/methods-guide.html"], ["Collection syntax", "https://docs.rix.ratmath.com/eval/syntax-guide.html#collection-syntax"]],
        3: [["Syntax and operators", "https://docs.rix.ratmath.com/eval/syntax-guide.html#operators"], ["Number notation", "https://docs.rix.ratmath.com/introduction.html#number-systems-and-notation"]],
        4: [["Cells and assignments", "https://docs.rix.ratmath.com/design/eval/cells-assignments.html"], ["Destructuring reference", "https://docs.rix.ratmath.com/eval/syntax-guide.html#left-hand-destructuring"]],
        5: [["Functions reference", "https://docs.rix.ratmath.com/eval/syntax-guide.html#assignment-definition"], ["Function rationale", "https://docs.rix.ratmath.com/rix-rationales.html#multifunctions-2026-04-01"]],
        6: [["Control-flow syntax", "https://docs.rix.ratmath.com/eval/syntax-guide.html#brace-containers"], ["Ternary reference", "https://docs.rix.ratmath.com/eval/syntax-guide.html#ternary-operator"]],
        7: [["Pipes API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#pipe-operators"], ["Generator reference", "https://docs.rix.ratmath.com/parser/array-generators-implementation.html"]],
        8: [["Units and exact generators", "https://docs.rix.ratmath.com/design/eval/units-and-exact-generators.html"], ["Cayley polar design", "https://docs.rix.ratmath.com/design/eval/cayley-polar.html"], ["Types and traits API", "https://docs.rix.ratmath.com/eval/types-and-traits-guide.html"]],
        9: [["Backtick parsers", "https://docs.rix.ratmath.com/parser/embedded-parsing.html"], ["System function API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#part-2-system-function-reference"], ["Diagnostics API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#part-4-diagnostics-testing-and-debugging"]],
        10: [["Script imports", "https://docs.rix.ratmath.com/eval/syntax-guide.html#script-import-expressions"], ["Adding extensions", "https://docs.rix.ratmath.com/developer-guide.html#adding-a-user-facing-capability"]],
        11: [["RiX at a glance", "https://docs.rix.ratmath.com/language-at-a-glance.html"], ["Evaluator syntax API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#part-1-syntax-system-function"]],
        12: [["Structured output model", "https://docs.rix.ratmath.com/design/eval/output-model.html"], ["Sheet views", "https://docs.rix.ratmath.com/eval/sheet-guide.html"]],
        13: [["Evaluator syntax API", "https://docs.rix.ratmath.com/eval/syntax-guide.html#part-1-syntax-system-function"], ["Adding user-facing capabilities", "https://docs.rix.ratmath.com/developer-guide.html#adding-a-user-facing-capability"]],
    }[root] || []);
    if (!links.length) return "";
    return `<section class="api-links"><h2>Reference</h2><ul>${links.map(([label, url]) => `<li><a href="${url}" data-doc-reference target="_blank" rel="noreferrer">${escapeHtml(label)} ↗</a></li>`).join("")}</ul></section>`;
}

function tutorialIndexTemplate() {
    const renderContents = (roots) => roots.map((tutorial) => {
        const children = childrenOf(tutorial.number);
        return `<section class="tutorial-index-section"><a href="./${tutorial.file}"><b>${escapeHtml(tutorial.number)} · ${escapeHtml(tutorial.title)}</b><span>${escapeHtml(tutorial.description)}</span></a>${children.length ? `<div class="tutorial-index-children">${children.map((child) => `<a href="./${child.file}">${escapeHtml(child.number)} · ${escapeHtml(child.title)}</a>`).join("")}</div>` : ""}</section>`;
    }).join("");
    const coreRoots = rootTutorials.filter((tutorial) => !tutorial.pluginGroup);
    const pluginRoots = rootTutorials.filter((tutorial) => tutorial.pluginGroup);
    if (navigationMode === "static") {
        const pluginSection = pluginRoots.length ? `<h2>Plugin tutorials</h2><p class="tutorial-index-intro">Plugin lessons follow the core language. The recommended implementation path begins with Oracle Phase 1, Numerics Phase 1, SVG and Canvas, then proceeds through geometry, data/documents, additional real backends, and publication renderers. Implemented lessons are runnable; proposed lessons show their planned API without a Run button.</p><nav class="tutorial-index tutorial-plugin-index" aria-label="Plugin tutorial table of contents">${renderContents(pluginRoots)}</nav>` : "";
        return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="An interactive introduction to the RiX language and RatCalc." /><title>RiX tutorials — RatCalc</title><link rel="stylesheet" href="../assets/app.css" /><link rel="stylesheet" href="../assets/tutorial.css" /></head><body><main class="tutorial-page"><div class="tutorial-shell"><header class="tutorial-header"><a class="brand" href="../" aria-label="RatCalc home"><span class="rm-mark">R/M</span><span><b>RatCalc</b><small>powered by RiX</small></span></a><a href="../">Open calculator</a></header><article class="lesson-card tutorial-index-card"><p class="lesson-kicker">RiX walkthroughs</p><h1>Learn RiX by running it.</h1><p class="deck">These tutorials introduce RiX one concept at a time. Cells within one h2 topic share deterministic state; each new h2 starts fresh, so examples can be grouped without leaking names across topics.</p><p class="tutorial-index-intro">Start with exact numbers, then follow the topics that match what you want to build. Capstone lessons combine the material into a small practical exercise.</p><nav class="tutorial-index" aria-label="Tutorial table of contents">${renderContents(coreRoots)}</nav>${pluginSection}<footer class="lesson-footer">Want to try an expression first? <a href="../">Open RatCalc →</a></footer></article></div></main></body></html>`;
    }
    const pluginSection = pluginRoots.length ? `<section data-tutorial-index-section hidden><h2>Plugin tutorials</h2><p class="tutorial-index-intro">Plugin lessons follow the core language. The recommended implementation path begins with Oracle Phase 1, Numerics Phase 1, SVG and Canvas, then proceeds through geometry, data/documents, additional real backends, and publication renderers. Implemented lessons are runnable; proposed lessons show their planned API without a Run button.</p><nav class="tutorial-index tutorial-plugin-index" aria-label="Plugin tutorial table of contents" data-tutorial-index="plugins"></nav></section>` : "";
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="An interactive introduction to the RiX language and RatCalc." /><title>RiX tutorials — RatCalc</title><link rel="stylesheet" href="../assets/app.css" /><link rel="stylesheet" href="../assets/tutorial.css" /></head><body><main class="tutorial-page"><div class="tutorial-shell"><header class="tutorial-header"><a class="brand" href="../" aria-label="RatCalc home"><span class="rm-mark">R/M</span><span><b>RatCalc</b><small>powered by RiX</small></span></a><a href="../">Open calculator</a></header><article class="lesson-card tutorial-index-card"><p class="lesson-kicker">RiX walkthroughs</p><h1>Learn RiX by running it.</h1><p class="deck">These tutorials introduce RiX one concept at a time. Cells within one h2 topic share deterministic state; each new h2 starts fresh, so examples can be grouped without leaking names across topics.</p><p class="tutorial-index-intro">Start with exact numbers, then follow the topics that match what you want to build. Capstone lessons combine the material into a small practical exercise.</p><nav class="tutorial-index" aria-label="Tutorial table of contents" data-tutorial-index="core"><a href="./getting-started.html">Start the tutorial</a></nav>${pluginSection}<footer class="lesson-footer">Want to try an expression first? <a href="../">Open RatCalc →</a></footer></article></div></main><script type="module" src="../assets/tutorial-navigation-client.js"></script></body></html>`;
}

function pageTemplate(meta, body) {
    const current = tutorialByNumber(normalizedNumber(meta.number)) || { number: normalizedNumber(meta.number), title: meta.title, file: "", parent: null };
    const section = current.parent ? tutorialByNumber(current.parent) : current;
    const sectionHref = current.parent ? `./${section.file}#lesson-start` : "#lesson-start";
    const suffix = current.parent ? current.number.slice(section.number.length) : "";
    const suffixLabel = suffix ? ` <span aria-hidden="true">·</span> <span>${escapeHtml(suffix)}</span>` : "";
    const proposed = meta.status === "proposed";
    const statusNotice = proposed ? `<aside class="challenge"><p class="eyebrow">Proposed plugin</p><p>This acceptance tutorial documents planned behavior. Its RiX examples are displayed as code until the plugin is implemented and tested.</p></aside>` : "";
    const notebookNotice = meta.pluginId ? `<aside class="challenge"><p class="eyebrow">Develop in RiX Notebook</p><p>Open <code>rix/plugins/${escapeHtml(meta.pluginDirectory || meta.pluginId)}/tutorial.md</code> in the macOS app to edit this lesson with live preview and plugin-aware code results. Use Reload plugins after changing project-local plugin source.</p></aside>` : "";
    const footer = proposed ? `This is a design tutorial; its examples become runnable when Phase 1 is implemented.` : `Every RiX cell above runs in this page. Cells share state within an h2 topic; each new h2 starts fresh.`;
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="${escapeHtml(meta.description || "A runnable RiX lesson")}" /><title>${escapeHtml(meta.title || "RiX tutorial")} — RatCalc</title><link rel="stylesheet" href="../assets/app.css" /><link rel="stylesheet" href="../assets/tutorial.css" /><link rel="stylesheet" href="../assets/tutorial-extra.css" /></head><body><main class="tutorial-page"><div class="tutorial-shell"><header class="tutorial-header"><a class="brand" href="../" aria-label="RatCalc home"><span class="rm-mark">R/M</span><span><b>RatCalc</b><small>powered by RiX</small></span></a><div class="tutorial-header-actions"><button id="tutorial-contents-toggle" type="button" data-toggle-contents aria-controls="lesson-sidebar" aria-expanded="false">Contents</button><a href="../">Open calculator</a></div></header><div class="lesson-layout">${sidebar(current)}<article id="lesson-start" class="lesson-card"><p class="lesson-kicker"><a href="./index.html">RiX walkthrough</a> <span aria-hidden="true">·</span> <a href="${sectionHref}" title="${escapeHtml(section.title)}">${escapeHtml(section.number)}</a>${suffixLabel}</p><h1>${escapeHtml(meta.title || "RiX tutorial")}</h1><p class="deck">${escapeHtml(meta.description || "Read, run, then change the next line.")}</p>${statusNotice}${notebookNotice}<div class="lesson-content">${body}</div>${relatedFunctions(current)}${referenceLinks(current)}${pageNavigation(current)}<footer class="lesson-footer">${footer} <a href="../">Open a fresh RatCalc session →</a></footer></article><aside id="tutorial-docs-panel" class="tutorial-docs-panel" aria-label="RiX documentation" hidden><header><span id="tutorial-docs-title">RiX documentation</span><div><a id="tutorial-docs-external" href="https://docs.rix.ratmath.com/" target="_blank" rel="noreferrer">Open in new tab</a><button type="button" data-close-tutorial-docs aria-label="Close documentation">×</button></div></header><iframe id="tutorial-docs-frame" src="https://docs.rix.ratmath.com/" title="RiX documentation"></iframe></aside></div></div></main><dialog id="object-help-dialog" class="object-help-dialog"></dialog><script type="module" src="../assets/tutorial-runner.js"></script></body></html>`;
}

const markdownFiles = [];
for await (const file of new Bun.Glob("*.md").scan({ cwd: tutorialsDir })) markdownFiles.push(file);
const generatedFiles = new Set();
for (const filename of markdownFiles) {
    const [meta, markdown] = parseFrontmatter(await Bun.file(path.join(tutorialsDir, filename)).text());
    await Bun.write(path.join(outDir, `${path.basename(filename, ".md")}.html`), pageTemplate(meta, renderMarkdown(markdown, {
        lint: meta.lint === "true",
        lintProfile: meta.lintProfile || "all",
        lintLevel: meta.lintLevel || "pedantic",
    })));
    generatedFiles.add(`${path.basename(filename, ".md")}.html`);
}
for (const lesson of tutorials.filter((item) => item.pluginTutorial)) {
    const [meta, markdown] = parseFrontmatter(await Bun.file(path.resolve(root, lesson.sourcePath)).text());
    const mergedMeta = { ...meta, number: lesson.number, title: lesson.title, description: lesson.description, status: lesson.status, pluginId: lesson.pluginId, pluginDirectory: lesson.pluginDirectory };
    await Bun.write(path.join(outDir, lesson.file), pageTemplate(mergedMeta, renderMarkdown(markdown, { runnable: lesson.status !== "proposed" })));
    generatedFiles.add(lesson.file);
}
for (const group of tutorials.filter((item) => item.pluginGroup)) {
    const children = childrenOf(group.number);
    const body = `<p>These optional packages share the <strong>${escapeHtml(group.theme)}</strong> theme. Phase 1 lessons emphasize one useful end-to-end result, documentation, tests, and a tutorial before the APIs become broad.</p><div class="tutorial-index-children">${children.map((child) => `<a href="./${child.file}">${escapeHtml(child.title)}${child.status === "proposed" ? " · proposed" : ""}</a>`).join("")}</div>`;
    await Bun.write(path.join(outDir, group.file), pageTemplate(group, body));
    generatedFiles.add(group.file);
}
for (const lesson of tutorials) {
    if (!generatedFiles.has(lesson.file)) {
        throw new Error(`Missing Markdown source for tutorial ${lesson.number}: ${lesson.file.replace(/\.html$/, ".md")}`);
    }
}
await Bun.write(path.join(outDir, "index.html"), tutorialIndexTemplate());
await Bun.write(path.join(outDir, "navigation.json"), `${JSON.stringify({
    version: 1,
    tutorials: tutorials.map(({
        number, parent, file, title, description, pluginGroup = false, status = "implemented",
    }) => ({ number, parent, file, title, description, pluginGroup, status })),
}, null, 2)}\n`);
console.log(`Built tutorial navigation in ${navigationMode} mode`);
