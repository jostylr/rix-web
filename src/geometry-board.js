import { createGeometryAuthoringProgram } from "../../rix/src/index.js";

export function createNewGeometryBoard(sequence = 1) {
    const suffix = Number.isInteger(sequence) && sequence > 0 ? sequence : 1;
    const namesPrefix = `geometryboard${suffix}`;
    const actionPrefix = `geometry-author-${suffix}`;
    return Object.freeze({
        pointActionId: `${actionPrefix}-point`,
        source: `.Plugin.Load("geometry");
${namesPrefix}seed := .geometry.ConstructionGraph([]);
${createGeometryAuthoringProgram("", {
    graphName: `${namesPrefix}seed`,
    namesPrefix,
    actionPrefix,
    view: [-5, -4, 5, 4],
    size: [720, 520],
    snap: "1/4",
    maxNodes: 1000,
})}`,
    });
}

export const NEW_GEOMETRY_BOARD_SOURCE = createNewGeometryBoard().source;
