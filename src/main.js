import { createRixRepl, findHelp } from "./repl-runtime.js";

const repl = createRixRepl();
const outputHistory = document.querySelector("#output-history");
const input = document.querySelector("#calculator-input");
const completionGhost = document.querySelector("#completion-ghost");
const completionHint = document.querySelector("#completion-hint");
const calculator = document.querySelector(".calculator");
const scriptToggle = document.querySelector("#script-toggle");
const lineSeparatorToggle = document.querySelector("#line-separator-toggle");
const scriptNote = document.querySelector("#script-note");
const helpDialog = document.querySelector("#help-dialog");
const helpSearch = document.querySelector("#help-search");
const helpContent = document.querySelector("#help-content");
const fileInput = document.querySelector("#file-input");
const docsPanel = document.querySelector("#docs-panel");
const docsToggle = document.querySelector("#docs-toggle");
const inspectDialog = document.querySelector("#inspect-dialog");
const inspectSource = document.querySelector("#inspect-source");
const inspectValue = document.querySelector("#inspect-value");

let scriptMode = false;
let history = [];
let historyIndex = -1;
let transcript = [];
let autoSeparateLines = true;
let completionState = null;

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;",
    })[character]);
}

function scrollTranscript() {
    requestAnimationFrame(() => { outputHistory.scrollTop = outputHistory.scrollHeight; });
}

function setInput(value) {
    clearCompletion();
    input.value = value;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
    input.focus();
}

function clearCompletion() {
    completionState = null;
    completionGhost.replaceChildren();
    completionHint.hidden = true;
    completionHint.replaceChildren();
}

function renderCompletion() {
    if (!completionState) return;
    const candidate = completionState.result.candidates[completionState.index];
    const { from, to } = completionState.result;
    const typed = input.value.slice(from, to);
    const startsWithTyped = candidate.insertText.toLowerCase().startsWith(typed.toLowerCase());
    const suffix = startsWithTyped ? candidate.insertText.slice(typed.length) : "";
    completionGhost.replaceChildren(document.createTextNode(input.value.slice(0, to)), Object.assign(document.createElement("span"), { className: "suffix", textContent: suffix }));
    completionGhost.scrollTop = input.scrollTop;
    completionHint.hidden = false;
    completionHint.innerHTML = `<b>${escapeHtml(candidate.insertText)}</b> · ${escapeHtml(candidate.detail)}${candidate.preview ? ` — ${escapeHtml(candidate.preview)}` : ""}`;
}

function beginCompletion() {
    if (input.selectionStart !== input.selectionEnd) return clearCompletion();
    const result = repl.complete(input.value, input.selectionStart);
    if (!result.candidates.length) return clearCompletion();
    completionState = { result, index: 0 };
    renderCompletion();
}

function moveCompletion(direction) {
    if (!completionState) return false;
    const { candidates } = completionState.result;
    completionState.index = (completionState.index + direction + candidates.length) % candidates.length;
    renderCompletion();
    return true;
}

function acceptCompletion() {
    if (!completionState) return false;
    const { from, to, candidates } = completionState.result;
    const candidate = candidates[completionState.index];
    const value = `${input.value.slice(0, from)}${candidate.insertText}${input.value.slice(to)}`;
    const cursor = from + candidate.insertText.length;
    clearCompletion();
    input.value = value;
    input.selectionStart = input.selectionEnd = cursor;
    setInput(value);
    return true;
}

function appendOutput(source, response) {
    const entry = document.createElement("article");
    entry.className = "output-entry";
    const sourceLine = document.createElement("div");
    sourceLine.className = "input-line";
    sourceLine.innerHTML = `<span class="prompt">&gt;</span>${escapeHtml(source)}<span class="reload-icon" title="Reload expression">↻</span>`;
    sourceLine.addEventListener("click", () => setInput(source));
    entry.appendChild(sourceLine);

    if (response.type === "help") {
        entry.appendChild(inlineHelp(response));
    } else {
        const outputLine = document.createElement("div");
        const inspectable = response.text.includes("\n");
        const preview = inspectable ? `${response.text.split("\n")[0]}\n… inspect full result` : response.text;
        outputLine.className = `${response.type === "error" ? "error-line" : "output-line"}${inspectable ? " truncated" : ""}`;
        outputLine.innerHTML = response.type === "error"
            ? escapeHtml(preview)
            : `${escapeHtml(preview)}<span class="inject-icon" title="Use this value">→</span>`;
        if (inspectable) outputLine.addEventListener("click", () => openInspection(source, response.text));
        else if (response.type === "result") outputLine.addEventListener("click", () => setInput(response.text));
        entry.appendChild(outputLine);
    }
    outputHistory.appendChild(entry);
    transcript.push({ source, text: response.type === "help" ? `.Help: ${response.query || "all topics"}` : response.text });
    scrollTranscript();
}

function inlineHelp({ query, groups }) {
    const panel = document.createElement("section");
    panel.className = "inline-help";
    const title = query ? `Help for “${escapeHtml(query)}”` : "RiX and RatCalc help";
    const body = groups.length
        ? groups.map((group) => `<h4>${escapeHtml(group.title)}</h4><ul>${group.items.map(([syntax, description]) => `<li><code>${escapeHtml(syntax)}</code> — ${escapeHtml(description)}</li>`).join("")}</ul>`).join("")
        : `<p>No help topic matched “${escapeHtml(query)}”. Try <code>.Help("interval")</code>.</p>`;
    panel.innerHTML = `<h3>${title}</h3>${body}`;
    return panel;
}

function renderHelp(query = "") {
    const { groups } = findHelp(query);
    const intro = query ? "" : `<section class="help-intro"><b>Welcome to RatCalc.</b><br />Type an exact expression and press Enter. Use <code>:=</code> for a fresh value, <code>2:5</code> for an interval, and <code>.Help(\"topic\")</code> when you want help printed directly in the transcript.</section>`;
    const sections = groups.length
        ? groups.map((group) => `<section class="help-group"><h3>${escapeHtml(group.title)}</h3>${group.items.map(([syntax, description]) => `<div class="help-item"><code>${escapeHtml(syntax)}</code><p>${escapeHtml(description)}</p></div>`).join("")}</section>`).join("")
        : `<p class="help-intro">No matching help topic. Try “interval”, “function”, or “assignment”.</p>`;
    helpContent.innerHTML = intro + sections;
}

function openHelp(query = "") {
    helpSearch.value = query;
    renderHelp(query);
    helpDialog.showModal();
    helpSearch.focus();
}

function setDocsOpen(next) {
    docsPanel.hidden = !next;
    document.querySelector(".container").classList.toggle("docs-open", next);
    docsToggle.setAttribute("aria-pressed", String(next));
    docsToggle.textContent = next ? "Close docs" : "Docs";
}

function openInspection(source, value) {
    inspectSource.textContent = source;
    inspectValue.textContent = value;
    inspectDialog.showModal();
}

function clearSession() {
    repl.reset();
    history = [];
    historyIndex = -1;
    transcript = [];
    outputHistory.innerHTML = "";
    displayWelcome();
    setInput("");
}

function displayWelcome() {
    const welcome = document.createElement("section");
    welcome.className = "welcome";
    welcome.innerHTML = `<b>Welcome to RatCalc!</b><br />Type a RiX expression and press Enter to calculate.<br />Use <code>.help</code> for the guide or <code>.Help("interval")</code> for inline help.`;
    outputHistory.appendChild(welcome);
}

function showVariables(source) {
    const variables = repl.variables();
    const text = variables.length
        ? `Variables:\n${variables.map(({ name, value }) => `  ${name} = ${value}`).join("\n")}`
        : "No variables or functions defined.";
    appendOutput(source, { type: "result", text });
}

function execute(source = input.value) {
    const command = source.trim();
    if (!command) return;
    if (/^\.help(?:\s+.*)?$/i.test(command)) {
        openHelp(command.replace(/^\.help/i, "").trim());
        setInput("");
        return;
    }
    if (/^\.clear$/i.test(command)) { clearSession(); return; }
    if (/^\.vars$/i.test(command)) { showVariables(source); setInput(""); return; }

    if (history.at(-1) !== source) history.push(source);
    historyIndex = -1;
    const response = repl.run(source);
    appendOutput(source, response);
    setInput("");
}

function setScriptMode(next) {
    scriptMode = next;
    calculator.classList.toggle("script-mode", scriptMode);
    scriptToggle.classList.toggle("active", scriptMode);
    scriptToggle.setAttribute("aria-pressed", String(scriptMode));
    scriptToggle.textContent = `Script entry: ${scriptMode ? "on" : "off"}`;
    scriptNote.hidden = !scriptMode;
    document.querySelector("#entry-mode-label").textContent = scriptMode
        ? "Script mode · Enter adds a line · Ctrl/⌘ + Enter runs"
        : "Command mode · Enter runs · Shift+↑ edits a script";
    setInput(input.value);
}

function setAutoSeparateLines(next) {
    autoSeparateLines = next;
    repl.setAutoSeparateLines(autoSeparateLines);
    lineSeparatorToggle.classList.toggle("active", autoSeparateLines);
    lineSeparatorToggle.setAttribute("aria-pressed", String(autoSeparateLines));
    lineSeparatorToggle.textContent = `Auto-separate lines: ${autoSeparateLines ? "on" : "off"}`;
}

function continueCommand() {
    const position = input.selectionStart;
    const before = input.value.slice(0, position);
    const after = input.value.slice(position);
    const slash = before.lastIndexOf("\\");
    input.value = `${before.slice(0, slash)}\n${after}`;
    input.selectionStart = input.selectionEnd = slash + 1;
    setInput(input.value);
}

function navigateHistory(direction) {
    if (scriptMode || history.length === 0) return;
    if (direction < 0) historyIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
    else historyIndex = historyIndex >= history.length - 1 ? -1 : historyIndex + 1;
    setInput(historyIndex < 0 ? "" : history[historyIndex]);
}

async function loadFile(file) {
    const text = await file.text();
    if (file.name.toLowerCase().endsWith(".js")) {
        appendOutput(`.load ${file.name}`, { type: "result", text: "JavaScript module selected. Browser execution is intentionally held behind a future trust policy." });
    } else {
        setScriptMode(true);
        setInput(text);
    }
}

document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (!control) return;
    switch (control.dataset.action) {
    case "run": execute(); break;
    case "help": openHelp(); break;
    case "close-help": helpDialog.close(); input.focus(); break;
    case "docs": setDocsOpen(docsPanel.hidden); break;
    case "close-docs": setDocsOpen(false); input.focus(); break;
    case "close-inspect": inspectDialog.close(); input.focus(); break;
    case "clear": clearSession(); break;
    case "script": setScriptMode(!scriptMode); break;
    case "line-separators": setAutoSeparateLines(!autoSeparateLines); break;
    case "copy": navigator.clipboard?.writeText(transcript.map((entry) => `> ${entry.source}\n${entry.text}`).join("\n\n")); break;
    case "load": fileInput.click(); break;
    default: break;
    }
});

input.addEventListener("input", () => setInput(input.value));
input.addEventListener("scroll", () => { if (completionState) renderCompletion(); });
input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") { event.preventDefault(); if (!acceptCompletion()) beginCompletion(); return; }
    if (event.key === "ArrowUp" && moveCompletion(-1)) { event.preventDefault(); return; }
    if (event.key === "ArrowDown" && moveCompletion(1)) { event.preventDefault(); return; }
    if (event.key === "ArrowRight" && acceptCompletion()) { event.preventDefault(); return; }
    if ((event.key === "ArrowLeft" || event.key === "Escape") && completionState) { event.preventDefault(); clearCompletion(); return; }
    // Keep ordinary arrows available for moving through a multiline textarea.
    // Shift+ArrowUp/Down are deliberate mode changes rather than history navigation.
    if (event.shiftKey && event.key === "ArrowUp") {
        event.preventDefault();
        setScriptMode(true);
        return;
    }
    if (event.shiftKey && event.key === "ArrowDown") {
        event.preventDefault();
        setScriptMode(false);
        return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); execute(); return; }
    if (event.key === "Enter" && !scriptMode) {
        event.preventDefault();
        const currentLine = input.value.slice(0, input.selectionStart).split("\n").at(-1).trimEnd();
        if (currentLine.endsWith("\\")) continueCommand();
        else execute();
        return;
    }
    if (event.key === "ArrowUp" && input.selectionStart === 0) { event.preventDefault(); navigateHistory(-1); }
    if (event.key === "ArrowDown" && input.selectionStart === input.value.length) { event.preventDefault(); navigateHistory(1); }
});
helpSearch.addEventListener("input", () => renderHelp(helpSearch.value));
fileInput.addEventListener("change", async () => { const [file] = fileInput.files; if (file) await loadFile(file); fileInput.value = ""; });
[helpDialog, inspectDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });
});

displayWelcome();
setAutoSeparateLines(autoSeparateLines);
input.focus();
