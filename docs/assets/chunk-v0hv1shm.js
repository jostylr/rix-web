// src/tutorial-replay.js
async function replayTutorialSourcesAsync(sources, targetIndex, createSession) {
  const repl = createSession();
  for (let index = 0;index <= targetIndex && index < sources.length; index += 1) {
    const source = String(sources[index] ?? "").trim();
    if (!source) {
      if (index === targetIndex)
        return null;
      continue;
    }
    const response = await repl.runAsync(source);
    if (index === targetIndex || response.type === "error")
      return { ...response, repl };
  }
  return null;
}
function tutorialSectionCells(entries, targetValue) {
  let section = [];
  for (const entry of entries) {
    if (entry.type === "heading") {
      section = [];
      continue;
    }
    if (entry.type !== "cell")
      continue;
    section.push(entry.value);
    if (entry.value === targetValue)
      return section;
  }
  return [];
}

export { replayTutorialSourcesAsync, tutorialSectionCells };

//# debugId=F3A0AA3B91C396C164756E2164756E21
//# sourceMappingURL=chunk-v0hv1shm.js.map
