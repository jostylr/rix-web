import { expect, test } from "bun:test";
import { startTutorialExecution } from "../src/tutorial-execution.js";

function fakeWorker() {
    return { messages: [], terminated: 0, postMessage(message) { this.messages.push(message); }, terminate() { this.terminated++; } };
}

test("execution replays the section and releases its worker", async () => {
    const worker = fakeWorker();
    const run = startTutorialExecution(["x := 2;", "x + 1;"], () => worker);
    expect(worker.messages).toEqual([["x := 2;", "x + 1;"]]);
    worker.onmessage({ data: { response: { type: "result", text: "3" } } });
    expect(await run.result).toEqual({ response: { type: "result", text: "3" } });
    run.stop();
    expect(worker.terminated).toBe(1);
});

test("stopping terminates only that cell and ignores late replies", async () => {
    const first = fakeWorker(), second = fakeWorker();
    const stopped = startTutorialExecution(["slow"], () => first);
    const other = startTutorialExecution(["quick"], () => second);
    stopped.stop();
    first.onmessage({ data: { response: { text: "stale" } } });
    expect(await stopped.result).toEqual({ stopped: true });
    expect(first.terminated).toBe(1);
    expect(second.terminated).toBe(0);
    second.onmessage({ data: { response: { text: "done" } } });
    expect(await other.result).toEqual({ response: { text: "done" } });
});

test("worker failures settle the run and terminate the worker", async () => {
    const worker = fakeWorker();
    const run = startTutorialExecution(["1;"], () => worker);
    worker.onerror({ message: "Could not load worker" });
    expect((await run.result).response).toEqual({ type: "error", text: "Could not load worker" });
    expect(worker.terminated).toBe(1);
});

test("live outputs request a local session without transferring callbacks", async () => {
    const worker = fakeWorker();
    const run = startTutorialExecution(["live output"], () => worker);
    worker.onmessage({ data: { localSessionRequired: true } });
    expect(await run.result).toEqual({ localSessionRequired: true });
    expect(worker.terminated).toBe(1);
});
