export const RIX_SESSION_FORMAT = "rix-web-session";
export const RIX_SESSION_VERSION = 1;

function requiredString(value, label) {
    if (typeof value !== "string") throw new Error(`${label} must be text`);
    return value;
}

export function createSessionSnapshot({
    transcript = [],
    input = "",
    scriptMode = false,
    autoSeparateLines = true,
    numberConfig = {},
    reactiveInputs = [],
    dashboardOpen = false,
    savedAt = new Date().toISOString(),
} = {}) {
    return {
        format: RIX_SESSION_FORMAT,
        version: RIX_SESSION_VERSION,
        savedAt,
        transcript: transcript.map((entry, index) => ({
            source: requiredString(entry?.source, `Transcript entry ${index + 1} source`),
            text: typeof entry?.text === "string" ? entry.text : "",
        })),
        input: requiredString(input, "Current input"),
        scriptMode: Boolean(scriptMode),
        autoSeparateLines: Boolean(autoSeparateLines),
        numberConfig: {
            input: requiredString(numberConfig.input ?? "z[10]", "Number input notation"),
            display: requiredString(numberConfig.display ?? "..", "Number display notation"),
        },
        reactiveInputs: reactiveInputs.map((entry, index) => ({
            name: requiredString(entry?.name, `Reactive input ${index + 1} name`),
            source: requiredString(entry?.source, `Reactive input ${index + 1} source`),
        })),
        dashboardOpen: Boolean(dashboardOpen),
    };
}

export function serializeSession(snapshot) {
    return `${JSON.stringify(createSessionSnapshot(snapshot), null, 2)}\n`;
}

export function parseSession(text) {
    let value;
    try {
        value = JSON.parse(String(text));
    } catch {
        throw new Error("This is not a valid RiX session file.");
    }
    if (!value || value.format !== RIX_SESSION_FORMAT) {
        throw new Error("This file is not a RiX Web session.");
    }
    if (value.version !== RIX_SESSION_VERSION) {
        throw new Error(`RiX session version ${value.version} is not supported.`);
    }
    if (!Array.isArray(value.transcript) || !Array.isArray(value.reactiveInputs ?? [])) {
        throw new Error("The RiX session is missing its command history.");
    }
    return createSessionSnapshot(value);
}

export function modePresentation(scriptMode) {
    return scriptMode
        ? {
            buttonLabel: "Input: Script",
            status: "Script input · Enter adds a line · Ctrl/⌘ + Enter runs",
            placeholder: "Enter a RiX script",
        }
        : {
            buttonLabel: "Input: Calculator",
            status: "Calculator input · Enter runs · Shift+↑ opens script input",
            placeholder: "Enter a RiX expression",
        };
}

export class ClearCoordinator {
    constructor() {
        this.armed = false;
    }

    activate(hasInput) {
        if (this.armed) {
            this.armed = false;
            return "clear-session";
        }
        this.armed = true;
        return hasInput ? "clear-input" : "confirm-session";
    }

    reset() {
        this.armed = false;
    }
}
