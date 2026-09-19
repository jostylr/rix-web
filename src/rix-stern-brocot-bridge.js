/**
 * RiX computation host for the prewritten Stern-Brocot page.
 *
 * The DOM remains owned by stern-brocot-web.js. This bridge owns one RiX
 * runtime, loads the pure RiX Stern-Brocot plugin, and exposes typed model
 * values to the native renderer.
 */

import {
  Context,
  createDefaultRegistry,
  createDefaultSystemContext,
  formatValue,
  parseAndEvaluate,
} from "../../rix/src/index.js";

import { boundedExactExplorationInterval } from "../../rix/src/tools/exact-exploration.js";

function mapField(value, name) {
  if (value?.type !== "map" || !(value.entries instanceof Map)) {
    throw new Error("Expected a RiX map value");
  }
  return value.entries.get(String(name).toLowerCase());
}

function sequenceValues(value, label) {
  if (!value || !Array.isArray(value.values)) {
    throw new Error(`Expected ${label} to be a RiX sequence`);
  }
  return value.values;
}

function integerNumber(value, label) {
  const exact = value?.value ?? value?.numerator;
  const result = Number(exact);
  if (!Number.isSafeInteger(result)) {
    throw new Error(`${label} is outside the browser's safe integer range`);
  }
  return result;
}

export class SternBrocotRixBridge {
  constructor() {
    this.context = new Context();
    this.registry = createDefaultRegistry();
    this.systemContext = createDefaultSystemContext();
    this.runtime = {
      context: this.context,
      registry: this.registry,
      systemContext: this.systemContext,
    };
    parseAndEvaluate("", this.runtime);
    parseAndEvaluate('.Plugin.Load("stern-brocot");', this.runtime);
  }

  describeNode(fraction) {
    this.context.setFresh("selectedfraction", fraction);
    const raw = parseAndEvaluate(
      ".sternBrocotDescribe(selectedfraction);",
      this.runtime,
    );
    return {
      raw,
      current: mapField(raw, "current"),
      parent: mapField(raw, "parent"),
      children: sequenceValues(mapField(raw, "children"), "children"),
      ancestors: sequenceValues(mapField(raw, "ancestors"), "ancestors"),
      depth: integerNumber(mapField(raw, "depth"), "Stern-Brocot depth"),
      path: sequenceValues(mapField(raw, "path"), "path").map(
        (direction) => direction.value,
      ),
      boundaries: sequenceValues(mapField(raw, "boundaries"), "boundaries"),
      mediant: mapField(raw, "mediant"),
      rational: mapField(raw, "rational"),
      continuedFraction: sequenceValues(
        mapField(raw, "continuedfraction"),
        "continued fraction",
      ),
      convergents: sequenceValues(mapField(raw, "convergents"), "convergents"),
    };
  }

  /** Bounded companion for the calculator's linked exact-number inspector. */
  describeBounded(value, { maxPath = 128, maxConvergents = 32 } = {}) {
    if (!Number.isInteger(maxPath) || maxPath < 1 || maxPath > 256 || !Number.isInteger(maxConvergents) || maxConvergents < 1 || maxConvergents > 64) {
      throw new Error("Linked number inspection supports at most 256 path steps and 64 convergents");
    }
    if (!boundedExactExplorationInterval(value)) throw new Error("Linked number inspection requires an exact rational value");
    this.context.setFresh("selectedfraction", value);
    const raw = parseAndEvaluate(`{;
      rational := @selectedfraction.F().Rational() ~!: :Rational;
      parents := @selectedfraction.F().FareyParents();
      {= rational=rational,parents=parents,mediant=(parents[1].Denominator()+parents[2].Denominator()==0 ?: @selectedfraction.F() ?_ parents[1].Mediant(parents[2])),
         continuedFraction=rational.ToContinuedFraction({= maxTerms=${maxConvergents + 1} }),
         convergents=rational.Convergents(${maxConvergents}).Map(q -> {= value=q,error=@rational-q }) }
    }`, this.runtime);
    let path = [], pathDiagnostic = null;
    try {
      path = sequenceValues(parseAndEvaluate(`selectedfraction.F().SternBrocotPath(${maxPath})`, this.runtime), "bounded path").map((entry) => entry.value);
    } catch (error) { pathDiagnostic = `Path exceeds ${maxPath} steps or is unavailable: ${error.message}`; }
    const terms = sequenceValues(mapField(raw, "continuedfraction"), "continued fraction");
    return { raw, rational: mapField(raw, "rational"), parents: sequenceValues(mapField(raw, "parents"), "Farey parents"),
      mediant: mapField(raw, "mediant"), continuedFraction: terms.slice(0, maxConvergents),
      convergents: sequenceValues(mapField(raw, "convergents"), "convergents").map((entry) => ({ value: mapField(entry, "value"), error: mapField(entry, "error") })),
      truncated: terms.length > maxConvergents, path, pathDiagnostic, limits: { maxPath, maxConvergents } };
  }

  visibleTree(fraction, descendantDepth = 2) {
    this.context.setFresh("selectedfraction", fraction);
    this.context.setFresh("descendantdepth", descendantDepth);
    const raw = parseAndEvaluate(
      ".sternBrocotVisibleTree(selectedfraction, descendantdepth);",
      this.runtime,
    );
    const nodes = sequenceValues(mapField(raw, "nodes"), "visible-tree nodes")
      .map((record) => ({
        fraction: mapField(record, "fraction"),
        parent: mapField(record, "parent"),
        role: mapField(record, "role").value,
        level: integerNumber(mapField(record, "level"), "relative tree level"),
        path: sequenceValues(mapField(record, "path"), "node path").map(
          (direction) => direction.value,
        ),
      }));
    const edges = sequenceValues(mapField(raw, "edges"), "visible-tree edges")
      .map((record) => ({
        parent: mapField(record, "parent"),
        child: mapField(record, "child"),
      }));
    return { raw, nodes, edges };
  }

  evaluateExpression(source, fraction) {
    const expression = String(source).trim();
    if (!expression) throw new Error("Expression cannot be empty");
    this.context.push(
      { x: fraction.toRational() },
      { isolated: true, readOnly: true },
    );
    try {
      return parseAndEvaluate(expression, {
        ...this.runtime,
        file: "<stern-brocot-expression>",
      });
    } finally {
      this.context.pop();
    }
  }

  format(value) {
    return formatValue(value, { context: this.context });
  }
}

export function createSternBrocotRixBridge() {
  return new SternBrocotRixBridge();
}
