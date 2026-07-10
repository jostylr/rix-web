import {
    Context,
    createDefaultRegistry,
    createDefaultSystemContext,
    formatValue,
    parseAndEvaluate,
} from "../../rix/src/index.js";
import { installSymbolicBindings } from "../../rix/src/eval/functions/symbolic.js";
import { normalizeReplSource } from "./repl-source.js";

const starterCode = `radius := 7
area := radius ^ 2 * 22 / 7
area`;
const storageKey = "rix-lab:editor";
const codeInput = document.querySelector("#code-input");
const flow = document.querySelector("#result-flow");
const variablesPanel = document.querySelector("#variables-panel");
const helpDialog = document.querySelector("#help-dialog");
const moduleDialog = document.querySelector("#module-dialog");
const fileInput = document.querySelector("#file-input");
const modulePreview = document.querySelector("#module-preview");

const state = {
    context: new Context(),
    registry: createDefaultRegistry(),
    systemContext: createDefaultSystemContext(),
    runCount: 0,
};
installSymbolicBindings(state.context);

const helpGroups = [
    {
        title: "Everyday syntax",
        items: [
            ["x := 3", "Bind a fresh value. Use this for ordinary assignments."],
            ["y = x", "Alias x's cell. An in-place update to either name is shared."],
            ["x ~= 9", "Replace the value in an existing cell, preserving aliases."],
            ["7 / 2", "Exact division. The result remains the rational 7/2."],
        ],
    },
    {
        title: "Collections & intervals",
        items: [
            ["[1, 2, 3]", "An array. Indexes begin at 1: a[2] is 2."],
            ["{| 1, 2 |}", "A set."],
            ["{= a=3, b=5 }", "A map."],
            ["2:5", "A rational interval from 2 to 5."],
        ],
    },
    {
        title: "Functions & capabilities",
        items: [
            ["Square(x) -> x ^ 2", "Define a callable with an uppercase name."],
            ["Square(12)", "Call a user-defined function."],
            [".SIN(x)", "Call a system capability via the dot prefix."],
            ["x > 0 ?? x ?: -x", "A compact conditional expression."],
        ],
    },
    {
        title: "Notebook commands",
        items: [
            ["Run cell", "Evaluate the editor in the current workspace. Results flow into the trail below."],
            ["New line", "At the top level of a notebook cell, a completed line starts the next statement. Use semicolons when you prefer explicit separators."],
            ["New session", "Clear variables and start a fresh persistent workspace."],
            ["Load .rix", "Put a RiX file into the editor, ready to run."],
            ["Load .js", "Preview a JavaScript module; execution is intentionally reserved for an explicit trust model."],
        ],
    },
];

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;",
    })[character]);
}

function sourcePreview(source) {
    const lines = source.trim().split("\n");
    return lines.length > 7 ? `${lines.slice(0, 7).join("\n")}\n…` : source.trim();
}

function resetWorkspace() {
    state.context.clear();
    installSymbolicBindings(state.context);
    state.runCount = 0;
    flow.innerHTML = `<div class="empty-flow"><span>→</span><p>Fresh workspace, clear trail.<br />Your next result starts here.</p></div>`;
    renderVariables();
}

function renderVariables() {
    const names = state.context.getAllNames();
    if (names.length === 0) {
        variablesPanel.innerHTML = `<p class="mini-heading">Current scope</p><p class="variables-empty">No names yet. Run a line with <code>:=</code> to keep a value.</p>`;
        return;
    }
    const items = names.map((name) => {
        let preview = "function";
        try {
            preview = formatValue(state.context.get(name), { context: state.context, evaluate: null });
        } catch {
            preview = "value";
        }
        return `<li><code>${escapeHtml(name)}</code><span>${escapeHtml(preview)}</span></li>`;
    }).join("");
    variablesPanel.innerHTML = `<p class="mini-heading">Current scope · ${names.length}</p><ul class="variable-list">${items}</ul>`;
}

function appendResult(source, result, error = null) {
    state.runCount += 1;
    flow.querySelector(".empty-flow")?.remove();
    const output = error
        ? error.message || String(error)
        : formatValue(result, { context: state.context, evaluate: null });
    const card = document.createElement("article");
    card.className = `result-card${error ? " error" : ""}`;
    card.innerHTML = `<div class="result-index">${String(state.runCount).padStart(2, "0")}</div>
      <div class="result-body"><pre class="result-source">${escapeHtml(sourcePreview(source))}</pre>
      <div class="result-output"><span class="result-badge">${error ? "error" : "result"}</span><code>${escapeHtml(output)}</code></div></div>`;
    flow.prepend(card);
}

function runCode() {
    const source = codeInput.value.trim();
    if (!source) return;
    try {
        const result = parseAndEvaluate(normalizeReplSource(source), {
            context: state.context,
            registry: state.registry,
            systemContext: state.systemContext,
            file: "<browser-repl>",
        });
        appendResult(source, result);
        renderVariables();
    } catch (error) {
        appendResult(source, null, error);
        renderVariables();
    }
}

function renderHelp(query = "") {
    const normalized = query.trim().toLowerCase();
    const groups = helpGroups.map((group) => ({
        ...group,
        items: group.items.filter(([syntax, description]) => !normalized || `${syntax} ${description} ${group.title}`.toLowerCase().includes(normalized)),
    })).filter((group) => group.items.length > 0);
    document.querySelector("#help-content").innerHTML = groups.length
        ? groups.map((group) => `<section class="help-group"><h3>${group.title}</h3>${group.items.map(([syntax, description]) => `<div class="help-item"><code>${escapeHtml(syntax)}</code><p>${escapeHtml(description)}</p></div>`).join("")}</section>`).join("")
        : `<p class="variables-empty">No matching reference entry. Try “array”, “assignment”, or “function”.</p>`;
}

function openHelp() {
    renderHelp();
    helpDialog.showModal();
    document.querySelector("#help-search-input").focus();
}

function saveCode() {
    const blob = new Blob([codeInput.value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "experiment.rix";
    anchor.click();
    URL.revokeObjectURL(url);
}

async function loadFile(file) {
    const text = await file.text();
    if (file.name.toLowerCase().endsWith(".js")) {
        modulePreview.textContent = text.slice(0, 1800);
        moduleDialog.showModal();
        return;
    }
    codeInput.value = text;
    localStorage.setItem(storageKey, text);
    codeInput.focus();
}

function loadTutorialCode() {
    const encoded = new URLSearchParams(location.search).get("code");
    if (!encoded) return false;
    try {
        codeInput.value = decodeURIComponent(encoded);
        history.replaceState({}, "", location.pathname);
        return true;
    } catch {
        return false;
    }
}

document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;
    const action = trigger.dataset.action;
    if (action === "run") runCode();
    if (action === "reset") resetWorkspace();
    if (action === "load") fileInput.click();
    if (action === "save") saveCode();
    if (action === "help") openHelp();
    if (action === "close-help") helpDialog.close();
    if (action === "close-module") moduleDialog.close();
    if (action === "clear-results") {
        state.runCount = 0;
        flow.innerHTML = `<div class="empty-flow"><span>→</span><p>The trail is clear.<br />Your next result will land here.</p></div>`;
    }
});

document.querySelectorAll("[data-inspector]").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelectorAll("[data-inspector]").forEach((item) => item.classList.toggle("active", item === button));
        variablesPanel.classList.toggle("hidden", button.dataset.inspector !== "variables");
        document.querySelector("#quick-help-panel").classList.toggle("hidden", button.dataset.inspector !== "help");
    });
});

document.querySelector("#help-search-input").addEventListener("input", (event) => renderHelp(event.target.value));
fileInput.addEventListener("change", async () => {
    const [file] = fileInput.files;
    if (file) await loadFile(file);
    fileInput.value = "";
});
codeInput.addEventListener("input", () => localStorage.setItem(storageKey, codeInput.value));
codeInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runCode();
    }
    if (event.key === "Tab") {
        event.preventDefault();
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;
        codeInput.setRangeText("  ", start, end, "end");
    }
});

const loadedFromTutorial = loadTutorialCode();
if (!loadedFromTutorial) codeInput.value = localStorage.getItem(storageKey) || starterCode;
renderVariables();
