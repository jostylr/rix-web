export const INTERACTIVE_OUTPUT_SELECTOR = [
    "a", "button", "input", "select", "textarea", "summary", "details", "canvas", "svg",
    "[contenteditable=true]", "[role=button]", "[role=link]", "[tabindex]",
    "[data-rix-drag-target]", "[data-rix-graphic-action]", "[data-rix-geometry-object]",
].join(",");

export function isInteractiveOutputEvent(event, outputEntry) {
    const target = event?.target;
    if (!target || typeof target.closest !== "function") return false;
    const interactive = target.closest(INTERACTIVE_OUTPUT_SELECTOR);
    if (!interactive) return false;
    return typeof outputEntry?.contains !== "function" || outputEntry.contains(interactive);
}
