import { createRixRepl } from "./repl-runtime.js";
import { replayTutorialSourcesAsync } from "./tutorial-replay.js";
import { encodeOutputJSON } from "../../rix/src/runtime/output-json.js";

self.onmessage = async ({ data: sources }) => {
    try {
        const response = await replayTutorialSourcesAsync(sources, sources.length - 1, createRixRepl);
        if (!response) { self.postMessage({ response: null }); return; }
        const { type, text, html, groups } = response;
        let valueJSON = null;
        if (html) {
            try {
                // Live controls and editable sheets require the local session.
                if (response.observe) throw new Error("Live output");
                valueJSON = encodeOutputJSON(response.value);
            } catch {
                self.postMessage({ localSessionRequired: true });
                return;
            }
        }
        self.postMessage({ response: { type, text, html, groups, valueJSON } });
    } catch (error) {
        self.postMessage({ response: { type: "error", text: error.message || String(error) } });
    }
};
