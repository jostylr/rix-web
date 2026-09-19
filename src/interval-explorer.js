import { Integer, Rational, RationalInterval } from "@ratmath/core";
import { renderOutputHtml, renderGraphicSvg } from "../../rix/src/index.js";
import { enhanceGraphicViews } from "../../rix/src/tools/graphic-view.js";
import { createExactNumberLineGraphic, traceExactArithmetic, boundedExactExplorationInterval } from "../../rix/src/tools/exact-exploration.js";
import { createSternBrocotRixBridge } from "./rix-stern-brocot-bridge.js";

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
    return value instanceof RationalInterval || value instanceof Rational || value instanceof Integer;
}

export function analyzeIntervalExpression(source, inspect, capturedTrace = null) {
    const trace = capturedTrace || traceExactArithmetic(source, inspect);
    const result = trace.result;
    if (!result || !["+", "-", "*", "/"].includes(result.operator) || result.dependencies.length !== 2) return null;
    const [left, right] = result.dependencies.map((id) => trace.steps.find((step) => step.id === id));
    if (!left?.value || !right?.value) return null;
    return { operator: result.operator,
        left: { source: left.source, value: intervalValue(left.value) },
        right: { source: right.source, value: intervalValue(right.value) } };
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

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;",
    })[character]);
}

export class IntervalExplorer {
    constructor({ dialog, evaluate, inspect = evaluate, onUse }) {
        this.dialog = dialog;
        this.evaluate = evaluate;
        this.inspect = inspect;
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
        this.graphicState = {};
        this.trace = null;
        this.linkBridge = null;

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
            const linked = event.target.closest("[data-exact-inspect]");
            if (linked) this.open(linked.dataset.exactInspect, new Rational(linked.dataset.exactInspect));
            const use = event.target.closest("[data-exact-use]");
            if (use) this.onUse(use.dataset.exactUse);
            if (nudge) {
                const [target, direction] = nudge.dataset.intervalNudge.split(":");
                this.nudge(target, Number(direction));
            }
        });
        window.addEventListener("pointermove", (event) => this.pointerMove(event));
        window.addEventListener("pointerup", () => { this.drag = null; });
    }

    open(source, value, capturedTrace = null) {
        const interval = intervalValue(value);
        if (!interval) return;
        try { boundedExactExplorationInterval(value); }
        catch (error) {
            this.limitError = error.message;
            this.resultError = null;
            this.source = source;
            this.sourceElement.textContent = source;
            this.items = [{ label: "Exact value outside graphic work budget", source, value: interval, derived: true }];
            this.selectedIndex = 0;
            this.operator = null; this.trace = null; this.links = null; this.graphic = null;
            this.provenanceElement.textContent = "The exact value remains available below. Graphic and arithmetic inspection stopped at the work budget.";
            this.graphicElement.replaceChildren();
            this.statusElement.textContent = error.message;
            this.renderEditor(); this.renderTable();
            if (!this.dialog.open) this.dialog.showModal();
            return;
        }
        this.resultError = null;
        this.limitError = null;
        this.source = source;
        this.trace = capturedTrace || traceExactArithmetic(source, this.inspect);
        this.graphicState = {};
        const provenance = analyzeIntervalExpression(source, this.inspect, this.trace);
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
            this.items = [{ label: interval.start.equals(interval.end) ? "Rational point" : "Interval", source, value: interval, derived: false }];
            this.selectedIndex = 0;
        }
        this.statusElement.textContent = "";
        this.sourceElement.textContent = source;
        this.render();
        if (!this.dialog.open) this.dialog.showModal();
    }

    close() {
        this.drag = null;
        this.dialog.close();
    }

    step() {
        const denominator = Math.min(1000000, Math.max(1, Number.parseInt(this.stepElement.value, 10) || 10));
        this.stepElement.value = String(denominator);
        return new Rational(1n, BigInt(denominator));
    }

    selected() {
        return this.items[this.selectedIndex];
    }

    recalculate() {
        if (!this.operator || this.items.length !== 3) return;
        try {
            this.resultError = null;
            this.items[2].label = `Result (${this.operator})`;
            this.items[2].value = applyOperation(this.operator, this.items[0].value, this.items[1].value);
            this.statusElement.textContent = "Result recalculated exactly from the edited operands.";
        } catch (error) {
            this.resultError = error.message || String(error);
            this.items[2].label = "Previous valid result (current result undefined)";
            this.statusElement.textContent = this.resultError;
        }
    }

    setItemValue(index, value) {
        if (this.items[index]?.derived) return;
        try { boundedExactExplorationInterval(value); }
        catch (error) { this.statusElement.textContent = error.message; return; }
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
        const start = traceExactArithmetic(this.startElement.value.trim(), this.inspect).result;
        const end = traceExactArithmetic(this.endElement.value.trim(), this.inspect).result;
        const startValue = rationalValue(start?.value);
        const endValue = rationalValue(end?.value);
        if (!startValue || !endValue) {
            this.statusElement.textContent = "Start and end must be bounded pure arithmetic expressions giving an exact integer or rational.";
            return;
        }
        this.setItemValue(this.selectedIndex, new RationalInterval(startValue, endValue));
        if (!this.resultError) this.statusElement.textContent = "Exact endpoints updated.";
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

    renderGraphic() {
        const activeId = this.dialog.ownerDocument.activeElement?.dataset?.rixSemanticId;
        this.graphic = createExactNumberLineGraphic(this.items.map((item, index) => ({ ...item, id: `interval-${index}` })), { title: "Exact rational points and intervals" });
        this.graphic.metadata.set("explorationText", this.explorationText());
        this.graphicElement.innerHTML = renderOutputHtml(this.graphic, String);
        this.svg = this.graphicElement.querySelector("svg");
        this.items.forEach((item, index) => {
            for (const target of ["start", "end", "whole"]) {
                const id = target === "whole" ? `interval-${index}` : `interval-${index}:${target}`;
                const element = [...this.svg.querySelectorAll("[data-rix-semantic-id]")].find((node) => node.dataset.rixSemanticId === id);
                if (!element || item.derived) continue;
                element.dataset.rixDragTarget = `interval:${index}:${target}`;
                element.setAttribute("tabindex", "0");
                element.setAttribute("role", "button");
                element.setAttribute("aria-label", `${item.label} ${target === "whole" ? "move both endpoints" : `${target} endpoint`}: ${target === "whole" ? String(item.value) : String(item.value[target])}. Left and Right adjust by the exact selected step.`);
                element.addEventListener("pointerdown", (event) => this.pointerStart(event, index, target));
                element.addEventListener("keydown", (event) => {
                    if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
                        event.preventDefault(); event.stopPropagation();
                        this.nudge(target, event.key === "ArrowLeft" ? -1 : 1, index);
                    }
                });
            }
        });
        enhanceGraphicViews(this.graphicElement, { graphic: this.graphic, state: this.graphicState, format: String });
        if (activeId) [...this.svg.querySelectorAll("[data-rix-semantic-id]")].find((node) => node.dataset.rixSemanticId === activeId)?.focus({ preventScroll: true });
    }

    renderProvenance() {
        if (!this.operator) {
            this.provenanceElement.innerHTML = `<span class="provenance-node"><b>Exact source</b><code>${escapeHtml(this.source)}</code></span><span class="provenance-arrow">→</span><span class="provenance-node result"><b>Interval</b><code>${escapeHtml(exactSource(this.items[0].value))}</code></span>`;
            this.renderExplorationDetails();
            return;
        }
        this.provenanceElement.innerHTML = `<span class="provenance-node"><b>Left operand</b><code>${escapeHtml(exactSource(this.items[0].value))}</code></span><span class="provenance-operator" aria-label="operator ${escapeHtml(this.operator)}">${escapeHtml(this.operator)}</span><span class="provenance-node"><b>Right operand</b><code>${escapeHtml(exactSource(this.items[1].value))}</code></span><span class="provenance-arrow">→</span><span class="provenance-node result"><b>${this.resultError ? "Previous valid result" : "Exact result"}</b><code>${escapeHtml(exactSource(this.items[2].value))}</code></span>`;
        this.renderExplorationDetails();
    }

    renderExplorationDetails() {
        this.links = null;
        if (this.resultError) this.provenanceElement.insertAdjacentHTML("beforeend", `<p role="alert">Current result is undefined: ${escapeHtml(this.resultError)}. The last valid result is shown for reference.</p>`);
        const trace = this.trace;
        const traceHtml = trace ? `<details class="interval-trace"><summary>Bounded arithmetic provenance (${trace.steps.length} steps)</summary>${trace.diagnostics.map((message) => `<p>${escapeHtml(message)}</p>`).join("")}<p>Opening this view inspects pure arithmetic only; calls and assignments are not replayed. This trace describes the original expression; edited endpoints are shown separately.</p><table><thead><tr><th>Step</th><th>Source</th><th>Exact result</th><th>Evidence / width</th></tr></thead><tbody>${trace.steps.map((step) => `<tr><th>${escapeHtml(step.id)}</th><td><code>${escapeHtml(step.source)}</code></td><td>${step.value === null ? "unresolved" : `<button type="button" data-exact-use="${escapeHtml(String(step.value))}">${escapeHtml(String(step.value))}</button>`}</td><td>${escapeHtml(step.status)}${step.width === null ? "" : `; width ${escapeHtml(String(step.width))}`}${step.reason ? `; ${escapeHtml(step.reason)}` : ""}</td></tr>`).join("")}</tbody></table></details>` : "";
        this.provenanceElement.insertAdjacentHTML("beforeend", traceHtml);
        const interval = this.items.at(-1)?.value;
        if (this.resultError || !interval?.start.equals(interval.end)) return;
        try {
            this.linkBridge ||= createSternBrocotRixBridge();
            const links = this.links = this.linkBridge.describeBounded(interval.start);
            const inspect = (value) => value.denominator === 0n ? escapeHtml(String(value)) : `<button type="button" data-exact-inspect="${escapeHtml(String(value))}">${escapeHtml(String(value))}</button>`;
            this.provenanceElement.insertAdjacentHTML("beforeend", `<details class="interval-number-links"><summary>Mediants, Farey parents and continued fractions</summary><p>Farey parents: ${links.parents.map(inspect).join(" and ")}; mediant: ${inspect(links.mediant)}.</p><p>Stern–Brocot path: ${escapeHtml(links.path.join(" ") || (links.pathDiagnostic ? "unavailable" : "root"))}${links.pathDiagnostic ? `; ${escapeHtml(links.pathDiagnostic)}` : ""}</p><p>Continued fraction: ${escapeHtml(links.continuedFraction.map(String).join(", "))}${links.truncated ? "; term limit reached" : ""}.</p><table><caption>Exact convergent errors (selected value minus convergent)</caption><thead><tr><th>Convergent</th><th>Exact error</th></tr></thead><tbody>${links.convergents.map((entry) => `<tr><td>${inspect(entry.value)}</td><td><button type="button" data-exact-use="${escapeHtml(String(entry.error))}">${escapeHtml(String(entry.error))}</button></td></tr>`).join("")}</tbody></table><a href="./stern-brocot-rix/" target="_blank" rel="noopener">Open the existing Stern–Brocot explorer</a></details>`);
        } catch (error) { this.provenanceElement.insertAdjacentHTML("beforeend", `<p>${escapeHtml(error.message)}</p>`); }
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

    explorationText() {
        return [
            `Original source: ${this.source}`,
            ...this.items.map((item) => `${item.label}: ${item.value}; ${item.value.isAscending ? "ascending" : "reversed"} endpoint order`),
            ...(this.limitError ? [`Inspection stopped: ${this.limitError}. The original exact value is unchanged.`] : []),
            ...(this.resultError ? [`Current result undefined: ${this.resultError}. The last valid result is shown for reference.`] : []),
            "Bounded arithmetic provenance describes the original expression, before endpoint edits.",
            ...(this.trace?.diagnostics || []),
            ...(this.trace?.steps || []).map((step) => `${step.id}: ${step.source} = ${step.value ?? "unresolved"}; ${step.status}; width ${step.width ?? "unknown"}${step.reason ? `; ${step.reason}` : ""}`),
            ...(this.links ? [
                `Farey parents: ${this.links.parents.join(", ")}; mediant: ${this.links.mediant}`,
                `Stern–Brocot path: ${this.links.pathDiagnostic || this.links.path.join(" ") || "root"}`,
                `Continued fraction: ${this.links.continuedFraction.join(", ")}${this.links.truncated ? "; term limit reached" : ""}`,
                ...this.links.convergents.map((entry) => `Convergent ${entry.value}; exact error ${entry.error}`),
            ] : []),
        ].join("\n");
    }

    resultSource() {
        const value = this.items.at(-1).value;
        return value.start.equals(value.end) ? String(value.start) : exactSource(value);
    }

    useResult() {
        if (this.resultError) { this.statusElement.textContent = this.resultError; return; }
        this.onUse(this.resultSource());
        this.close();
    }

    download(kind) {
        if (kind === "svg" && !this.graphic) { this.statusElement.textContent = "SVG is unavailable because this value exceeds the graphic work budget. Export text or HTML for the exact value."; return; }
        const svg = this.graphic ? renderGraphicSvg(this.graphic, String) : "";
        const text = this.explorationText();
        const content = kind === "txt" ? text : kind === "svg"
            ? `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`
            : `<!doctype html><html lang="en"><meta charset="utf-8"><title>RiX exact exploration</title><body><h1>Exact exploration</h1><p>${this.resultError ? "Previous valid result; the current result is undefined: " : ""}<code>${escapeHtml(this.resultSource())}</code></p>${this.graphic ? renderOutputHtml(this.graphic, String) : svg}${this.provenanceElement.innerHTML}<p>Coordinates are approximate pixels; labels retain exact values.</p></body></html>`;
        const blob = new Blob([content], { type: kind === "svg" ? "image/svg+xml" : kind === "txt" ? "text/plain" : "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `rix-interval.${kind}`;
        link.click();
        URL.revokeObjectURL(url);
        this.statusElement.textContent = `Exported exact interval ${kind.toUpperCase()}.`;
    }
}
