const INDENT = "    ";

function lineStart(value, offset) {
    return value.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
}

function lineIndent(value, start) {
    return (value.slice(start).match(/^[ \t]*/) || [""])[0];
}

function newlineIndent(value, cursor) {
    const currentStart = lineStart(value, cursor);
    const current = lineIndent(value, currentStart);
    if (current || value.slice(currentStart, cursor).trim()) return current;
    const previousEnd = Math.max(0, currentStart - 1);
    return lineIndent(value, lineStart(value, previousEnd));
}

function selectedLineRange(value, start, end) {
    const first = lineStart(value, start);
    const effectiveEnd = end > start && value[end - 1] === "\n" ? end - 1 : end;
    const lastBreak = value.indexOf("\n", effectiveEnd);
    return { first, last: lastBreak === -1 ? value.length : lastBreak };
}

export function insertTutorialNewline(value, start, end = start) {
    const insertion = `\n${newlineIndent(value, start)}`;
    const cursor = start + insertion.length;
    return {
        value: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
        start: cursor,
        end: cursor,
    };
}

export function indentTutorialSelection(value, start, end = start) {
    if (start === end) {
        const cursor = start + INDENT.length;
        return { value: `${value.slice(0, start)}${INDENT}${value.slice(end)}`, start: cursor, end: cursor };
    }
    const range = selectedLineRange(value, start, end);
    const selected = value.slice(range.first, range.last);
    const count = selected.split("\n").length;
    return {
        value: `${value.slice(0, range.first)}${INDENT}${selected.replace(/\n/g, `\n${INDENT}`)}${value.slice(range.last)}`,
        start: start + INDENT.length,
        end: end + count * INDENT.length,
    };
}

export function deindentTutorialSelection(value, start, end = start) {
    const range = selectedLineRange(value, start, end);
    const selected = value.slice(range.first, range.last);
    const lines = selected.split("\n");
    const removed = lines.map((line) => (line.match(/^(?: {1,4}|\t)/) || [""])[0].length);
    const next = lines.map((line, index) => line.slice(removed[index])).join("\n");
    const beforeStart = removed[0];
    const beforeEnd = removed.reduce((sum, amount) => sum + amount, 0);
    return {
        value: `${value.slice(0, range.first)}${next}${value.slice(range.last)}`,
        start: Math.max(range.first, start - beforeStart),
        end: Math.max(range.first, end - beforeEnd),
    };
}

export function applyTutorialEditorKey(value, start, end, { key, shiftKey = false } = {}) {
    if (key === "Enter") return insertTutorialNewline(value, start, end);
    if (key === "Tab") return shiftKey
        ? deindentTutorialSelection(value, start, end)
        : indentTutorialSelection(value, start, end);
    return null;
}
