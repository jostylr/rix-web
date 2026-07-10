import {
    Context,
    createDefaultRegistry,
    createDefaultSystemContext,
    formatValue,
    parseAndEvaluate,
} from "../../rix/src/index.js";
import { installSymbolicBindings } from "../../rix/src/eval/functions/symbolic.js";
import { normalizeReplSource } from "./repl-source.js";

export const helpGroups = [
    {
        title: "Start here",
        items: [
            ["2 + 3", "Evaluate an exact expression. Integers and fractions never become floats by accident."],
            ["3 / 8", "Exact division returns the rational 3/8."],
            ["2:5", "An interval with exact endpoints."],
            ["x := 7", "Store a fresh value in the current calculator session."],
        ],
    },
    {
        title: "Names and functions",
        items: [
            ["x := 3", "Create a lower-case value binding."],
            ["y = x", "Alias x's cell; in-place updates are shared."],
            ["Square(x) -> x ^ 2", "Define an uppercase callable."],
            [".SIN(x)", "Call a RiX system capability with the dot prefix."],
        ],
    },
    {
        title: "Collections",
        items: [
            ["[1, 2, 3]", "An array; indexes begin at 1."],
            ["{| 1, 2 |}", "A set."],
            ["{= a=3, b=5 }", "A map."],
            ["values[2]", "Read the second array item."],
        ],
    },
    {
        title: "Calculator commands",
        items: [
            [".help", "Open this reference and its quick-start guide."],
            [".Help(\"interval\")", "Print matching help inline in the calculator transcript."],
            [".vars", "Show values currently held by the RiX session."],
            [".clear", "Clear the transcript and begin a new RiX session."],
        ],
    },
];

export function findHelp(topic = "") {
    const query = String(topic).trim().toLowerCase();
    const groups = helpGroups.map((group) => ({
        ...group,
        items: group.items.filter(([syntax, description]) => !query || `${group.title} ${syntax} ${description}`.toLowerCase().includes(query)),
    })).filter((group) => group.items.length > 0);
    return { query, groups };
}

function inlineHelpRequest(source) {
    const match = source.trim().match(/^\.Help\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))?\s*\)\s*;?$/);
    return match ? (match[1] ?? match[2] ?? match[3] ?? "").trim() : null;
}

export function createRixRepl() {
    const state = {
        context: new Context(),
        registry: createDefaultRegistry(),
        systemContext: createDefaultSystemContext(),
    };
    installSymbolicBindings(state.context);

    return {
        run(source) {
            const topic = inlineHelpRequest(source);
            if (topic !== null) return { type: "help", source, ...findHelp(topic) };
            try {
                const result = parseAndEvaluate(normalizeReplSource(source), {
                    ...state,
                    file: "<ratcalc>",
                });
                return { type: "result", source, value: result, text: formatValue(result, { context: state.context, evaluate: null }) };
            } catch (error) {
                return { type: "error", source, text: error.message || String(error) };
            }
        },
        variables() {
            return state.context.getAllNames().map((name) => ({
                name,
                value: formatValue(state.context.get(name), { context: state.context, evaluate: null }),
            }));
        },
        reset() {
            state.context.clear();
            installSymbolicBindings(state.context);
        },
    };
}
