import {
    createControlPanel,
    mountOutputWidgets,
    renderOutputHtml,
} from "../../rix/src/index.js";

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

export function reactiveVariableCardsHtml(descriptors) {
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
        return `<article class="reactive-variable-card" data-reactive-state="${escapeHtml(descriptor.state)}">
            <header><div><code>$$${escapeHtml(descriptor.name)}</code>${aliases.length ? `<small>aliases: ${aliases.map(escapeHtml).join(", ")}</small>` : ""}</div><span class="reactive-role ${role}">${role}</span></header>
            <button type="button" class="reactive-value" data-dashboard-use="${escapeHtml(descriptor.sourceText)}" title="Use this exact value in the calculator">${escapeHtml(descriptor.valueText)}</button>
            ${formula}
            <div class="reactive-dependency-grid">
                ${listHtml("Depends on", descriptor.dependencies, "none")}
                ${listHtml("Feeds", descriptor.dependents, "none")}
            </div>
            ${diagnostics}
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

        panel.addEventListener("click", (event) => {
            const use = event.target.closest("[data-dashboard-use]");
            if (use) this.onUse(use.dataset.dashboardUse);
            const read = event.target.closest("[data-dashboard-read]");
            if (read) this.onUse(`$${read.dataset.dashboardRead}`);
            if (event.target.closest("[data-dashboard-example]")) this.onLoadExample();
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
