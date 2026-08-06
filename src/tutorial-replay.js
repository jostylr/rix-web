/**
 * Evaluate a tutorial deterministically through one cell.
 *
 * A fresh session prevents bindings removed from edited source from surviving
 * a rerun, while replaying earlier cells preserves notebook-style dependencies.
 */
export function replayTutorialSources(sources, targetIndex, createSession) {
    const repl = createSession();
    for (let index = 0; index <= targetIndex && index < sources.length; index += 1) {
        const source = String(sources[index] ?? "").trim();
        if (!source) {
            if (index === targetIndex) return null;
            continue;
        }
        const response = repl.run(source);
        if (index === targetIndex || response.type === "error") return { ...response, repl };
    }
    return null;
}

/** Async counterpart used by tutorials that exercise {$ ... } and {$$ ... }. */
export async function replayTutorialSourcesAsync(sources, targetIndex, createSession) {
    const repl = createSession();
    for (let index = 0; index <= targetIndex && index < sources.length; index += 1) {
        const source = String(sources[index] ?? "").trim();
        if (!source) {
            if (index === targetIndex) return null;
            continue;
        }
        const response = await repl.runAsync(source);
        if (index === targetIndex || response.type === "error") return { ...response, repl };
    }
    return null;
}

/**
 * Return the tutorial cells in the target cell's h2 section, through target.
 *
 * Entries are deliberately host-neutral so section scoping can be tested
 * without a browser DOM: { type: "heading" } resets the section and
 * { type: "cell", value } contributes a replay value.
 */
export function tutorialSectionCells(entries, targetValue) {
    let section = [];
    for (const entry of entries) {
        if (entry.type === "heading") {
            section = [];
            continue;
        }
        if (entry.type !== "cell") continue;
        section.push(entry.value);
        if (entry.value === targetValue) return section;
    }
    return [];
}
