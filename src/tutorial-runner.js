import { createRixRepl } from "./repl-runtime.js";
import { objectHelp } from "./tutorial-index.js";
import { replayTutorialSources, tutorialSectionCells } from "./tutorial-replay.js";
import { applyTutorialEditorKey } from "./tutorial-editor.js";
import { formatValue, mountOutputWidgets } from "../../rix/src/index.js";

const outputDisposers = new WeakMap();

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;",
    })[character]);
}

function sizeTutorialSource(input) {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
}

function revealTutorialOutput(output) {
    requestAnimationFrame(() => output.scrollIntoView({ behavior: "smooth", block: "nearest" }));
}

function insertTutorialText(input, text) {
    const untouchedStart = input.selectionStart === 0 && input.selectionEnd === 0 && document.activeElement !== input;
    const start = untouchedStart ? input.value.length : input.selectionStart ?? input.value.length;
    const end = untouchedStart ? start : input.selectionEnd ?? start;
    const insertion = start === input.value.length && start === end && input.value && !input.value.endsWith("\n")
        ? `\n${text}`
        : text;
    input.value = `${input.value.slice(0, start)}${insertion}${input.value.slice(end)}`;
    input.selectionStart = input.selectionEnd = start + insertion.length;
    sizeTutorialSource(input);
    input.focus();
}

function replayThrough(cell) {
    const content = cell.closest(".lesson-content") || document;
    const entries = [...content.querySelectorAll("h2, .tutorial-cell")].map((node) => ({
        type: node.matches("h2") ? "heading" : "cell",
        value: node,
    }));
    const cells = tutorialSectionCells(entries, cell);
    return replayTutorialSources(
        cells.map((candidate) => candidate.querySelector("[data-tutorial-source]")?.value),
        cells.length - 1,
        createRixRepl,
    );
}

function runCell(cell) {
    const sourceInput = cell.querySelector("[data-tutorial-source]");
    const response = replayThrough(cell);
    if (!response) return;
    const output = cell.querySelector("[data-tutorial-output]");
    outputDisposers.get(output)?.();
    outputDisposers.delete(output);
    if (response.type === "help") {
        const lines = response.groups.flatMap((group) => group.items.map(([syntax, description]) => `${syntax} — ${description}`));
        output.innerHTML = `<div class="result">${escapeHtml(lines.join("\n"))}</div>`;
        revealTutorialOutput(output);
        return;
    }
    if (response.type !== "error" && response.html) {
        const result = document.createElement("div");
        result.className = "result rich-output";
        result.innerHTML = response.html;
        output.replaceChildren(result);
        const dispose = mountOutputWidgets(result, response.value, {
            format: formatValue,
            observe: response.observe
                ? (listener) => response.observe((next) => listener(next.value))
                : null,
            onActivate: ({ address }) => insertTutorialText(sourceInput, address),
            evaluateEdit: (editSource, { mode }) => response.repl.run(mode === "formula"
                ? `@{ ${editSource} }`
                : editSource),
        });
        outputDisposers.set(output, dispose);
        revealTutorialOutput(output);
        return;
    }
    output.innerHTML = `<div class="${response.type === "error" ? "error" : "result"}">${escapeHtml(response.text)}</div>`;
    revealTutorialOutput(output);
}

function openDocumentation(link) {
    const panel = document.querySelector("#tutorial-docs-panel");
    if (!panel) return;
    const url = link.href;
    panel.hidden = false;
    document.querySelector(".tutorial-shell")?.classList.add("docs-open");
    document.querySelector("#tutorial-docs-title").textContent = link.textContent.replace(/\s*↗\s*$/, "").trim();
    document.querySelector("#tutorial-docs-external").href = url;
    const frame = document.querySelector("#tutorial-docs-frame");
    if (frame.src !== url) frame.src = url;
}

function closeDocumentation() {
    document.querySelector("#tutorial-docs-panel").hidden = true;
    document.querySelector(".tutorial-shell")?.classList.remove("docs-open");
}

function toggleContents() {
    const shell = document.querySelector(".tutorial-shell");
    if (window.matchMedia("(max-width: 760px)").matches) {
        const expanded = shell.classList.toggle("sidebar-expanded");
        const toggle = document.querySelector("#tutorial-contents-toggle");
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.textContent = expanded ? "Hide contents" : "Contents";
        return;
    }
    const collapsed = shell.classList.toggle("sidebar-collapsed");
    const toggle = document.querySelector("#tutorial-contents-toggle");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.textContent = collapsed ? "Show contents" : "Contents";
}

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tutorial-run]");
    if (button) runCell(button.closest(".tutorial-cell"));
    const objectButton = event.target.closest("[data-object-help]");
    if (objectButton) openObjectHelp(objectButton.dataset.objectHelp, objectButton.dataset.objectFunction);
    const reference = event.target.closest("[data-doc-reference]");
    if (reference) { event.preventDefault(); openDocumentation(reference); }
    if (event.target.closest("[data-close-object-help]")) document.querySelector("#object-help-dialog")?.close();
    if (event.target.closest("[data-close-tutorial-docs]")) closeDocumentation();
    if (event.target.closest("[data-toggle-contents]")) toggleContents();
});
const tutorialSources = document.querySelectorAll("[data-tutorial-source]");
tutorialSources.forEach((input) => {
    input.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            runCell(input.closest(".tutorial-cell"));
            return;
        }
        const edit = applyTutorialEditorKey(input.value, input.selectionStart ?? 0, input.selectionEnd ?? 0, event);
        if (edit) {
            event.preventDefault();
            input.value = edit.value;
            input.selectionStart = edit.start;
            input.selectionEnd = edit.end;
            sizeTutorialSource(input);
        }
    });
});

requestAnimationFrame(() => tutorialSources.forEach(sizeTutorialSource));

document.querySelector("#object-help-dialog")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
});

const contentsToggle = document.querySelector("#tutorial-contents-toggle");
const contentsSidebar = document.querySelector("#lesson-sidebar");
if (contentsToggle && contentsSidebar) {
    requestAnimationFrame(() => {
        contentsToggle.setAttribute("aria-expanded", String(getComputedStyle(contentsSidebar).display !== "none"));
    });
}

function openObjectHelp(name, requestedFunction = null) {
    const entry = objectHelp[name];
    if (!entry) return;
    const functions = requestedFunction
        ? entry.functions.filter(([functionName]) => functionName === requestedFunction)
        : entry.functions;
    const dialog = document.querySelector("#object-help-dialog");
    dialog.innerHTML = `<header><div><h2>${escapeHtml(requestedFunction || entry.title)}</h2><p>${escapeHtml(entry.intro)}</p></div><button type="button" data-close-object-help aria-label="Close object help">×</button></header><div class="object-help-body">${functions.map(([nameText, syntax, description, example]) => `<section><h3>${escapeHtml(nameText)}</h3><code>${escapeHtml(syntax)}</code><p>${escapeHtml(description)}</p><pre>${escapeHtml(example)}</pre></section>`).join("")}</div>`;
    dialog.showModal();
}
