import {
  replayTutorialSourcesAsync
} from "./chunk-v0hv1shm.js";
import {
  createRixRepl
} from "./chunk-btazq016.js";
import {
  encodeOutputJSON
} from "./chunk-kx4t6gwn.js";
import"./chunk-9v01vpwy.js";

// src/tutorial-worker.js
self.onmessage = async ({ data: sources }) => {
  try {
    const response = await replayTutorialSourcesAsync(sources, sources.length - 1, createRixRepl);
    if (!response) {
      self.postMessage({ response: null });
      return;
    }
    const { type, text, html, groups } = response;
    let valueJSON = null;
    if (html) {
      try {
        if (response.observe)
          throw new Error("Live output");
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

//# debugId=04D4D8F784A35B1364756E2164756E21
//# sourceMappingURL=tutorial-worker.js.map
