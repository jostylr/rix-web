import { tokenize } from "../../rix/src/index.js";

const statementClosers = new Set([")", "]", "}", "|}", ";}", "@}", "!}", ":}"]);
const containerOpeners = new Set(["(", "[", "{", "{|", "{=", "{;", "{@", "{!", "{:" ]);

function isComment(token) {
    return token?.type === "String" && token.kind === "comment";
}

function canEndStatement(token) {
    if (!token || isComment(token)) return false;
    if (token.type !== "Symbol") return token.type !== "End";
    return statementClosers.has(token.value) || token.value === "^^" || token.value === "_";
}

function canStartStatement(token) {
    if (!token || isComment(token) || token.type === "End") return false;
    if (token.type !== "Symbol") return true;
    return ["(", "[", "{", "-", "+", "!", "_", "@", "@_"].includes(token.value) || String(token.value).startsWith("{");
}

/**
 * RiX source normally uses semicolons between top-level statements. The web
 * notebook accepts a more familiar one-statement-per-line form and inserts
 * separators only where a newline appears between complete top-level terms.
 */
export function normalizeReplSource(source) {
    let tokens;
    try {
        tokens = tokenize(source);
    } catch {
        return source;
    }

    const insertions = [];
    let depth = 0;
    let previous = null;

    for (const token of tokens) {
        if (token.type === "End") break;

        if (!isComment(token) && previous) {
            const whitespaceBetween = source.slice(previous.pos[2], token.pos[1]);
            if (
                depth === 0
                && whitespaceBetween.includes("\n")
                && canEndStatement(previous)
                && canStartStatement(token)
            ) {
                insertions.push(previous.pos[2]);
            }
        }

        if (!isComment(token)) {
            if (containerOpeners.has(token.value)) depth += 1;
            if (statementClosers.has(token.value)) depth = Math.max(0, depth - 1);
            previous = token;
        }
    }

    return insertions
        .sort((left, right) => right - left)
        .reduce((result, position) => `${result.slice(0, position)};${result.slice(position)}`, source);
}
