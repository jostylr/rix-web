import {
  Context,
  boundedExactExplorationInterval,
  createDefaultRegistry,
  createDefaultSystemContext,
  formatValue,
  parseAndEvaluate
} from "./chunk-f4fq1e6m.js";

// src/rix-stern-brocot-bridge.js
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

class SternBrocotRixBridge {
  constructor() {
    this.context = new Context;
    this.registry = createDefaultRegistry();
    this.systemContext = createDefaultSystemContext();
    this.runtime = {
      context: this.context,
      registry: this.registry,
      systemContext: this.systemContext
    };
    parseAndEvaluate("", this.runtime);
    parseAndEvaluate('.Plugin.Load("stern-brocot");', this.runtime);
  }
  describeNode(fraction) {
    this.context.setFresh("selectedfraction", fraction);
    const raw = parseAndEvaluate(".sternBrocotDescribe(selectedfraction);", this.runtime);
    return {
      raw,
      current: mapField(raw, "current"),
      parent: mapField(raw, "parent"),
      children: sequenceValues(mapField(raw, "children"), "children"),
      ancestors: sequenceValues(mapField(raw, "ancestors"), "ancestors"),
      depth: integerNumber(mapField(raw, "depth"), "Stern-Brocot depth"),
      path: sequenceValues(mapField(raw, "path"), "path").map((direction) => direction.value),
      boundaries: sequenceValues(mapField(raw, "boundaries"), "boundaries"),
      mediant: mapField(raw, "mediant"),
      rational: mapField(raw, "rational"),
      continuedFraction: sequenceValues(mapField(raw, "continuedfraction"), "continued fraction"),
      convergents: sequenceValues(mapField(raw, "convergents"), "convergents")
    };
  }
  describeBounded(value, { maxPath = 128, maxConvergents = 32 } = {}) {
    if (!Number.isInteger(maxPath) || maxPath < 1 || maxPath > 256 || !Number.isInteger(maxConvergents) || maxConvergents < 1 || maxConvergents > 64) {
      throw new Error("Linked number inspection supports at most 256 path steps and 64 convergents");
    }
    if (!boundedExactExplorationInterval(value))
      throw new Error("Linked number inspection requires an exact rational value");
    this.context.setFresh("selectedfraction", value);
    const raw = parseAndEvaluate(`{;
      source := @selectedfraction.F();
      parents := .fraction.Derivation(:parentage,source);
      path := .fraction.Derivation(:fareyPath,source,{= maxSteps=${maxPath},maxDenominator=source.Denominator() });
      convergents := .fraction.Derivation(:convergents,source,{= maxTerms=${maxConvergents} });
      [parents,path,convergents].Map((record)->.fraction.CheckDerivation(record)[:accepted]).Reduce((same,accepted)->same && accepted,1)
        ?: _ ?_ .Error("Fraction exploration evidence failed replay");
      {= rational=source.Rational() ~!: :Rational,parentage=parents,path=path,convergence=convergents }
    }`, this.runtime);
    const parentage = mapField(raw, "parentage"), walk = mapField(raw, "path"), convergence = mapField(raw, "convergence");
    const path = sequenceValues(mapField(mapField(walk, "details"), "path"), "bounded path").map((entry) => entry.value);
    const pathDiagnostic = mapField(walk, "status").value === "found" ? null : `Path exceeds ${maxPath} steps or its denominator budget: ${mapField(walk, "status").value}`;
    return {
      raw,
      evidence: { parentage, path: walk, convergence },
      rational: mapField(raw, "rational"),
      parents: sequenceValues(mapField(mapField(parentage, "details"), "parents"), "Farey parents"),
      mediant: mapField(parentage, "value"),
      continuedFraction: sequenceValues(mapField(mapField(convergence, "details"), "coefficients"), "coefficients"),
      convergents: sequenceValues(mapField(convergence, "steps"), "convergents").map((entry) => ({ value: mapField(entry, "rational"), error: mapField(entry, "error") })),
      truncated: mapField(convergence, "status").value !== "exact",
      path,
      pathDiagnostic,
      limits: { maxPath, maxConvergents }
    };
  }
  visibleTree(fraction, descendantDepth = 2) {
    this.context.setFresh("selectedfraction", fraction);
    this.context.setFresh("descendantdepth", descendantDepth);
    const raw = parseAndEvaluate(".sternBrocotVisibleTree(selectedfraction, descendantdepth);", this.runtime);
    const nodes = sequenceValues(mapField(raw, "nodes"), "visible-tree nodes").map((record) => ({
      fraction: mapField(record, "fraction"),
      parent: mapField(record, "parent"),
      role: mapField(record, "role").value,
      level: integerNumber(mapField(record, "level"), "relative tree level"),
      path: sequenceValues(mapField(record, "path"), "node path").map((direction) => direction.value)
    }));
    const edges = sequenceValues(mapField(raw, "edges"), "visible-tree edges").map((record) => ({
      parent: mapField(record, "parent"),
      child: mapField(record, "child")
    }));
    return { raw, nodes, edges };
  }
  evaluateExpression(source, fraction) {
    const expression = String(source).trim();
    if (!expression)
      throw new Error("Expression cannot be empty");
    this.context.push({ x: fraction.toRational() }, { isolated: true, readOnly: true });
    try {
      return parseAndEvaluate(expression, {
        ...this.runtime,
        file: "<stern-brocot-expression>"
      });
    } finally {
      this.context.pop();
    }
  }
  format(value) {
    return formatValue(value, { context: this.context });
  }
}
function createSternBrocotRixBridge() {
  return new SternBrocotRixBridge;
}

export { createSternBrocotRixBridge };

//# debugId=F2A9BCC8CA3E149564756E2164756E21
//# sourceMappingURL=chunk-mdjjda8c.js.map
