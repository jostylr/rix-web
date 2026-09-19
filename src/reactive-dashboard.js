import {
    createControlPanel,
    mountOutputWidgets,
    renderOutputHtml,
    renderGraphicSvg,
} from "../../rix/src/index.js";
import { dashboardPresentation, dashboardHistoryGraphic, recordDashboardHistory, DASHBOARD_LIMITS } from "./dashboard-state.js";

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;",
    })[character]);
}

function listHtml(title, names, empty) {
    const content = names.length
        ? names.map((name) => `<code>${escapeHtml(name)}</code>`).join("")
        : `<span>${empty}</span>`;
    return `<div class="reactive-links"><b>${title}</b><div>${content}</div></div>`;
}

export function reactiveVariableCardsHtml(descriptors, { presentation = dashboardPresentation(), histories = new Map() } = {}) {
    return descriptors.map((descriptor) => {
        const role = descriptor.controls.length
            ? "controlled"
            : descriptor.dependencies.length ? "derived" : "input";
        const aliases = descriptor.aliases.filter((name) => name !== descriptor.name);
        const formula = descriptor.dependencies.length && descriptor.formulaSource
            ? `<div class="reactive-formula"><b>Formula</b><code>${escapeHtml(descriptor.formulaSource)}</code></div>`
            : "";
        const diagnostics = descriptor.diagnostics.length
            ? `<ul class="reactive-diagnostics">${descriptor.diagnostics.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>`
            : "";
        const pinned = presentation.pinned.includes(descriptor.name);
        const group = (Object.hasOwn(presentation.groups, descriptor.name) ? presentation.groups[descriptor.name] : "");
        const history = histories.get(descriptor.id ?? descriptor.name);
        const graphic = dashboardHistoryGraphic(history);
        const historyHtml = history ? `<details class="reactive-history"><summary>Value history (${history.samples.length}/${DASHBOARD_LIMITS.samples})</summary>${history.dropped ? `<p>${history.dropped} older changes discarded at the history limit.</p>` : ""}${history.diagnostic ? `<p>${escapeHtml(history.diagnostic)}</p>` : ""}${graphic ? renderOutputHtml(graphic, String) : ""}<table><caption>Exact retained revisions</caption><thead><tr><th>Revision</th><th>Value</th><th>State</th></tr></thead><tbody>${history.samples.map((sample) => `<tr><th>${sample.revision}</th><td><button type="button" data-dashboard-use="${escapeHtml(sample.source)}">${escapeHtml(sample.source)}</button></td><td>${escapeHtml(sample.state)}</td></tr>`).join("")}</tbody></table>${graphic ? `<button type="button" data-dashboard-history-export="${escapeHtml(descriptor.name)}">Export history SVG</button>` : ""}</details>` : "";
        return `<article class="reactive-variable-card" data-dashboard-name="${escapeHtml(descriptor.name)}" data-reactive-state="${escapeHtml(descriptor.state)}">
            <header><div><code>$$${escapeHtml(descriptor.name)}</code>${aliases.length ? `<small>aliases: ${aliases.map(escapeHtml).join(", ")}</small>` : ""}</div><span class="reactive-role ${role}">${role}</span></header>
            <div class="reactive-organization"><button type="button" data-dashboard-pin="${escapeHtml(descriptor.name)}" aria-pressed="${pinned}">${pinned ? "Unpin" : "Pin"}</button><label>Group <input data-dashboard-group="${escapeHtml(descriptor.name)}" value="${escapeHtml(group)}" maxlength="80" placeholder="Ungrouped"></label></div>
            <button type="button" class="reactive-value" data-dashboard-use="${escapeHtml(descriptor.sourceText)}" title="Use this exact value in the calculator">${escapeHtml(descriptor.valueText)}</button>
            ${formula}
            <div class="reactive-dependency-grid">
                ${listHtml("Depends on", descriptor.dependencies, "none")}
                ${listHtml("Feeds", descriptor.dependents, "none")}
            </div>
            ${diagnostics}
            ${historyHtml}
            <footer><span>${escapeHtml(descriptor.state)}</span><button type="button" data-dashboard-read="${escapeHtml(descriptor.name)}">Insert $${escapeHtml(descriptor.name)}</button></footer>
        </article>`;
    }).join("");
}

export class ReactiveDashboard {
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
        this.presentation = dashboardPresentation();
        this.histories = new Map();
        this.historyDisposers = [];

        panel.addEventListener("click", (event) => {
            const use = event.target.closest("[data-dashboard-use]");
            if (use) this.onUse(use.dataset.dashboardUse);
            const read = event.target.closest("[data-dashboard-read]");
            if (read) this.onUse(`$${read.dataset.dashboardRead}`);
            if (event.target.closest("[data-dashboard-example]")) this.onLoadExample();
            const pin = event.target.closest("[data-dashboard-pin]");
            if (pin) {
                const name = pin.dataset.dashboardPin;
                this.presentation.pinned = this.presentation.pinned.includes(name)
                    ? this.presentation.pinned.filter((entry) => entry !== name)
                    : [...this.presentation.pinned, name].slice(-DASHBOARD_LIMITS.variables);
                this.renderVariables();
            }
            const exported = event.target.closest("[data-dashboard-history-export]");
            if (exported) this.exportHistory(exported.dataset.dashboardHistoryExport);
        });
        panel.addEventListener("change", (event) => {
            const name = event.target.dataset.dashboardGroup;
            if (!name) return;
            this.presentation = dashboardPresentation({ ...this.presentation, groups: { ...this.presentation.groups, [name]: event.target.value } });
            this.renderVariables();
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
        if (this.isOpen) this.close();
        else this.open();
    }

    disposeMounted() {
        this.historyDisposers.splice(0).forEach((dispose) => dispose());
        this.controlDisposer?.();
        this.controlDisposer = null;
        this.reactiveDisposer?.();
        this.reactiveDisposer = null;
    }

    subscribe() {
        this.reactiveDisposer?.();
        this.reactiveDisposer = this.repl.subscribeReactive(() => {
            if (this.renderQueued) return;
            this.renderQueued = true;
            queueMicrotask(() => {
                this.renderQueued = false;
                if (this.isOpen) this.refresh({ rebuildControls: false, resubscribe: false });
            });
        });
    }

    renderSummary() {
        const controlled = this.descriptors.filter(({ controls }) => controls.length).length;
        const derived = this.descriptors.filter(({ dependencies }) => dependencies.length).length;
        const failed = this.descriptors.filter(({ state }) => state === "error").length;
        const count = this.descriptors.length;
        this.countElement.textContent = `${count} reactive ${count === 1 ? "value" : "values"}`;
        this.summaryElement.innerHTML = `${count > DASHBOARD_LIMITS.variables ? `<p>History is limited to the first ${DASHBOARD_LIMITS.variables} values in name order. All current values remain available.</p>` : ""}<span><b>${count}</b> total</span><span><b>${controlled}</b> controlled</span><span><b>${derived}</b> derived</span><span${failed ? ' class="has-error"' : ""}><b>${failed}</b> errors</span>`;
        this.toggle.dataset.count = String(count);
        this.toggle.setAttribute("aria-label", `Reactive dashboard, ${count} ${count === 1 ? "value" : "values"}`);
    }

    renderVariables() {
        const hasValues = this.descriptors.length > 0;
        this.emptyElement.hidden = hasValues;
        this.variablesElement.hidden = !hasValues;
        const active = this.panel.ownerDocument?.activeElement;
        const focusedName = active?.dataset?.dashboardPin || active?.dataset?.dashboardGroup;
        const focusedKind = active?.dataset?.dashboardPin ? "pin" : "group";
        const openHistory = new Set([...this.variablesElement.querySelectorAll("[data-dashboard-name]")]
            .filter((card) => card.querySelector(".reactive-history")?.open).map((card) => card.dataset.dashboardName));
        this.historyDisposers.splice(0).forEach((dispose) => dispose());
        const groups = new Map();
        for (const descriptor of this.descriptors) {
            const group = this.presentation.pinned.includes(descriptor.name) ? "Pinned" : (Object.hasOwn(this.presentation.groups, descriptor.name) && this.presentation.groups[descriptor.name] || "Ungrouped");
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group).push(descriptor);
        }
        this.variablesElement.innerHTML = [...groups].sort(([a], [b]) => a === "Pinned" ? -1 : b === "Pinned" ? 1 : a.localeCompare(b))
            .map(([name, descriptors]) => `<section class="reactive-variable-group"><h3>${escapeHtml(name)}</h3>${reactiveVariableCardsHtml(descriptors, this)}</section>`).join("");
        for (const card of this.variablesElement.querySelectorAll("[data-dashboard-name]")) {
            const descriptor = this.descriptors.find(({ name }) => name === card.dataset.dashboardName);
            const history = this.histories.get(descriptor.id ?? descriptor.name);
            const graphic = dashboardHistoryGraphic(history);
            if (graphic) this.historyDisposers.push(mountOutputWidgets(card, graphic, { format: String }));
            const details = card.querySelector(".reactive-history");
            if (details) details.open = openHistory.has(descriptor.name);
            if (descriptor.name === focusedName) card.querySelector(`[data-dashboard-${focusedKind}]`)?.focus({ preventScroll: true });
        }
    }

    restorePresentation(value) { this.presentation = dashboardPresentation(value); }

    exportHistory(name) {
        const descriptor = this.descriptors.find((entry) => entry.name === name);
        const graphic = descriptor && dashboardHistoryGraphic(this.histories.get(descriptor.id ?? descriptor.name));
        if (!graphic) return;
        const url = URL.createObjectURL(new Blob([renderGraphicSvg(graphic, String)], { type: "image/svg+xml" }));
        const link = this.panel.ownerDocument.createElement("a");
        link.href = url; link.download = "rix-value-history.svg"; link.click(); URL.revokeObjectURL(url);
    }

    renderControls() {
        this.controlDisposer?.();
        this.controlDisposer = null;
        const controls = this.descriptors.flatMap(({ controls }) => controls);
        this.controlsSection.hidden = controls.length === 0;
        this.controlsElement.replaceChildren();
        if (!controls.length) return;
        const panelValue = createControlPanel([
            controls,
            "Reactive inputs",
            "Only variables with an explicit control definition are editable.",
        ]);
        this.controlsElement.innerHTML = renderOutputHtml(panelValue, this.repl.formatValue);
        this.controlDisposer = mountOutputWidgets(this.controlsElement, panelValue, {
            format: this.repl.formatValue,
            evaluateControl: (source) => this.repl.run(source),
            onControlSet: () => this.refresh({ rebuildControls: false, resubscribe: false }),
            onControlSubmit: () => this.refresh({ rebuildControls: false, resubscribe: false }),
        });
    }

    refresh({ rebuildControls = true, resubscribe = true } = {}) {
        this.descriptors = this.repl.reactiveVariables();
        recordDashboardHistory(this.histories, this.descriptors);
        this.renderSummary();
        if (!this.isOpen) return;
        this.renderVariables();
        if (rebuildControls) this.renderControls();
        if (resubscribe) this.subscribe();
    }

    dispose() {
        this.disposeMounted();
    }
}
