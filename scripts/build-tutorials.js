import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

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

function runLink(code) {
    return `../?code=${encodeURIComponent(code)}`;
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
        html.push(`<section class="code-lesson"><header><span>Runnable RiX</span><button type="button" data-code="${escapeHtml(code)}">Open in workspace →</button></header><pre><code>${escapeHtml(code)}</code></pre></section>`);
        code = null;
    };
    const flushChallenge = () => {
        if (!challenge) return;
        const challengeCode = challenge.code || "# Write your RiX solution here\n";
        html.push(`<aside class="challenge"><p class="eyebrow">Challenge</p><h3>${escapeHtml(challenge.title || "Make it yours")}</h3><p>${escapeHtml(challenge.body.join(" "))}</p><button class="run-challenge" type="button" data-code="${escapeHtml(challengeCode)}">Try it in the workspace →</button></aside>`);
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

function pageTemplate(meta, body) {
    return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="${escapeHtml(meta.description || "A runnable RiX lesson")}" /><title>${escapeHtml(meta.title || "RiX tutorial")} — RiX Lab</title><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet" /><link rel="stylesheet" href="../assets/app.css" /><link rel="stylesheet" href="../assets/tutorial.css" /></head><body><div class="tutorial-page"><header class="topbar"><a class="brand" href="../" aria-label="RiX Lab home"><span class="brand-mark">R</span><span>RiX <b>Lab</b></span></a><nav><a href="../#workspace">Workspace</a><a href="../#learn">Lessons</a></nav></header><main class="tutorial-layout"><aside class="lesson-nav"><span>In this lesson</span><a href="#start">Start</a><a href="../">Open REPL →</a></aside><article class="lesson-content" id="start"><p class="lesson-kicker">RiX walkthrough · ${escapeHtml(meta.number || "01")}</p><h1>${escapeHtml(meta.title || "RiX tutorial")}</h1><p class="deck">${escapeHtml(meta.description || "Read, run, then change the next line.")}</p>${body}<footer class="lesson-footer">Ready for a blank page? <a href="../">Return to the RiX workspace →</a></footer></article></main></div><script>document.addEventListener('click', event => { const button = event.target.closest('[data-code]'); if (!button) return; location.href = '../?code=' + encodeURIComponent(button.dataset.code); });</script></body></html>`;
}

const markdownFiles = [];
for await (const file of new Bun.Glob("*.md").scan({ cwd: tutorialsDir })) markdownFiles.push(file);
for (const filename of markdownFiles) {
    const [meta, markdown] = parseFrontmatter(await Bun.file(path.join(tutorialsDir, filename)).text());
    await Bun.write(path.join(outDir, `${path.basename(filename, ".md")}.html`), pageTemplate(meta, renderMarkdown(markdown)));
}
