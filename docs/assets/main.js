import {
  childrenOf,
  createRixRepl,
  findHelp,
  rootTutorials
} from "./chunk-rcdpfsg8.js";

// src/main.js
var repl = createRixRepl();
var outputHistory = document.querySelector("#output-history");
var input = document.querySelector("#calculator-input");
var calculator = document.querySelector(".calculator");
var scriptToggle = document.querySelector("#script-toggle");
var lineSeparatorToggle = document.querySelector("#line-separator-toggle");
var scriptNote = document.querySelector("#script-note");
var helpDialog = document.querySelector("#help-dialog");
var helpSearch = document.querySelector("#help-search");
var helpContent = document.querySelector("#help-content");
var fileInput = document.querySelector("#file-input");
var tutorialDialog = document.querySelector("#tutorial-dialog");
var tutorialContent = document.querySelector("#tutorial-content");
var inspectDialog = document.querySelector("#inspect-dialog");
var inspectSource = document.querySelector("#inspect-source");
var inspectValue = document.querySelector("#inspect-value");
var scriptMode = false;
var history = [];
var historyIndex = -1;
var transcript = [];
var autoSeparateLines = true;
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  })[character]);
}
function scrollTranscript() {
  requestAnimationFrame(() => {
    outputHistory.scrollTop = outputHistory.scrollHeight;
  });
}
function setInput(value) {
  input.value = value;
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  input.focus();
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
    const inspectable = response.text.includes(`
`);
    const preview = inspectable ? `${response.text.split(`
`)[0]}
… inspect full result` : response.text;
    outputLine.className = `${response.type === "error" ? "error-line" : "output-line"}${inspectable ? " truncated" : ""}`;
    outputLine.innerHTML = response.type === "error" ? escapeHtml(preview) : `${escapeHtml(preview)}<span class="inject-icon" title="Use this value">→</span>`;
    if (inspectable)
      outputLine.addEventListener("click", () => openInspection(source, response.text));
    else if (response.type === "result")
      outputLine.addEventListener("click", () => setInput(response.text));
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
  const body = groups.length ? groups.map((group) => `<h4>${escapeHtml(group.title)}</h4><ul>${group.items.map(([syntax, description]) => `<li><code>${escapeHtml(syntax)}</code> — ${escapeHtml(description)}</li>`).join("")}</ul>`).join("") : `<p>No help topic matched “${escapeHtml(query)}”. Try <code>.Help("interval")</code>.</p>`;
  panel.innerHTML = `<h3>${title}</h3>${body}`;
  return panel;
}
function renderHelp(query = "") {
  const { groups } = findHelp(query);
  const intro = query ? "" : `<section class="help-intro"><b>Welcome to RatCalc.</b><br />Type an exact expression and press Enter. Use <code>:=</code> for a fresh value, <code>2:5</code> for an interval, and <code>.Help("topic")</code> when you want help printed directly in the transcript.</section>`;
  const sections = groups.length ? groups.map((group) => `<section class="help-group"><h3>${escapeHtml(group.title)}</h3>${group.items.map(([syntax, description]) => `<div class="help-item"><code>${escapeHtml(syntax)}</code><p>${escapeHtml(description)}</p></div>`).join("")}</section>`).join("") : `<p class="help-intro">No matching help topic. Try “interval”, “function”, or “assignment”.</p>`;
  helpContent.innerHTML = intro + sections;
}
function openHelp(query = "") {
  helpSearch.value = query;
  renderHelp(query);
  helpDialog.showModal();
  helpSearch.focus();
}
function renderTutorialIndex() {
  tutorialContent.innerHTML = rootTutorials.map((tutorial) => {
    const children = childrenOf(tutorial.number);
    return `<section class="tutorial-index-section"><a href="./learn/${tutorial.file}"><b>${escapeHtml(tutorial.number)} · ${escapeHtml(tutorial.title)}</b><span>${escapeHtml(tutorial.description)}</span></a>${children.length ? `<div class="tutorial-index-children">${children.map((child) => `<a href="./learn/${child.file}">${escapeHtml(child.number)} · ${escapeHtml(child.title)}</a>`).join("")}</div>` : ""}</section>`;
  }).join("");
}
function openTutorials() {
  renderTutorialIndex();
  tutorialDialog.showModal();
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
  const text = variables.length ? `Variables:
${variables.map(({ name, value }) => `  ${name} = ${value}`).join(`
`)}` : "No variables or functions defined.";
  appendOutput(source, { type: "result", text });
}
function execute(source = input.value) {
  const command = source.trim();
  if (!command)
    return;
  if (/^\.help(?:\s+.*)?$/i.test(command)) {
    openHelp(command.replace(/^\.help/i, "").trim());
    setInput("");
    return;
  }
  if (/^\.clear$/i.test(command)) {
    clearSession();
    return;
  }
  if (/^\.vars$/i.test(command)) {
    showVariables(source);
    setInput("");
    return;
  }
  if (history.at(-1) !== source)
    history.push(source);
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
  document.querySelector("#entry-mode-label").textContent = scriptMode ? "Script mode · Enter adds a line · Ctrl/⌘ + Enter runs" : "Command mode · Enter runs · Shift+↑ edits a script";
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
  input.value = `${before.slice(0, slash)}
${after}`;
  input.selectionStart = input.selectionEnd = slash + 1;
  setInput(input.value);
}
function navigateHistory(direction) {
  if (scriptMode || history.length === 0)
    return;
  if (direction < 0)
    historyIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
  else
    historyIndex = historyIndex >= history.length - 1 ? -1 : historyIndex + 1;
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
  if (!control)
    return;
  switch (control.dataset.action) {
    case "run":
      execute();
      break;
    case "help":
      openHelp();
      break;
    case "close-help":
      helpDialog.close();
      input.focus();
      break;
    case "tutorials":
      openTutorials();
      break;
    case "close-tutorials":
      tutorialDialog.close();
      input.focus();
      break;
    case "close-inspect":
      inspectDialog.close();
      input.focus();
      break;
    case "clear":
      clearSession();
      break;
    case "script":
      setScriptMode(!scriptMode);
      break;
    case "line-separators":
      setAutoSeparateLines(!autoSeparateLines);
      break;
    case "copy":
      navigator.clipboard?.writeText(transcript.map((entry) => `> ${entry.source}
${entry.text}`).join(`

`));
      break;
    case "load":
      fileInput.click();
      break;
    default:
      break;
  }
});
input.addEventListener("input", () => setInput(input.value));
input.addEventListener("keydown", (event) => {
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
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    execute();
    return;
  }
  if (event.key === "Enter" && !scriptMode) {
    event.preventDefault();
    const currentLine = input.value.slice(0, input.selectionStart).split(`
`).at(-1).trimEnd();
    if (currentLine.endsWith("\\"))
      continueCommand();
    else
      execute();
    return;
  }
  if (event.key === "ArrowUp" && input.selectionStart === 0) {
    event.preventDefault();
    navigateHistory(-1);
  }
  if (event.key === "ArrowDown" && input.selectionStart === input.value.length) {
    event.preventDefault();
    navigateHistory(1);
  }
});
helpSearch.addEventListener("input", () => renderHelp(helpSearch.value));
fileInput.addEventListener("change", async () => {
  const [file] = fileInput.files;
  if (file)
    await loadFile(file);
  fileInput.value = "";
});
[helpDialog, tutorialDialog, inspectDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog)
      dialog.close();
  });
});
displayWelcome();
setAutoSeparateLines(autoSeparateLines);
input.focus();

//# debugId=6FD31F7BC81EC72B64756E2164756E21
//# sourceMappingURL=main.js.map
