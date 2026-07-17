import { createRixRepl } from "./repl-runtime.js";
import { objectHelp } from "./tutorial-index.js";

const repl = createRixRepl();

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;",
    })[character]);
}

function runCell(cell) {
    const source = cell.querySelector("[data-tutorial-source]").value.trim();
    if (!source) return;
    const response = repl.run(source);
    const output = cell.querySelector("[data-tutorial-output]");
    if (response.type === "help") {
        const lines = response.groups.flatMap((group) => group.items.map(([syntax, description]) => `${syntax} — ${description}`));
        output.innerHTML = `<div class="result">${escapeHtml(lines.join("\n"))}</div>`;
        return;
    }
    output.innerHTML = `<div class="${response.type === "error" ? "error" : "result"}">${escapeHtml(response.text)}</div>`;
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
document.querySelectorAll("[data-tutorial-source]").forEach((input) => {
    input.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            runCell(input.closest(".tutorial-cell"));
        }
    });
});

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
