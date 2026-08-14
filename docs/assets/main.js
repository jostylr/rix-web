import {
  createRixRepl,
  findHelp
} from "./chunk-yzzrqt4a.js";
import {
  Integer,
  Rational,
  RationalInterval,
  mountOutputWidgets,
  parse
} from "./chunk-c0ebrwr4.js";

// src/interval-explorer.js
var SVG_NS = "http://www.w3.org/2000/svg";
var COLORS = ["#2563eb", "#dc2626", "#7c3aed"];
function unwrapGrouping(node) {
  return node?.type === "Grouping" ? unwrapGrouping(node.expression) : node;
}
function astSource(node) {
  if (!node)
    return null;
  switch (node.type) {
    case "Number":
      return node.value;
    case "UserIdentifier":
      return node.name;
    case "SystemIdentifier":
      return `.${node.name}`;
    case "Grouping": {
      const expression = astSource(node.expression);
      return expression === null ? null : `(${expression})`;
    }
    case "UnaryOperation": {
      const operand = astSource(node.operand);
      return operand === null ? null : `${node.operator}${operand}`;
    }
    case "BinaryOperation": {
      const left = astSource(node.left);
      const right = astSource(node.right);
      return left === null || right === null ? null : `(${left} ${node.operator} ${right})`;
    }
    default:
      return null;
  }
}
function rationalValue(value) {
  if (value instanceof Rational)
    return value;
  if (value instanceof Integer)
    return value.toRational();
  return null;
}
function intervalValue(value) {
  if (value instanceof RationalInterval)
    return new RationalInterval(value.start, value.end);
  const rational = rationalValue(value);
  return rational ? new RationalInterval(rational, rational) : null;
}
function isRationalIntervalValue(value) {
  return value instanceof RationalInterval;
}
function analyzeIntervalExpression(source, evaluate) {
  try {
    const nodes = parse(source);
    if (nodes.length !== 1)
      return null;
    const root = unwrapGrouping(nodes[0]);
    if (root?.type !== "BinaryOperation" || !["+", "-", "*", "/"].includes(root.operator))
      return null;
    const leftSource = astSource(root.left);
    const rightSource = astSource(root.right);
    if (!leftSource || !rightSource)
      return null;
    const left = evaluate(leftSource);
    const right = evaluate(rightSource);
    const leftInterval = left?.type === "result" ? intervalValue(left.value) : null;
    const rightInterval = right?.type === "result" ? intervalValue(right.value) : null;
    if (!leftInterval || !rightInterval)
      return null;
    return {
      operator: root.operator,
      left: { source: leftSource, value: leftInterval },
      right: { source: rightSource, value: rightInterval }
    };
  } catch {
    return null;
  }
}
function applyOperation(operator, left, right) {
  if (operator === "+")
    return left.add(right);
  if (operator === "-")
    return left.subtract(right);
  if (operator === "*")
    return left.multiply(right);
  if (operator === "/")
    return left.divide(right);
  throw new Error(`Unsupported interval operation ${operator}`);
}
function exactSource(value) {
  return `${value.start.toString()}:${value.end.toString()}`;
}
function approximate(value) {
  const result = Number.parseFloat(value.toDecimal(20));
  return Number.isFinite(result) ? result : null;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  })[character]);
}
function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes))
    element.setAttribute(key, String(value));
  return element;
}

class IntervalExplorer {
  constructor({ dialog, evaluate, onUse }) {
    this.dialog = dialog;
    this.evaluate = evaluate;
    this.onUse = onUse;
    this.sourceElement = dialog.querySelector("#interval-source");
    this.provenanceElement = dialog.querySelector("#interval-provenance");
    this.graphicElement = dialog.querySelector("#interval-graphic");
    this.selectionElement = dialog.querySelector("#interval-selection");
    this.startElement = dialog.querySelector("#interval-start");
    this.endElement = dialog.querySelector("#interval-end");
    this.stepElement = dialog.querySelector("#interval-step");
    this.statusElement = dialog.querySelector("#interval-status");
    this.tableElement = dialog.querySelector("#interval-table");
    this.selectedIndex = 0;
    this.items = [];
    this.drag = null;
    this.selectionElement.addEventListener("change", () => {
      this.selectedIndex = Number(this.selectionElement.value);
      this.render();
    });
    for (const input of [this.startElement, this.endElement]) {
      input.addEventListener("change", () => this.applyEditor());
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.applyEditor();
        }
      });
    }
    this.stepElement.addEventListener("change", () => this.render());
    dialog.addEventListener("click", (event) => {
      const nudge = event.target.closest("[data-interval-nudge]");
      if (nudge) {
        const [target, direction] = nudge.dataset.intervalNudge.split(":");
        this.nudge(target, Number(direction));
      }
    });
    window.addEventListener("pointermove", (event) => this.pointerMove(event));
    window.addEventListener("pointerup", () => {
      this.drag = null;
    });
  }
  open(source, value) {
    const interval = intervalValue(value);
    if (!interval)
      return;
    this.source = source;
    const provenance = analyzeIntervalExpression(source, this.evaluate);
    if (provenance) {
      this.operator = provenance.operator;
      this.items = [
        { label: "Left operand", source: provenance.left.source, value: provenance.left.value, derived: false },
        { label: "Right operand", source: provenance.right.source, value: provenance.right.value, derived: false },
        { label: `Result (${provenance.operator})`, source, value: interval, derived: true }
      ];
      this.selectedIndex = 2;
    } else {
      this.operator = null;
      this.items = [{ label: "Interval", source, value: interval, derived: false }];
      this.selectedIndex = 0;
    }
    this.statusElement.textContent = "";
    this.sourceElement.textContent = source;
    this.render();
    this.dialog.showModal();
  }
  close() {
    this.drag = null;
    this.dialog.close();
  }
  step() {
    const denominator = Math.max(1, Number.parseInt(this.stepElement.value, 10) || 10);
    this.stepElement.value = String(denominator);
    return new Rational(1n, BigInt(denominator));
  }
  selected() {
    return this.items[this.selectedIndex];
  }
  recalculate() {
    if (!this.operator || this.items.length !== 3)
      return;
    try {
      this.items[2].value = applyOperation(this.operator, this.items[0].value, this.items[1].value);
      this.statusElement.textContent = "Result recalculated exactly from the edited operands.";
    } catch (error) {
      this.statusElement.textContent = error.message || String(error);
    }
  }
  setItemValue(index, value) {
    if (this.items[index]?.derived)
      return;
    this.items[index].value = value;
    this.recalculate();
    this.render();
  }
  nudge(target, direction, index = this.selectedIndex) {
    const item = this.items[index];
    if (!item || item.derived)
      return;
    const delta = this.step().multiply(new Rational(BigInt(direction), 1n));
    const start = target === "end" ? item.value.start : item.value.start.add(delta);
    const end = target === "start" ? item.value.end : item.value.end.add(delta);
    this.setItemValue(index, new RationalInterval(start, end));
  }
  applyEditor() {
    const item = this.selected();
    if (!item || item.derived)
      return;
    const start = this.evaluate(this.startElement.value.trim());
    const end = this.evaluate(this.endElement.value.trim());
    const startValue = start?.type === "result" ? rationalValue(start.value) : null;
    const endValue = end?.type === "result" ? rationalValue(end.value) : null;
    if (!startValue || !endValue) {
      this.statusElement.textContent = "Start and end must each evaluate to one exact integer or rational.";
      return;
    }
    this.setItemValue(this.selectedIndex, new RationalInterval(startValue, endValue));
    this.statusElement.textContent = "Exact endpoints updated.";
  }
  pointerStart(event, index, target) {
    if (this.items[index]?.derived)
      return;
    event.preventDefault();
    this.selectedIndex = index;
    this.drag = {
      index,
      target,
      x: event.clientX,
      count: 0,
      value: new RationalInterval(this.items[index].value.start, this.items[index].value.end)
    };
    this.renderEditor();
  }
  pointerMove(event) {
    if (!this.drag)
      return;
    const count = Math.round((event.clientX - this.drag.x) / 12);
    if (count === this.drag.count)
      return;
    this.drag.count = count;
    const delta = this.step().multiply(new Rational(BigInt(count), 1n));
    const original = this.drag.value;
    const start = this.drag.target === "end" ? original.start : original.start.add(delta);
    const end = this.drag.target === "start" ? original.end : original.end.add(delta);
    this.setItemValue(this.drag.index, new RationalInterval(start, end));
  }
  range() {
    const values = this.items.flatMap(({ value }) => [value.low, value.high]);
    const approximateValues = values.map(approximate).filter((value) => value !== null);
    if (approximateValues.length !== values.length)
      return { min: -1, max: 1, reliable: false };
    let min = Math.min(...approximateValues);
    let max = Math.max(...approximateValues);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const padding = Math.max((max - min) * 0.12, 0.25);
    return { min: min - padding, max: max + padding, reliable: true };
  }
  renderGraphic() {
    const width = 760;
    const height = this.items.length === 3 ? 270 : 210;
    const left = 54;
    const right = width - 38;
    const range = this.range();
    const x = (value) => {
      const number = approximate(value);
      if (number === null)
        return (left + right) / 2;
      return left + (number - range.min) / (range.max - range.min) * (right - left);
    };
    const svg = svgElement("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-labelledby": "interval-svg-title interval-svg-description" });
    const title = svgElement("title", { id: "interval-svg-title" });
    title.textContent = "Exact rational intervals on an approximate number line";
    const description = svgElement("desc", { id: "interval-svg-description" });
    description.textContent = this.items.map(({ label, value }) => `${label}: ${exactSource(value)}`).join("; ");
    svg.append(title, description);
    const axisY = this.items.length === 3 ? 132 : 102;
    svg.appendChild(svgElement("line", { x1: left, y1: axisY, x2: right, y2: axisY, class: "interval-axis" }));
    for (let index = 0;index <= 4; index += 1) {
      const position = left + (right - left) * index / 4;
      const value = range.min + (range.max - range.min) * index / 4;
      svg.appendChild(svgElement("line", { x1: position, y1: axisY - 6, x2: position, y2: axisY + 6, class: "interval-tick" }));
      const label = svgElement("text", { x: position, y: axisY + 24, class: "interval-tick-label", "text-anchor": "middle" });
      label.textContent = Number.isFinite(value) ? value.toPrecision(4).replace(/\.0+$/, "") : "approx.";
      svg.appendChild(label);
    }
    this.items.forEach((item, index) => {
      const y = this.items.length === 3 ? [65, 112, 201][index] : 72;
      const startX = x(item.value.start);
      const endX = x(item.value.end);
      const color = COLORS[index % COLORS.length];
      const group = svgElement("g", { class: `interval-lane${index === this.selectedIndex ? " selected" : ""}` });
      const laneLabel = svgElement("text", { x: left, y: y - 18, class: "interval-lane-label" });
      laneLabel.textContent = `${item.label}  ${exactSource(item.value)}`;
      const segment = svgElement("line", { x1: startX, y1: y, x2: endX, y2: y, stroke: color, class: "interval-segment", tabindex: item.derived ? -1 : 0, role: "button", "aria-label": `${item.label}; move both endpoints; ${exactSource(item.value)}` });
      segment.addEventListener("pointerdown", (event) => this.pointerStart(event, index, "whole"));
      segment.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          this.nudge("whole", event.key === "ArrowLeft" ? -1 : 1, index);
        }
      });
      group.append(laneLabel, segment);
      [["start", startX], ["end", endX]].forEach(([target, cx]) => {
        const handle = svgElement("circle", { cx, cy: y, r: 8, fill: color, class: "interval-handle", tabindex: item.derived ? -1 : 0, role: "slider", "aria-label": `${item.label} ${target} endpoint`, "aria-valuetext": item.value[target].toString() });
        handle.addEventListener("pointerdown", (event) => this.pointerStart(event, index, target));
        handle.addEventListener("keydown", (event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            this.nudge(target, event.key === "ArrowLeft" ? -1 : 1, index);
          }
        });
        group.appendChild(handle);
      });
      svg.appendChild(group);
    });
    this.graphicElement.replaceChildren(svg);
    this.svg = svg;
  }
  renderProvenance() {
    if (!this.operator) {
      this.provenanceElement.innerHTML = `<span class="provenance-node"><b>Exact source</b><code>${escapeHtml(this.source)}</code></span><span class="provenance-arrow">→</span><span class="provenance-node result"><b>Interval</b><code>${escapeHtml(exactSource(this.items[0].value))}</code></span>`;
      return;
    }
    this.provenanceElement.innerHTML = `<span class="provenance-node"><b>Left operand</b><code>${escapeHtml(exactSource(this.items[0].value))}</code></span><span class="provenance-operator" aria-label="operator ${escapeHtml(this.operator)}">${escapeHtml(this.operator)}</span><span class="provenance-node"><b>Right operand</b><code>${escapeHtml(exactSource(this.items[1].value))}</code></span><span class="provenance-arrow">→</span><span class="provenance-node result"><b>Exact result</b><code>${escapeHtml(exactSource(this.items[2].value))}</code></span>`;
  }
  renderEditor() {
    this.selectionElement.replaceChildren(...this.items.map((item2, index) => Object.assign(document.createElement("option"), { value: String(index), textContent: item2.label })));
    this.selectionElement.value = String(this.selectedIndex);
    const item = this.selected();
    this.startElement.value = item.value.start.toString();
    this.endElement.value = item.value.end.toString();
    this.startElement.disabled = item.derived;
    this.endElement.disabled = item.derived;
    this.dialog.querySelectorAll("[data-interval-nudge]").forEach((button) => {
      button.disabled = item.derived;
    });
  }
  renderTable() {
    this.tableElement.innerHTML = `<table><caption>Exact textual alternative</caption><thead><tr><th>Role</th><th>Source</th><th>Start</th><th>End</th><th>Orientation</th></tr></thead><tbody>${this.items.map((item) => `<tr><th>${escapeHtml(item.label)}</th><td><code>${escapeHtml(item.source)}</code></td><td>${escapeHtml(item.value.start)}</td><td>${escapeHtml(item.value.end)}</td><td>${item.value.isAscending ? "ascending" : "reversed"}</td></tr>`).join("")}</tbody></table>`;
  }
  render() {
    this.renderProvenance();
    this.renderGraphic();
    this.renderEditor();
    this.renderTable();
  }
  resultSource() {
    return exactSource(this.items.at(-1).value);
  }
  useResult() {
    this.onUse(this.resultSource());
    this.close();
  }
  download(kind) {
    const svg = this.svg?.outerHTML || "";
    const content = kind === "svg" ? `<?xml version="1.0" encoding="UTF-8"?>
${svg}` : `<!doctype html><html lang="en"><meta charset="utf-8"><title>RiX exact interval</title><body><h1>Exact interval</h1><p><code>${escapeHtml(this.resultSource())}</code></p>${svg}<p>Coordinates are approximate pixels; labels retain exact values.</p></body></html>`;
    const blob = new Blob([content], { type: kind === "svg" ? "image/svg+xml" : "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rix-interval.${kind}`;
    link.click();
    URL.revokeObjectURL(url);
    this.statusElement.textContent = `Exported exact interval ${kind.toUpperCase()}.`;
  }
}

// src/main.js
var repl = createRixRepl();
var outputHistory = document.querySelector("#output-history");
var input = document.querySelector("#calculator-input");
var completionGhost = document.querySelector("#completion-ghost");
var completionHint = document.querySelector("#completion-hint");
var calculator = document.querySelector(".calculator");
var scriptToggle = document.querySelector("#script-toggle");
var lineSeparatorToggle = document.querySelector("#line-separator-toggle");
var scriptNote = document.querySelector("#script-note");
var helpDialog = document.querySelector("#help-dialog");
var helpSearch = document.querySelector("#help-search");
var helpContent = document.querySelector("#help-content");
var fileInput = document.querySelector("#file-input");
var docsPanel = document.querySelector("#docs-panel");
var docsToggle = document.querySelector("#docs-toggle");
var inspectDialog = document.querySelector("#inspect-dialog");
var inspectSource = document.querySelector("#inspect-source");
var inspectValue = document.querySelector("#inspect-value");
var numberDialog = document.querySelector("#number-dialog");
var numberForm = document.querySelector("#number-form");
var numberInputBase = document.querySelector("#number-input-base");
var numberDisplayProfile = document.querySelector("#number-display-profile");
var numberPersist = document.querySelector("#number-persist");
var numberSettingsStatus = document.querySelector("#number-settings-status");
var intervalDialog = document.querySelector("#interval-dialog");
var mobileCommandPanel = document.querySelector("#mobile-command-panel");
var NUMBER_STORAGE_KEY = "ratcalc.number-config.v1";
var scriptMode = false;
var history = [];
var historyIndex = -1;
var transcript = [];
var autoSeparateLines = true;
var completionState = null;
var outputDisposers = new Set;
var intervalExplorer = new IntervalExplorer({
  dialog: intervalDialog,
  evaluate: (source) => repl.run(source),
  onUse: (source) => setInput(source)
});
function escapeHtml2(value) {
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
  clearCompletion();
  input.value = value;
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  input.focus();
}
function insertInputText(text) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  const value = `${input.value.slice(0, start)}${text}${input.value.slice(end)}`;
  setInput(value);
  const cursor = start + text.length;
  input.selectionStart = input.selectionEnd = cursor;
}
function clearCompletion() {
  completionState = null;
  completionGhost.replaceChildren();
  completionHint.hidden = true;
  completionHint.replaceChildren();
}
function renderCompletion() {
  if (!completionState)
    return;
  const candidate = completionState.result.candidates[completionState.index];
  const { from, to } = completionState.result;
  const typed = input.value.slice(from, to);
  const startsWithTyped = candidate.insertText.toLowerCase().startsWith(typed.toLowerCase());
  const suffix = startsWithTyped ? candidate.insertText.slice(typed.length) : "";
  completionGhost.replaceChildren(document.createTextNode(input.value.slice(0, to)), Object.assign(document.createElement("span"), { className: "suffix", textContent: suffix }));
  completionGhost.scrollTop = input.scrollTop;
  completionHint.hidden = false;
  completionHint.innerHTML = `<b>${escapeHtml2(candidate.insertText)}</b> · ${escapeHtml2(candidate.detail)}${candidate.preview ? ` — ${escapeHtml2(candidate.preview)}` : ""}`;
}
function beginCompletion() {
  if (input.selectionStart !== input.selectionEnd)
    return clearCompletion();
  const result = repl.complete(input.value, input.selectionStart);
  if (!result.candidates.length)
    return clearCompletion();
  completionState = { result, index: 0 };
  renderCompletion();
}
function moveCompletion(direction) {
  if (!completionState)
    return false;
  const { candidates } = completionState.result;
  completionState.index = (completionState.index + direction + candidates.length) % candidates.length;
  renderCompletion();
  return true;
}
function acceptCompletion() {
  if (!completionState)
    return false;
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
  sourceLine.innerHTML = `<span class="prompt">&gt;</span>${escapeHtml2(source)}<span class="reload-icon" title="Reload expression">↻</span>`;
  sourceLine.addEventListener("click", () => setInput(source));
  entry.appendChild(sourceLine);
  if (response.type === "help") {
    entry.appendChild(inlineHelp(response));
  } else {
    const outputLine = document.createElement("div");
    const inspectable = Boolean(response.html) || response.text.includes(`
`);
    const preview = inspectable ? `${response.text.split(`
`)[0]}
… inspect full result` : response.text;
    outputLine.className = `${response.type === "error" ? "error-line" : "output-line"}${inspectable ? " truncated" : ""}`;
    if (response.html) {
      outputLine.classList.add("rich-output");
      outputLine.innerHTML = response.html;
      outputLine.addEventListener("click", () => openInspection(source, response.text));
      const dispose = mountOutputWidgets(outputLine, response.value, {
        format: repl.formatValue,
        observe: response.observe ? (listener) => response.observe((next) => listener(next.value)) : null,
        onActivate: ({ address }) => insertInputText(address),
        evaluateEdit: (editSource, { mode }) => repl.run(mode === "formula" ? `@{ ${editSource} }` : editSource)
      });
      outputDisposers.add(dispose);
    } else {
      outputLine.innerHTML = response.type === "error" ? escapeHtml2(preview) : `${escapeHtml2(preview)}<span class="inject-icon" title="Use this value">→</span>`;
      if (inspectable)
        outputLine.addEventListener("click", () => openInspection(source, response.text));
      else if (response.type === "result")
        outputLine.addEventListener("click", () => setInput(response.sourceText ?? response.text));
      if (response.type === "result" && isRationalIntervalValue(response.value)) {
        const explore = document.createElement("button");
        explore.type = "button";
        explore.className = "interval-explore-button";
        explore.textContent = "Explore interval";
        explore.addEventListener("click", (event) => {
          event.stopPropagation();
          intervalExplorer.open(source, response.value);
        });
        outputLine.appendChild(explore);
      }
    }
    entry.appendChild(outputLine);
  }
  outputHistory.appendChild(entry);
  transcript.push({ source, text: response.type === "help" ? `.Help: ${response.query || "all topics"}` : response.text });
  scrollTranscript();
}
function openNumberSettings() {
  const config = repl.numberConfig();
  numberInputBase.value = config.input;
  numberDisplayProfile.value = config.display;
  numberSettingsStatus.textContent = "";
  numberDialog.showModal();
  numberInputBase.focus();
}
function saveNumberSettings(config) {
  if (numberPersist.checked)
    localStorage.setItem(NUMBER_STORAGE_KEY, JSON.stringify(config));
  else
    localStorage.removeItem(NUMBER_STORAGE_KEY);
}
function applyNumberSettings(config, { close = false } = {}) {
  try {
    const applied = repl.setNumberConfig(config);
    numberInputBase.value = applied.input;
    numberDisplayProfile.value = applied.display;
    saveNumberSettings(applied);
    numberSettingsStatus.textContent = `Using #${applied.input} input and ${applied.display} output.`;
    if (close)
      numberDialog.close();
  } catch (error) {
    numberSettingsStatus.textContent = error.message || String(error);
  }
}
function setNumberPreset(profile) {
  numberDisplayProfile.value = profile;
  applyNumberSettings({ display: profile });
}
async function copySession() {
  const button = document.querySelector('[data-action="copy"]');
  const text = transcript.map((entry) => `> ${entry.source}
${entry.text}`).join(`

`);
  if (!text) {
    button.textContent = "Nothing to copy";
    setTimeout(() => {
      button.textContent = "Copy session";
    }, 1600);
    return;
  }
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.className = "clipboard-fallback";
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    button.textContent = copied ? "Copied" : "Copy failed";
  }
  setTimeout(() => {
    button.textContent = "Copy session";
  }, 1600);
}
function restoreNumberSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(NUMBER_STORAGE_KEY) || "null");
    if (saved && typeof saved === "object") {
      numberPersist.checked = true;
      applyNumberSettings(saved);
    }
  } catch {
    localStorage.removeItem(NUMBER_STORAGE_KEY);
  }
}
function inlineHelp({ query, groups }) {
  const panel = document.createElement("section");
  panel.className = "inline-help";
  const title = query ? `Help for “${escapeHtml2(query)}”` : "RiX and RatCalc help";
  const body = groups.length ? groups.map((group) => `<h4>${escapeHtml2(group.title)}</h4><ul>${group.items.map(([syntax, description]) => `<li><code>${escapeHtml2(syntax)}</code> — ${escapeHtml2(description)}</li>`).join("")}</ul>`).join("") : `<p>No help topic matched “${escapeHtml2(query)}”. Try <code>.Help("interval")</code>.</p>`;
  panel.innerHTML = `<h3>${title}</h3>${body}`;
  return panel;
}
function renderHelp(query = "") {
  const { groups } = findHelp(query);
  const intro = query ? "" : `<section class="help-intro"><b>Welcome to RatCalc.</b><br />Type an exact expression and press Enter. Use <code>:=</code> for a fresh value, <code>2:5</code> for an interval, and <code>.Help("topic")</code> when you want help printed directly in the transcript.</section>`;
  const sections = groups.length ? groups.map((group) => `<section class="help-group"><h3>${escapeHtml2(group.title)}</h3>${group.items.map(([syntax, description]) => `<div class="help-item"><code>${escapeHtml2(syntax)}</code><p>${escapeHtml2(description)}</p></div>`).join("")}</section>`).join("") : `<p class="help-intro">No matching help topic. Try “interval”, “function”, or “assignment”.</p>`;
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
async function clearSession() {
  for (const dispose of outputDisposers)
    dispose();
  outputDisposers.clear();
  await repl.reset();
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
async function execute(source = input.value) {
  const command = source.trim();
  if (!command)
    return;
  if (/^\.help(?:\s+.*)?$/i.test(command)) {
    openHelp(command.replace(/^\.help/i, "").trim());
    setInput("");
    return;
  }
  if (/^\.clear$/i.test(command)) {
    await clearSession();
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
  const response = await repl.runAsync(source);
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
    case "number-settings":
      openNumberSettings();
      break;
    case "close-number-settings":
      numberDialog.close();
      input.focus();
      break;
    case "reset-number-settings":
      numberInputBase.value = "z[10]";
      numberDisplayProfile.value = "..";
      applyNumberSettings({ input: "z[10]", display: ".." });
      break;
    case "close-help":
      helpDialog.close();
      input.focus();
      break;
    case "docs":
      setDocsOpen(docsPanel.hidden);
      break;
    case "close-docs":
      setDocsOpen(false);
      input.focus();
      break;
    case "close-inspect":
      inspectDialog.close();
      input.focus();
      break;
    case "close-interval":
      intervalExplorer.close();
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
      copySession();
      break;
    case "load":
      fileInput.click();
      break;
    case "interval-export-svg":
      intervalExplorer.download("svg");
      break;
    case "interval-export-html":
      intervalExplorer.download("html");
      break;
    case "interval-use":
      intervalExplorer.useResult();
      break;
    default:
      break;
  }
});
document.addEventListener("click", (event) => {
  const preset = event.target.closest("[data-number-preset]");
  if (preset) {
    setNumberPreset(preset.dataset.numberPreset);
    if (preset.closest("#mobile-command-panel"))
      mobileCommandPanel.hidden = true;
  }
  const insert = event.target.closest("[data-insert]");
  if (insert)
    insertInputText(insert.dataset.insert);
  const mobileAction = event.target.closest("[data-mobile-action]")?.dataset.mobileAction;
  if (mobileAction === "backspace") {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (start !== end) {
      input.setRangeText("", start, end, "end");
    } else if (start > 0) {
      input.setRangeText("", start - 1, start, "end");
    }
    setInput(input.value);
  }
  if (mobileAction === "clear-input")
    setInput("");
  if (mobileAction === "commands")
    mobileCommandPanel.hidden = !mobileCommandPanel.hidden;
  const mobileCommand = event.target.closest("[data-mobile-command]")?.dataset.mobileCommand;
  if (mobileCommand) {
    mobileCommandPanel.hidden = true;
    execute(mobileCommand);
  }
});
input.addEventListener("input", () => setInput(input.value));
input.addEventListener("scroll", () => {
  if (completionState)
    renderCompletion();
});
input.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    if (!acceptCompletion())
      beginCompletion();
    return;
  }
  if (event.key === "ArrowUp" && moveCompletion(-1)) {
    event.preventDefault();
    return;
  }
  if (event.key === "ArrowDown" && moveCompletion(1)) {
    event.preventDefault();
    return;
  }
  if (event.key === "ArrowRight" && acceptCompletion()) {
    event.preventDefault();
    return;
  }
  if ((event.key === "ArrowLeft" || event.key === "Escape") && completionState) {
    event.preventDefault();
    clearCompletion();
    return;
  }
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
numberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyNumberSettings({ input: numberInputBase.value, display: numberDisplayProfile.value }, { close: true });
});
[helpDialog, inspectDialog, numberDialog, intervalDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog)
      dialog.close();
  });
});
displayWelcome();
setAutoSeparateLines(autoSeparateLines);
restoreNumberSettings();
input.focus();
window.addEventListener("pagehide", () => {
  repl.dispose();
});

//# debugId=950F8A2C8242E22764756E2164756E21
//# sourceMappingURL=main.js.map
