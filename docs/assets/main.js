import {
  createRixRepl,
  findHelp,
  pluginProfileFromUrl,
  stripMarkedPluginProfile
} from "./chunk-p4snh1wx.js";
import {
  Integer,
  Rational,
  RationalInterval,
  createControlPanel,
  mountOutputWidgets,
  parse,
  renderOutputHtml
} from "./chunk-pn6ryp6s.js";

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

// src/reactive-dashboard.js
function escapeHtml2(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  })[character]);
}
function listHtml(title, names, empty) {
  const content = names.length ? names.map((name) => `<code>${escapeHtml2(name)}</code>`).join("") : `<span>${empty}</span>`;
  return `<div class="reactive-links"><b>${title}</b><div>${content}</div></div>`;
}
function reactiveVariableCardsHtml(descriptors) {
  return descriptors.map((descriptor) => {
    const role = descriptor.controls.length ? "controlled" : descriptor.dependencies.length ? "derived" : "input";
    const aliases = descriptor.aliases.filter((name) => name !== descriptor.name);
    const formula = descriptor.dependencies.length && descriptor.formulaSource ? `<div class="reactive-formula"><b>Formula</b><code>${escapeHtml2(descriptor.formulaSource)}</code></div>` : "";
    const diagnostics = descriptor.diagnostics.length ? `<ul class="reactive-diagnostics">${descriptor.diagnostics.map((message) => `<li>${escapeHtml2(message)}</li>`).join("")}</ul>` : "";
    return `<article class="reactive-variable-card" data-reactive-state="${escapeHtml2(descriptor.state)}">
            <header><div><code>$$${escapeHtml2(descriptor.name)}</code>${aliases.length ? `<small>aliases: ${aliases.map(escapeHtml2).join(", ")}</small>` : ""}</div><span class="reactive-role ${role}">${role}</span></header>
            <button type="button" class="reactive-value" data-dashboard-use="${escapeHtml2(descriptor.sourceText)}" title="Use this exact value in the calculator">${escapeHtml2(descriptor.valueText)}</button>
            ${formula}
            <div class="reactive-dependency-grid">
                ${listHtml("Depends on", descriptor.dependencies, "none")}
                ${listHtml("Feeds", descriptor.dependents, "none")}
            </div>
            ${diagnostics}
            <footer><span>${escapeHtml2(descriptor.state)}</span><button type="button" data-dashboard-read="${escapeHtml2(descriptor.name)}">Insert $${escapeHtml2(descriptor.name)}</button></footer>
        </article>`;
  }).join("");
}

class ReactiveDashboard {
  constructor({ panel, toggle, repl, onUse, onLoadExample }) {
    this.panel = panel;
    this.toggle = toggle;
    this.repl = repl;
    this.onUse = onUse;
    this.onLoadExample = onLoadExample;
    this.countElement = panel.querySelector("#reactive-dashboard-count");
    this.summaryElement = panel.querySelector("#reactive-dashboard-summary");
    this.controlsSection = panel.querySelector("#reactive-dashboard-controls-section");
    this.controlsElement = panel.querySelector("#reactive-dashboard-controls");
    this.variablesElement = panel.querySelector("#reactive-dashboard-variables");
    this.emptyElement = panel.querySelector("#reactive-dashboard-empty");
    this.controlDisposer = null;
    this.reactiveDisposer = null;
    this.renderQueued = false;
    this.descriptors = [];
    panel.addEventListener("click", (event) => {
      const use = event.target.closest("[data-dashboard-use]");
      if (use)
        this.onUse(use.dataset.dashboardUse);
      const read = event.target.closest("[data-dashboard-read]");
      if (read)
        this.onUse(`$${read.dataset.dashboardRead}`);
      if (event.target.closest("[data-dashboard-example]"))
        this.onLoadExample();
    });
  }
  get isOpen() {
    return !this.panel.hidden;
  }
  open() {
    this.panel.hidden = false;
    this.toggle.setAttribute("aria-pressed", "true");
    this.toggle.textContent = "Close dashboard";
    this.refresh();
  }
  close() {
    this.panel.hidden = true;
    this.toggle.setAttribute("aria-pressed", "false");
    this.toggle.textContent = "Dashboard";
    this.disposeMounted();
  }
  toggleOpen() {
    if (this.isOpen)
      this.close();
    else
      this.open();
  }
  disposeMounted() {
    this.controlDisposer?.();
    this.controlDisposer = null;
    this.reactiveDisposer?.();
    this.reactiveDisposer = null;
  }
  subscribe() {
    this.reactiveDisposer?.();
    this.reactiveDisposer = this.repl.subscribeReactive(() => {
      if (this.renderQueued)
        return;
      this.renderQueued = true;
      queueMicrotask(() => {
        this.renderQueued = false;
        if (this.isOpen)
          this.refresh({ rebuildControls: false, resubscribe: false });
      });
    });
  }
  renderSummary() {
    const controlled = this.descriptors.filter(({ controls }) => controls.length).length;
    const derived = this.descriptors.filter(({ dependencies }) => dependencies.length).length;
    const failed = this.descriptors.filter(({ state }) => state === "error").length;
    const count = this.descriptors.length;
    this.countElement.textContent = `${count} reactive ${count === 1 ? "value" : "values"}`;
    this.summaryElement.innerHTML = `<span><b>${count}</b> total</span><span><b>${controlled}</b> controlled</span><span><b>${derived}</b> derived</span><span${failed ? ' class="has-error"' : ""}><b>${failed}</b> errors</span>`;
    this.toggle.dataset.count = String(count);
    this.toggle.setAttribute("aria-label", `Reactive dashboard, ${count} ${count === 1 ? "value" : "values"}`);
  }
  renderVariables() {
    const hasValues = this.descriptors.length > 0;
    this.emptyElement.hidden = hasValues;
    this.variablesElement.hidden = !hasValues;
    this.variablesElement.innerHTML = reactiveVariableCardsHtml(this.descriptors);
  }
  renderControls() {
    this.controlDisposer?.();
    this.controlDisposer = null;
    const controls = this.descriptors.flatMap(({ controls: controls2 }) => controls2);
    this.controlsSection.hidden = controls.length === 0;
    this.controlsElement.replaceChildren();
    if (!controls.length)
      return;
    const panelValue = createControlPanel([
      controls,
      "Reactive inputs",
      "Only variables with an explicit control definition are editable."
    ]);
    this.controlsElement.innerHTML = renderOutputHtml(panelValue, this.repl.formatValue);
    this.controlDisposer = mountOutputWidgets(this.controlsElement, panelValue, {
      format: this.repl.formatValue,
      evaluateControl: (source) => this.repl.run(source),
      onControlSet: () => this.refresh({ rebuildControls: false, resubscribe: false }),
      onControlSubmit: () => this.refresh({ rebuildControls: false, resubscribe: false })
    });
  }
  refresh({ rebuildControls = true, resubscribe = true } = {}) {
    this.descriptors = this.repl.reactiveVariables();
    this.renderSummary();
    if (!this.isOpen)
      return;
    this.renderVariables();
    if (rebuildControls)
      this.renderControls();
    if (resubscribe)
      this.subscribe();
  }
  dispose() {
    this.disposeMounted();
  }
}

// src/showcase-examples.js
var program = (source) => source.trim();
var showcaseExamples = Object.freeze([
  {
    id: "fraction-sum",
    category: "Exact numbers",
    complexity: "Short",
    output: "Array",
    title: "Three exact fractions",
    summary: "Add familiar fractions without introducing floating-point rounding.",
    source: "1/2 + 1/3 + 1/7",
    keywords: "rational fraction arithmetic sum"
  },
  {
    id: "pi-views",
    category: "Exact numbers",
    complexity: "Tiny",
    output: "Number",
    title: "One value, three notations",
    summary: "Inspect the classic 355/113 approximation as decimal, fraction, and continued fraction.",
    source: 'q := 355/113; [q _> ".18", q _> "/", q _> ".~"]',
    keywords: "decimal format continued fraction pi notation"
  },
  {
    id: "interval-product",
    category: "Exact numbers",
    complexity: "Tiny",
    output: "Interval",
    title: "Multiply two uncertainties",
    summary: "Propagate two exact rational intervals and retain their exact endpoints.",
    source: "(9/10:11/10) * (3/2:7/4)",
    keywords: "interval uncertainty bounds product"
  },
  {
    id: "harmonic-mean",
    category: "Calculator programs",
    complexity: "Short",
    output: "Number",
    title: "Define an exact function",
    summary: "Create a reusable harmonic mean and call it with two rational inputs.",
    source: program(`
HarmonicMean(a, b) -> 2 * a * b / (a + b);
HarmonicMean(3/4, 5/6)
        `),
    keywords: "function exact harmonic mean non-reactive"
  },
  {
    id: "fraction-table",
    category: "Calculator programs",
    complexity: "Short",
    output: "Table",
    title: "A small exact-value table",
    summary: "Compose fractions and their squares into portable structured output.",
    source: program(`
.Table(
    ["n", "fraction", "square"],
    [
        [1, 1/2, 1/4],
        [2, 2/3, 4/9],
        [3, 3/4, 9/16],
        [4, 4/5, 16/25]
    ],
    {= caption="Exact fractions and squares" }
)
        `),
    keywords: "table structured output fraction square non-reactive"
  },
  {
    id: "static-geometry",
    category: "Calculator programs",
    complexity: "Medium",
    output: "Graphic",
    title: "Draw a geometric postcard",
    summary: "Build a portable vector scene from paths, circles, rectangles, and text.",
    source: program(`
.Graphics.Graphic([360, 190], [
    .Graphics.Rectangle([0, 0], [360, 190],
        {= fill="#f0fdfa" }),
    .Graphics.Path([[45, 145], [180, 30], [315, 145], [45, 145]],
        {= stroke="#0f766e", width=4, fill="#ccfbf1" }),
    .Graphics.Circle([180, 95], 34,
        {= fill="#7c3aed", stroke="#ffffff", width=3 }),
    .Graphics.Text([180, 103], "RiX",
        {= fill="#ffffff", anchor="middle", size=20, weight="bold" })
])
        `),
    keywords: "graphic drawing geometry path circle vector non-reactive"
  },
  {
    id: "triangular-number",
    category: "Reactive models",
    complexity: "Short",
    output: "Number",
    title: "A live triangular number",
    summary: "Move one exact slider and watch a derived numerical value update.",
    source: program(`
$$n := .Slider(5, 1:20, 1, "n");
$$triangular := $n * ($n + 1) / 2;
$triangular
        `),
    keywords: "reactive slider number sequence triangular dashboard"
  },
  {
    id: "simple-interest",
    category: "Reactive models",
    complexity: "Medium",
    output: "Table",
    title: "Exact simple-interest model",
    summary: "Combine a direct expression input with exact rate and duration sliders.",
    source: program(`
$$principal := .Input(1200, "Principal");
$$rate := .Slider(1/20, 0:1/5, 1/100, "Annual rate");
$$years := .Slider(5, 1:20, 1, "Years");

$$interestReport := {;
    interest := $principal * $rate * $years;
    total := $principal + interest;
    .Table(
        ["Quantity", "Exact value"],
        [
            ["Principal", $principal],
            ["Rate", $rate],
            ["Years", $years],
            ["Interest", interest],
            ["Total", total]
        ],
        {= caption="Simple interest, with no rounded cents" }
    )
};
$interestReport
        `),
    keywords: "reactive input slider financial interest numerical table dashboard"
  },
  {
    id: "reactive-circle",
    category: "Reactive models",
    complexity: "Medium",
    output: "Graphic",
    title: "Reactive circle studio",
    summary: "Control exact geometry and color while a portable graphic redraws live.",
    source: program(`
$$radius := .Slider(42, 10:80, 2, "Radius");
$$fill := .Choice("#0f766e", [
    {= value="#0f766e", label="teal" },
    {= value="#7c3aed", label="violet" },
    {= value="#be123c", label="crimson" }
], "Fill color");

$$circleStudio := .Graphics.Graphic([360, 220], [
    .Graphics.Rectangle([0, 0], [360, 220], {= fill="#f8fafc" }),
    .Graphics.Path([[40, 110], [320, 110]],
        {= stroke="#cbd5e1", width=1 }),
    .Graphics.Path([[180, 25], [180, 195]],
        {= stroke="#cbd5e1", width=1 }),
    .Graphics.Circle([180, 110], $radius,
        {= fill=$fill, stroke="#ffffff", width=4 }),
    .Graphics.Text([180, 116], @"r = @{$radius}",
        {= fill="#ffffff", anchor="middle", size=18, weight="bold" })
]);
$circleStudio
        `),
    keywords: "reactive graphic circle slider choice color geometry dashboard"
  },
  {
    id: "reactive-quadratic",
    category: "Polynomial labs",
    complexity: "Long",
    output: "Plot",
    title: "Reactive quadratic coefficients",
    summary: "Explore an exact quadratic whose three coefficients are dashboard controls.",
    source: program(`
.Plugin.Load("plot");

$$a := .Choice(1, [-2, -1, 1, 2], "x² coefficient");
$$b := .Slider(-2, -8:8, 1, "x coefficient");
$$c := .Slider(-1, -8:8, 1, "constant");

$$quadraticLab := {;
    coefficients := [$a, $b, $c];
    discriminant := $b^2 - 4 * $a * $c;
    graph := .plot.Polynomial(coefficients, [-5, 5], {=
        size=[620, 340],
        yDomain=[-24, 24],
        stroke="#2563eb",
        width=3,
        label="f(x)"
    });
    .Fragment([
        .Heading(2, "Reactive quadratic"),
        .Paragraph(@"f(x) = @{$a}x² + @{$b}x + @{$c}"),
        graph,
        .Table(
            ["Quantity", "Exact value"],
            [
                ["Coefficients", coefficients],
                ["Discriminant", discriminant],
                ["f(0)", $c]
            ]
        )
    ])
};
$quadraticLab
        `),
    keywords: "reactive polynomial quadratic coefficients discriminant plot graph dashboard"
  },
  {
    id: "synthetic-recenter",
    category: "Polynomial labs",
    complexity: "Extended",
    output: "Plot + grids",
    title: "Recenter a cubic by synthetic division",
    summary: "Repeated synthetic division derives the coefficients of P(h + u) and plots the recentered cubic.",
    source: program(`
.Plugin.Load("algebra");
.Plugin.Load("plot");

$$a := .Choice(1, [-2, -1, 1, 2], "x³ coefficient");
$$b := .Slider(-3, -8:8, 1, "x² coefficient");
$$c := .Slider(2, -8:8, 1, "x coefficient");
$$d := .Slider(4, -8:8, 1, "constant");
$$center := .Slider(2, -3:3, 1/2, "Center h");

$$recenteredCubic := {;
    original := [$a, $b, $c, $d];
    polynomial := .algebra.Polynomial(original);

    first := .algebra.SyntheticDivide(polynomial, $center);
    second := .algebra.SyntheticDivide(first.Quotient(), $center);
    third := .algebra.SyntheticDivide(second.Quotient(), $center);

    constantInU := first.Remainder().Evaluate(0);
    linearInU := second.Remainder().Evaluate(0);
    quadraticInU := third.Remainder().Evaluate(0);
    shifted := [$a, quadraticInU, linearInU, constantInU];

    shiftedPlot := .plot.Polynomial(shifted, [-4, 4], {=
        size=[620, 340],
        yDomain=[-80, 80],
        stroke="#7c3aed",
        width=3,
        label="P(h + u)"
    });

    .Fragment([
        .Heading(2, "Synthetic recentering"),
        .Paragraph(@"Set u = x - @{$center}, so x = u + @{$center}."),
        .Table(
            ["Basis", "Descending coefficients"],
            [
                ["P(x)", original],
                ["P(h + u)", shifted]
            ],
            {= caption="Repeated remainders become the new coefficients" }
        ),
        .Heading(3, "Divide P(x) by x - h"),
        first.Grid(),
        .Heading(3, "Divide the quotient again"),
        second.Grid(),
        .Heading(3, "One final synthetic division"),
        third.Grid(),
        .Heading(3, "The same curve in u-coordinates"),
        shiftedPlot
    ])
};
$recenteredCubic
        `),
    keywords: "reactive polynomial cubic coefficients synthetic division recenter shift horner plot graph dashboard"
  },
  {
    id: "scene3d-camera-studio",
    category: "Spatial labs",
    complexity: "Extended",
    output: "Interactive 3D snapshot",
    title: "Orbit an exact 3D scene",
    summary: "Drive a retained mesh, exact sampled curve, annotations, picking IDs, rational orbit camera, and lit/wireframe snapshots.",
    source: program(`
.Plugin.Load("scene3d");

Cayley(t) -> {= c=(1-t^2)/(1+t^2), s=2*t/(1+t^2) };
vertices := [
    [-1,-1,0], [1,-1,0], [1,1,0], [-1,1,0],
    [-1,-1,2], [1,-1,2], [1,1,2], [-1,1,2]
];
triangles := [
    [1,3,2], [1,4,3], [5,6,7], [5,7,8],
    [1,2,6], [1,6,5], [2,3,7], [2,7,6],
    [3,4,8], [3,8,7], [4,1,5], [4,5,8]
];
cube := .scene3d.Mesh(vertices, triangles, {= color="#2563eb", width=2, id="cube", label="exact cube" });
axes := .scene3d.Axes({= length=3, width=3, id="basis" });
curve := .scene3d.ParametricCurve(t -> [2*t,t^2-1,1+t/2], -1:1, {=
    samples=25, color="#7c3aed", width=3, id="trajectory", label="exact trajectory"
});
note := .scene3d.Annotation([2,0,3/2], "t = 1", {= color="#7c3aed", id="endpoint" });

$$orbit := 1/3;
$$spin := 1/4;
$$height := 7/2;
$$projection := "perspective";
$$mode := "lit";

$$view := {;
    spinPair := Cayley($spin);
    camera := .scene3d.OrbitCamera([0,0,1], {=
        radius=6, height=$height-1, turn=$orbit, projection=$projection, scale=6
    });
    matrix := [spinPair[:c],-spinPair[:s],0,0, spinPair[:s],spinPair[:c],0,0, 0,0,1,0, 0,0,0,1];
    scene := .scene3d.Scene([
        @axes,
        @curve,
        @note,
        .scene3d.Transform([@cube], {= matrix=matrix })
    ], {=
        camera=camera,
        lights=[
            .scene3d.AmbientLight("#ffffff", 1/4),
            .scene3d.DirectionalLight([2,-3,-4], {= intensity=3/4 })
        ]
    });
    snapshot := .scene3d.Snapshot(scene, {= size=[680,440], mode=$mode });
    .Fragment([
        .Heading(2, "Exact Scene3D camera studio"),
        .ControlPanel([
            .Controls.Slider($$orbit, -2:2, 1/12, "camera orbit"),
            .Controls.Slider($$spin, -2:2, 1/12, "cube rotation"),
            .Controls.Slider($$height, 2:7, 1/4, "camera height"),
            .Controls.Choice($$projection, ["perspective","orthographic"], "projection"),
            .Controls.Choice($$mode, ["lit","wireframe"], "snapshot mode")
        ]),
        .Figure(snapshot[:value], "Phase 2 axes, curve, annotation, picking identities, and exact orbit metadata remain portable."),
        .Table(["Stage","Value"], [
            ["scene", scene[:schema]],
            ["realized", scene[:realized][:schema]],
            ["projected", snapshot[:projected][:schema]],
            ["orbit", camera[:orbit][:schema]],
            ["trajectory records", snapshot[:picking][:trajectory][:indices]],
            ["work", snapshot[:work]]
        ])
    ])
};
$view
        `),
    keywords: "scene3d 3d reactive camera orbit mesh curve annotation picking axes lights lit wireframe retained exact cayley"
  },
  {
    id: "nd-hypercube-lab",
    category: "Spatial labs",
    complexity: "Extended",
    output: "Interactive nD projection",
    title: "Project a live nD hypercube",
    summary: "Compare 4D, 5D, and 6D hypercubes after exact hidden-plane rotations and explicit projection to Scene3D.",
    source: program(`
.Plugin.Load("scene3d");
.Plugin.Load("nd");

Cayley(t) -> {= c=(1-t^2)/(1+t^2), s=2*t/(1+t^2) };
HiddenRotation(dimension, turn) -> {;
    combined := .nd.CayleyRotation(dimension, 1, 2, 0);
    {@ hidden=4; hidden<=@dimension; {;
        visible := hidden-3;
        parameter := hidden%2 == 0 ?: @turn ?_ 0-@turn;
        next := .nd.CayleyRotation(@dimension, visible, hidden, parameter);
        @combined ~= .nd.Compose(next, @combined);
    }; hidden+=1 };
    combined
};

$$dimension := 4;
$$hiddenTurn := 1/3;
$$cameraTurn := 1/4;
$$color := "#7c3aed";

$$view := {;
    source := .nd.Hypercube($dimension, 2);
    rotation := HiddenRotation($dimension, $hiddenTurn);
    xyz := .nd.CoordinateProjection($dimension, [1,2,3]);
    projected := .nd.Project(source, .nd.Compose(xyz, rotation));
    orbit := Cayley($cameraTurn);
    camera := .scene3d.OrthographicCamera([6*orbit[:c],6*orbit[:s],4], [0,0,0], {= scale=6 });
    scene := .nd.ToScene3D(projected, {= camera=camera, style={= color=$color, width=2, opacity=4/5 } });
    graphic := .scene3d.Snapshot(scene, {= size=[680,460] })[:value];
    .Fragment([
        .Heading(2, "Exact nD hypercube lab"),
        .ControlPanel([
            .Controls.Choice($$dimension, [4,5,6], "dimension"),
            .Controls.Slider($$hiddenTurn, -1:1, 1/12, "hidden-plane turn"),
            .Controls.Slider($$cameraTurn, -2:2, 1/12, "3D camera orbit"),
            .Controls.Choice($$color, ["#7c3aed","#0891b2","#be123c"], "edge color")
        ]),
        .Figure(graphic, "Every hidden dimension is mixed into x/y/z before the explicit coordinate projection."),
        .Table(["Quantity","Value"], [
            ["dimension", source[:dimension]],
            ["vertices", source[:vertices].Len()],
            ["edges", source[:edges].Len()],
            ["nD schema", source[:schema]],
            ["projection schema", xyz[:schema]]
        ])
    ])
};
$view
        `),
    keywords: "nd n-dimensional hypercube tesseract 4d 5d 6d exact cayley projection scene3d reactive"
  },
  {
    id: "nd-slice-sweep",
    category: "Spatial labs",
    complexity: "Extended",
    output: "Interactive 4D section",
    title: "Sweep a tesseract slice",
    summary: "Intersect rotated 4D edges with w = level exactly, then compare the section points with an affine wireframe projection.",
    source: program(`
.Plugin.Load("scene3d");
.Plugin.Load("nd");

SlicePoints(polytope, level) -> {;
    points := [];
    {@ edgeIndex=1; edgeIndex<=@polytope[:edges].Len(); {;
        edge := @polytope[:edges][edgeIndex];
        first := @polytope[:vertices][edge[1]];
        second := @polytope[:vertices][edge[2]];
        crosses := (first[4]<@level && second[4]>@level) || (second[4]<@level && first[4]>@level);
        crosses ?: {;
            amount := (@level-@first[4])/(@second[4]-@first[4]);
            point := [1,2,3].Map(axis -> @first[axis]+@amount*(@second[axis]-@first[axis]));
            @points ~= @points.Push(point);
        } ?_ _;
    }; edgeIndex+=1 };
    points
};

source := .nd.Hypercube(4, 2);
rotated := .nd.Project(source, .nd.Compose(
    .nd.CayleyRotation(4,2,4,-1/3),
    .nd.CayleyRotation(4,1,4,1/2)
));
wire3d := .nd.Project(rotated, .nd.CoordinateProjection(4,[1,2,3]));
wire := .nd.ToScene3D(wire3d, {= style={= color="#94a3b8", width=1, opacity=1/3 } });
$$level := 0;

$$view := {;
    points := SlicePoints(@rotated, $level);
    scene := .scene3d.Scene([
        @wire[:children][1],
        .scene3d.PointCloud(points, {= color="#e11d48", radius=6 })
    ], {= camera=.scene3d.OrthographicCamera([5,5,4],[0,0,0],{= scale=5 }) });
    graphic := .scene3d.Snapshot(scene, {= size=[680,460] })[:value];
    .Fragment([
        .Heading(2, "Exact tesseract edge/plane section"),
        .Paragraph("Grey is affine projection; red points are exact intersections computed before w is discarded."),
        .ControlPanel([.Controls.Slider($$level, -6/5:6/5, 1/5, "w level")]),
        .Figure(graphic, @"w = @{$level}; @{points.Len()} intersections"),
        .Table(["Property","Value"], [["slice axis",4],["level",$level],["intersections",points.Len()]])
    ])
};
$view
        `),
    keywords: "nd tesseract 4d slice section hyperplane intersection animation scene3d reactive exact"
  }
].map((example) => Object.freeze(example)));
function findShowcaseExamples(query = "") {
  const needle = String(query).trim().toLowerCase();
  if (!needle)
    return showcaseExamples;
  return showcaseExamples.filter((example) => [
    example.title,
    example.summary,
    example.category,
    example.complexity,
    example.output,
    example.keywords,
    example.source
  ].join(" ").toLowerCase().includes(needle));
}
function showcaseExample(id) {
  return showcaseExamples.find((example) => example.id === id) || null;
}

// src/workspace-state.js
var RIX_SESSION_FORMAT = "rix-web-session";
var RIX_SESSION_VERSION = 1;
function requiredString(value, label) {
  if (typeof value !== "string")
    throw new Error(`${label} must be text`);
  return value;
}
function sessionPluginProfile(value) {
  if (value === null || value === undefined)
    return null;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Plugin profile must be an object");
  if (!Array.isArray(value.plugins) || value.plugins.some((id) => typeof id !== "string")) {
    throw new Error("Plugin profile plugins must be a list of names");
  }
  return {
    name: requiredString(value.name ?? "saved", "Plugin profile name"),
    plugins: [...new Set(value.plugins.map((id) => id.trim()).filter(Boolean))],
    source: requiredString(value.source ?? "", "Plugin profile source")
  };
}
function createSessionSnapshot({
  transcript = [],
  input = "",
  scriptMode = false,
  autoSeparateLines = true,
  numberConfig = {},
  reactiveInputs = [],
  dashboardOpen = false,
  pluginProfile = null,
  savedAt = new Date().toISOString()
} = {}) {
  return {
    format: RIX_SESSION_FORMAT,
    version: RIX_SESSION_VERSION,
    savedAt,
    transcript: transcript.map((entry, index) => ({
      source: requiredString(entry?.source, `Transcript entry ${index + 1} source`),
      text: typeof entry?.text === "string" ? entry.text : ""
    })),
    input: requiredString(input, "Current input"),
    scriptMode: Boolean(scriptMode),
    autoSeparateLines: Boolean(autoSeparateLines),
    numberConfig: {
      input: requiredString(numberConfig.input ?? "z[10]", "Number input notation"),
      display: requiredString(numberConfig.display ?? "..", "Number display notation")
    },
    reactiveInputs: reactiveInputs.map((entry, index) => ({
      name: requiredString(entry?.name, `Reactive input ${index + 1} name`),
      source: requiredString(entry?.source, `Reactive input ${index + 1} source`)
    })),
    dashboardOpen: Boolean(dashboardOpen),
    pluginProfile: sessionPluginProfile(pluginProfile)
  };
}
function serializeSession(snapshot) {
  return `${JSON.stringify(createSessionSnapshot(snapshot), null, 2)}
`;
}
function parseSession(text) {
  let value;
  try {
    value = JSON.parse(String(text));
  } catch {
    throw new Error("This is not a valid RiX session file.");
  }
  if (!value || value.format !== RIX_SESSION_FORMAT) {
    throw new Error("This file is not a RiX Web session.");
  }
  if (value.version !== RIX_SESSION_VERSION) {
    throw new Error(`RiX session version ${value.version} is not supported.`);
  }
  if (!Array.isArray(value.transcript) || !Array.isArray(value.reactiveInputs ?? [])) {
    throw new Error("The RiX session is missing its command history.");
  }
  return createSessionSnapshot(value);
}
function statement(source) {
  const text = String(source).trim();
  return text ? `${text}${text.endsWith(";") ? "" : ";"}` : "";
}
function webMetaCommand(source) {
  return /^\.(?:help|clear|vars)(?:\s|$)/i.test(String(source).trim());
}
function serializePortableSession(snapshot) {
  const session = createSessionSnapshot(snapshot);
  const profile = session.pluginProfile || { name: "fresh", plugins: [], source: "" };
  const plugins = profile.plugins.join(", ");
  const parts = [
    `/**
plugins: [${plugins}]
operator-files: []
**/`,
    "## Portable session exported by RiX-Web."
  ];
  if (profile.source.trim()) {
    parts.push("## A RiX-Web host that already applied this profile may remove the following marked block.", `## RIX-WEB-PROFILE-BEGIN ${profile.name}`, profile.source.trim(), "## RIX-WEB-PROFILE-END");
  }
  parts.push(statement(`<* ${JSON.stringify(session.numberConfig.input)}`), statement(`*> ${JSON.stringify(session.numberConfig.display)}`), ...session.transcript.filter(({ source }) => !webMetaCommand(source)).map(({ source }) => statement(source)), ...session.reactiveInputs.map(({ name, source }) => statement(`$${name} := ${source}`)));
  if (session.input) {
    parts.push("## Unexecuted RiX-Web draft:", ...session.input.split(`
`).map((line) => `## ${line}`));
  }
  return `${parts.filter(Boolean).join(`

`)}
`;
}
function modePresentation(scriptMode) {
  return scriptMode ? {
    buttonLabel: "Input: Script",
    status: "Script input · Enter adds a line · Ctrl/⌘ + Enter runs",
    placeholder: "Enter a RiX script"
  } : {
    buttonLabel: "Input: Calculator",
    status: "Calculator input · Enter runs · Shift+↑ opens script input",
    placeholder: "Enter a RiX expression"
  };
}

class ClearCoordinator {
  constructor() {
    this.armed = false;
  }
  activate(hasInput) {
    if (this.armed) {
      this.armed = false;
      return "clear-session";
    }
    this.armed = true;
    return hasInput ? "clear-input" : "confirm-session";
  }
  reset() {
    this.armed = false;
  }
}

// src/main.js
var repl = createRixRepl({ pluginProfile: pluginProfileFromUrl(window.location.href) });
var outputHistory = document.querySelector("#output-history");
var input = document.querySelector("#calculator-input");
var completionGhost = document.querySelector("#completion-ghost");
var completionHint = document.querySelector("#completion-hint");
var calculator = document.querySelector(".calculator");
var scriptToggle = document.querySelector("#script-toggle");
var lineSeparatorToggle = document.querySelector("#line-separator-toggle");
var clearButton = document.querySelector("#clear-button");
var scriptNote = document.querySelector("#script-note");
var sessionStatus = document.querySelector("#session-status");
var helpDialog = document.querySelector("#help-dialog");
var helpSearch = document.querySelector("#help-search");
var helpContent = document.querySelector("#help-content");
var fileInput = document.querySelector("#file-input");
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
var reactiveDashboardPanel = document.querySelector("#reactive-dashboard-panel");
var reactiveDashboardToggle = document.querySelector("#reactive-dashboard-toggle");
var NUMBER_STORAGE_KEY = "ratcalc.number-config.v1";
var REACTIVE_DASHBOARD_EXAMPLE = `$$width := .Slider(3, 0:10, 1/2, "Width");
$$height := .Slider(2, 0:10, 1/2, "Height");
$$area := $width * $height;
$area`;
var scriptMode = false;
var history = [];
var historyIndex = -1;
var transcript = [];
var autoSeparateLines = true;
var completionState = null;
var clearTimer = null;
var outputDisposers = new Set;
var clearCoordinator = new ClearCoordinator;
var intervalExplorer = new IntervalExplorer({
  dialog: intervalDialog,
  evaluate: (source) => repl.run(source),
  onUse: (source) => setInput(source)
});
var reactiveDashboard = new ReactiveDashboard({
  panel: reactiveDashboardPanel,
  toggle: reactiveDashboardToggle,
  repl,
  onUse: (source) => setInput(source),
  onLoadExample: () => {
    setScriptMode(true);
    setInput(REACTIVE_DASHBOARD_EXAMPLE);
  }
});
function escapeHtml3(value) {
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
  completionHint.innerHTML = `<b>${escapeHtml3(candidate.insertText)}</b> · ${escapeHtml3(candidate.detail)}${candidate.preview ? ` — ${escapeHtml3(candidate.preview)}` : ""}`;
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
  sourceLine.innerHTML = `<span class="prompt">&gt;</span>${escapeHtml3(source)}<span class="reload-icon" title="Reload expression">↻</span>`;
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
      outputLine.innerHTML = response.type === "error" ? escapeHtml3(preview) : `${escapeHtml3(preview)}<span class="inject-icon" title="Use this value">→</span>`;
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
    reactiveDashboard.refresh({ rebuildControls: false });
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
      button.textContent = "Transcript";
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
    button.textContent = "Transcript";
  }, 1600);
}
function setSessionStatus(message, { error = false } = {}) {
  sessionStatus.textContent = message;
  sessionStatus.classList.toggle("error", error);
}
function currentSessionSnapshot() {
  const reactiveInputs = repl.reactiveVariables().filter(({ dependencies }) => dependencies.length === 0).map(({ name, sourceText }) => ({ name, source: sourceText }));
  return createSessionSnapshot({
    transcript,
    input: input.value,
    scriptMode,
    autoSeparateLines,
    numberConfig: repl.numberConfig(),
    reactiveInputs,
    dashboardOpen: reactiveDashboard.isOpen,
    pluginProfile: repl.pluginProfile()
  });
}
function downloadText(filename, text, type) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type }));
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function saveSession() {
  const date = new Date().toISOString().slice(0, 10);
  downloadText(`ratcalc-${date}.rix-session`, serializeSession(currentSessionSnapshot()), "application/json");
  setSessionStatus("Session saved. Load this .rix-session file to restore it.");
}
function exportPortableSession() {
  const date = new Date().toISOString().slice(0, 10);
  downloadText(`ratcalc-${date}.rix`, serializePortableSession(currentSessionSnapshot()), "text/plain");
  setSessionStatus("Portable RiX source exported. Run it with the rix command-line runner.");
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
  const title = query ? `Help for “${escapeHtml3(query)}”` : "RiX and RatCalc help";
  const body = groups.length ? groups.map((group) => `<h4>${escapeHtml3(group.title)}</h4><ul>${group.items.map(([syntax, description]) => `<li><code>${escapeHtml3(syntax)}</code> — ${escapeHtml3(description)}</li>`).join("")}</ul>`).join("") : `<p>No help topic matched “${escapeHtml3(query)}”. Try <code>.Help("interval")</code>.</p>`;
  panel.innerHTML = `<h3>${title}</h3>${body}`;
  return panel;
}
function renderHelp(query = "") {
  const { groups } = findHelp(query);
  const examples = findShowcaseExamples(query);
  const intro = query ? "" : `<p class="help-overview">Choose a section for syntax, examples, and calculator features.</p>`;
  const exampleGroups = new Map;
  for (const example of examples) {
    const entries = exampleGroups.get(example.category) || [];
    entries.push(example);
    exampleGroups.set(example.category, entries);
  }
  const showcaseSection = examples.length ? `
        <details class="help-section help-showcases">
            <summary><span><b>Runnable examples</b><small>Load complete programs for exact arithmetic, reactive models, graphics, and polynomial work.</small></span><i>${examples.length} example${examples.length === 1 ? "" : "s"}</i></summary>
            <div class="help-section-body">
                ${[...exampleGroups].map(([category, entries]) => `
                    <section class="help-showcase-group">
                        <h4>${escapeHtml3(category)}</h4>
                        <div class="help-showcase-grid">
                            ${entries.map((example) => `
                                <button type="button" class="help-showcase-card" data-showcase-example="${escapeHtml3(example.id)}" aria-label="Load ${escapeHtml3(example.title)}">
                                    <span class="help-showcase-meta"><i>${escapeHtml3(example.complexity)}</i><i>${escapeHtml3(example.output)}</i></span>
                                    <b>${escapeHtml3(example.title)}</b>
                                    <small>${escapeHtml3(example.summary)}</small>
                                    <code>${escapeHtml3(example.source.split(`
`).find((line) => line.trim())?.trim() || example.source)}</code>
                                    <span class="help-showcase-load">Load example →</span>
                                </button>
                            `).join("")}
                        </div>
                    </section>
                `).join("")}
            </div>
        </details>` : "";
  const sections = groups.length ? groups.map((group) => `<details class="help-section help-group"><summary><span><b>${escapeHtml3(group.title)}</b><small>${escapeHtml3(group.description)}</small></span><i>${group.items.length} topic${group.items.length === 1 ? "" : "s"}</i></summary><div class="help-section-body">${group.items.map(([syntax, description]) => `<div class="help-item"><code>${escapeHtml3(syntax)}</code><p>${escapeHtml3(description)}</p></div>`).join("")}</div></details>`).join("") : examples.length ? "" : `<p class="help-intro">No matching help topic or showcase. Try “interval”, “reactive”, “polynomial”, or “graphic”.</p>`;
  helpContent.innerHTML = intro + showcaseSection + sections;
}
function openHelp(query = "") {
  helpSearch.value = query;
  renderHelp(query);
  helpDialog.showModal();
  helpSearch.focus();
}
function loadShowcase(id) {
  const example = showcaseExample(id);
  if (!example)
    return;
  helpDialog.close();
  setScriptMode(example.source.includes(`
`) || example.source.includes(";"));
  setInput(example.source);
}
function setReactiveDashboardOpen(next) {
  if (next) {
    reactiveDashboard.open();
  } else {
    reactiveDashboard.close();
  }
  document.querySelector(".container").classList.toggle("dashboard-open", next);
}
function openInspection(source, value) {
  inspectSource.textContent = source;
  inspectValue.textContent = value;
  inspectDialog.showModal();
}
async function clearSession(options = {}) {
  for (const dispose of outputDisposers)
    dispose();
  outputDisposers.clear();
  await repl.reset(options);
  history = [];
  historyIndex = -1;
  transcript = [];
  outputHistory.innerHTML = "";
  displayWelcome();
  reactiveDashboard.refresh();
  setInput("");
  clearCoordinator.reset();
  updateClearButton();
  setSessionStatus("Session cleared.");
}
function updateClearButton() {
  const armed = clearCoordinator.armed;
  for (const button of document.querySelectorAll('[data-action="clear"]')) {
    button.textContent = armed ? "Clear history?" : button === clearButton ? "Clear input" : "Clear";
    button.classList.toggle("danger", armed);
    button.setAttribute("aria-label", armed ? "Clear calculator history and reset the session" : "Clear current input");
  }
}
function resetClearConfirmation() {
  if (clearTimer)
    clearTimeout(clearTimer);
  clearTimer = null;
  clearCoordinator.reset();
  updateClearButton();
}
async function handleClear() {
  const intent = clearCoordinator.activate(Boolean(input.value));
  if (intent === "clear-session") {
    if (clearTimer)
      clearTimeout(clearTimer);
    clearTimer = null;
    await clearSession();
    return;
  }
  if (intent === "clear-input")
    setInput("");
  updateClearButton();
  setSessionStatus("Input cleared. Select “Clear history?” to reset the full session.");
  if (clearTimer)
    clearTimeout(clearTimer);
  clearTimer = setTimeout(resetClearConfirmation, 5000);
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
  reactiveDashboard.refresh();
  setInput("");
}
function setScriptMode(next) {
  scriptMode = next;
  const presentation = modePresentation(scriptMode);
  calculator.classList.toggle("script-mode", scriptMode);
  scriptToggle.classList.toggle("active", scriptMode);
  scriptToggle.setAttribute("aria-pressed", String(scriptMode));
  scriptToggle.textContent = presentation.buttonLabel;
  scriptNote.hidden = !scriptMode;
  document.querySelector("#entry-mode-label").textContent = presentation.status;
  input.placeholder = `${presentation.placeholder} — .help for help`;
  setInput(input.value);
}
function setAutoSeparateLines(next) {
  autoSeparateLines = next;
  repl.setAutoSeparateLines(autoSeparateLines);
  lineSeparatorToggle.checked = autoSeparateLines;
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
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".rix-session")) {
    try {
      await restoreSession(parseSession(text));
      setSessionStatus(`Restored ${file.name}.`);
    } catch (error) {
      setSessionStatus(error.message || String(error), { error: true });
    }
  } else if (lowerName.endsWith(".js")) {
    appendOutput(`.load ${file.name}`, { type: "result", text: "JavaScript module selected. Browser execution is intentionally held behind a future trust policy." });
  } else {
    setScriptMode(true);
    setInput(stripMarkedPluginProfile(text, repl.pluginProfile().source));
  }
}
async function restoreSession(session) {
  await clearSession(session.pluginProfile ? { pluginProfile: session.pluginProfile } : {});
  setAutoSeparateLines(session.autoSeparateLines);
  applyNumberSettings(session.numberConfig);
  for (const entry of session.transcript) {
    if (/^\.vars$/i.test(entry.source.trim())) {
      showVariables(entry.source);
      continue;
    }
    const response = await repl.runAsync(entry.source);
    if (history.at(-1) !== entry.source)
      history.push(entry.source);
    appendOutput(entry.source, response);
  }
  for (const reactive of session.reactiveInputs) {
    const response = await repl.runAsync(`$${reactive.name} := ${reactive.source}`);
    if (response.type === "error")
      throw new Error(`Could not restore reactive input ${reactive.name}: ${response.text}`);
  }
  reactiveDashboard.refresh();
  setScriptMode(session.scriptMode);
  setInput(session.input);
  setReactiveDashboardOpen(session.dashboardOpen);
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
    case "reactive-dashboard":
      setReactiveDashboardOpen(!reactiveDashboard.isOpen);
      break;
    case "close-reactive-dashboard":
      setReactiveDashboardOpen(false);
      input.focus();
      break;
    case "refresh-reactive-dashboard":
      reactiveDashboard.refresh();
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
      handleClear();
      break;
    case "script":
      setScriptMode(!scriptMode);
      break;
    case "copy":
      copySession();
      break;
    case "save":
      saveSession();
      break;
    case "export-rix":
      exportPortableSession();
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
  const showcase = event.target.closest("[data-showcase-example]");
  if (showcase) {
    loadShowcase(showcase.dataset.showcaseExample);
    return;
  }
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
input.addEventListener("input", () => {
  resetClearConfirmation();
  setInput(input.value);
});
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
  setAutoSeparateLines(lineSeparatorToggle.checked);
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
reactiveDashboard.refresh();
if (repl.pluginProfile().warnings.length) {
  setSessionStatus(repl.pluginProfile().warnings.join(" "), { error: true });
}
input.focus();
window.addEventListener("pagehide", () => {
  reactiveDashboard.dispose();
  repl.dispose();
});

//# debugId=3BEB6D4B0D338A6064756E2164756E21
//# sourceMappingURL=main.js.map
