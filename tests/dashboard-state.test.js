import { expect, test } from "bun:test";
import { Rational, RationalInterval } from "@ratmath/core";
import { dashboardPresentation, recordDashboardHistory, dashboardHistoryGraphic, DASHBOARD_LIMITS } from "../src/dashboard-state.js";
import { createSessionSnapshot, parseSession, serializeSession } from "../src/workspace-state.js";
import { renderGraphicSvg } from "../../rix/src/index.js";

test("dashboard pins/groups round-trip as bounded inert presentation state", () => {
    const presentation = dashboardPresentation({ pinned: ["x", "x", ...Array.from({ length: 140 }, (_, i) => `v${i}`)], groups: { x: "  Dimensions  " } });
    expect(presentation.pinned).toHaveLength(DASHBOARD_LIMITS.variables);
    expect(presentation.groups.x).toBe("Dimensions");
    const restored = parseSession(serializeSession(createSessionSnapshot({ dashboardPresentation: presentation })));
    expect(restored.dashboardPresentation).toEqual(presentation);
    expect(restored).not.toHaveProperty("histories");
});

test("history holds exact snapshots, deduplicates unchanged reads, prunes old identities and enforces limits", () => {
    const histories = new Map();
    const descriptor = (index) => ({ id: "x", name: "x", sourceText: `${index}/7`, value: new Rational(index, 7), state: "clean" });
    for (let i = 0; i < 80; i += 1) recordDashboardHistory(histories, [descriptor(i)]);
    expect(histories.get("x").samples).toHaveLength(64);
    expect(histories.get("x").dropped).toBe(16);
    recordDashboardHistory(histories, [descriptor(79)]);
    expect(histories.get("x").revision).toBe(80);
    expect(histories.get("x").samples[0].source).toBe("16/7");
    recordDashboardHistory(histories, [{ ...descriptor(1), sourceText: "x".repeat(8193) }]);
    expect(histories.get("x").diagnostic).toContain("8192-byte");
    recordDashboardHistory(histories, []);
    expect(histories.size).toBe(0);
});

test("history charts normalize exact tiny intervals and export original source revisions", () => {
    const histories = new Map();
    const value = new RationalInterval("2/1000000000000000000000000000000000000000", "1/1000000000000000000000000000000000000000");
    recordDashboardHistory(histories, [{ id: "a", name: "a", sourceText: String(value), value, state: "clean" }]);
    const graphic = dashboardHistoryGraphic(histories.get("a"));
    expect(graphic).not.toBeNull();
    const svg = renderGraphicSvg(graphic, String);
    expect(svg).toContain("Retained Retained revisions");
    expect(svg).toContain(String(value.start));
    expect(histories.get("a").samples[0].source).toBe(String(value));
});
