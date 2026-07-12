import {
  createRixRepl,
  objectHelp
} from "./chunk-p6zbrad8.js";

// src/tutorial-runner.js
var repl = createRixRepl();
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  })[character]);
}
function runCell(cell) {
  const source = cell.querySelector("[data-tutorial-source]").value.trim();
  if (!source)
    return;
  const response = repl.run(source);
  const output = cell.querySelector("[data-tutorial-output]");
  if (response.type === "help") {
    const lines = response.groups.flatMap((group) => group.items.map(([syntax, description]) => `${syntax} — ${description}`));
    output.innerHTML = `<div class="result">${escapeHtml(lines.join(`
`))}</div>`;
    return;
  }
  output.innerHTML = `<div class="${response.type === "error" ? "error" : "result"}">${escapeHtml(response.text)}</div>`;
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tutorial-run]");
  if (button)
    runCell(button.closest(".tutorial-cell"));
  const objectButton = event.target.closest("[data-object-help]");
  if (objectButton)
    openObjectHelp(objectButton.dataset.objectHelp, objectButton.dataset.objectFunction);
  if (event.target.closest("[data-close-object-help]"))
    document.querySelector("#object-help-dialog")?.close();
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
  if (event.target === event.currentTarget)
    event.currentTarget.close();
});
function openObjectHelp(name, requestedFunction = null) {
  const entry = objectHelp[name];
  if (!entry)
    return;
  const functions = requestedFunction ? entry.functions.filter(([functionName]) => functionName === requestedFunction) : entry.functions;
  const dialog = document.querySelector("#object-help-dialog");
  dialog.innerHTML = `<header><div><h2>${escapeHtml(requestedFunction || entry.title)}</h2><p>${escapeHtml(entry.intro)}</p></div><button type="button" data-close-object-help aria-label="Close object help">×</button></header><div class="object-help-body">${functions.map(([nameText, syntax, description, example]) => `<section><h3>${escapeHtml(nameText)}</h3><code>${escapeHtml(syntax)}</code><p>${escapeHtml(description)}</p><pre>${escapeHtml(example)}</pre></section>`).join("")}</div>`;
  dialog.showModal();
}

//# debugId=1B47CCAB8A8B099164756E2164756E21
//# sourceMappingURL=tutorial-runner.js.map
