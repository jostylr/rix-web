import {
  createRixRepl
} from "./chunk-yg7w3en2.js";

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
});
document.querySelectorAll("[data-tutorial-source]").forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runCell(input.closest(".tutorial-cell"));
    }
  });
});

//# debugId=3EDCB8034691B71864756E2164756E21
//# sourceMappingURL=tutorial-runner.js.map
