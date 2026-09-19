/** Bounded presentation-only state. No graph handles or executable recipes. */
import { Rational, RationalInterval, Integer } from "@ratmath/core";

export const DASHBOARD_LIMITS = Object.freeze({ variables: 128, samples: 64, sourceBytes: 8192, groupLength: 80 });

export function dashboardPresentation(value = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value)) value = {};
    const names = Array.isArray(value.pinned) ? value.pinned : [];
    const groups = value.groups && typeof value.groups === "object" && !Array.isArray(value.groups) ? value.groups : {};
    return {
        schema: "rix.web.dashboard-presentation@1",
        pinned: [...new Set(names.filter((name) => typeof name === "string" && name.length <= 256))].slice(0, DASHBOARD_LIMITS.variables),
        groups: Object.fromEntries(Object.entries(groups).filter(([name, group]) => name.length <= 256 && typeof group === "string")
            .slice(0, DASHBOARD_LIMITS.variables).map(([name, group]) => [name, group.trim().slice(0, DASHBOARD_LIMITS.groupLength)])),
    };
}

export function recordDashboardHistory(histories, descriptors, limit = DASHBOARD_LIMITS.samples) {
    if (!Number.isInteger(limit) || limit < 1 || limit > DASHBOARD_LIMITS.samples) throw new Error("Dashboard history limit must be 1–64");
    const live = new Set(descriptors.slice(0, DASHBOARD_LIMITS.variables).map((descriptor) => descriptor.id ?? descriptor.name));
    for (const id of histories.keys()) if (!live.has(id)) histories.delete(id);
    for (const descriptor of descriptors.slice(0, DASHBOARD_LIMITS.variables)) {
        const id = descriptor.id ?? descriptor.name;
        const history = histories.get(id) || { samples: [], dropped: 0, revision: 0 };
        histories.set(id, history);
        const source = String(descriptor.sourceText ?? "");
        if (new TextEncoder().encode(source).length > DASHBOARD_LIMITS.sourceBytes) {
            history.diagnostic = "Value exceeds the 8192-byte history limit; current exact value remains available.";
            continue;
        }
        history.diagnostic = null;
        const previous = history.samples.at(-1);
        if (previous?.source === source && previous?.state === descriptor.state) continue;
        let bounds = null;
        if (descriptor.value instanceof RationalInterval) bounds = [String(descriptor.value.start), String(descriptor.value.end)];
        else if (descriptor.value instanceof Rational || descriptor.value instanceof Integer) bounds = [String(descriptor.value), String(descriptor.value)];
        history.samples.push(Object.freeze({ revision: ++history.revision, source, state: descriptor.state, bounds: bounds && Object.freeze(bounds) }));
        if (history.samples.length > limit) { history.samples.shift(); history.dropped += 1; }
    }
    return histories;
}

/** Exact rational normalization prevents huge/narrow values collapsing before projection. */
export function dashboardHistoryGraphic(history) {
    const samples = (history?.samples || []).filter((sample) => sample.bounds && sample.state !== "error");
    if (!samples.length) return null;
    const endpoints = samples.flatMap((sample) => sample.bounds.map((source) => new Rational(source)));
    let low = endpoints[0], high = endpoints[0];
    for (const value of endpoints) { if (value.lessThan(low)) low = value; if (value.greaterThan(high)) high = value; }
    if (low.equals(high)) { low = low.subtract(new Rational(1)); high = high.add(new Rational(1)); }
    const span = high.subtract(low);
    const x = (index) => new Rational(15).add(new Rational(BigInt(index * 270), BigInt(Math.max(1, samples.length - 1))));
    const y = (source) => new Rational(70).subtract(new Rational(source).subtract(low).divide(span).multiply(new Rational(55)));
    const paths = samples.map((sample, index) => ({ type: "output", kind: "path", points: [[x(index), y(sample.bounds[0])], [x(index), y(sample.bounds[1])]],
        style: new Map([["stroke", "#7c3aed"], ["width", 2], ["id", `history-${sample.revision}`]]) }));
    const points = samples.map((sample, index) => [x(index), y(sample.bounds[0])]);
    const rangeLabel = `Range ${low} to ${high}`;
    const label = (text, at, id) => ({ type: "output", kind: "text_mark", text,
        position: [new Rational(15), new Rational(at)], style: new Map([["size", 9], ["fill", "#475569"], ["id", id]]) });
    return { type: "output", kind: "graphic", size: [300, 85], children: [
        { type: "output", kind: "path", points, style: new Map([["stroke", "#2563eb"], ["fill", "none"], ["width", 2], ["id", "history-series"]]) }, ...paths,
        label(`Observed revisions ${samples[0].revision}–${samples.at(-1).revision}`, 10, "history-revisions"),
        label(rangeLabel.length > 54 ? `${rangeLabel.slice(0, 51)}…` : rangeLabel, 82, "history-range"),
    ], metadata: new Map([["plot", new Map([["title", "Bounded exact value history"], ["kind", "history"], ["series", [new Map([
        ["id", "history"], ["label", "Retained revisions"], ["data", points],
        ["originalData", samples.map((sample) => [new Rational(sample.revision), new RationalInterval(...sample.bounds)])],
    ])]]])]]) };
}
