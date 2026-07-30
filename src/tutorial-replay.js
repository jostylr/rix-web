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
