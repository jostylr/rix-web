import {
    Context,
    createDefaultRegistry,
    createDefaultSystemContext,
    disposeAsyncResources,
    complete,
    formatValue,
    formatValueSource,
    irToText,
    isReactiveNode,
    isOutputValue,
    parseAndEvaluate,
    parseAndEvaluateAsync,
    renderOutputHtml,
    tokenize,
} from "../../rix/src/index.js";
import { normalizeReplSource } from "./repl-source.js";
import { createBundledPluginCatalog } from "./generated/bundled-plugin-catalog.js";
import {
    expandDeclarativeWebControls,
    installWebControlCapabilities,
} from "./web-control-capabilities.js";

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
        title: "Exact symbolic work",
        items: [
            ["{#x}", "Create the identity-symbol spec for x."],
            ["{#x# x^2 + 1 }", "Create a single-output symbolic expression."],
            [".Deriv(S, {#x})", "Differentiate a spec or spec-backed function exactly."],
            [".Integrate(S, {#x})", "Build a supported zero-constant antiderivative."],
        ],
    },
    {
        title: "Number views",
        items: [
            ["Numbers", "Open the number panel for decimal, exact, base, continued-fraction, and scientific presets."],
            ['*> ".[12],b,.."', "Show a bounded decimal, binary expansion, and exact mixed fraction together."],
            ['*> "cf"', "Display exact numeric results as continued fractions."],
            ['*> "sci[10]"', "Display scientific notation with ten significant digits."],
        ],
    },
    {
        title: "Intervals and graphics",
        items: [
            ["1/3:2/3", "Create an exact closed interval; endpoint orientation is retained."],
            ["Explore interval", "Open the exact number line, edit endpoints, inspect arithmetic provenance, and export SVG or HTML."],
            ["Arrow keys", "In the interval explorer, move a focused endpoint or the whole interval by the exact selected step."],
            [".Graphics", "Build portable figures that RiX Web can render and make interactive."],
        ],
    },
    {
        title: "Scripts and plugins",
        items: [
            ["Script entry", "Write several RiX statements and run them together with Ctrl/Command + Enter."],
            ["Load", "Load a local .rix file into script entry mode."],
            ['.Plugin.Load("plot")', "Load an approved browser plugin into this session."],
            ["Tab", "Complete names and methods from the current RiX context without evaluating the draft."],
        ],
    },
    {
        title: "Reactive dashboard",
        items: [
            ["$$x := 2", "Declare a reactive value; the dashboard displays it live."],
            ["$x", "Read x and record a dependency inside another reactive definition."],
            ["$$x := .Slider(2, 0:5, 1/2, \"x\")", "Declare x at 2 and give it an exact RiX-Web dashboard slider."],
            [".Slider($$x, 0:5, 1/2, \"x\")", "Attach a dashboard slider to an existing reactive identity."],
            ["Dashboard", "Open live values, explicit controls, formulas, dependencies, and diagnostics."],
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

function currentReactiveValue(source) {
    if (source?.type === "reactive_node" && typeof source.peek === "function") return source.peek();
    if (source?.type === "formula_sheet") return source;
    return undefined;
}

function collectControlValues(value, controls, seen = new Set()) {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (isOutputValue(value) && value.kind?.startsWith("control_")) {
        controls.push(value);
        return;
    }
    if (isOutputValue(value) && value.kind === "control_panel") {
        for (const control of value.controls || []) collectControlValues(control, controls, seen);
        return;
    }
    if (!isOutputValue(value)) return;
    for (const child of value.children || []) collectControlValues(child, controls, seen);
}

function diagnosticText(diagnostic) {
    return diagnostic?.message || diagnostic?.text || diagnostic?.label || String(diagnostic);
}

const FORMULA_OPERATORS = Object.freeze({
    ADD: ["+", 10], SUB: ["-", 10], MUL: ["*", 20], DIV: ["/", 20],
    IDIV: ["//", 20], MOD: ["%", 20], POW: ["^", 30], INTERVAL: [":", 5],
    EQ: ["==", 4], NEQ: ["!=", 4], LT: ["<", 4], LTE: ["<=", 4],
    GT: [">", 4], GTE: [">=", 4],
});

function readableFormula(node, parentPrecedence = 0) {
    if (!node || typeof node !== "object") return String(node ?? "_");
    if (node.fn === "LITERAL") return String(node.args?.[0] ?? "_");
    if (node.fn === "REACTIVE_READ") return `$${node.args?.[0]}`;
    if (node.fn === "REACTIVE_NODE") return `$$${node.args?.[0]}`;
    if (node.fn === "RETRIEVE") return String(node.args?.[0]);
    if (node.fn === "NEG") return `-${readableFormula(node.args?.[0], 40)}`;
    const operation = FORMULA_OPERATORS[node.fn];
    if (operation) {
        const [symbol, precedence] = operation;
        const text = (node.args || []).map((arg) => readableFormula(arg, precedence)).join(` ${symbol} `);
        return precedence < parentPrecedence ? `(${text})` : text;
    }
    if (node.fn === "SYS_CALL") {
        return `.${node.args?.[0]}(${(node.args || []).slice(1).map((arg) => readableFormula(arg)).join(", ")})`;
    }
    return irToText(node);
}

function reactiveFormulaSource(node) {
    if (node.source) return node.source;
    const body = node.formula?.args?.[0];
    return body?.fn ? readableFormula(body) : null;
}

export function createRixRepl({ autoSeparateLines = true } = {}) {
    const registeredControls = new Map();
    const systemContext = createDefaultSystemContext({
        frozen: false,
        pluginCatalog: createBundledPluginCatalog(),
    });
    installWebControlCapabilities(systemContext, {
        onControl({ control, create }) {
            registeredControls.set(`${control.targetId}\u0000${control.id}`, {
                targetId: control.targetId,
                create,
            });
        },
    }).freeze();
    const state = {
        context: new Context(),
        registry: createDefaultRegistry(),
        systemContext,
    };
    let initialNames = new Set(state.context.getAllNames());
    let separateLines = autoSeparateLines;
    const numberConfig = { input: "z[10]", display: ".." };

    const configuredFormat = (value) => formatValue(value, { context: state.context, evaluate: null });
    const applyNumberConfig = ({ input, display } = {}) => {
        if (input !== undefined) {
            parseAndEvaluate(`<* ${JSON.stringify(String(input))}`, { ...state, file: "<ratcalc-config>" });
            numberConfig.input = state.context.getEnv("numInput", String(input));
        }
        if (display !== undefined) {
            parseAndEvaluate(`*> ${JSON.stringify(String(display))}`, { ...state, file: "<ratcalc-config>" });
            numberConfig.display = state.context.getEnv("numDisplay", String(display));
        } else if (input !== undefined && state.context.getEnv("numDisplayExplicit", false) !== true) {
            numberConfig.display = state.context.getEnv("numDisplay", numberConfig.input);
        }
        return { ...numberConfig };
    };

    return {
        run(source) {
            const topic = inlineHelpRequest(source);
            if (topic !== null) return { type: "help", source, ...findHelp(topic) };
            try {
                const reactiveReads = new Set();
                const normalizedSource = separateLines ? normalizeReplSource(source) : source;
                const evaluationSource = expandDeclarativeWebControls(normalizedSource, tokenize);
                const result = parseAndEvaluate(evaluationSource, {
                    ...state,
                    file: "<ratcalc>",
                    reactiveReads,
                });
                const format = configuredFormat;
                const observedSource = [...reactiveReads]
                    .find((candidate) => currentReactiveValue(candidate) === result);
                const makeResponse = (value) => ({
                    type: "result",
                    source,
                    value,
                    text: format(value),
                    sourceText: formatValueSource(value),
                    html: isOutputValue(value) ? renderOutputHtml(value, format) : null,
                    observe: observedSource
                        ? (listener) => observedSource.subscribe(() => {
                            listener(makeResponse(currentReactiveValue(observedSource)));
                        })
                        : null,
                });
                return makeResponse(result);
            } catch (error) {
                return { type: "error", source, text: error.message || String(error) };
            }
        },
        async runAsync(source) {
            // Preserve the mature synchronous evaluator for ordinary cells;
            // select the promise-aware path only when async block syntax is
            // present. This also keeps existing plugin/lazy-form behavior
            // identical while the async evaluator coverage expands.
            const tokens = tokenize(source);
            const usesAsyncEvaluation = tokens.some((token) => token.value === "{$" || token.value === "{$$")
                || tokens.some((token) => token.value === "|>_" || token.value === "|>!")
                || /\.(?:ForEach|Reduce|Collect|First|Find|Count|Close|Retry)\s*\(/i.test(source);
            if (!usesAsyncEvaluation) return this.run(source);
            const topic = inlineHelpRequest(source);
            if (topic !== null) return { type: "help", source, ...findHelp(topic) };
            try {
                const reactiveReads = new Set();
                const normalizedSource = separateLines ? normalizeReplSource(source) : source;
                const evaluationSource = expandDeclarativeWebControls(normalizedSource, tokenize);
                const result = await parseAndEvaluateAsync(evaluationSource, {
                    ...state,
                    file: "<ratcalc>",
                    reactiveReads,
                });
                const format = configuredFormat;
                const observedSource = [...reactiveReads]
                    .find((candidate) => currentReactiveValue(candidate) === result);
                const makeResponse = (value) => ({
                    type: "result",
                    source,
                    value,
                    text: format(value),
                    sourceText: formatValueSource(value),
                    html: isOutputValue(value) ? renderOutputHtml(value, format) : null,
                    observe: observedSource
                        ? (listener) => observedSource.subscribe(() => {
                            listener(makeResponse(currentReactiveValue(observedSource)));
                        })
                        : null,
                });
                return makeResponse(result);
            } catch (error) {
                return { type: "error", source, text: error.message || String(error) };
            }
        },
        variables() {
            return state.context.getAllNames().filter((name) => !initialNames.has(name)).map((name) => ({
                name,
                value: configuredFormat(state.context.get(name)),
            }));
        },
        reactiveVariables() {
            const names = state.context.getAllNames();
            const byId = new Map();
            for (const bindingName of names) {
                const node = state.context.get(bindingName);
                if (!isReactiveNode(node)) continue;
                const descriptor = byId.get(node.id) || {
                    id: node.id,
                    name: node.name,
                    aliases: [],
                    node,
                };
                descriptor.aliases.push(bindingName);
                byId.set(node.id, descriptor);
            }

            const controls = [];
            for (const name of names) collectControlValues(state.context.get(name), controls);
            for (const [key, entry] of registeredControls) {
                if (!byId.has(entry.targetId)) {
                    registeredControls.delete(key);
                    continue;
                }
                try {
                    controls.push(entry.create());
                } catch {
                    // The reactive value remains visible if a direct edit makes
                    // it temporarily incompatible with its declared control.
                }
            }
            const controlsByTarget = new Map();
            for (const control of controls) {
                if (!control.targetId) continue;
                const keyed = controlsByTarget.get(control.targetId) || new Map();
                keyed.set(control.id, control);
                controlsByTarget.set(control.targetId, keyed);
            }

            return [...byId.values()].map((descriptor) => {
                const { node } = descriptor;
                const value = node.peek();
                return {
                    ...descriptor,
                    aliases: Object.freeze([...new Set(descriptor.aliases)].sort()),
                    kind: node.kind,
                    state: node.state,
                    value,
                    valueText: configuredFormat(value),
                    sourceText: formatValueSource(value),
                    formulaSource: reactiveFormulaSource(node),
                    dependencies: Object.freeze([...node.dependencies].sort()),
                    dependents: Object.freeze([...node.dependents].sort()),
                    diagnostics: Object.freeze((node.diagnostics || []).map(diagnosticText)),
                    controls: Object.freeze([...(controlsByTarget.get(node.id)?.values() || [])]),
                };
            }).sort((left, right) => left.name.localeCompare(right.name));
        },
        subscribeReactive(listener) {
            if (typeof listener !== "function") throw new Error("Reactive subscriber must be a function");
            const graphs = new Set(this.reactiveVariables().map(({ node }) => node.graph));
            const unsubscribes = [...graphs].map((graph) => graph.subscribe(listener));
            return () => unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe?.());
        },
        formatValue: configuredFormat,
        sourceText: formatValueSource,
        numberConfig() {
            return {
                input: state.context.getEnv("numInput", numberConfig.input),
                display: state.context.getEnv("numDisplay", numberConfig.display),
            };
        },
        setNumberConfig(config) {
            return applyNumberConfig(config);
        },
        complete(source, cursor = String(source).length) {
            return complete(source, cursor, {
                context: state.context,
                systemContext: state.systemContext,
                formatValue: (value) => formatValue(value, { context: state.context, evaluate: null }),
            });
        },
        async reset() {
            await disposeAsyncResources(state.context, { kind: "session reset" });
            state.context.clear();
            registeredControls.clear();
            initialNames = new Set(state.context.getAllNames());
            applyNumberConfig(numberConfig);
        },
        async dispose() {
            await disposeAsyncResources(state.context, { kind: "session shutdown" });
        },
        setAutoSeparateLines(enabled) {
            separateLines = Boolean(enabled);
        },
        autoSeparatesLines() {
            return separateLines;
        },
    };
}
