/** One disposable worker per run keeps cancellation isolated from other cells. */
export function startTutorialExecution(sources, workerFactory = () => new Worker(
    new URL("./tutorial-worker.js", import.meta.url), { type: "module" },
)) {
    const worker = workerFactory();
    let settled = false;
    let resolveResult;
    const finish = (result) => {
        if (settled) return;
        settled = true;
        worker.terminate();
        resolveResult(result);
    };
    const result = new Promise((resolve) => { resolveResult = resolve; });
    worker.onmessage = ({ data }) => finish(data);
    worker.onerror = (event) => {
        event.preventDefault?.();
        finish({ response: { type: "error", text: event.message || "Could not start tutorial computation." } });
    };
    try { worker.postMessage(sources); }
    catch (error) { finish({ response: { type: "error", text: error.message || String(error) } }); }
    return { result, stop: () => finish({ stopped: true }) };
}
