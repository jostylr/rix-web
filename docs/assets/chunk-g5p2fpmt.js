// src/tutorial-navigation.js
function localFileName(location) {
  const path = new URL(location.href).pathname;
  return decodeURIComponent(path.slice(path.lastIndexOf("/") + 1) || "index.html");
}
function tutorialLabel(tutorial) {
  if (!tutorial)
    return "";
  const firstWord = tutorial.title.split(/\s+/, 1)[0].replace(/[^\p{L}\p{N}]+$/u, "");
  return `${tutorial.number} ${firstWord}`;
}
function link(document, tutorial, text = `${tutorial.number} · ${tutorial.title}`) {
  const anchor = document.createElement("a");
  anchor.href = `./${tutorial.file}`;
  anchor.textContent = text;
  return anchor;
}
function rootsOf(tutorials) {
  return tutorials.filter((tutorial) => !tutorial.parent);
}
function childrenOf(tutorials, number) {
  return tutorials.filter((tutorial) => tutorial.parent === String(number));
}
function renderTutorialSidebar(document, container, tutorials, currentFile) {
  const current = tutorials.find((tutorial) => tutorial.file === currentFile);
  const activeRoot = current?.parent || current?.number;
  const heading = document.createElement("p");
  heading.textContent = "Contents";
  const fragment = document.createDocumentFragment();
  fragment.append(heading);
  for (const root of rootsOf(tutorials)) {
    const children = childrenOf(tutorials, root.number);
    if (!children.length) {
      const anchor = link(document, root);
      if (current?.number === root.number)
        anchor.classList.add("current");
      fragment.append(anchor);
      continue;
    }
    const details = document.createElement("details");
    details.open = activeRoot === root.number;
    const summary = document.createElement("summary");
    summary.textContent = `${root.number} · ${root.title}`;
    details.append(summary);
    const overview = link(document, root, "Overview");
    overview.classList.add("overview");
    if (current?.number === root.number)
      overview.classList.add("current");
    details.append(overview);
    for (const child of children) {
      const anchor = link(document, child);
      if (current?.number === child.number)
        anchor.classList.add("current");
      details.append(anchor);
    }
    fragment.append(details);
  }
  container.replaceChildren(fragment);
}
function appendNavigationLink(document, container, tutorial, text) {
  if (!tutorial)
    return;
  container.append(link(document, tutorial, text));
}
function renderTutorialPageNavigation(document, container, tutorials, currentFile) {
  const position = tutorials.findIndex((tutorial) => tutorial.file === currentFile);
  if (position === -1)
    return;
  const current = tutorials[position];
  const roots = rootsOf(tutorials);
  const section = current.parent ? tutorials.find((tutorial) => tutorial.number === current.parent) : current;
  const down = roots[roots.findIndex((tutorial) => tutorial.number === section.number) + 1];
  const previous = document.createElement("span");
  previous.className = "previous-link";
  appendNavigationLink(document, previous, tutorials[position - 1], `← ${tutorialLabel(tutorials[position - 1])}`);
  const sections = document.createElement("span");
  sections.className = "section-links";
  appendNavigationLink(document, sections, section, `↑ ${tutorialLabel(section)}`);
  appendNavigationLink(document, sections, down, `↓ ${tutorialLabel(down)}`);
  const next = document.createElement("span");
  next.className = "next-link";
  appendNavigationLink(document, next, tutorials[position + 1], `${tutorialLabel(tutorials[position + 1])} →`);
  container.replaceChildren(previous, sections, next);
}
function renderIndexSection(document, tutorial, tutorials) {
  const section = document.createElement("section");
  section.className = "tutorial-index-section";
  const rootLink = link(document, tutorial);
  const title = document.createElement("b");
  title.textContent = `${tutorial.number} · ${tutorial.title}`;
  const description = document.createElement("span");
  description.textContent = tutorial.description;
  rootLink.replaceChildren(title, description);
  section.append(rootLink);
  const children = childrenOf(tutorials, tutorial.number);
  if (children.length) {
    const childContainer = document.createElement("div");
    childContainer.className = "tutorial-index-children";
    for (const child of children)
      childContainer.append(link(document, child));
    section.append(childContainer);
  }
  return section;
}
function renderTutorialIndex(document, container, tutorials, pluginGroup) {
  const roots = rootsOf(tutorials).filter((tutorial) => Boolean(tutorial.pluginGroup) === pluginGroup);
  container.replaceChildren(...roots.map((tutorial) => renderIndexSection(document, tutorial, tutorials)));
  container.closest("[data-tutorial-index-section]")?.removeAttribute("hidden");
}
async function mountTutorialNavigation({ document = globalThis.document, fetchImpl = globalThis.fetch } = {}) {
  if (!document)
    return;
  const targets = document.querySelectorAll("[data-tutorial-sidebar], [data-tutorial-page-navigation], [data-tutorial-index]");
  if (!targets.length)
    return;
  try {
    const response = await fetchImpl(new URL("./navigation.json", document.baseURI), { cache: "no-cache" });
    if (!response.ok)
      throw new Error(`Tutorial navigation request failed (${response.status})`);
    const { tutorials } = await response.json();
    const currentFile = localFileName(document.location);
    document.querySelectorAll("[data-tutorial-sidebar]").forEach((container) => {
      renderTutorialSidebar(document, container, tutorials, currentFile);
    });
    document.querySelectorAll("[data-tutorial-page-navigation]").forEach((container) => {
      renderTutorialPageNavigation(document, container, tutorials, currentFile);
    });
    document.querySelectorAll('[data-tutorial-index="core"]').forEach((container) => {
      renderTutorialIndex(document, container, tutorials, false);
    });
    document.querySelectorAll('[data-tutorial-index="plugins"]').forEach((container) => {
      renderTutorialIndex(document, container, tutorials, true);
    });
  } catch (error) {
    console.warn("Tutorial navigation could not be loaded.", error);
  }
}

export { mountTutorialNavigation };

//# debugId=FB9512E54CF362DC64756E2164756E21
//# sourceMappingURL=chunk-g5p2fpmt.js.map
