import { Integer, Rational, RationalInterval } from "@ratmath/core";
import { parse } from "../../rix/src/index.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const COLORS = ["#2563eb", "#dc2626", "#7c3aed"];

function unwrapGrouping(node) {
    return node?.type === "Grouping" ? unwrapGrouping(node.expression) : node;
}

function astSource(node) {
    if (!node) return null;
    switch (node.type) {
    case "Number": return node.value;
    case "UserIdentifier": return node.name;
    case "SystemIdentifier": return `.${node.name}`;
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
    default: return null;
    }
}

function rationalValue(value) {
    if (value instanceof Rational) return value;
    if (value instanceof Integer) return value.toRational();
    return null;
}

function intervalValue(value) {
    if (value instanceof RationalInterval) return new RationalInterval(value.start, value.end);
    const rational = rationalValue(value);
    return rational ? new RationalInterval(rational, rational) : null;
}

export function isRationalIntervalValue(value) {
    return value instanceof RationalInterval;
}

export function analyzeIntervalExpression(source, evaluate) {
    try {
        const nodes = parse(source);
        if (nodes.length !== 1) return null;
        const root = unwrapGrouping(nodes[0]);
        if (root?.type !== "BinaryOperation" || !["+", "-", "*", "/"].includes(root.operator)) return null;
        const leftSource = astSource(root.left);
        const rightSource = astSource(root.right);
        if (!leftSource || !rightSource) return null;
        const left = evaluate(leftSource);
        const right = evaluate(rightSource);
        const leftInterval = left?.type === "result" ? intervalValue(left.value) : null;
        const rightInterval = right?.type === "result" ? intervalValue(right.value) : null;
        if (!leftInterval || !rightInterval) return null;
        return {
            operator: root.operator,
            left: { source: leftSource, value: leftInterval },
            right: { source: rightSource, value: rightInterval },
        };
    } catch {
        return null;
    }
}

function applyOperation(operator, left, right) {
    if (operator === "+") return left.add(right);
    if (operator === "-") return left.subtract(right);
    if (operator === "*") return left.multiply(right);
    if (operator === "/") return left.divide(right);
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
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;",
    })[character]);
}

function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    return element;
}

export class IntervalExplorer {
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
                if (event.key === "Enter") { event.preventDefault(); this.applyEditor(); }
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
        window.addEventListener("pointerup", () => { this.drag = null; });
    }

    open(source, value) {
        const interval = intervalValue(value);
        if (!interval) return;
        this.source = source;
        const provenance = analyzeIntervalExpression(source, this.evaluate);
        if (provenance) {
            this.operator = provenance.operator;
            this.items = [
                { label: "Left operand", source: provenance.left.source, value: provenance.left.value, derived: false },
                { label: "Right operand", source: provenance.right.source, value: provenance.right.value, derived: false },
                { label: `Result (${provenance.operator})`, source, value: interval, derived: true },
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
        if (!this.operator || this.items.length !== 3) return;
        try {
            this.items[2].value = applyOperation(this.operator, this.items[0].value, this.items[1].value);
            this.statusElement.textContent = "Result recalculated exactly from the edited operands.";
        } catch (error) {
            this.statusElement.textContent = error.message || String(error);
        }
    }

    setItemValue(index, value) {
        if (this.items[index]?.derived) return;
        this.items[index].value = value;
        this.recalculate();
        this.render();
    }

    nudge(target, direction, index = this.selectedIndex) {
        const item = this.items[index];
        if (!item || item.derived) return;
        const delta = this.step().multiply(new Rational(BigInt(direction), 1n));
        const start = target === "end" ? item.value.start : item.value.start.add(delta);
        const end = target === "start" ? item.value.end : item.value.end.add(delta);
        this.setItemValue(index, new RationalInterval(start, end));
    }

    applyEditor() {
        const item = this.selected();
        if (!item || item.derived) return;
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
        if (this.items[index]?.derived) return;
        event.preventDefault();
        this.selectedIndex = index;
        this.drag = {
            index,
            target,
            x: event.clientX,
            count: 0,
            value: new RationalInterval(this.items[index].value.start, this.items[index].value.end),
        };
        this.renderEditor();
    }

    pointerMove(event) {
        if (!this.drag) return;
        const count = Math.round((event.clientX - this.drag.x) / 12);
        if (count === this.drag.count) return;
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
        if (approximateValues.length !== values.length) return { min: -1, max: 1, reliable: false };
        let min = Math.min(...approximateValues);
        let max = Math.max(...approximateValues);
        if (min === max) { min -= 1; max += 1; }
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
            if (number === null) return (left + right) / 2;
            return left + ((number - range.min) / (range.max - range.min)) * (right - left);
        };
        const svg = svgElement("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-labelledby": "interval-svg-title interval-svg-description" });
        const title = svgElement("title", { id: "interval-svg-title" });
        title.textContent = "Exact rational intervals on an approximate number line";
        const description = svgElement("desc", { id: "interval-svg-description" });
        description.textContent = this.items.map(({ label, value }) => `${label}: ${exactSource(value)}`).join("; ");
        svg.append(title, description);

        const axisY = this.items.length === 3 ? 132 : 102;
        svg.appendChild(svgElement("line", { x1: left, y1: axisY, x2: right, y2: axisY, class: "interval-axis" }));
        for (let index = 0; index <= 4; index += 1) {
            const position = left + ((right - left) * index) / 4;
            const value = range.min + ((range.max - range.min) * index) / 4;
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
        this.selectionElement.replaceChildren(...this.items.map((item, index) => Object.assign(document.createElement("option"), { value: String(index), textContent: item.label })));
        this.selectionElement.value = String(this.selectedIndex);
        const item = this.selected();
        this.startElement.value = item.value.start.toString();
        this.endElement.value = item.value.end.toString();
        this.startElement.disabled = item.derived;
        this.endElement.disabled = item.derived;
        this.dialog.querySelectorAll("[data-interval-nudge]").forEach((button) => { button.disabled = item.derived; });
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
        const content = kind === "svg"
            ? `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`
            : `<!doctype html><html lang="en"><meta charset="utf-8"><title>RiX exact interval</title><body><h1>Exact interval</h1><p><code>${escapeHtml(this.resultSource())}</code></p>${svg}<p>Coordinates are approximate pixels; labels retain exact values.</p></body></html>`;
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
