import {
  replayTutorialSourcesAsync,
  tutorialSectionCells
} from "./chunk-v0hv1shm.js";
import {
  createRixRepl
} from "./chunk-btazq016.js";
import {
  PluginCatalog,
  decodeOutputJSON,
  formatValue,
  lintRix,
  mountOutputWidgets,
  readPluginHeader
} from "./chunk-kx4t6gwn.js";
import {
  mountTutorialNavigation
} from "./chunk-g5p2fpmt.js";
import"./chunk-9v01vpwy.js";

// src/tutorial-object-help.js
var objectHelp = {
  array: {
    title: "Array functions",
    intro: "Arrays are ordered, one-based sequences. Non-bang methods return a new value; bang methods update a mutable target.",
    functions: [
      ["Len", "values.Len()", "Return the number of elements.", "[3, 5, 8].Len()"],
      ["Get", "values.Get(index)", "Read an item by one-based index.", "[3, 5, 8].Get(2)"],
      ["Push", "values.Push(value)", "Return a new array with values appended.", "[1, 2].Push(3)"],
      ["Set", "values.Set(index, value)", "Return an array with one position replaced.", "[1, 2].Set(2, 9)"],
      ["RemoveAt", "values.RemoveAt(index)", "Return an array without one position.", "[1, 2, 3].RemoveAt(2)"],
      ["Join", "values.Join(separator)", "Join string-like values into a string.", '["a", "b"].Join("-")'],
      ["Iterator", "values.Iterator()", "Create a cursor that can move and peek without changing the array.", "[10, 20, 30].Iterator().Next(2)"]
    ]
  },
  map: {
    title: "Map functions",
    intro: "Maps hold named values. Use non-bang methods for a returned copy and bang methods when deliberately mutating a mutable map.",
    functions: [
      ["Len", "record.Len()", "Return the number of entries.", "{= a=3, b=5 }.Len()"],
      ["Has", "record.Has(key)", "Check whether a key is present.", '{= a=3 }.Has("a")'],
      ["Get", "record.Get(key)", "Read an entry by key.", '{= a=3 }.Get("a")'],
      ["Keys", "record.Keys()", "Return an array of keys.", "{= a=3, b=5 }.Keys()"],
      ["Values", "record.Values()", "Return an array of values.", "{= a=3, b=5 }.Values()"],
      ["Set", "record.Set(key, value)", "Return a copy with an entry added or replaced.", '{= a=3 }.Set("b", 5)'],
      ["Iterator", "record.Iterator()", "Create a cursor over map values in entry order.", "{= a=3, b=5 }.Iterator().Next()"]
    ]
  },
  set: {
    title: "Set functions",
    intro: "Sets keep one copy of each value. Their collection methods make it easy to test membership and compose exact sets.",
    functions: [
      ["Len", "items.Len()", "Return the count of unique members.", "{| 1, 2, 2 |}.Len()"],
      ["Has", "items.Has(value)", "Test whether a member is present.", "{| 1, 2 |}.Has(2)"],
      ["Values", "items.Values()", "Return the set members as a sequence.", "{| 1, 2 |}.Values()"],
      ["Add", "items.Add(value)", "Return a set containing a new value.", "{| 1, 2 |}.Add(3)"],
      ["Remove", "items.Remove(value)", "Return a set without a member.", "{| 1, 2 |}.Remove(1)"],
      ["Union", "items.Union(other)", "Combine the members of two sets.", "{| 1, 2 |}.Union({| 2, 3 |})"],
      ["Iterator", "items.Iterator()", "Create a cursor over set members in iteration order.", "{| 1, 2 |}.Iterator().Next()"]
    ]
  }
};

// src/tutorial-editor.js
var INDENT = "    ";
function lineStart(value, offset) {
  return value.lastIndexOf(`
`, Math.max(0, offset - 1)) + 1;
}
function lineIndent(value, start) {
  return (value.slice(start).match(/^[ \t]*/) || [""])[0];
}
function newlineIndent(value, cursor) {
  const currentStart = lineStart(value, cursor);
  const current = lineIndent(value, currentStart);
  if (current || value.slice(currentStart, cursor).trim())
    return current;
  const previousEnd = Math.max(0, currentStart - 1);
  return lineIndent(value, lineStart(value, previousEnd));
}
function selectedLineRange(value, start, end) {
  const first = lineStart(value, start);
  const effectiveEnd = end > start && value[end - 1] === `
` ? end - 1 : end;
  const lastBreak = value.indexOf(`
`, effectiveEnd);
  return { first, last: lastBreak === -1 ? value.length : lastBreak };
}
function insertTutorialNewline(value, start, end = start) {
  const insertion = `
${newlineIndent(value, start)}`;
  const cursor = start + insertion.length;
  return {
    value: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
    start: cursor,
    end: cursor
  };
}
function indentTutorialSelection(value, start, end = start) {
  if (start === end) {
    const cursor = start + INDENT.length;
    return { value: `${value.slice(0, start)}${INDENT}${value.slice(end)}`, start: cursor, end: cursor };
  }
  const range = selectedLineRange(value, start, end);
  const selected = value.slice(range.first, range.last);
  const count = selected.split(`
`).length;
  return {
    value: `${value.slice(0, range.first)}${INDENT}${selected.replace(/\n/g, `
${INDENT}`)}${value.slice(range.last)}`,
    start: start + INDENT.length,
    end: end + count * INDENT.length
  };
}
function deindentTutorialSelection(value, start, end = start) {
  const range = selectedLineRange(value, start, end);
  const selected = value.slice(range.first, range.last);
  const lines = selected.split(`
`);
  const removed = lines.map((line) => (line.match(/^(?: {1,4}|\t)/) || [""])[0].length);
  const next = lines.map((line, index) => line.slice(removed[index])).join(`
`);
  const beforeStart = removed[0];
  const beforeEnd = removed.reduce((sum, amount) => sum + amount, 0);
  return {
    value: `${value.slice(0, range.first)}${next}${value.slice(range.last)}`,
    start: Math.max(range.first, start - beforeStart),
    end: Math.max(range.first, end - beforeEnd)
  };
}
function applyTutorialEditorKey(value, start, end, { key, shiftKey = false } = {}) {
  if (key === "Enter")
    return insertTutorialNewline(value, start, end);
  if (key === "Tab")
    return shiftKey ? deindentTutorialSelection(value, start, end) : indentTutorialSelection(value, start, end);
  return null;
}

// src/tutorial-lint.js
function leadingPluginMetadata(source, file) {
  if (!/^\s*\/\*{2,}/.test(source))
    return null;
  const raw = readPluginHeader(source, file);
  return new PluginCatalog().addMetadata(raw, {
    sourcePath: file,
    source,
    kind: raw.kind || "rix"
  });
}
function contractDiagnostic(error, file) {
  return {
    code: "RX1901",
    severity: "error",
    title: "Plugin header contract",
    message: error instanceof Error ? error.message : String(error),
    hint: "Begin plugin source with a valid /** YAML header **/ contract.",
    file,
    line: 1,
    column: 1,
    offset: 0,
    level: 1
  };
}
function lintTutorialSource(source, options = {}) {
  const file = options.file || "tutorial-cell.rix";
  let pluginMetadata = null;
  try {
    pluginMetadata = leadingPluginMetadata(String(source), file);
  } catch (error) {
    return [contractDiagnostic(error, file)];
  }
  try {
    return lintRix(String(source), {
      file,
      level: options.level || "pedantic",
      profile: options.profile || (pluginMetadata ? "plugin" : "all"),
      pluginMetadata
    });
  } catch (error) {
    return [{
      code: "RX0001",
      severity: "error",
      title: "Source could not be analyzed",
      message: error instanceof Error ? error.message : String(error),
      hint: "Fix the parse error, then lint the cell again.",
      file,
      line: error?.line || 1,
      column: error?.column || 1,
      offset: error?.pos || 0,
      level: 1
    }];
  }
}

// src/tutorial-execution.js
function startTutorialExecution(sources, workerFactory = () => new Worker(new URL("./tutorial-worker.js", import.meta.url), { type: "module" })) {
  const worker = workerFactory();
  let settled = false;
  let resolveResult;
  const finish = (result2) => {
    if (settled)
      return;
    settled = true;
    worker.terminate();
    resolveResult(result2);
  };
  const result = new Promise((resolve) => {
    resolveResult = resolve;
  });
  worker.onmessage = ({ data }) => finish(data);
  worker.onerror = (event) => {
    event.preventDefault?.();
    finish({ response: { type: "error", text: event.message || "Could not start tutorial computation." } });
  };
  try {
    worker.postMessage(sources);
  } catch (error) {
    finish({ response: { type: "error", text: error.message || String(error) } });
  }
  return { result, stop: () => finish({ stopped: true }) };
}

// src/tutorial-runner.js
var outputDisposers = new WeakMap;
var runningCells = new WeakMap;
var completedSources = new WeakMap;
function updateRunButton(cell) {
  const button = cell.querySelector("[data-tutorial-run]");
  if (!button || runningCells.has(cell))
    return;
  button.textContent = completedSources.get(cell) === cell.querySelector("[data-tutorial-source]").value ? "Re-Run Cell" : "Run Cell";
}
function sourceChanged(input) {
  completedSources.delete(input.closest(".tutorial-cell"));
  updateRunButton(input.closest(".tutorial-cell"));
  sizeTutorialSource(input);
}
mountTutorialNavigation();
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
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
  const insertion = start === input.value.length && start === end && input.value && !input.value.endsWith(`
`) ? `
${text}` : text;
  input.value = `${input.value.slice(0, start)}${insertion}${input.value.slice(end)}`;
  input.selectionStart = input.selectionEnd = start + insertion.length;
  sourceChanged(input);
  input.focus();
}
function sourcesThrough(cell) {
  const content = cell.closest(".lesson-content") || document;
  const entries = [...content.querySelectorAll("h2, .tutorial-cell")].map((node) => ({
    type: node.matches("h2") ? "heading" : "cell",
    value: node
  }));
  const cells = tutorialSectionCells(entries, cell);
  return cells.map((candidate) => candidate.querySelector("[data-tutorial-source]")?.value);
}
async function runCell(cell) {
  const active = runningCells.get(cell);
  if (active) {
    active.stop();
    return;
  }
  const sourceInput = cell.querySelector("[data-tutorial-source]");
  const source = sourceInput.value;
  const button = cell.querySelector("[data-tutorial-run]");
  const lintButton = cell.querySelector("[data-tutorial-lint]");
  const output = cell.querySelector("[data-tutorial-output]");
  completedSources.delete(cell);
  output.setAttribute("aria-busy", "true");
  button.textContent = "Stop";
  button.classList.add("tutorial-stop");
  if (lintButton)
    lintButton.disabled = true;
  let status = cell.querySelector(".tutorial-run-status");
  if (!status) {
    status = document.createElement("span");
    status.className = "tutorial-run-status";
    status.setAttribute("role", "status");
    button.before(status);
  }
  status.textContent = "Running…";
  try {
    const sources = sourcesThrough(cell);
    const execution = startTutorialExecution(sources);
    runningCells.set(cell, execution);
    const result = await execution.result;
    if (result.stopped) {
      status.textContent = "Stopped";
      return;
    }
    let response = result.response;
    if (result.localSessionRequired) {
      button.textContent = "Running…";
      button.disabled = true;
      runningCells.set(cell, { stop() {} });
      status.textContent = "Preparing interactive output…";
      await new Promise((resolve) => setTimeout(resolve, 30));
      response = await replayTutorialSourcesAsync(sources, sources.length - 1, createRixRepl);
    } else if (response?.valueJSON) {
      response.value = decodeOutputJSON(response.valueJSON).value;
    }
    if (!response) {
      status.textContent = "";
      return;
    }
    renderCellResponse(cell, response);
    if (response.type !== "error" && sourceInput.value === source)
      completedSources.set(cell, source);
    status.textContent = response.type === "error" ? "Failed" : "Done";
  } catch (error) {
    renderCellResponse(cell, { type: "error", text: error.message || String(error) });
    status.textContent = "Failed";
  } finally {
    runningCells.delete(cell);
    output.setAttribute("aria-busy", "false");
    button.disabled = false;
    button.classList.remove("tutorial-stop");
    if (lintButton)
      lintButton.disabled = false;
    updateRunButton(cell);
  }
}
function renderCellResponse(cell, response) {
  const sourceInput = cell.querySelector("[data-tutorial-source]");
  const output = cell.querySelector("[data-tutorial-output]");
  outputDisposers.get(output)?.();
  outputDisposers.delete(output);
  if (response.type === "help") {
    const lines = response.groups.flatMap((group) => group.items.map(([syntax, description]) => `${syntax} — ${description}`));
    output.innerHTML = `<div class="result">${escapeHtml(lines.join(`
`))}</div>`;
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
      observe: response.observe ? (listener) => response.observe((next) => listener(next.value)) : null,
      onActivate: ({ address }) => insertTutorialText(sourceInput, address),
      evaluateEdit: (editSource, { mode }) => response.repl.run(mode === "formula" ? `@{ ${editSource} }` : editSource)
    });
    outputDisposers.set(output, dispose);
    revealTutorialOutput(output);
    return;
  }
  output.innerHTML = `<div class="${response.type === "error" ? "error" : "result"}">${escapeHtml(response.text)}</div>`;
  revealTutorialOutput(output);
}
function lintCell(cell, button) {
  const sourceInput = cell.querySelector("[data-tutorial-source]");
  const output = cell.querySelector("[data-tutorial-output]");
  outputDisposers.get(output)?.();
  outputDisposers.delete(output);
  const diagnostics = lintTutorialSource(sourceInput.value, {
    file: button?.dataset.lintFile || "tutorial-cell.rix",
    level: button?.dataset.lintLevel || "pedantic",
    profile: button?.dataset.lintProfile || "all"
  });
  if (diagnostics.length === 0) {
    output.innerHTML = '<div class="lint-clean"><strong>No lint findings.</strong> This cell is clean at the selected level and profile.</div>';
    revealTutorialOutput(output);
    return;
  }
  output.innerHTML = `<div class="lint-summary"><strong>${diagnostics.length} lint finding${diagnostics.length === 1 ? "" : "s"}</strong><ol class="lint-diagnostics">${diagnostics.map((diagnostic) => `<li class="lint-${escapeHtml(diagnostic.severity)}"><p><span class="lint-code">${escapeHtml(diagnostic.code)}</span><span class="lint-severity">${escapeHtml(diagnostic.severity)}</span><span class="lint-location">line ${escapeHtml(diagnostic.line)}, column ${escapeHtml(diagnostic.column)}</span></p><strong>${escapeHtml(diagnostic.title || diagnostic.message)}</strong>${diagnostic.title ? `<span>${escapeHtml(diagnostic.message)}</span>` : ""}${diagnostic.hint ? `<small>Fix: ${escapeHtml(diagnostic.hint)}</small>` : ""}</li>`).join("")}</ol></div>`;
  revealTutorialOutput(output);
}
function openDocumentation(link) {
  const panel = document.querySelector("#tutorial-docs-panel");
  if (!panel)
    return;
  const url = link.href;
  panel.hidden = false;
  document.querySelector(".tutorial-shell")?.classList.add("docs-open");
  document.querySelector("#tutorial-docs-title").textContent = link.textContent.replace(/\s*↗\s*$/, "").trim();
  document.querySelector("#tutorial-docs-external").href = url;
  const frame = document.querySelector("#tutorial-docs-frame");
  if (frame.src !== url)
    frame.src = url;
}
function closeDocumentation() {
  document.querySelector("#tutorial-docs-panel").hidden = true;
  document.querySelector(".tutorial-shell")?.classList.remove("docs-open");
}
function toggleContents() {
  const shell = document.querySelector(".tutorial-shell");
  if (window.matchMedia("(max-width: 760px)").matches) {
    const expanded = shell.classList.toggle("sidebar-expanded");
    const toggle2 = document.querySelector("#tutorial-contents-toggle");
    toggle2.setAttribute("aria-expanded", String(expanded));
    toggle2.textContent = expanded ? "Hide contents" : "Contents";
    return;
  }
  const collapsed = shell.classList.toggle("sidebar-collapsed");
  const toggle = document.querySelector("#tutorial-contents-toggle");
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.textContent = collapsed ? "Show contents" : "Contents";
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tutorial-run]");
  if (button)
    runCell(button.closest(".tutorial-cell"));
  const lintButton = event.target.closest("[data-tutorial-lint]");
  if (lintButton)
    lintCell(lintButton.closest(".tutorial-cell"), lintButton);
  const objectButton = event.target.closest("[data-object-help]");
  if (objectButton)
    openObjectHelp(objectButton.dataset.objectHelp, objectButton.dataset.objectFunction);
  const reference = event.target.closest("[data-doc-reference]");
  if (reference) {
    event.preventDefault();
    openDocumentation(reference);
  }
  if (event.target.closest("[data-close-object-help]"))
    document.querySelector("#object-help-dialog")?.close();
  if (event.target.closest("[data-close-tutorial-docs]"))
    closeDocumentation();
  if (event.target.closest("[data-toggle-contents]"))
    toggleContents();
});
var tutorialSources = document.querySelectorAll("[data-tutorial-source]");
tutorialSources.forEach((input) => {
  input.addEventListener("input", () => sourceChanged(input));
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
      sourceChanged(input);
    }
  });
});
requestAnimationFrame(() => tutorialSources.forEach(sizeTutorialSource));
document.querySelector("#object-help-dialog")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget)
    event.currentTarget.close();
});
var contentsToggle = document.querySelector("#tutorial-contents-toggle");
var contentsSidebar = document.querySelector("#lesson-sidebar");
if (contentsToggle && contentsSidebar) {
  requestAnimationFrame(() => {
    contentsToggle.setAttribute("aria-expanded", String(getComputedStyle(contentsSidebar).display !== "none"));
  });
}
function openObjectHelp(name, requestedFunction = null) {
  const entry = objectHelp[name];
  if (!entry)
    return;
  const functions = requestedFunction ? entry.functions.filter(([functionName]) => functionName === requestedFunction) : entry.functions;
  const dialog = document.querySelector("#object-help-dialog");
  dialog.innerHTML = `<header><div><h2>${escapeHtml(requestedFunction || entry.title)}</h2><p>${escapeHtml(entry.intro)}</p></div><button type="button" data-close-object-help aria-label="Close object help">×</button></header><div class="object-help-body">${functions.map(([nameText, syntax, description, example]) => `<section><h3>${escapeHtml(nameText)}</h3><code>${escapeHtml(syntax)}</code><p>${escapeHtml(description)}</p><pre>${escapeHtml(example)}</pre></section>`).join("")}</div>`;
  dialog.showModal();
}

//# debugId=CDF9134BBBFD63A364756E2164756E21
//# sourceMappingURL=tutorial-runner.js.map
