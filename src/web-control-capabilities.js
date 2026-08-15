import {
    createActionControl,
    createChoiceControl,
    createHoldControl,
    createInputControl,
    createRangeControl,
    createResetControl,
    createSliderControl,
    createToggleControl,
} from "../../rix/src/index.js";
import { callWithConcreteArgs } from "../../rix/src/eval/functions/functions.js";

const constructors = new Map([
    ["Slider", createSliderControl],
    ["Input", createInputControl],
    ["Choice", createChoiceControl],
    ["Toggle", createToggleControl],
    ["Range", createRangeControl],
    ["Reset", createResetControl],
    ["Action", createActionControl],
    ["Hold", createHoldControl],
]);

const declarativeControls = new Map([
    ["SLIDER", { name: "Slider", minimumArguments: 2 }],
    ["INPUT", { name: "Input", minimumArguments: 1 }],
    ["CHOICE", { name: "Choice", minimumArguments: 2 }],
    ["TOGGLE", { name: "Toggle", minimumArguments: 3 }],
    ["RANGE", { name: "Range", minimumArguments: 2 }],
]);

const containerOpeners = new Set(["(", "[", "{", "{|", "{=", "{;", "{@", "{!", "{:"]);
const containerClosers = new Set([")", "]", "}", "|}", ";}", "@}", "!}", ":}"]);

export const WEB_CONTROL_NAMES = Object.freeze([...constructors.keys()]);

function callArguments(tokens, openIndex, source) {
    const commas = [];
    let depth = 0;
    for (let index = openIndex; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (containerOpeners.has(token.value)) {
            depth += 1;
            continue;
        }
        if (containerClosers.has(token.value)) {
            depth -= 1;
            if (depth === 0) {
                const boundaries = [tokens[openIndex].pos[2], ...commas.map((comma) => comma.pos[2])];
                const ends = [...commas.map((comma) => comma.pos[0]), token.pos[0]];
                return {
                    closeIndex: index,
                    arguments: boundaries.map((start, argumentIndex) => source.slice(start, ends[argumentIndex]).trim()),
                };
            }
            continue;
        }
        if (token.value === "," && depth === 1) commas.push(token);
    }
    return null;
}

function nextCodeToken(tokens, index) {
    for (let cursor = index; cursor < tokens.length; cursor += 1) {
        const token = tokens[cursor];
        if (!(token.type === "String" && token.kind === "comment")) return token;
    }
    return null;
}

/**
 * Expand RiX-Web's calculator-friendly reactive declarations into ordinary
 * RiX reactive state plus a concise control attachment. Portable RiX and the
 * canonical .Controls constructors remain untouched.
 */
export function expandDeclarativeWebControls(source, tokenize) {
    let tokens;
    try {
        tokens = tokenize(source);
    } catch {
        return source;
    }

    const replacements = [];
    let depth = 0;
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (depth === 0
            && token.value === "$$"
            && tokens[index + 1]?.type === "Identifier"
            && tokens[index + 1]?.kind === "User"
            && tokens[index + 2]?.value === ":="
            && tokens[index + 3]?.value === "."
            && tokens[index + 4]?.type === "Identifier"
            && declarativeControls.has(tokens[index + 4]?.value)
            && tokens[index + 5]?.value === "(") {
            const declaration = declarativeControls.get(tokens[index + 4].value);
            const call = callArguments(tokens, index + 5, source);
            const following = call ? nextCodeToken(tokens, call.closeIndex + 1) : null;
            if (call
                && [";", null].includes(following?.value ?? null)
                && call.arguments.length >= declaration.minimumArguments
                && call.arguments[0]) {
                const name = tokens[index + 1].value;
                const controlArguments = [`$$${name}`, ...call.arguments.slice(1)].join(", ");
                replacements.push({
                    start: tokens[index + 3].pos[1],
                    end: tokens[call.closeIndex].pos[2],
                    value: `${call.arguments[0]}; .${declaration.name}(${controlArguments}); $${name}`,
                });
                index = call.closeIndex;
                continue;
            }
        }

        if (containerOpeners.has(token.value)) depth += 1;
        else if (containerClosers.has(token.value)) depth = Math.max(0, depth - 1);
    }

    return replacements
        .sort((left, right) => right.start - left.start)
        .reduce((result, replacement) => (
            `${result.slice(0, replacement.start)}${replacement.value}${result.slice(replacement.end)}`
        ), source);
}

/** Install concise RiX-Web aliases for the portable .Controls constructors. */
export function installWebControlCapabilities(systemContext, { onControl = null } = {}) {
    for (const [name, constructor] of constructors) {
        if (systemContext.has(name)) {
            throw new Error(`RiX-Web control shortcut conflicts with .${name}`);
        }
        systemContext.register(name, {
            pure: true,
            groups: ["Output", "Controls"],
            doc: declarativeControls.has(name.toUpperCase())
                ? `RiX-Web shortcut for .Controls.${name}; supports $$name := .${name}(initial, ...)`
                : `RiX-Web shortcut for .Controls.${name}`,
            impl(args, context, evaluate) {
                const runtime = {
                    context,
                    evaluate,
                    invoke: (callable, callArgs) =>
                        callWithConcreteArgs(callable, callArgs, context, evaluate),
                };
                const control = constructor(args, runtime);
                onControl?.({
                    control,
                    create: () => constructor(args, runtime),
                });
                return control;
            },
        });
    }
    return systemContext;
}
