import {
  createRixRepl
} from "./chunk-b38djzrz.js";
import {
  formatValue,
  mountOutputWidgets
} from "./chunk-8j2sbdyp.js";
import {
  mountTutorialNavigation
} from "./chunk-g5p2fpmt.js";

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

// src/tutorial-replay.js
async function replayTutorialSourcesAsync(sources, targetIndex, createSession) {
  const repl = createSession();
  for (let index = 0;index <= targetIndex && index < sources.length; index += 1) {
    const source = String(sources[index] ?? "").trim();
    if (!source) {
      if (index === targetIndex)
        return null;
      continue;
    }
    const response = await repl.runAsync(source);
    if (index === targetIndex || response.type === "error")
      return { ...response, repl };
  }
  return null;
}
function tutorialSectionCells(entries, targetValue) {
  let section = [];
  for (const entry of entries) {
    if (entry.type === "heading") {
      section = [];
      continue;
    }
    if (entry.type !== "cell")
      continue;
    section.push(entry.value);
    if (entry.value === targetValue)
      return section;
  }
  return [];
}

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

// src/tutorial-runner.js
var outputDisposers = new WeakMap;
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
  sizeTutorialSource(input);
  input.focus();
}
async function replayThrough(cell) {
  const content = cell.closest(".lesson-content") || document;
  const entries = [...content.querySelectorAll("h2, .tutorial-cell")].map((node) => ({
    type: node.matches("h2") ? "heading" : "cell",
    value: node
  }));
  const cells = tutorialSectionCells(entries, cell);
  return replayTutorialSourcesAsync(cells.map((candidate) => candidate.querySelector("[data-tutorial-source]")?.value), cells.length - 1, createRixRepl);
}
async function runCell(cell) {
  const sourceInput = cell.querySelector("[data-tutorial-source]");
  const response = await replayThrough(cell);
  if (!response)
    return;
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

//# debugId=E2A404D5EFF2038E64756E2164756E21
//# sourceMappingURL=tutorial-runner.js.map
