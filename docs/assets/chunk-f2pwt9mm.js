import {
  Context,
  Integer,
  PluginCatalog,
  Rational,
  RationalInterval,
  callWithConcreteArgs,
  complete,
  createActionControl,
  createChoiceControl,
  createDefaultRegistry,
  createDefaultSystemContext,
  createHoldControl,
  createInputControl,
  createRangeControl,
  createResetControl,
  createSliderControl,
  createToggleControl,
  disposeAsyncResources,
  formatValue,
  formatValueSource,
  install,
  install1 as install2,
  install10 as install11,
  install11 as install12,
  install12 as install13,
  install13 as install14,
  install14 as install15,
  install15 as install16,
  install16 as install17,
  install17 as install18,
  install18 as install19,
  install19 as install20,
  install2 as install3,
  install20 as install21,
  install21 as install22,
  install22 as install23,
  install23 as install24,
  install3 as install4,
  install4 as install5,
  install5 as install6,
  install6 as install7,
  install7 as install8,
  install8 as install9,
  install9 as install10,
  installRegisteredTypes,
  irToText,
  isOutputValue,
  isReactiveNode,
  makeProto,
  parseAndEvaluate,
  parseAndEvaluateAsync,
  registerType,
  renderOutputHtml,
  stringObj,
  tokenize,
  typeRegistry,
  unsupportedRefinementResult,
  valueMethod
} from "./chunk-jgnjwpp0.js";

// src/repl-source.js
var statementClosers = new Set([")", "]", "}", "|}", ";}", "@}", "!}", ":}"]);
var containerOpeners = new Set(["(", "[", "{", "{|", "{=", "{;", "{@", "{!", "{:"]);
function isComment(token) {
  return token?.type === "String" && token.kind === "comment";
}
function canEndStatement(token) {
  if (!token || isComment(token))
    return false;
  if (token.type !== "Symbol")
    return token.type !== "End";
  return statementClosers.has(token.value) || token.value === "^^" || token.value === "_";
}
function canStartStatement(token) {
  if (!token || isComment(token) || token.type === "End")
    return false;
  if (token.type !== "Symbol")
    return true;
  return ["(", "[", "{", "-", "+", "!", "_", "@", "@_", "."].includes(token.value) || String(token.value).startsWith("{");
}
function normalizeReplSource(source) {
  let tokens;
  try {
    tokens = tokenize(source);
  } catch {
    return source;
  }
  const insertions = [];
  let depth = 0;
  let previous = null;
  for (const token of tokens) {
    if (token.type === "End")
      break;
    if (!isComment(token) && previous) {
      const whitespaceBetween = source.slice(previous.pos[2], token.pos[1]);
      if (depth === 0 && whitespaceBetween.includes(`
`) && canEndStatement(previous) && canStartStatement(token)) {
        insertions.push(previous.pos[2]);
      }
    }
    if (!isComment(token)) {
      if (containerOpeners.has(token.value))
        depth += 1;
      if (statementClosers.has(token.value))
        depth = Math.max(0, depth - 1);
      previous = token;
    }
  }
  return insertions.sort((left, right) => right - left).reduce((result, position) => `${result.slice(0, position)};${result.slice(position)}`, source);
}

// ../rix/examples/plugins/example-array-js/array-js.plugin.rix.js
function valuesFrom(value) {
  if (!value || !Array.isArray(value.values)) {
    throw new Error("arrayJs expects an array or sequence");
  }
  return value.values;
}
function integerFrom(value) {
  if (value instanceof Integer)
    return value.value;
  if (typeof value === "bigint")
    return value;
  throw new Error("arrayJs.Sum expects Integer values");
}
function sum(value) {
  return new Integer(valuesFrom(value).reduce((total, item) => total + integerFrom(item), 0n));
}
function describe(value) {
  const values = valuesFrom(value);
  return { type: "string", value: `count ${values.length}; sum ${sum(value).value}` };
}
function reverse(value) {
  return { type: "sequence", values: [...valuesFrom(value)].reverse() };
}
function collection() {
  const entries = new Map;
  const extension = new Map([["immutable", new Integer(1n)]]);
  for (const [name, helper] of [["Sum", sum], ["Describe", describe], ["Reverse", reverse]]) {
    entries.set(name, helper);
    extension.set(name.toUpperCase(), {
      type: "method_builtin",
      name,
      impl: (args) => helper(args[1])
    });
  }
  return { type: "map", entries, _ext: extension };
}
function install25({ systemContext }) {
  const value = collection();
  systemContext.registerHostCallableValue("arrayJs", value, {
    impl(args) {
      return sum(args[0]);
    }
  }, {
    doc: "Example JavaScript array plugin",
    groups: ["Examples"]
  });
  return value;
}

// ../rix/plugins/float/math-functions.js
function numberFrom(value) {
  if (value instanceof Integer)
    return Number(value.value);
  if (value instanceof Rational)
    return Number(value.numerator) / Number(value.denominator);
  if (typeof value === "bigint")
    return Number(value);
  if (value?.type === "string")
    return Number(value.value);
  return Number(value);
}
function finiteNumberFrom(value) {
  const number = numberFrom(value);
  if (Number.isNaN(number))
    throw new Error("Math function expected a numeric value");
  return number;
}
function unary(fn) {
  return (args) => fn(finiteNumberFrom(args[0]));
}
function binary(fn) {
  return (args) => fn(finiteNumberFrom(args[0]), finiteNumberFrom(args[1]));
}
var mathFunctions = {
  SIN: { impl: unary(Math.sin), pure: true, doc: "Float sine" },
  COS: { impl: unary(Math.cos), pure: true, doc: "Float cosine" },
  TAN: { impl: unary(Math.tan), pure: true, doc: "Float tangent" },
  ASIN: { impl: unary(Math.asin), pure: true, doc: "Float arcsine" },
  ACOS: { impl: unary(Math.acos), pure: true, doc: "Float arccosine" },
  ATAN: { impl: unary(Math.atan), pure: true, doc: "Float arctangent" },
  ATAN2: { impl: binary(Math.atan2), pure: true, doc: "Float two-argument arctangent" },
  LOG: { impl: unary(Math.log), pure: true, doc: "Float natural logarithm" },
  LN: { impl: unary(Math.log), pure: true, doc: "Float natural logarithm" },
  LOG10: { impl: unary(Math.log10), pure: true, doc: "Float base-10 logarithm" },
  EXP: { impl: unary(Math.exp), pure: true, doc: "Float exponential" }
};

// ../rix/plugins/float/protocol.js
function int(value) {
  return new Integer(BigInt(value));
}
function text(value) {
  return { type: "string", value };
}
function map(entries) {
  return { type: "map", entries: new Map(entries) };
}
function sequence(values) {
  return { type: "sequence", values };
}
function entry(value, key, fallback = null) {
  if (!(value?.entries instanceof Map))
    return fallback;
  if (value.entries.has(key))
    return value.entries.get(key);
  const lower = key.toLowerCase();
  for (const [candidate, item] of value.entries) {
    if (String(candidate).toLowerCase() === lower)
      return item;
  }
  return fallback;
}
function exactFloatRational(float) {
  const value = float?.value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Float exact conversion requires a finite Float");
  }
  if (value === 0)
    return Rational.zero;
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const negative = bits >> 63n !== 0n;
  const exponent = Number(bits >> 52n & 0x7ffn);
  const fraction = bits & (1n << 52n) - 1n;
  const significand = exponent === 0 ? fraction : 1n << 52n | fraction;
  const binaryExponent = exponent === 0 ? -1074 : exponent - 1075;
  const numerator = negative ? -significand : significand;
  return binaryExponent >= 0 ? new Rational(numerator << BigInt(binaryExponent), 1n) : new Rational(numerator, 1n << BigInt(-binaryExponent));
}
function NumericsCapabilities() {
  return map([
    ["valuekind", text("numericsCapabilities")],
    ["schema", text("rix.numerics.capabilities@1")],
    ["backend", text("float")],
    ["representation", text("ieee754Binary64")],
    ["denotation", text("storedScalar")],
    ["operations", sequence([text("sample"), text("enclose")])],
    ["evidencelevels", sequence([text("approximate")])],
    ["certified", null],
    ["arbitraryrefinement", null],
    ["deterministic", int(1)],
    ["minimumwidth", Rational.zero],
    ["storedvalueexact", int(1)],
    ["intendedrealcertified", null]
  ]);
}
function approximateStoredValue(value, request, operation) {
  const exact = exactFloatRational(value);
  const requestedWidth = entry(request, "absolutewidth", null);
  const requestedWork = entry(entry(request, "work", null), "maxwork", int(0));
  return map([
    ["valuekind", text("enclosure")],
    ["schema", text("rix.numerics.enclosure@1")],
    ["status", text("approximate")],
    ["interval", new RationalInterval(exact, exact)],
    ["certified", null],
    ["goalmet", null],
    ["requestedwidth", requestedWidth],
    ["achievedwidth", Rational.zero],
    ["evidencelevel", text("approximate")],
    ["backend", text("float")],
    ["operation", text(operation)],
    ["trace", sequence([])],
    ["work", map([
      ["samples", int(1)],
      ["maxwork", requestedWork],
      ["exhausted", null]
    ])],
    ["diagnostics", sequence([
      text("storedValueOnly"),
      text("noErrorBoundForIntendedReal")
    ])],
    ["source", map([
      ["plugin", text("float")],
      ["representation", text("ieee754Binary64")],
      ["storedvalueexact", int(1)]
    ])]
  ]);
}
function Sample(value, request) {
  return approximateStoredValue(value, request, "sample");
}
function Enclose(value, request) {
  return approximateStoredValue(value, request, "enclose");
}
function Refine(_value, request) {
  return unsupportedRefinementResult(request, NumericsCapabilities(), "noArbitraryRefinementForIntendedReal");
}

// ../rix/plugins/float/browser-installer.js
var TYPE_NAME = "FloatIEEE754";
var NATIVE_TYPE = "float_ieee754";
function isFloat(value) {
  return value?.type === NATIVE_TYPE && typeof value.value === "number";
}
function numberFrom2(value) {
  if (isFloat(value))
    return value.value;
  if (value instanceof Integer)
    return Number(value.value);
  if (value instanceof Rational)
    return Number(value.numerator) / Number(value.denominator);
  if (typeof value === "number")
    return value;
  if (typeof value === "bigint")
    return Number(value);
  if (value?.type === "string")
    return Number(value.value);
  return Number(value);
}
function float(value) {
  const number = numberFrom2(value);
  if (!Number.isFinite(number))
    throw new Error("Cannot convert value to finite Float");
  return { type: NATIVE_TYPE, value: number, toString() {
    return String(number);
  } };
}
function requireFloat(value, evaluate) {
  return evaluate({ fn: "SEMANTIC_CONVERT_STRICT", args: [value, TYPE_NAME] });
}
function decimalPlaces(value) {
  if (value === undefined || value === null)
    return 0;
  if (!(value instanceof Integer) || value.value < 0n || value.value > 10000n) {
    throw new Error("Float rounding places must be a non-negative integer no greater than 10000");
  }
  return Number(value.value);
}
function floorDiv(numerator, denominator) {
  return numerator >= 0n ? numerator / denominator : -((-numerator + denominator - 1n) / denominator);
}
function decimalRounded(value, places, mode) {
  const exact = exactFloatRational(value);
  const scale = 10n ** BigInt(places);
  const scaled = exact.numerator * scale;
  const lower = floorDiv(scaled, exact.denominator);
  let coefficient = lower;
  if (mode === "ceiling" && scaled !== lower * exact.denominator)
    coefficient += 1n;
  if (mode === "round") {
    const remainder = scaled - lower * exact.denominator;
    const doubled = remainder * 2n;
    if (doubled > exact.denominator || doubled === exact.denominator && (lower & 1n) !== 0n)
      coefficient += 1n;
  }
  return new Rational(coefficient, scale);
}
function numericVariant(name, fn, arity = 2) {
  return {
    name,
    priority: 500,
    prep(args) {
      return args.length >= arity && args.slice(0, arity).every(isFloat);
    },
    impl(args) {
      return float(fn(...args.map(numberFrom2)));
    }
  };
}
function compareVariant(name, relation) {
  return {
    name,
    priority: 500,
    prep(args) {
      return args.length === 2 && args.every(isFloat);
    },
    impl(args) {
      return relation(numberFrom2(args[0]), numberFrom2(args[1])) ? new Integer(1n) : null;
    }
  };
}
function prepareFloatComparison(args) {
  return args.length === 2 && args.every(isFloat) ? { args } : false;
}
function registerFloatType() {
  if (typeRegistry.has(TYPE_NAME))
    return;
  const installs = new Map([
    ["ADD", [numericVariant("FloatIEEE754Add", (...args) => args.reduce((total, value) => total + value, 0))]],
    ["SUB", [numericVariant("FloatIEEE754Sub", (left, right) => left - right)]],
    ["MUL", [numericVariant("FloatIEEE754Mul", (...args) => args.reduce((total, value) => total * value, 1))]],
    ["DIV", [numericVariant("FloatIEEE754Div", (left, right) => left / right)]],
    ["POW", [numericVariant("FloatIEEE754Pow", (left, right) => left ** right)]],
    ["POWPROD", [numericVariant("FloatIEEE754PowProd", (left, right) => left ** right)]],
    ["NEG", [numericVariant("FloatIEEE754Neg", (value) => -value, 1)]],
    ["COMPARE", [{
      name: "FloatIEEE754Compare",
      priority: 500,
      prepare: prepareFloatComparison,
      impl(args) {
        const [left, right] = args.map(numberFrom2);
        return new Integer(left < right ? -1n : left > right ? 1n : 0n);
      }
    }]],
    ["EQ", [compareVariant("FloatIEEE754Eq", (left, right) => left === right)]],
    ["NEQ", [compareVariant("FloatIEEE754Neq", (left, right) => left !== right)]],
    ["LT", [compareVariant("FloatIEEE754Lt", (left, right) => left < right)]],
    ["GT", [compareVariant("FloatIEEE754Gt", (left, right) => left > right)]],
    ["LTE", [compareVariant("FloatIEEE754Lte", (left, right) => left <= right)]],
    ["GTE", [compareVariant("FloatIEEE754Gte", (left, right) => left >= right)]],
    ["ABS", [numericVariant("FloatIEEE754Abs", Math.abs, 1)]],
    ["SIN", [numericVariant("FloatIEEE754Sin", Math.sin, 1)]],
    ["COS", [numericVariant("FloatIEEE754Cos", Math.cos, 1)]],
    ["TAN", [numericVariant("FloatIEEE754Tan", Math.tan, 1)]],
    ["ASIN", [numericVariant("FloatIEEE754Asin", Math.asin, 1)]],
    ["ACOS", [numericVariant("FloatIEEE754Acos", Math.acos, 1)]],
    ["ATAN", [numericVariant("FloatIEEE754Atan", Math.atan, 1)]],
    ["ATAN2", [numericVariant("FloatIEEE754Atan2", Math.atan2, 2)]],
    ["LOG", [numericVariant("FloatIEEE754Log", Math.log, 1)]],
    ["LN", [numericVariant("FloatIEEE754Ln", Math.log, 1)]],
    ["LOG10", [numericVariant("FloatIEEE754Log10", Math.log10, 1)]],
    ["EXP", [numericVariant("FloatIEEE754Exp", Math.exp, 1)]]
  ]);
  registerType({
    name: TYPE_NAME,
    nativeType: NATIVE_TYPE,
    defaultTraits: ["field", "ordered"],
    convertFrom: new Map([
      ["Integer", float],
      ["Rational", float],
      [NATIVE_TYPE, float]
    ]),
    convert: float,
    normalize: float,
    validate: isFloat,
    proto: () => makeProto([
      ["ToString", valueMethod("ToString", (value) => stringObj(String(value.value)))],
      ["Value", valueMethod("Value", (value) => stringObj(String(value.value)))],
      ["Sample", valueMethod("Sample", (value, [request]) => Sample(value, request))],
      ["Enclose", valueMethod("Enclose", (value, [request]) => Enclose(value, request))],
      ["Refine", valueMethod("Refine", (value, [request]) => Refine(value, request))],
      ["NumericsCapabilities", valueMethod("NumericsCapabilities", () => NumericsCapabilities())]
    ]),
    installs
  });
}
function method(name, impl) {
  return { type: "method_builtin", name, impl };
}
function installBrowserApproxMathPlugin({ systemContext, registry, metadata = {}, options = {} }) {
  registerFloatType();
  registry.registerAll(mathFunctions);
  installRegisteredTypes(registry, [TYPE_NAME], { skipMissing: true, skipExisting: true });
  const entries = new Map;
  const extension = new Map;
  const add = (name, impl) => {
    const entry2 = method(name, impl);
    entries.set(name, entry2);
    extension.set(name.toUpperCase(), entry2);
  };
  add("Float", (args, _context, evaluate) => requireFloat(args[1], evaluate));
  add("Interval", (args, _context, evaluate) => {
    const exact = exactFloatRational(requireFloat(args[1], evaluate));
    return new RationalInterval(exact, exact);
  });
  add("Round", (args, _context, evaluate) => decimalRounded(requireFloat(args[1], evaluate), decimalPlaces(args[2]), "round"));
  add("Floor", (args, _context, evaluate) => decimalRounded(requireFloat(args[1], evaluate), decimalPlaces(args[2]), "floor"));
  add("Ceiling", (args, _context, evaluate) => decimalRounded(requireFloat(args[1], evaluate), decimalPlaces(args[2]), "ceiling"));
  add("Abs", (args, _context, evaluate) => evaluate({ fn: "ABS", args: [requireFloat(args[1], evaluate)] }));
  for (const name of ["Sqrt", "Sin", "Cos", "Tan", "Asin", "Acos", "Atan", "Log", "Ln", "Log10", "Exp"]) {
    add(name, (args, _context, evaluate) => evaluate({ fn: name.toUpperCase(), args: [requireFloat(args[1], evaluate)] }));
  }
  add("Atan2", (args, _context, evaluate) => evaluate({ fn: "ATAN2", args: [requireFloat(args[1], evaluate), requireFloat(args[2], evaluate)] }));
  const value = { type: "map", entries, _ext: extension };
  systemContext.registerHostCallableValue("float", value, {
    impl(args, _context, evaluate) {
      return requireFloat(args[0], evaluate);
    }
  }, {
    doc: "Optional IEEE-754 Float conversion and approximate math",
    groups: ["ApproximateMath", "Float"]
  });
  const floatExtension = method("Float", (args, _context, evaluate) => requireFloat(args[0], evaluate));
  const owner = {
    pluginId: metadata.id || "float",
    mount: options.as || metadata.mount || "float"
  };
  systemContext.registerMethod("Integer", "Float", floatExtension, owner);
  systemContext.registerMethod("Rational", "Float", floatExtension, owner);
  return systemContext;
}
var install26 = installBrowserApproxMathPlugin;

// src/generated/bundled-plugin-catalog.js
function createBundledPluginCatalog() {
  const catalog = new PluginCatalog;
  catalog.addMetadata({ id: "algebra", description: "Polynomial algebra façade backed by the canonical pure-RiX poly service.", kind: "rix", mount: "algebra", exports: ["Polynomial", "Coefficients", "Record", "Evaluate", "Equal", "Divide", "SyntheticDivide", "Quotient", "Remainder", "IsFactor", "Grid"], groups: ["Algebra", "Exact"], permissions: [], requires: ["rix.polynomial.algorithms@1", "rix.rational-function@1"], provides: ["rix.algebra.division@1"], schemas: ["rix.algebra.division@1", "rix.polynomial.division@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:algebra" }, { source: `/**
id: algebra
description: Polynomial algebra façade backed by the canonical pure-RiX poly service.
kind: rix
mount: algebra
exports: [Polynomial, Coefficients, Record, Evaluate, Equal, Divide, SyntheticDivide, Quotient, Remainder, IsFactor, Grid]
groups: [Algebra, Exact]
permissions: []
requires: [rix.polynomial.algorithms@1, rix.rational-function@1]
provides: [rix.algebra.division@1]
schemas: [rix.algebra.division@1, rix.polynomial.division@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

AlgebraDivision(core, method, grid ?= _) -> {;
    division = {=
        valueKind = :algebraDivision,
        schema = "rix.algebra.division@1",
        method = method,
        exact = 1,
        core = core,
        identity = {=
            relation = "dividend = divisor * quotient + remainder",
            verified = core[:verified]
        },
        factor = {=
            divisorIsFactor = core[:divisorIsFactor] ?: 1 ?_ 0,
            status = core[:divisorIsFactor] ?: :exactFactor ?_ :nonzeroRemainder
        },
        grid = grid
    };
    division.__type = "PolynomialDivision";
    division._proto = {=
        Quotient = (self) -> self[:core][:quotient],
        Remainder = (self) -> self[:core][:remainder],
        IsFactor = (self) -> self[:core][:divisorIsFactor],
        Grid = (self) -> AlgebraGrid(self),
        Record = (self) -> self
    };
    .ImmutableValue(division);
};

AlgebraRequireDivision(value) -> {;
    valid = value ? :Map ?: value[:schema] == "rix.algebra.division@1" ?_ _;
    valid ?: value ?_ .Error("Expected an algebra division result");
};
AlgebraDivide(dividend, divisor) -> AlgebraDivision(.poly.Divide(dividend, divisor), :long);
AlgebraSyntheticDivide(polynomial, root) -> {;
    core = .poly.SyntheticDivide(polynomial, root);
    grid = .Algebra.SyntheticDivision(root, polynomial.Coefficients());
    AlgebraDivision(core, :synthetic, grid);
};
AlgebraGrid(division) -> {;
    value = AlgebraRequireDivision(division);
    (value[:method] == :synthetic && value[:grid] != _)
      ?: value[:grid]
      ?_ .Error("algebra.Grid requires a SyntheticDivide result");
};

algebraNamespace = {= };
algebraNamespace._proto = {=
    Polynomial = (self, source, second ?= _) -> .poly(source, second),
    Coefficients = (self, polynomial, order ?= :descending) -> polynomial.Coefficients(order),
    Record = (self, polynomial) -> polynomial.Record(),
    Evaluate = (self, polynomial, value) -> polynomial.Evaluate(value),
    Equal = (self, left, right) -> left == right,
    Divide = (self, dividend, divisor) -> AlgebraDivide(dividend, divisor),
    SyntheticDivide = (self, polynomial, root) -> AlgebraSyntheticDivide(polynomial, root),
    Quotient = (self, division) -> division.Quotient(),
    Remainder = (self, division) -> division.Remainder(),
    IsFactor = (self, dividend, candidate) -> dividend.IsFactor(candidate) ?: 1 ?_ 0,
    Grid = (self, division) -> AlgebraGrid(division)
};

.Host.RegisterValue(
    "algebra",
    algebraNamespace,
    "Polynomial algebra façade backed by .poly",
    ["Algebra", "Exact"]
);
`, sourcePath: "bundled:algebra", kind: "rix" });
  catalog.addMetadata({ id: "algebraic-real", description: "Exact real algebraic roots certified by canonical Polynomial values and Sturm isolating intervals.", kind: "rix", mount: "algebraicReal", aliases: ["ar"], exports: ["Root", "Sqrt2", "Polynomial", "Evaluate", "Derivative", "SturmSequence", "RootCount", "IsSquareFree", "Refine", "Sign", "CompareRational", "Export", "Import"], groups: ["Numerics", "Exact", "Algebra"], permissions: [], requires: ["rix.polynomial.algorithms@1", "rix.oracle@1"], provides: ["rix.algebraic-real@1", "rix.exact-sign@1", "rix.refinable@1", "rix.enclosable-real@1"], schemas: ["rix.algebraic-real@1", "rix.algebraic-real.export@1", "rix.algebraic-real.arithmetic-real@1", "rix.polynomial@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:algebraic-real" }, { source: `/**
id: algebraic-real
description: Exact real algebraic roots certified by canonical Polynomial values and Sturm isolating intervals.
kind: rix
mount: algebraicReal
aliases: [ar]
exports: [Root, Sqrt2, Polynomial, Evaluate, Derivative, SturmSequence, RootCount, IsSquareFree, Refine, Sign, CompareRational, Export, Import]
groups: [Numerics, Exact, Algebra]
permissions: []
requires: [rix.polynomial.algorithms@1, rix.oracle@1]
provides: [rix.algebraic-real@1, rix.exact-sign@1, rix.refinable@1, rix.enclosable-real@1]
schemas: [rix.algebraic-real@1, rix.algebraic-real.export@1, rix.algebraic-real.arithmetic-real@1, rix.polynomial@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

AROption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

ARRequirePositiveInteger(value, label) -> {;
    integer = value ~!: :Integer;
    integer >= 1 ?: integer ?_ .Error(@"@{label} must be a positive Integer");
};

ARScalarIsZero(value, label ?= "value") -> (value ? :Integer)
  ?: (value == 0)
  ?_ ((value ? :Rational)
       ?: (value.Numerator() == 0)
       ?_ .Error(@"Expected an exact Integer or Rational @{label}; received @{value}"));
ARSignOf(value) -> value < 0 ?: -1 ?_ value > 0 ?: 1 ?_ 0;

ARPolynomial(coefficients) -> {;
    coefficients ? :Array ?: _ ?_ .Error("Algebraic-real polynomials require an Array of coefficients");
    candidate = .poly({= coefficients=coefficients, order=:ascending, variable=:x });
    candidate.Degree() >= 1 ?: _ ?_ .Error("Algebraic-real polynomials must have positive degree");
    canonicalCoefficients = candidate.PrimitiveInteger();
    polynomial = .poly({= coefficients=canonicalCoefficients, order=:ascending, variable=:x });
    polynomial.IsSquareFree()
      ?: polynomial
      ?_ .Error("Algebraic-real defining polynomial must be square-free");
};

ARRequirePolynomial(value) -> value ? :Polynomial ?: value ?_ .Error("Expected a Polynomial value");
ARPolynomialEvaluate(polynomial, point) -> ARRequirePolynomial(polynomial).Evaluate(point ~!: :Rational);
ARRootCount(polynomial, interval) -> ARRequirePolynomial(polynomial).RootCount(interval);

ARRequireReal(value) -> {;
    valid = value ? :Map ?: value[:valueKind] == :algebraicReal ?_ _;
    valid ?: value ?_ .Error("Expected an AlgebraicReal value");
};

ARCapabilities(real) -> {=
    valueKind = :numericsCapabilities,
    schema = "rix.numerics.capabilities@1",
    backend = :algebraicReal,
    representation = :squareFreeIntegerPolynomialIsolatingInterval,
    denotation = :singleton,
    operations = [:enclose, :refine],
    evidenceLevels = [:proof],
    certified = 1,
    exactSign = 1,
    exactRationalComparison = 1,
    arbitraryRefinement = 1,
    deterministic = 1,
    minimumWidth = 0,
    maxCalls = 100000,
    maxIterations = 100000
};

ARRefinementState(real, requestedWidth, maxCalls, maxIterations) -> {;
    polynomial = real[:polynomial];
    low := real[:interval].Low();
    high := real[:interval].High();
    lowValue := polynomial.Evaluate(low);
    highValue := polynomial.Evaluate(high);
    calls := 0;
    iterations := 0;
    {@ step = 1;
       ((@high - @low) > @requestedWidth) && (@calls < @maxCalls) && (@iterations < @maxIterations);
       {;
           midpoint = (@low + @high) / 2;
           midpointValue = @polynomial.Evaluate(midpoint);
           ARScalarIsZero(midpointValue)
             ?: {;
                 @low ~= @midpoint;
                 @high ~= @midpoint;
                 @lowValue ~= 0;
                 @highValue ~= 0;
             }
             ?_ ARSignOf(@lowValue) == ARSignOf(midpointValue)
                  ?: {; @low ~= @midpoint; @lowValue ~= @midpointValue; }
                  ?_ {; @high ~= @midpoint; @highValue ~= @midpointValue; };
           @calls += 1;
           @iterations += 1;
       };
       step += 1
    };
    interval = low:high;
    {=
        interval = interval,
        width = interval.Width(),
        midpoint = interval.Midpoint(),
        lowValue = lowValue,
        highValue = highValue,
        calls = calls,
        iterations = iterations
    };
};

ARProtocolEnclosure(real, request, operation) -> {;
    exactReal = ARRequireReal(real);
    capabilities = ARCapabilities(exactReal);
    normalized = .RefinementRequest(request, operation, capabilities);
    requestedWidth = normalized[:absoluteWidth];
    maxCalls = normalized[:work][:maxCalls];
    maxIterations = normalized[:work][:maxIterations];
    state = ARRefinementState(exactReal, requestedWidth, maxCalls, maxIterations);
    goalMet = state[:width] <= requestedWidth;
    status = goalMet ?: :enclosed ?_ :budgetExhausted;
    approximation = .CertifiedApproximation(state[:midpoint], state[:interval], {=
        reason = status,
        requested = requestedWidth,
        achieved = state[:width],
        provider = :algebraicReal
    });
    {=
        valueKind = :enclosure,
        schema = "rix.numerics.enclosure@1",
        status = status,
        interval = state[:interval],
        certified = 1,
        goalMet = goalMet,
        requestedWidth = requestedWidth,
        achievedWidth = state[:width],
        approximation = approximation,
        evidenceLevel = :proof,
        backend = :algebraicReal,
        operation = normalized[:operation],
        trace = [{=
            interval=state[:interval],
            lowValue=state[:lowValue],
            highValue=state[:highValue],
            rootCount=1
        }],
        work = {=
            calls=state[:calls],
            iterations=state[:iterations],
            maxCalls=maxCalls,
            maxIterations=maxIterations,
            exhausted=!goalMet
        },
        diagnostics = goalMet ?: [] ?_ [:maxCallsReached],
        evidence = {=
            kind=:sturmIsolationWithSignBisection,
            property=:containment,
            polynomial=exactReal[:coefficients],
            rootIndex=exactReal[:rootIndex],
            rootCount=1
        },
        source = {=
            plugin=:algebraicReal,
            schema=exactReal[:schema],
            rootIndex=exactReal[:rootIndex]
        }
    };
};

ARExactSign(real) -> {;
    exactReal = ARRequireReal(real);
    interval = exactReal[:interval];
    interval.High() <= 0
      ?: :negative
      ?_ interval.Low() >= 0
           ?: :positive
           ?_ {;
               atZero = @exactReal[:polynomial].Evaluate(0);
               ARScalarIsZero(atZero)
                 ?: :zero
                 ?_ @exactReal[:polynomial].RootCount(@interval.Low():0) == 1
                      ?: :negative
                      ?_ :positive;
           };
};

ARCompareRational(real, value) -> {;
    exactReal = ARRequireReal(real);
    rational = value ~!: :Rational;
    interval = exactReal[:interval];
    polynomialValue = exactReal[:polynomial].Evaluate(rational);
    exactMatch = ARScalarIsZero(polynomialValue) ?: interval.ContainsValue(rational) ?_ _;
    exactMatch
      ?: :equal
      ?_ {;
          @rational <= @interval.Low()
            ?: :greater
            ?_ @rational >= @interval.High()
                 ?: :less
                 ?_ @exactReal[:polynomial].RootCount(@interval.Low():@rational) == 1
                      ?: :less
                      ?_ :greater;
      };
};

ARExport(real) -> {;
    exactReal = ARRequireReal(real);
    {=
        valueKind = :algebraicRealExport,
        schema = "rix.algebraic-real.export@1",
        version = 1,
        coefficients = exactReal[:coefficients],
        interval = exactReal[:interval],
        rootIndex = exactReal[:rootIndex],
        name = exactReal[:name],
        evidence = exactReal[:evidence]
    };
};

ARRecord(real) -> {;
    exactReal = ARRequireReal(real);
    {=
        valueKind = :algebraicReal,
        schema = exactReal[:schema],
        polynomial = exactReal[:polynomial],
        coefficients = exactReal[:coefficients],
        interval = exactReal[:interval],
        rootIndex = exactReal[:rootIndex],
        name = exactReal[:name],
        evidence = exactReal[:evidence],
        certified = 1
    };
};

ARAttachProtocol(real) -> {;
    real._proto = {=
        Polynomial = (self) -> self[:polynomial],
        Coefficients = (self) -> self[:coefficients],
        Interval = (self) -> self[:interval],
        RootIndex = (self) -> self[:rootIndex],
        EvaluatePolynomial = (self, point) -> self[:polynomial].Evaluate(point),
        RootCount = (self, interval) -> self[:polynomial].RootCount(interval),
        Sign = (self) -> ARExactSign(self),
        CompareRational = (self, value) -> ARCompareRational(self, value),
        Record = (self) -> ARRecord(self),
        Export = (self) -> ARExport(self),
        Enclose = (self, request ?= {= }) -> ARProtocolEnclosure(self, request, :enclose),
        Refine = (self, request ?= {= }) -> ARProtocolEnclosure(self, request, :refine),
        NumericsCapabilities = (self) -> ARCapabilities(self)
    };
    .ImmutableValue(real);
};

ARRoot(coefficients, interval, rootIndex ?= 1, options ?= {= }) -> {;
    polynomial = ARPolynomial(coefficients);
    canonical = polynomial.AscendingCoefficients();
    exactInterval = interval ~!: :RationalInterval;
    low = exactInterval.Low();
    high = exactInterval.High();
    low < high ?: _ ?_ .Error("Algebraic-real isolating interval must have increasing endpoints");
    lowValue = polynomial.Evaluate(low);
    highValue = polynomial.Evaluate(high);
    lowIsRoot = ARScalarIsZero(lowValue, "low endpoint evaluation");
    highIsRoot = ARScalarIsZero(highValue, "high endpoint evaluation");
    endpointRoot = lowIsRoot || highIsRoot;
    endpointRoot
      ?: .Error("Algebraic-real isolating endpoints cannot be roots")
      ?_ _;
    sturmSequence = polynomial.SturmSequence();
    isolatedCount = polynomial.RootCount(exactInterval);
    isolatedCount == 1
      ?: _
      ?_ .Error(@"Algebraic-real interval must isolate exactly one distinct real root; found @{isolatedCount}");
    index = ARRequirePositiveInteger(rootIndex, "Algebraic-real root index");
    bound = polynomial.RootBound();
    leftBoundary = low <= -bound ?: low - 1 ?_ -bound;
    computedIndex = polynomial.RootCount(leftBoundary:low) + 1;
    index == computedIndex
      ?: _
      ?_ .Error(@"Algebraic-real root index @{index} does not match certified index @{computedIndex}");
    evidence = {=
        kind = :sturmIsolation,
        property = :uniqueRealRoot,
        squareFree = 1,
        rootCount = isolatedCount,
        rootIndex = computedIndex,
        cauchyBound = bound,
        endpointSigns = [ARSignOf(lowValue), ARSignOf(highValue)],
        sturmLength = sturmSequence.Len(),
        provenance = AROption(options, "evidence", _)
    };
    real = {=
        valueKind = :algebraicReal,
        schema = "rix.algebraic-real@1",
        name = AROption(options, "name", :root),
        polynomial = polynomial,
        coefficients = canonical,
        interval = exactInterval,
        rootIndex = computedIndex,
        sturmSequence = sturmSequence,
        evidence = evidence,
        certified = 1
    };
    ARAttachProtocol(real);
};

ARSqrt2(sign ?= 1) -> {;
    direction = sign ~!: :Integer;
    direction == 1
      ?: ARRoot([-2, 0, 1], 1:2, 2, {=
          name=:sqrt2,
          evidence={= kind=:definingEquation, equation="x^2 - 2 = 0", branch=:positive }
      })
      ?_ direction == -1
           ?: ARRoot([-2, 0, 1], -2:-1, 1, {=
               name=:negativeSqrt2,
               evidence={= kind=:definingEquation, equation="x^2 - 2 = 0", branch=:negative }
           })
           ?_ .Error("Algebraic-real Sqrt2 sign must be 1 or -1");
};

ARImport(record) -> {;
    valid = record ? :Map ?: record[:schema] == "rix.algebraic-real.export@1" ?_ _;
    valid ?: _ ?_ .Error("Expected an algebraic-real export record");
    record[:version] == 1 ?: _ ?_ .Error("Unsupported algebraic-real export version");
    ARRoot(record[:coefficients], record[:interval], record[:rootIndex], {=
        name=record[:name],
        evidence=record[:evidence]
    });
};

ARFamily(value) -> (value ? :Map) &&
  (value[:valueKind] == :algebraicReal || value[:valueKind] == :algebraicRealArithmeticReal);
ARExact(value) -> (value ? :Integer) || (value ? :Rational);
ARArithmeticPair(left, right) ->
  (ARFamily(left) || ARFamily(right)) &&
  (ARFamily(left) || ARExact(left)) &&
  (ARFamily(right) || ARExact(right));

ARArithmeticCapabilities(real) -> {=
    valueKind=:numericsCapabilities,
    schema="rix.numerics.capabilities@1",
    backend=:algebraicReal,
    representation=:oracleBackedAlgebraicArithmetic,
    denotation=:singleton,
    operations=[:enclose, :refine],
    evidenceLevels=[:constructorGuarantee, :proof],
    certified=1,
    arbitraryRefinement=1,
    deterministic=1,
    minimumWidth=0,
    maxCalls=100000,
    maxIterations=100000
};

ARArithmetic(operation, left, right ?= _) -> {;
    unary = operation == :neg || operation == :abs;
    recipe = unary ?: .oracle.Operation(operation, left) ?_ .oracle.Operation(operation, left, right);
    real = {=
        valueKind=:algebraicRealArithmeticReal,
        schema="rix.algebraic-real.arithmetic-real@1",
        kind=:arithmetic,
        operation=operation,
        recipe=recipe,
        provenance={= plugin=:algebraicReal, version=2, source=:arithmeticRecipe }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->self[:recipe].Enclose(request),
        Refine=(self, request ?= {= })->self[:recipe].Refine(request),
        NumericsCapabilities=(self)->ARArithmeticCapabilities(self),
        Record=(self)->{= valueKind=self[:valueKind], schema=self[:schema], operation=self[:operation], certified=1 }
    };
    .ImmutableValue(real ~!: :AlgebraicReal);
};

.TypeKnown(:AlgebraicReal) ?: _ ?_ .TypeRegister({=
    name=:AlgebraicReal,
    nativeType=:map,
    defaultTraits=[:number, :ordered],
    convertFrom={= map=(x) ?- [ARFamily(x)] -> x },
    validate=(x)->ARFamily(x),
    proto={=
        Enclose=(self,request ?= {= })->self[:kind] == :arithmetic ?: self[:recipe].Enclose(request) ?_ ARProtocolEnclosure(self,request,:enclose),
        Refine=(self,request ?= {= })->self[:kind] == :arithmetic ?: self[:recipe].Refine(request) ?_ ARProtocolEnclosure(self,request,:refine),
        NumericsCapabilities=(self)->self[:kind] == :arithmetic ?: ARArithmeticCapabilities(self) ?_ ARCapabilities(self)
    },
    installs={=
        ADD=[{= name=:ARAdd, priority=300, prep=(x,y)->ARArithmeticPair(x,y), impl=(x,y)->ARArithmetic(:add,x,y) }],
        SUB=[{= name=:ARSub, priority=300, prep=(x,y)->ARArithmeticPair(x,y), impl=(x,y)->ARArithmetic(:sub,x,y) }],
        MUL=[{= name=:ARMul, priority=300, prep=(x,y)->ARArithmeticPair(x,y), impl=(x,y)->ARArithmetic(:mul,x,y) }],
        DIV=[{= name=:ARDiv, priority=300, prep=(x,y)->ARArithmeticPair(x,y), impl=(x,y)->ARArithmetic(:div,x,y) }],
        POW=[{= name=:ARPow, priority=300, prep=(x,y)->ARFamily(x)&&(y ? :Integer), impl=(x,y)->ARArithmetic(:pow,x,y) }],
        NEG=[{= name=:ARNeg, priority=300, prep=(x)->ARFamily(x), impl=(x)->ARArithmetic(:neg,x) }],
        ABS=[{= name=:ARAbs, priority=300, prep=(x)->ARFamily(x), impl=(x)->ARArithmetic(:abs,x) }]
    }
});

.TypeInstall(:AlgebraicReal);

ARConstruct(coefficients, interval, rootIndex ?= 1, options ?= {= }) ->
    ARRoot(coefficients, interval, rootIndex, options);

algebraicRealNamespace = (coefficients, interval, rootIndex ?= 1, options ?= {= }) ->
    ARConstruct(coefficients, interval, rootIndex, options);
algebraicRealNamespace._proto = {=
    Root = (self, coefficients, interval, rootIndex ?= 1, options ?= {= }) -> ARRoot(coefficients, interval, rootIndex, options),
    Sqrt2 = (self, sign ?= 1) -> ARSqrt2(sign),
    Polynomial = (self, coefficients) -> ARPolynomial(coefficients),
    Evaluate = (self, coefficients, point) -> ARPolynomial(coefficients).Evaluate(point),
    Derivative = (self, coefficients) -> ARPolynomial(coefficients).Derivative(),
    SturmSequence = (self, coefficients) -> ARPolynomial(coefficients).SturmSequence(),
    RootCount = (self, coefficients, interval) -> ARPolynomial(coefficients).RootCount(interval),
    IsSquareFree = (self, coefficients) -> {; candidate=.poly({= coefficients=coefficients, order=:ascending, variable=:x }); candidate.IsSquareFree(); },
    Refine = (self, real, request ?= {= }) -> ARProtocolEnclosure(real, request, :refine),
    Sign = (self, real) -> ARExactSign(real),
    CompareRational = (self, real, value) -> ARCompareRational(real, value),
    Export = (self, real) -> ARExport(real),
    Import = (self, record) -> ARImport(record)
};

.Host.RegisterCallableValue(
    "algebraicReal",
    algebraicRealNamespace,
    "Exact real algebraic roots certified by canonical Polynomial values and Sturm isolating intervals",
    ["Numerics", "Exact", "Algebra"]
);
`, sourcePath: "bundled:algebraic-real", kind: "rix" });
  catalog.addMetadata({ id: "ball", description: "Certified rational midpoint-radius balls and nested square-root refinement.", kind: "rix", mount: "ball", exports: ["Ball", "Interval", "Sqrt", "Midpoint", "Radius", "Lower", "Upper", "Contains", "RoundOut", "Record"], groups: ["Numerics", "Exact"], permissions: [], requires: ["rix.oracle@1"], provides: ["rix.ball@1", "rix.enclosable-real@1"], schemas: ["rix.ball@1", "rix.ball.nested-real@1", "rix.ball.arithmetic-real@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:ball" }, { source: `/**
id: ball
description: Certified rational midpoint-radius balls and nested square-root refinement.
kind: rix
mount: ball
exports: [Ball, Interval, Sqrt, Midpoint, Radius, Lower, Upper, Contains, RoundOut, Record]
groups: [Numerics, Exact]
permissions: []
requires: [rix.oracle@1]
provides: [rix.ball@1, rix.enclosable-real@1]
schemas: [rix.ball@1, rix.ball.nested-real@1, rix.ball.arithmetic-real@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

BallRequireRational(value, label) -> value ~!: :Rational;

BallRequireNonnegativeInteger(value, label) -> {;
    integer = value ~!: :Integer;
    integer >= 0 ?: integer ?_ .Error(@"@{label} must be a nonnegative Integer");
};

BallRaw(midpoint, radius ?= 0) -> {;
    exactMidpoint = BallRequireRational(midpoint, "Ball midpoint");
    exactRadius = BallRequireRational(radius, "Ball radius");
    exactRadius >= 0 ?: _ ?_ .Error("Ball radius must be nonnegative");
    {=
        valueKind = :ball,
        schema = "rix.ball@1",
        midpoint = exactMidpoint,
        radius = exactRadius,
        interval = (exactMidpoint - exactRadius):(exactMidpoint + exactRadius)
    };
};

BallConstruct(midpoint, radius ?= 0) -> {;
    ball = BallRaw(midpoint, radius) ~!: :Ball;
    .ImmutableValue(ball);
};

BallRequire(value) -> value ? :Ball ?: value ?_ .Error("Expected a Ball value");

BallPromote(value) -> value ? :Ball ?: value ?_ BallConstruct(value, 0);

BallFromInterval(interval) -> {;
    exactInterval = interval ~!: :RationalInterval;
    BallConstruct(exactInterval.Midpoint(), exactInterval.Width() / 2);
};

BallContains(ball, candidate) -> {;
    exactBall = BallRequire(ball);
    candidate ? :Ball
      ?: exactBall[:interval].Contains(candidate[:interval])
      ?_ exactBall[:interval].ContainsValue(BallRequireRational(candidate, "Ball containment candidate"));
};

BallRoundOut(ball, bits ?= 53) -> {;
    exactBall = BallRequire(ball);
    precision = BallRequireNonnegativeInteger(bits, "Ball dyadic precision");
    precision <= 100000 ?: _ ?_ .Error("Ball dyadic precision must not exceed 100000 bits");
    scale = 2^precision;
    low = (exactBall[:interval].Low() * scale).Floor() / scale;
    high = (exactBall[:interval].High() * scale).Ceil() / scale;
    BallFromInterval(low:high);
};

BallRecord(ball) -> {;
    exactBall = BallRequire(ball);
    {=
        valueKind = :ball,
        schema = "rix.ball@1",
        midpoint = exactBall[:midpoint],
        radius = exactBall[:radius],
        interval = exactBall[:interval],
        lower = exactBall[:interval].Low(),
        upper = exactBall[:interval].High(),
        certified = 1
    };
};

BallIntegerSqrtFloor(value) -> {;
    n = BallRequireNonnegativeInteger(value, "Integer square root argument");
    n < 2 ?: n ?_ {;
        x := @n;
        next := (x + 1) // 2;
        {@ step = 1; @next < @x; {;
            @x ~= @next;
            @next ~= (@x + (@n // @x)) // 2;
        }; step += 1 };
        x;
    };
};

BallExactSqrt(value) -> {;
    numeratorRoot = BallIntegerSqrtFloor(value.Numerator());
    denominatorRoot = BallIntegerSqrtFloor(value.Denominator());
    exact = numeratorRoot^2 == value.Numerator() && denominatorRoot^2 == value.Denominator();
    exact ?: numeratorRoot / denominatorRoot ?_ _;
};

BallInitialSqrt(value) -> {;
    value >= 0 ?: _ ?_ .Error("Ball square root requires a nonnegative exact value");
    exact = BallExactSqrt(value);
    exact ?: BallConstruct(exact, 0) ?_ BallFromInterval(0:(value > 1 ?: value ?_ 1));
};

BallNestedRecord(real) -> {=
    valueKind = :nestedBallReal,
    schema = "rix.ball.nested-real@1",
    recipe = real[:kind],
    parameter = real[:parameter],
    initialBall = real[:initialBall],
    certified = 1
};

BallCapabilities(real) -> {;
    nested = real[:valueKind] == :nestedBallReal;
    {=
        valueKind = :numericsCapabilities,
        schema = "rix.numerics.capabilities@1",
        backend = :ball,
        representation = nested ?: :nestedRationalBalls ?_ :rationalMidpointRadius,
        denotation = nested ?: :singleton ?_ :set,
        operations = [:enclose, :refine],
        evidenceLevels = [:proof],
        certified = 1,
        arbitraryRefinement = nested,
        deterministic = 1,
        minimumWidth = 0,
        maxCalls = nested ?: 100000 ?_ 0,
        maxIterations = nested ?: 100000 ?_ 0
    };
};

BallSqrtState(real, callLimit, requestedWidth ?= _) -> {;
    low = real[:initialBall][:interval].Low();
    high = real[:initialBall][:interval].High();
    calls = 0;
    {@ step = 1;
       @calls < @callLimit && @high - @low > 0 && (@requestedWidth == _ || @high - @low > @requestedWidth);
       {;
           midpoint = (@low + @high) / 2;
           midpoint^2 <= @real[:parameter]
             ?: {; @low ~= @midpoint; }
             ?_ {; @high ~= @midpoint; };
           @calls += 1;
       };
       step += 1
    };
    {= ball=BallFromInterval(low:high), calls=calls };
};

BallAt(real, iterations ?= 0) -> {;
    calls = BallRequireNonnegativeInteger(iterations, "Nested Ball iteration count");
    BallSqrtState(real, calls)[:ball];
};

BallProtocolEnclosure(subject, request, operation) -> {;
    capabilities = BallCapabilities(subject);
    normalized = .RefinementRequest(request, operation, capabilities);
    requestedWidth = normalized[:absoluteWidth];
    maxCalls = normalized[:work][:maxCalls];
    nested = subject[:valueKind] == :nestedBallReal;
    state = nested
      ?: BallSqrtState(subject, maxCalls, requestedWidth)
      ?_ {= ball=BallRequire(subject), calls=0 };
    selected = state[:ball];
    interval = selected[:interval];
    achievedWidth = interval.Width();
    goalMet = achievedWidth <= requestedWidth;
    status = goalMet ?: :enclosed ?_ nested ?: :budgetExhausted ?_ :resolutionFloor;
    approximation = .CertifiedApproximation(selected[:midpoint], interval, {=
        reason = status,
        requested = requestedWidth,
        achieved = achievedWidth,
        provider = :ball
    });
    {=
        valueKind = :enclosure,
        schema = "rix.numerics.enclosure@1",
        status = status,
        interval = interval,
        certified = 1,
        goalMet = goalMet,
        requestedWidth = requestedWidth,
        achievedWidth = achievedWidth,
        approximation = approximation,
        evidenceLevel = :proof,
        backend = :ball,
        operation = normalized[:operation],
        trace = [],
        work = {=
            calls = state[:calls],
            iterations = state[:calls],
            maxCalls = maxCalls,
            exhausted = !goalMet && nested
        },
        diagnostics = status == :budgetExhausted
          ?: [:maxCallsReached]
          ?_ status == :resolutionFloor ?: [:finiteBallCannotRefine] ?_ [],
        evidence = {=
            kind = nested ?: :nestedBisection ?_ :exactEndpoints,
            property = :containment,
            subject = nested ?: subject[:parameter] ?_ subject[:interval]
        },
        source = {=
            plugin = :ball,
            schema = nested ?: "rix.ball.nested-real@1" ?_ "rix.ball@1",
            recipe = nested ?: subject[:kind] ?_ :finite
        }
    };
};

BallSqrt(value) -> {;
    radicand = BallRequireRational(value, "Ball square-root argument");
    initial = BallInitialSqrt(radicand);
    real = {=
        valueKind = :nestedBallReal,
        schema = "rix.ball.nested-real@1",
        kind = :sqrt,
        parameter = radicand,
        initialBall = initial
    };
    real._proto = {=
        Ball = (self, iterations ?= 0) -> BallAt(self, iterations),
        InitialBall = (self) -> self[:initialBall],
        Record = (self) -> BallNestedRecord(self),
        Enclose = (self, request ?= {= }) -> BallProtocolEnclosure(self, request, :enclose),
        Refine = (self, request ?= {= }) -> BallProtocolEnclosure(self, request, :refine),
        NumericsCapabilities = (self) -> BallCapabilities(self)
    };
    .ImmutableValue(real);
};

NestedBallFamily(value) -> (value ? :Map) &&
  (value[:valueKind] == :nestedBallReal || value[:valueKind] == :nestedBallArithmeticReal);
NestedBallExact(value) -> (value ? :Integer) || (value ? :Rational);
NestedBallArithmeticPair(left, right) ->
  (NestedBallFamily(left) || NestedBallFamily(right)) &&
  (NestedBallFamily(left) || NestedBallExact(left)) &&
  (NestedBallFamily(right) || NestedBallExact(right));

NestedBallArithmeticCapabilities(real) -> {=
    valueKind=:numericsCapabilities,
    schema="rix.numerics.capabilities@1",
    backend=:ball,
    representation=:oracleBackedNestedBallArithmetic,
    denotation=:singleton,
    operations=[:enclose, :refine],
    evidenceLevels=[:constructorGuarantee, :proof],
    certified=1,
    arbitraryRefinement=1,
    deterministic=1,
    minimumWidth=0,
    maxCalls=100000,
    maxIterations=100000
};

NestedBallArithmetic(operation, left, right ?= _) -> {;
    unary = operation == :neg || operation == :abs;
    recipe = unary ?: .oracle.Operation(operation, left) ?_ .oracle.Operation(operation, left, right);
    real = {=
        valueKind=:nestedBallArithmeticReal,
        schema="rix.ball.arithmetic-real@1",
        kind=:arithmetic,
        operation=operation,
        recipe=recipe,
        provenance={= plugin=:ball, version=2, source=:arithmeticRecipe }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->self[:recipe].Enclose(request),
        Refine=(self, request ?= {= })->self[:recipe].Refine(request),
        NumericsCapabilities=(self)->NestedBallArithmeticCapabilities(self),
        Record=(self)->{= valueKind=self[:valueKind], schema=self[:schema], operation=self[:operation], certified=1 }
    };
    .ImmutableValue(real ~!: :NestedBallReal);
};

.TypeKnown(:NestedBallReal) ?: _ ?_ .TypeRegister({=
    name=:NestedBallReal,
    nativeType=:map,
    defaultTraits=[:number, :ordered],
    convertFrom={= map=(x) ?- [NestedBallFamily(x)] -> x },
    validate=(x)->NestedBallFamily(x),
    proto={=
        Enclose=(self,request ?= {= })->self[:kind] == :arithmetic ?: self[:recipe].Enclose(request) ?_ BallProtocolEnclosure(self,request,:enclose),
        Refine=(self,request ?= {= })->self[:kind] == :arithmetic ?: self[:recipe].Refine(request) ?_ BallProtocolEnclosure(self,request,:refine),
        NumericsCapabilities=(self)->self[:kind] == :arithmetic ?: NestedBallArithmeticCapabilities(self) ?_ BallCapabilities(self)
    },
    installs={=
        ADD=[{= name=:NestedBallAdd, priority=300, prep=(x,y)->NestedBallArithmeticPair(x,y), impl=(x,y)->NestedBallArithmetic(:add,x,y) }],
        SUB=[{= name=:NestedBallSub, priority=300, prep=(x,y)->NestedBallArithmeticPair(x,y), impl=(x,y)->NestedBallArithmetic(:sub,x,y) }],
        MUL=[{= name=:NestedBallMul, priority=300, prep=(x,y)->NestedBallArithmeticPair(x,y), impl=(x,y)->NestedBallArithmetic(:mul,x,y) }],
        DIV=[{= name=:NestedBallDiv, priority=300, prep=(x,y)->NestedBallArithmeticPair(x,y), impl=(x,y)->NestedBallArithmetic(:div,x,y) }],
        POW=[{= name=:NestedBallPow, priority=300, prep=(x,y)->NestedBallFamily(x)&&(y ? :Integer), impl=(x,y)->NestedBallArithmetic(:pow,x,y) }],
        NEG=[{= name=:NestedBallNeg, priority=300, prep=(x)->NestedBallFamily(x), impl=(x)->NestedBallArithmetic(:neg,x) }],
        ABS=[{= name=:NestedBallAbs, priority=300, prep=(x)->NestedBallFamily(x), impl=(x)->NestedBallArithmetic(:abs,x) }]
    }
});

.TypeInstall(:NestedBallReal);

BallAdd(left, right) -> BallFromInterval(BallPromote(left)[:interval] + BallPromote(right)[:interval]);
BallSub(left, right) -> BallFromInterval(BallPromote(left)[:interval] - BallPromote(right)[:interval]);
BallMul(left, right) -> BallFromInterval(BallPromote(left)[:interval] * BallPromote(right)[:interval]);
BallDiv(left, right) -> {;
    divisor = BallPromote(right);
    divisor[:interval].ContainsZero() ?: .Error("Cannot divide by a Ball containing zero")
                                        ?_ BallFromInterval(BallPromote(left)[:interval] / divisor[:interval]);
};
BallNeg(value) -> BallConstruct(-value[:midpoint], value[:radius]);
BallEq(left, right) -> {;
    a = BallPromote(left);
    b = BallPromote(right);
    a[:midpoint] == b[:midpoint] && a[:radius] == b[:radius];
};

.TypeKnown(:Ball) ?: _ ?_ .TypeRegister({=
    name = :Ball,
    nativeType = :map,
    defaultTraits = [:number, :enclosed],
    convertFrom = {=
        map = (x) ?- [x[:valueKind] == :ball] -> x
    },
    validate = (x) -> x[:valueKind] == :ball && x[:radius] >= 0,
    proto = {=
        Midpoint = (self) -> self[:midpoint],
        Radius = (self) -> self[:radius],
        Interval = (self) -> self[:interval],
        Lower = (self) -> self[:interval].Low(),
        Upper = (self) -> self[:interval].High(),
        Contains = (self, candidate) -> BallContains(self, candidate),
        RoundOut = (self, bits ?= 53) -> BallRoundOut(self, bits),
        Record = (self) -> BallRecord(self),
        Enclose = (self, request ?= {= }) -> BallProtocolEnclosure(self, request, :enclose),
        Refine = (self, request ?= {= }) -> BallProtocolEnclosure(self, request, :refine),
        NumericsCapabilities = (self) -> BallCapabilities(self)
    },
    installs = {=
        ADD = [{= name=:BallAdd, priority=400, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallAdd(x, y) }],
        SUB = [{= name=:BallSub, priority=400, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallSub(x, y) }],
        MUL = [{= name=:BallMul, priority=400, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallMul(x, y) }],
        DIV = [{= name=:BallDiv, priority=400, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallDiv(x, y) }],
        NEG = [{= name=:BallNeg, priority=400, prep=(x) -> x ? :Ball, impl=(x) -> BallNeg(x) }],
        EQ = [{= name=:BallEq, priority=400, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallEq(x, y) }],
        NEQ = [{= name=:BallNeq, priority=400, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> !BallEq(x, y) }]
    }
});

.TypeInstall(:Ball);

ballNamespace = (midpoint, radius ?= 0) -> BallConstruct(midpoint, radius);
ballNamespace._proto = {=
    Ball = (self, midpoint, radius ?= 0) -> BallConstruct(midpoint, radius),
    Interval = (self, low, high) -> BallFromInterval((BallRequireRational(low, "Ball lower endpoint")):(BallRequireRational(high, "Ball upper endpoint"))),
    Sqrt = (self, value) -> BallSqrt(value),
    Midpoint = (self, ball) -> BallRequire(ball)[:midpoint],
    Radius = (self, ball) -> BallRequire(ball)[:radius],
    Lower = (self, ball) -> BallRequire(ball)[:interval].Low(),
    Upper = (self, ball) -> BallRequire(ball)[:interval].High(),
    Contains = (self, ball, candidate) -> BallContains(ball, candidate),
    RoundOut = (self, ball, bits ?= 53) -> BallRoundOut(ball, bits),
    Record = (self, value) -> value[:valueKind] == :ball ?: BallRecord(value) ?_ BallNestedRecord(value)
};

.Host.RegisterCallableValue(
    "ball",
    ballNamespace,
    "Certified rational midpoint-radius balls and nested square-root refinement",
    ["Numerics", "Exact"]
);
`, sourcePath: "bundled:ball", kind: "rix" });
  catalog.addMetadata({ id: "canvas", description: "Serializable Canvas 2D drawing plans for core Graphics scenes.", kind: "host", mount: "canvas", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.canvas@1"], targets: ["canvas", "application/vnd.rix.canvas+json"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:canvas" }, { sourcePath: "bundled:canvas", kind: "host" });
  catalog.registerInstaller("canvas", install14);
  catalog.addMetadata({ id: "cauchy", description: "Rational Cauchy sequences with explicit certified tail bounds and moduli.", kind: "rix", mount: "cauchy", exports: ["Sequence", "Certified", "Geometric", "Term", "TailBound", "Modulus", "Enclosure", "Record"], groups: ["Numerics", "Exact"], permissions: [], requires: ["rix.oracle@1"], provides: ["rix.cauchy@1", "rix.refinable@1", "rix.enclosable-real@1"], schemas: ["rix.cauchy.sequence@1", "rix.cauchy.real@1", "rix.cauchy.arithmetic-real@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:cauchy" }, { source: `/**
id: cauchy
description: Rational Cauchy sequences with explicit certified tail bounds and moduli.
kind: rix
mount: cauchy
exports: [Sequence, Certified, Geometric, Term, TailBound, Modulus, Enclosure, Record]
groups: [Numerics, Exact]
permissions: []
requires: [rix.oracle@1]
provides: [rix.cauchy@1, rix.refinable@1, rix.enclosable-real@1]
schemas: [rix.cauchy.sequence@1, rix.cauchy.real@1, rix.cauchy.arithmetic-real@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

CauchyOption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

CauchyRequireRational(value, label) -> value ~!: :Rational;

CauchyRequirePositive(value, label) -> {;
    rational = CauchyRequireRational(value, label);
    rational > 0 ?: rational ?_ .Error(@"@{label} must be positive");
};

CauchyRequireNonnegative(value, label) -> {;
    rational = CauchyRequireRational(value, label);
    rational >= 0 ?: rational ?_ .Error(@"@{label} must be nonnegative");
};

CauchyRequireIndex(value, label) -> {;
    integer = value ~!: :Integer;
    integer >= 0 ?: integer ?_ .Error(@"@{label} must be a nonnegative Integer");
};

CauchyWitness(term, tailBound, index) -> {;
    exactTerm = CauchyRequireRational(term, @"Cauchy term @{index}");
    exactTail = CauchyRequireNonnegative(tailBound, @"Cauchy tail bound @{index}");
    interval = (exactTerm - exactTail):(exactTerm + exactTail);
    {=
        index = index,
        term = exactTerm,
        tailBound = exactTail,
        interval = interval,
        width = interval.Width()
    };
};

CauchyTermAt(real, index) -> {;
    n = CauchyRequireIndex(index, "Cauchy term index");
    real[:kind] == :geometric
      ?: CauchyGeometricTerm(real, n)
      ?_ CauchyRequireRational(real[:termFunction](n), @"Cauchy term @{n}");
};

CauchyTailBoundAt(real, index) -> {;
    n = CauchyRequireIndex(index, "Cauchy tail-bound index");
    real[:kind] == :geometric
      ?: CauchyGeometricTailBound(real, n)
      ?_ CauchyRequireNonnegative(real[:tailFunction](n), @"Cauchy tail bound @{n}");
};

CauchyWitnessAt(real, index) -> CauchyWitness(
    CauchyTermAt(real, index),
    CauchyTailBoundAt(real, index),
    index
);

CauchyGeometricTerm(real, index) ->
    real[:first] * (1 - real[:ratio]^(index + 1)) / (1 - real[:ratio]);

CauchyGeometricTailBound(real, index) -> {;
    magnitude = real[:ratio].Abs();
    real[:first].Abs() * magnitude^(index + 1) / (1 - magnitude);
};

CauchyGeometricModulus(real, radius) -> {;
    requestedRadius = CauchyRequirePositive(radius, "Cauchy modulus radius");
    index = 0;
    bound = CauchyGeometricTailBound(real, index);
    {@ step = 1; @bound > @requestedRadius && @index < 100000; {;
        @index += 1;
        @bound = CauchyGeometricTailBound(@real, @index);
    }; step += 1 };
    bound <= requestedRadius ?: index
      ?_ .Error("Cauchy modulus exceeds the provider index limit");
};

CauchyModulusAt(real, radius) -> {;
    requestedRadius = CauchyRequirePositive(radius, "Cauchy modulus radius");
    index = real[:kind] == :geometric
      ?: CauchyGeometricModulus(real, requestedRadius)
      ?_ CauchyRequireIndex(real[:modulusFunction](requestedRadius), "Cauchy modulus result");
    witness = CauchyWitnessAt(real, index);
    witness[:tailBound] <= requestedRadius ?: index
      ?_ .Error(@"Cauchy modulus certificate failed at index @{index}: tail bound @{witness[:tailBound]} exceeds @{requestedRadius}");
};

CauchyCapabilities(real) -> {;
    certified = real[:kind] != :bare;
    evidenceLevels = real[:kind] == :geometric
      ?: [:proof]
      ?_ (real[:kind] == :declared ?: [:constructorGuarantee] ?_ []);
    {=
        valueKind = :numericsCapabilities,
        schema = "rix.numerics.capabilities@1",
        backend = :cauchy,
        representation = certified ?: :rationalSequenceWithTailModulus ?_ :bareRationalSequence,
        denotation = certified ?: :singleton ?_ :sequence,
        operations = certified ?: [:enclose, :refine] ?_ [],
        evidenceLevels = evidenceLevels,
        certified = certified,
        arbitraryRefinement = certified,
        deterministic = 1,
        minimumWidth = 0,
        maxCalls = certified ?: 100000 ?_ 0,
        maxIterations = certified ?: 100000 ?_ 0
    };
};

CauchyBareRecord(real) -> {=
    valueKind = :cauchySequence,
    schema = "rix.cauchy.sequence@1",
    name = real[:name],
    certified = _,
    tailModulus = _
};

CauchyCertifiedRecord(real) -> {;
    record = {=
        valueKind = :cauchyReal,
        schema = "rix.cauchy.real@1",
        name = real[:name],
        kind = real[:kind],
        certified = 1,
        initialWitness = real[:initialWitness],
        evidence = real[:evidence]
    };
    real[:kind] == :geometric ?: {;
        @record["first"] = @real[:first];
        @record["ratio"] = @real[:ratio];
    } ?_ _;
    record;
};

CauchyRecord(real) -> real[:kind] == :bare ?: CauchyBareRecord(real) ?_ CauchyCertifiedRecord(real);

CauchyUnsupported(real, request, operation) -> .RefinementUnsupported(
    .RefinementRequest(request, operation, CauchyCapabilities(real)),
    CauchyCapabilities(real),
    :missingCertifiedTailModulus
);

CauchyAttachBareProtocol(real) -> {;
    real._proto = {=
        Term = (self, index) -> CauchyTermAt(self, index),
        Record = (self) -> CauchyRecord(self),
        NumericsCapabilities = (self) -> CauchyCapabilities(self),
        Enclose = (self, request ?= {= }) -> CauchyUnsupported(self, request, :enclose),
        Refine = (self, request ?= {= }) -> CauchyUnsupported(self, request, :refine)
    };
    real;
};

CauchyAttachCertifiedProtocol(real) -> {;
    real._proto = {=
        Term = (self, index) -> CauchyTermAt(self, index),
        TailBound = (self, index) -> CauchyTailBoundAt(self, index),
        Modulus = (self, radius) -> CauchyModulusAt(self, radius),
        Enclosure = (self, index) -> CauchyWitnessAt(self, index)[:interval],
        InitialEnclosure = (self) -> self[:initialWitness][:interval],
        Record = (self) -> CauchyRecord(self),
        NumericsCapabilities = (self) -> CauchyCapabilities(self),
        Enclose = (self, request ?= {= }) -> CauchyProtocolEnclosure(self, request, :enclose),
        Refine = (self, request ?= {= }) -> CauchyProtocolEnclosure(self, request, :refine)
    };
    real;
};

BuildBareCauchy(termFunction, options) -> CauchyAttachBareProtocol({=
    valueKind = :cauchySequence,
    schema = "rix.cauchy.sequence@1",
    kind = :bare,
    name = CauchyOption(options, "name", :sequence),
    termFunction = termFunction,
    provenance = {= plugin=:cauchy, version=1, source=:sequence }
});

BuildCertifiedCauchy(termFunction, tailFunction, modulusFunction, options) -> {;
    initialTerm = CauchyRequireRational(0 |> termFunction, "Cauchy term 0");
    initialTail = CauchyRequireNonnegative(0 |> tailFunction, "Cauchy tail bound 0");
    CauchyAttachCertifiedProtocol({=
        valueKind = :cauchyReal,
        schema = "rix.cauchy.real@1",
        kind = :declared,
        name = CauchyOption(options, "name", :certifiedSequence),
        termFunction = termFunction,
        tailFunction = tailFunction,
        modulusFunction = modulusFunction,
        evidence = CauchyOption(options, "evidence", :declaredTailModulus),
        initialWitness = CauchyWitness(initialTerm, initialTail, 0),
        provenance = {= plugin=:cauchy, version=1, source=:declaredTailModulus }
    });
};

CauchySequenceConstructor(termFunction, tailFunction ?= _, modulusFunction ?= _, options ?= {= }) -> {;
    noCertificate = tailFunction == _ && modulusFunction == _;
    completeCertificate = tailFunction != _ && modulusFunction != _;
    {? noCertificate ? BuildBareCauchy(termFunction, options);
       completeCertificate ? BuildCertifiedCauchy(termFunction, tailFunction, modulusFunction, options);
       .Error("cauchy.Sequence expects term, or term, tailBound, modulus, and optional options")
    };
};

CauchyCertifiedConstructor(termFunction, tailFunction, modulusFunction, options ?= {= }) ->
    BuildCertifiedCauchy(termFunction, tailFunction, modulusFunction, options);

CauchyGeometricConstructor(first, ratio, options ?= {= }) -> {;
    exactFirst = CauchyRequireRational(first, "Cauchy geometric first term");
    exactRatio = CauchyRequireRational(ratio, "Cauchy geometric ratio");
    exactRatio.Abs() < 1 ?: _ ?_ .Error("Cauchy geometric ratio must have absolute value less than one");
    initial = CauchyWitness(
        exactFirst,
        exactFirst.Abs() * exactRatio.Abs() / (1 - exactRatio.Abs()),
        0
    );
    CauchyAttachCertifiedProtocol({=
        valueKind = :cauchyReal,
        schema = "rix.cauchy.real@1",
        kind = :geometric,
        name = CauchyOption(options, "name", :geometricSeries),
        first = exactFirst,
        ratio = exactRatio,
        evidence = {=
            kind = :geometricTail,
            property = :absoluteRemainderBound,
            ratio = exactRatio
        },
        initialWitness = initial,
        provenance = {= plugin=:cauchy, version=1, source=:geometricTail }
    });
};

CauchyGeometricRefinement(real, requestedWidth, maxCalls, maxIterations) -> {;
    selected = real[:initialWitness];
    calls = 0;
    iterations = 0;
    {@ step = 1;
       @selected[:width] > @requestedWidth && @calls < @maxCalls && @iterations < @maxIterations;
       {;
           @selected = CauchyWitnessAt(@real, @selected[:index] + 1);
           @calls += 1;
           @iterations += 1;
       };
       step += 1
    };
    {=
        selected = selected,
        calls = calls,
        iterations = iterations,
        diagnostic = selected[:width] <= requestedWidth ?: _ ?_ :workBudgetReached
    };
};

CauchyDeclaredRefinement(real, requestedWidth, maxCalls, maxIterations) -> {;
    selected = real[:initialWitness];
    calls = 0;
    iterations = 0;
    diagnostic = _;
    selected[:width] > requestedWidth ?: {;
        enoughWork = @maxCalls >= 3 && @maxIterations >= 1;
        enoughWork ?: {;
            targetRadius = @requestedWidth / 2;
            index = CauchyRequireIndex(@real[:modulusFunction](targetRadius), "Cauchy modulus result");
            @calls = 1;
            candidate = CauchyWitnessAt(@real, index);
            @calls = 3;
            @iterations = 1;
            candidate[:tailBound] <= targetRadius ?: _ ?_ .Error(
                @"Cauchy modulus certificate failed at index @{index}: tail bound @{candidate[:tailBound]} exceeds @{targetRadius}"
            );
            candidate[:interval].Overlaps(@real[:initialWitness][:interval]) ?: _ ?_ .Error(
                @"Cauchy certificate at index @{index} contradicts the initial certified enclosure"
            );
            @selected = candidate;
        } ?_ {;
            @diagnostic = :insufficientBudgetForModulusWitness;
        };
    } ?_ _;
    {= selected=selected, calls=calls, iterations=iterations, diagnostic=diagnostic };
};

CauchyProtocolEnclosure(real, request, operation) -> {;
    capabilities = CauchyCapabilities(real);
    normalized = .RefinementRequest(request, operation, capabilities);
    requestedWidth = normalized[:absoluteWidth];
    maxCalls = normalized[:work][:maxCalls];
    maxIterations = normalized[:work][:maxIterations];
    state = real[:kind] == :geometric
      ?: CauchyGeometricRefinement(real, requestedWidth, maxCalls, maxIterations)
      ?_ CauchyDeclaredRefinement(real, requestedWidth, maxCalls, maxIterations);
    selected = state[:selected];
    achievedWidth = selected[:width];
    goalMet = achievedWidth <= requestedWidth;
    status = goalMet ?: :enclosed ?_ :budgetExhausted;
    evidenceLevel = real[:kind] == :geometric ?: :proof ?_ :constructorGuarantee;
    approximation = .CertifiedApproximation(selected[:term], selected[:interval], {=
        reason = status,
        requested = requestedWidth,
        achieved = achievedWidth,
        provider = :cauchy
    });
    {=
        valueKind = :enclosure,
        schema = "rix.numerics.enclosure@1",
        status = status,
        interval = selected[:interval],
        certified = 1,
        goalMet = goalMet,
        requestedWidth = requestedWidth,
        achievedWidth = achievedWidth,
        approximation = approximation,
        evidenceLevel = evidenceLevel,
        backend = :cauchy,
        operation = normalized[:operation],
        trace = [selected],
        work = {=
            calls = state[:calls],
            iterations = state[:iterations],
            index = selected[:index],
            maxCalls = maxCalls,
            maxIterations = maxIterations,
            exhausted = !goalMet
        },
        diagnostics = state[:diagnostic] == _ ?: [] ?_ [state[:diagnostic]],
        evidence = {=
            kind = real[:kind] == :geometric ?: :geometricTail ?_ :declaredTailModulus,
            property = :limitWithinTermPlusOrMinusTailBound,
            witness = selected,
            certificate = real[:evidence]
        },
        source = real[:provenance]
    };
};

CauchyFamily(value) -> (value ? :Map) &&
  (value[:valueKind] == :cauchyReal || value[:valueKind] == :cauchyArithmeticReal);
CauchyExact(value) -> (value ? :Integer) || (value ? :Rational);
CauchyArithmeticPair(left, right) ->
  (CauchyFamily(left) || CauchyFamily(right)) &&
  (CauchyFamily(left) || CauchyExact(left)) &&
  (CauchyFamily(right) || CauchyExact(right));

CauchyArithmeticCapabilities(real) -> {=
    valueKind=:numericsCapabilities,
    schema="rix.numerics.capabilities@1",
    backend=:cauchy,
    representation=:oracleBackedCauchyArithmetic,
    denotation=:singleton,
    operations=[:enclose, :refine],
    evidenceLevels=[:constructorGuarantee, :proof],
    certified=1,
    arbitraryRefinement=1,
    deterministic=1,
    minimumWidth=0,
    maxCalls=100000,
    maxIterations=100000
};

CauchyArithmetic(operation, left, right ?= _) -> {;
    unary = operation == :neg || operation == :abs;
    recipe = unary ?: .oracle.Operation(operation, left) ?_ .oracle.Operation(operation, left, right);
    real = {=
        valueKind=:cauchyArithmeticReal,
        schema="rix.cauchy.arithmetic-real@1",
        kind=:arithmetic,
        operation=operation,
        recipe=recipe,
        provenance={= plugin=:cauchy, version=2, source=:arithmeticRecipe }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->self[:recipe].Enclose(request),
        Refine=(self, request ?= {= })->self[:recipe].Refine(request),
        NumericsCapabilities=(self)->CauchyArithmeticCapabilities(self),
        Record=(self)->{= valueKind=self[:valueKind], schema=self[:schema], operation=self[:operation], certified=1 }
    };
    .ImmutableValue(real ~!: :CauchyReal);
};

.TypeKnown(:CauchyReal) ?: _ ?_ .TypeRegister({=
    name=:CauchyReal,
    nativeType=:map,
    defaultTraits=[:number, :ordered],
    convertFrom={= map=(x) ?- [CauchyFamily(x)] -> x },
    validate=(x)->CauchyFamily(x),
    proto={=
        Enclose=(self,request ?= {= })->self[:kind] == :arithmetic ?: self[:recipe].Enclose(request) ?_ CauchyProtocolEnclosure(self,request,:enclose),
        Refine=(self,request ?= {= })->self[:kind] == :arithmetic ?: self[:recipe].Refine(request) ?_ CauchyProtocolEnclosure(self,request,:refine),
        NumericsCapabilities=(self)->self[:kind] == :arithmetic ?: CauchyArithmeticCapabilities(self) ?_ CauchyCapabilities(self)
    },
    installs={=
        ADD=[{= name=:CauchyAdd, priority=300, prep=(x,y)->CauchyArithmeticPair(x,y), impl=(x,y)->CauchyArithmetic(:add,x,y) }],
        SUB=[{= name=:CauchySub, priority=300, prep=(x,y)->CauchyArithmeticPair(x,y), impl=(x,y)->CauchyArithmetic(:sub,x,y) }],
        MUL=[{= name=:CauchyMul, priority=300, prep=(x,y)->CauchyArithmeticPair(x,y), impl=(x,y)->CauchyArithmetic(:mul,x,y) }],
        DIV=[{= name=:CauchyDiv, priority=300, prep=(x,y)->CauchyArithmeticPair(x,y), impl=(x,y)->CauchyArithmetic(:div,x,y) }],
        POW=[{= name=:CauchyPow, priority=300, prep=(x,y)->CauchyFamily(x)&&(y ? :Integer), impl=(x,y)->CauchyArithmetic(:pow,x,y) }],
        NEG=[{= name=:CauchyNeg, priority=300, prep=(x)->CauchyFamily(x), impl=(x)->CauchyArithmetic(:neg,x) }],
        ABS=[{= name=:CauchyAbs, priority=300, prep=(x)->CauchyFamily(x), impl=(x)->CauchyArithmetic(:abs,x) }]
    }
});

.TypeInstall(:CauchyReal);

cauchyNamespace = {= };
cauchyNamespace._proto = {=
    Sequence = (self, termFunction, tailFunction ?= _, modulusFunction ?= _, options ?= {= }) ->
        CauchySequenceConstructor(termFunction, tailFunction, modulusFunction, options),
    Certified = (self, termFunction, tailFunction, modulusFunction, options ?= {= }) ->
        CauchyCertifiedConstructor(termFunction, tailFunction, modulusFunction, options),
    Geometric = (self, first, ratio, options ?= {= }) -> CauchyGeometricConstructor(first, ratio, options),
    Term = (self, real, index) -> CauchyTermAt(real, index),
    TailBound = (self, real, index) -> CauchyTailBoundAt(real, index),
    Modulus = (self, real, radius) -> CauchyModulusAt(real, radius),
    Enclosure = (self, real, index) -> CauchyWitnessAt(real, index)[:interval],
    Record = (self, real) -> CauchyRecord(real)
};

.Host.RegisterValue(
    "cauchy",
    cauchyNamespace,
    "Rational Cauchy sequences with explicit certified tail bounds and moduli",
    ["Numerics", "Exact"]
);
`, sourcePath: "bundled:cauchy", kind: "rix" });
  catalog.addMetadata({ id: "complex-viz", description: "Exact domain-color sampling for complex functions rendered as portable Graphics.", kind: "rix", mount: "complexViz", aliases: ["domainColoring"], exports: ["DomainColoring", "RationalFunction", "Sample", "Pole", "Unresolved", "PhaseSector", "MagnitudeBand", "Color"], groups: ["Graphics", "Exact", "Algebra"], permissions: [], provides: ["rix.complex-visualization@1"], schemas: ["rix.complex-viz.sample@1", "rix.complex-viz.domain-coloring@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:complex-viz" }, { source: `/**
id: complex-viz
description: Exact domain-color sampling for complex functions rendered as portable Graphics.
kind: rix
mount: complexViz
aliases: [domainColoring]
exports: [DomainColoring, RationalFunction, Sample, Pole, Unresolved, PhaseSector, MagnitudeBand, Color]
groups: [Graphics, Exact, Algebra]
permissions: []
provides: [rix.complex-visualization@1]
schemas: [rix.complex-viz.sample@1, rix.complex-viz.domain-coloring@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

CVOption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;
CVAbs(value) -> value < 0 ?: -value ?_ value;

CVSample(value) -> {=
    valueKind=:complexVizSample,
    schema="rix.complex-viz.sample@1",
    status=:value,
    value=value
};
CVPole() -> {= valueKind=:complexVizSample, schema="rix.complex-viz.sample@1", status=:pole, value=_ };
CVUnresolved(reason ?= :unresolved) -> {= valueKind=:complexVizSample, schema="rix.complex-viz.sample@1", status=:unresolved, reason=reason, value=_ };

CVNormalizeSample(value) -> ((value ? :Map) && value.Has("status")) ?: value ?_ CVSample(value);

CVRationalSample(numerator, denominator, point) -> {;
    denominatorValue = point |> denominator;
    .Complex.NormSquared(denominatorValue) == 0
      ?: CVPole()
      ?_ CVSample((point |> numerator) / denominatorValue);
};

CVRationalFunction(numerator, denominator) -> (point) -> CVRationalSample(numerator, denominator, point);

CVPhaseSector(value) -> {;
    x = .Complex.Re(value) ~!: :Rational;
    y = .Complex.Im(value) ~!: :Rational;
    (x == 0 && y == 0)
      ?: :zero
      ?_ x >= 0
           ?: (y >= 0
                 ?: (y <= x ?: 0 ?_ 1)
                 ?_ ((-y) >= x ?: 6 ?_ 7))
           ?_ (y >= 0
                 ?: (y >= (-x) ?: 2 ?_ 3)
                 ?_ ((-y) <= (-x) ?: 4 ?_ 5));
};

CVMagnitudeBand(value) -> {;
    magnitudeSquared = .Complex.NormSquared(value) ~!: :Rational;
    magnitudeSquared == 0 ?: :zero ?_ magnitudeSquared <= 1/4 ?: :small ?_ magnitudeSquared <= 4 ?: :medium ?_ :large;
};

CVPalette(sector, band) -> {;
    small = ["#fecaca", "#fed7aa", "#fef08a", "#d9f99d", "#a7f3d0", "#a5f3fc", "#bfdbfe", "#ddd6fe"];
    medium = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6"];
    large = ["#991b1b", "#9a3412", "#854d0e", "#3f6212", "#065f46", "#155e75", "#1e3a8a", "#4c1d95"];
    band == :small ?: small[sector + 1] ?_ band == :medium ?: medium[sector + 1] ?_ large[sector + 1];
};

CVColor(sampleValue) -> {;
    sample = CVNormalizeSample(sampleValue);
    sample[:status] == :pole
      ?: "#ffffff"
      ?_ sample[:status] == :unresolved
           ?: "#64748b"
           ?_ {;
               sector = CVPhaseSector(@sample[:value]);
               sector == :zero ?: "#111827" ?_ CVPalette(sector, CVMagnitudeBand(@sample[:value]));
           };
};

CVPositiveInteger(value, label) -> {;
    integer = value ~!: :Integer;
    integer >= 1 ?: integer ?_ .Error(@"@{label} must be a positive Integer");
};

CVDomainColoring(spec) -> {;
    fn = spec[:fn];
    fn == _ ?: .Error("DomainColoring requires fn") ?_ _;
    domain = CVOption(spec, "domain", {= re=[-2, 2], im=[-2, 2] });
    re = domain[:re];
    im = domain[:im];
    resolution = CVOption(spec, "resolution", [32, 32]);
    columns = CVPositiveInteger(resolution[1], "DomainColoring columns");
    rows = CVPositiveInteger(resolution[2], "DomainColoring rows");
    size = CVOption(spec, "size", [360, 360]);
    cellWidth = size[1] / columns;
    cellHeight = size[2] / rows;
    reStep = (re[2] - re[1]) / columns;
    imStep = (im[2] - im[1]) / rows;
    children := [];
    poles := 0;
    unresolved := 0;
    zeros := 0;
    {@ row = 1; row <= @rows; {;
        {@ column = 1; column <= @columns; {;
            real = @re[1] + (column - 1/2) * @reStep;
            imaginary = @im[2] - (@row - 1/2) * @imStep;
            point = .Complex.FromParts(real, imaginary);
            sample = CVNormalizeSample(point |> @fn);
            sample[:status] == :pole ?: {; @poles += 1; } ?_ _;
            sample[:status] == :unresolved ?: {; @unresolved += 1; } ?_ _;
            (sample[:status] == :value && .Complex.NormSquared(sample[:value]) == 0) ?: {; @zeros += 1; } ?_ _;
            color = CVColor(sample);
            @children ~= @children.Push(.Graphics.Rectangle(
                [(column - 1) * @cellWidth, (@row - 1) * @cellHeight],
                [@cellWidth, @cellHeight],
                {= fill=color, stroke=color, width=0 }
            ));
        }; column += 1 };
    }; row += 1 };
    .Graphics.Graphic(size, children, {=
        schema="rix.complex-viz.domain-coloring@1",
        convention=:exactOctantPhaseThreeBandMagnitude,
        phase=:octantsByCartesianDominance,
        magnitude=:normSquaredBands,
        magnitudeBands=[0, 1/4, 4],
        poleColor="#ffffff",
        unresolvedColor="#64748b",
        zeroColor="#111827",
        domain=domain,
        resolution=resolution,
        samples=rows * columns,
        poles=poles,
        unresolved=unresolved,
        zeros=zeros,
        alt="Complex domain coloring"
    });
};

complexVizNamespace = {= };
complexVizNamespace._proto = {=
    DomainColoring=(self, spec)->CVDomainColoring(spec),
    RationalFunction=(self, numerator, denominator)->CVRationalFunction(numerator, denominator),
    Sample=(self, value)->CVSample(value),
    Pole=(self)->CVPole(),
    Unresolved=(self, reason ?= :unresolved)->CVUnresolved(reason),
    PhaseSector=(self, value)->CVPhaseSector(value),
    MagnitudeBand=(self, value)->CVMagnitudeBand(value),
    Color=(self, value)->CVColor(value)
};
.Host.RegisterValue("complexViz", complexVizNamespace, "Exact complex domain coloring as portable Graphics", ["Graphics", "Exact", "Algebra"]);
`, sourcePath: "bundled:complex-viz", kind: "rix" });
  catalog.addMetadata({ id: "continued-fraction", description: "Finite and lazy simple continued fractions with exact convergents and certified enclosures.", kind: "rix", mount: "continuedFraction", aliases: ["cf"], exports: ["Finite", "Lazy", "Periodic", "Sqrt2", "FromRational", "Coefficient", "Coefficients", "Convergent", "Convergents", "Enclosure", "ErrorInterval", "Record"], groups: ["Numerics", "Exact"], permissions: [], requires: ["rix.oracle@1"], provides: ["rix.continued-fraction@1", "rix.refinable@1", "rix.enclosable-real@1"], schemas: ["rix.continued-fraction.finite@1", "rix.continued-fraction.lazy@1", "rix.continued-fraction.arithmetic-real@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:continued-fraction" }, { source: `/**
id: continued-fraction
description: Finite and lazy simple continued fractions with exact convergents and certified enclosures.
kind: rix
mount: continuedFraction
aliases: [cf]
exports: [Finite, Lazy, Periodic, Sqrt2, FromRational, Coefficient, Coefficients, Convergent, Convergents, Enclosure, ErrorInterval, Record]
groups: [Numerics, Exact]
permissions: []
requires: [rix.oracle@1]
provides: [rix.continued-fraction@1, rix.refinable@1, rix.enclosable-real@1]
schemas: [rix.continued-fraction.finite@1, rix.continued-fraction.lazy@1, rix.continued-fraction.arithmetic-real@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

CFOption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

CFRequireIndex(value, label) -> {;
    index = value ~!: :Integer;
    index >= 0 ?: index ?_ .Error(@"@{label} must be a nonnegative Integer");
};

CFRequireCount(value, label) -> {;
    count = value ~!: :Integer;
    count >= 1 ?: count ?_ .Error(@"@{label} must be a positive Integer");
};

CFValidateCoefficient(value, index) -> {;
    coefficient = value ~!: :Integer;
    valid = index == 0 ?: 1 ?_ coefficient > 0;
    valid
      ?: coefficient
      ?_ .Error(@"Continued-fraction coefficient @{index} must be a positive Integer");
};

CFCoefficientAt(real, index) -> {;
    n = CFRequireIndex(index, "Continued-fraction coefficient index");
    outOfRange = real[:kind] == :finite ?: n >= real[:length] ?_ _;
    outOfRange
      ?: .Error(@"Finite continued fraction has no coefficient at index @{n}")
      ?_ CFValidateCoefficient(n |> real[:coefficientFunction], n);
};

CFCoefficients(real, count ?= _) -> {;
    amount = count == _
      ?: (real[:kind] == :finite ?: real[:length] ?_ .Error("Lazy continued fractions require an explicit coefficient count"))
      ?_ CFRequireIndex(count, "Continued-fraction coefficient count");
    exceedsFinite = real[:kind] == :finite ?: amount > real[:length] ?_ _;
    exceedsFinite
      ?: .Error("Requested coefficient count exceeds the finite continued fraction")
      ?_ _;
    values = [];
    {@ index = 0; index < @amount; {;
        @values ~= @values.Push(CFCoefficientAt(@real, index));
    }; index += 1 };
    values;
};

CFConvergentState(real, count) -> {;
    amount = CFRequireCount(count, "Continued-fraction convergent count");
    exceedsFinite = real[:kind] == :finite ?: amount > real[:length] ?_ _;
    exceedsFinite
      ?: .Error("Requested convergent exceeds the finite continued fraction")
      ?_ _;
    p0 = 0;
    p1 = 1;
    q0 = 1;
    q1 = 0;
    {@ index = 0; index < @amount; {;
        coefficient = CFCoefficientAt(@real, index);
        nextP = coefficient * @p1 + @p0;
        nextQ = coefficient * @q1 + @q0;
        @p0 ~= @p1;
        @p1 ~= nextP;
        @q0 ~= @q1;
        @q1 ~= nextQ;
    }; index += 1 };
    {=
        count = amount,
        previous = q0 == 0 ?: _ ?_ p0 / q0,
        current = q1 == 0 ?: _ ?_ p1 / q1,
        p0 = p0,
        p1 = p1,
        q0 = q0,
        q1 = q1
    };
};

CFConvergent(real, count) -> CFConvergentState(real, count)[:current];

CFConvergents(real, count ?= _) -> {;
    amount = count == _
      ?: (real[:kind] == :finite ?: real[:length] ?_ .Error("Lazy continued fractions require an explicit convergent count"))
      ?_ CFRequireIndex(count, "Continued-fraction convergent count");
    results = [];
    {@ index = 1; index <= @amount; {;
        @results ~= @results.Push(CFConvergent(@real, index));
    }; index += 1 };
    results;
};

CFWitness(real, count) -> {;
    state = CFConvergentState(real, count);
    interval = state[:previous]:state[:current];
    {=
        count = state[:count],
        previous = state[:previous],
        convergent = state[:current],
        interval = interval,
        width = interval.Width(),
        p0 = state[:p0],
        p1 = state[:p1],
        q0 = state[:q0],
        q1 = state[:q1]
    };
};

CFNextWitness(real, witness) -> {;
    index = witness[:count];
    coefficient = CFCoefficientAt(real, index);
    nextP = coefficient * witness[:p1] + witness[:p0];
    nextQ = coefficient * witness[:q1] + witness[:q0];
    next = nextP / nextQ;
    interval = witness[:convergent]:next;
    {=
        count = index + 1,
        previous = witness[:convergent],
        convergent = next,
        interval = interval,
        width = interval.Width(),
        p0 = witness[:p1],
        p1 = nextP,
        q0 = witness[:q1],
        q1 = nextQ
    };
};

CFEnclosureAt(real, count ?= _) -> {;
    real[:kind] == :finite
      ?: {;
          exact = CFConvergent(@real, @count == _ ?: @real[:length] ?_ @count);
          exact:exact;
      }
      ?_ CFWitness(real, count == _ ?: 2 ?_ CFRequireCount(count, "Continued-fraction enclosure count"))[:interval];
};

CFErrorInterval(real, count) -> {;
    convergent = CFConvergent(real, count);
    enclosure = CFEnclosureAt(real, real[:kind] == :finite ?: _ ?_ count);
    (enclosure.Low() - convergent):(enclosure.High() - convergent);
};

CFCapabilities(real) -> {;
    lazy = real[:kind] != :finite;
    {=
        valueKind = :numericsCapabilities,
        schema = "rix.numerics.capabilities@1",
        backend = :continuedFraction,
        representation = lazy ?: :lazySimpleContinuedFraction ?_ :finiteSimpleContinuedFraction,
        denotation = :singleton,
        operations = [:enclose, :refine],
        evidenceLevels = [lazy ?: real[:evidenceLevel] ?_ :proof],
        certified = 1,
        arbitraryRefinement = lazy,
        deterministic = 1,
        minimumWidth = 0,
        maxCalls = lazy ?: 100000 ?_ 0,
        maxIterations = lazy ?: 100000 ?_ 0
    };
};

CFRecord(real) -> {=
    valueKind = :continuedFraction,
    schema = real[:schema],
    kind = real[:kind],
    name = real[:name],
    coefficients = real[:kind] == :finite ?: real[:coefficients] ?_ _,
    length = real[:kind] == :finite ?: real[:length] ?_ _,
    period = real[:period],
    initialEnclosure = real[:initialWitness][:interval],
    evidence = real[:evidence],
    certified = 1
};

CFAttachProtocol(real) -> {;
    real._proto = {=
        Coefficient = (self, index) -> CFCoefficientAt(self, index),
        Coefficients = (self, count ?= _) -> CFCoefficients(self, count),
        Convergent = (self, count) -> CFConvergent(self, count),
        Convergents = (self, count ?= _) -> CFConvergents(self, count),
        Value = (self) -> self[:kind] == :finite ?: CFConvergent(self, self[:length]) ?_ .Error("Lazy continued fractions do not have a finite exact Value"),
        Enclosure = (self, count ?= _) -> CFEnclosureAt(self, count),
        ErrorInterval = (self, count) -> CFErrorInterval(self, count),
        Record = (self) -> CFRecord(self),
        Enclose = (self, request ?= {= }) -> CFProtocolEnclosure(self, request, :enclose),
        Refine = (self, request ?= {= }) -> CFProtocolEnclosure(self, request, :refine),
        NumericsCapabilities = (self) -> CFCapabilities(self)
    };
    .ImmutableValue(real);
};

CFFinite(coefficients, options ?= {= }) -> {;
    length = coefficients.Len();
    length >= 1 ?: _ ?_ .Error("Finite continued fractions require at least one coefficient");
    exactCoefficients = [];
    {@ index = 0; index < @length; {;
        @exactCoefficients ~= @exactCoefficients.Push(CFValidateCoefficient((@coefficients)[index + 1], index));
    }; index += 1 };
    coefficientFunction = (index) -> (@exactCoefficients)[index + 1];
    provisional = {=
        valueKind = :continuedFraction,
        schema = "rix.continued-fraction.finite@1",
        kind = :finite,
        name = CFOption(options, "name", :finite),
        coefficients = exactCoefficients,
        length = length,
        coefficientFunction = coefficientFunction,
        evidenceLevel = :proof,
        evidence = {= kind=:finiteEvaluation, property=:exactRationalValue }
    };
    exact = CFConvergent(provisional, length) ~!: :Rational;
    provisional["initialwitness"] = {=
        count=length,
        previous=exact,
        convergent=exact,
        interval=exact:exact,
        width=0,
        p0=exact.Numerator(), p1=exact.Numerator(),
        q0=exact.Denominator(), q1=exact.Denominator()
    };
    CFAttachProtocol(provisional);
};

CFLazy(coefficientFunction, options ?= {= }) -> {;
    provisional = {=
        valueKind = :continuedFraction,
        schema = "rix.continued-fraction.lazy@1",
        kind = CFOption(options, "kind", :lazy),
        name = CFOption(options, "name", :lazy),
        coefficientFunction = coefficientFunction,
        prefix = CFOption(options, "prefix", _),
        period = CFOption(options, "period", _),
        evidenceLevel = CFOption(options, "evidenceLevel", :constructorGuarantee),
        evidence = CFOption(options, "evidence", {=
            kind=:declaredSimpleContinuedFraction,
            property=:positiveTailCoefficients
        })
    };
    provisional["initialwitness"] = CFWitness(provisional, 2);
    CFAttachProtocol(provisional);
};

CFPeriodic(prefix, period, options ?= {= }) -> {;
    prefixLength = prefix.Len();
    periodLength = period.Len();
    prefixLength >= 1 ?: _ ?_ .Error("Periodic continued fractions require a nonempty prefix");
    periodLength >= 1 ?: _ ?_ .Error("Periodic continued fractions require a nonempty period");
    exactPrefix = CFCoefficients(CFFinite(prefix), prefixLength);
    exactPeriod = [];
    {@ index = 0; index < @periodLength; {;
        @exactPeriod ~= @exactPeriod.Push(CFValidateCoefficient((@period)[index + 1], index + 1));
    }; index += 1 };
    rule = (index) -> index < @prefixLength
      ?: (@exactPrefix)[index + 1]
      ?_ (@exactPeriod)[((index - @prefixLength) % @periodLength) + 1];
    CFLazy(rule, {=
        kind = :periodic,
        name = CFOption(options, "name", :periodic),
        prefix = exactPrefix,
        period = exactPeriod,
        evidenceLevel = CFOption(options, "evidenceLevel", :constructorGuarantee),
        evidence = CFOption(options, "evidence", {=
            kind=:periodicSimpleContinuedFraction,
            property=:positiveRepeatingTail
        })
    });
};

CFSqrt2() -> CFPeriodic([1], [2], {=
    name = :sqrt2,
    evidenceLevel = :proof,
    evidence = {=
        kind=:periodicQuadraticIrrational,
        property=:squareEqualsTwo,
        equation="x = 1 + 1/(1+x)"
    }
});

CFFromRational(value, options ?= {= }) -> {;
    exact = value ~!: :Rational;
    CFFinite(exact.ToContinuedFraction(), {= name=CFOption(options, "name", :rational) });
};

CFConstruct(value, options ?= {= }) -> {;
    alreadyContinuedFraction = value ? :Map ?: value[:valueKind] == :continuedFraction ?_ _;
    alreadyContinuedFraction
      ?: value
      ?_ (value ? :Array ?: CFFinite(value, options) ?_ CFFromRational(value, options));
};

CFRefinementState(real, requestedWidth, maxCalls, maxIterations) -> {;
    selected = real[:initialWitness];
    calls = 0;
    iterations = 0;
    {@ step = 1;
       (@selected)[:width] > @requestedWidth && @calls < @maxCalls && @iterations < @maxIterations;
       {;
           @selected ~= CFNextWitness(@real, @selected);
           @calls += 1;
           @iterations += 1;
       };
       step += 1
    };
    {= selected=selected, calls=calls, iterations=iterations };
};

CFProtocolEnclosure(real, request, operation) -> {;
    capabilities = CFCapabilities(real);
    normalized = .RefinementRequest(request, operation, capabilities);
    requestedWidth = normalized[:absoluteWidth];
    maxCalls = normalized[:work][:maxCalls];
    maxIterations = normalized[:work][:maxIterations];
    finite = real[:kind] == :finite;
    state = finite
      ?: {= selected=real[:initialWitness], calls=0, iterations=0 }
      ?_ CFRefinementState(real, requestedWidth, maxCalls, maxIterations);
    selected = state[:selected];
    achievedWidth = selected[:width];
    goalMet = achievedWidth <= requestedWidth;
    status = goalMet ?: :enclosed ?_ :budgetExhausted;
    approximation = .CertifiedApproximation(selected[:convergent], selected[:interval], {=
        reason=status,
        requested=requestedWidth,
        achieved=achievedWidth,
        provider=:continuedFraction
    });
    {=
        valueKind = :enclosure,
        schema = "rix.numerics.enclosure@1",
        status = status,
        interval = selected[:interval],
        certified = 1,
        goalMet = goalMet,
        requestedWidth = requestedWidth,
        achievedWidth = achievedWidth,
        approximation = approximation,
        evidenceLevel = finite ?: :proof ?_ real[:evidenceLevel],
        backend = :continuedFraction,
        operation = normalized[:operation],
        trace = [selected],
        work = {=
            calls=state[:calls],
            iterations=state[:iterations],
            coefficients=selected[:count],
            maxCalls=maxCalls,
            maxIterations=maxIterations,
            exhausted=!goalMet
        },
        diagnostics = goalMet ?: [] ?_ [:maxCallsReached],
        evidence = {=
            kind=finite ?: :finiteEvaluation ?_ :consecutiveConvergents,
            property=:containment,
            witness=selected,
            certificate=real[:evidence]
        },
        source = {= plugin=:continuedFraction, schema=real[:schema], kind=real[:kind] }
    };
};

CFFamily(value) -> (value ? :Map) &&
  (value[:valueKind] == :continuedFraction || value[:valueKind] == :continuedFractionArithmeticReal);
CFExact(value) -> (value ? :Integer) || (value ? :Rational);
CFArithmeticPair(left, right) ->
  (CFFamily(left) || CFFamily(right)) &&
  (CFFamily(left) || CFExact(left)) &&
  (CFFamily(right) || CFExact(right));

CFArithmeticCapabilities(real) -> {=
    valueKind=:numericsCapabilities,
    schema="rix.numerics.capabilities@1",
    backend=:continuedFraction,
    representation=:oracleBackedContinuedFractionArithmetic,
    denotation=:singleton,
    operations=[:enclose, :refine],
    evidenceLevels=[:constructorGuarantee, :proof],
    certified=1,
    arbitraryRefinement=1,
    deterministic=1,
    minimumWidth=0,
    maxCalls=100000,
    maxIterations=100000
};

CFArithmetic(operation, left, right ?= _) -> {;
    unary = operation == :neg || operation == :abs;
    recipe = unary ?: .oracle.Operation(operation, left) ?_ .oracle.Operation(operation, left, right);
    real = {=
        valueKind=:continuedFractionArithmeticReal,
        schema="rix.continued-fraction.arithmetic-real@1",
        kind=:arithmetic,
        operation=operation,
        recipe=recipe,
        provenance={= plugin=:continuedFraction, version=2, source=:arithmeticRecipe }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->self[:recipe].Enclose(request),
        Refine=(self, request ?= {= })->self[:recipe].Refine(request),
        NumericsCapabilities=(self)->CFArithmeticCapabilities(self),
        Record=(self)->{= valueKind=self[:valueKind], schema=self[:schema], operation=self[:operation], certified=1 }
    };
    .ImmutableValue(real ~!: :ContinuedFractionReal);
};

.TypeKnown(:ContinuedFractionReal) ?: _ ?_ .TypeRegister({=
    name=:ContinuedFractionReal,
    nativeType=:map,
    defaultTraits=[:number, :ordered],
    convertFrom={= map=(x) ?- [CFFamily(x)] -> x },
    validate=(x)->CFFamily(x),
    proto={=
        Enclose=(self,request ?= {= })->self[:kind] == :arithmetic ?: self[:recipe].Enclose(request) ?_ CFProtocolEnclosure(self,request,:enclose),
        Refine=(self,request ?= {= })->self[:kind] == :arithmetic ?: self[:recipe].Refine(request) ?_ CFProtocolEnclosure(self,request,:refine),
        NumericsCapabilities=(self)->self[:kind] == :arithmetic ?: CFArithmeticCapabilities(self) ?_ CFCapabilities(self)
    },
    installs={=
        ADD=[{= name=:CFAdd, priority=300, prep=(x,y)->CFArithmeticPair(x,y), impl=(x,y)->CFArithmetic(:add,x,y) }],
        SUB=[{= name=:CFSub, priority=300, prep=(x,y)->CFArithmeticPair(x,y), impl=(x,y)->CFArithmetic(:sub,x,y) }],
        MUL=[{= name=:CFMul, priority=300, prep=(x,y)->CFArithmeticPair(x,y), impl=(x,y)->CFArithmetic(:mul,x,y) }],
        DIV=[{= name=:CFDiv, priority=300, prep=(x,y)->CFArithmeticPair(x,y), impl=(x,y)->CFArithmetic(:div,x,y) }],
        POW=[{= name=:CFPow, priority=300, prep=(x,y)->CFFamily(x)&&(y ? :Integer), impl=(x,y)->CFArithmetic(:pow,x,y) }],
        NEG=[{= name=:CFNeg, priority=300, prep=(x)->CFFamily(x), impl=(x)->CFArithmetic(:neg,x) }],
        ABS=[{= name=:CFAbs, priority=300, prep=(x)->CFFamily(x), impl=(x)->CFArithmetic(:abs,x) }]
    }
});

.TypeInstall(:ContinuedFractionReal);

continuedFractionNamespace = (value, options ?= {= }) -> CFConstruct(value, options);
continuedFractionNamespace._proto = {=
    Finite = (self, coefficients, options ?= {= }) -> CFFinite(coefficients, options),
    Lazy = (self, coefficientFunction, options ?= {= }) -> CFLazy(coefficientFunction, options),
    Periodic = (self, prefix, period, options ?= {= }) -> CFPeriodic(prefix, period, options),
    Sqrt2 = (self) -> CFSqrt2(),
    FromRational = (self, value, options ?= {= }) -> CFFromRational(value, options),
    Coefficient = (self, real, index) -> CFCoefficientAt(real, index),
    Coefficients = (self, real, count ?= _) -> CFCoefficients(real, count),
    Convergent = (self, real, count) -> CFConvergent(real, count),
    Convergents = (self, real, count ?= _) -> CFConvergents(real, count),
    Enclosure = (self, real, count ?= _) -> CFEnclosureAt(real, count),
    ErrorInterval = (self, real, count) -> CFErrorInterval(real, count),
    Record = (self, real) -> CFRecord(real)
};

.Host.RegisterCallableValue(
    "continuedFraction",
    continuedFractionNamespace,
    "Finite and lazy simple continued fractions with exact convergents and certified enclosures",
    ["Numerics", "Exact"]
);
`, sourcePath: "bundled:continued-fraction", kind: "rix" });
  catalog.addMetadata({ id: "csv", description: "Deterministic CSV and TSV export for portable Tables and typed data Relations.", kind: "host", mount: "csv", exports: ["Render"], groups: ["Renderers", "Data"], permissions: [], provides: ["rix.renderer.csv@1"], targets: ["csv", "text/csv", "tsv", "text/tab-separated-values"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:csv" }, { sourcePath: "bundled:csv", kind: "host" });
  catalog.registerInstaller("csv", install23);
  catalog.addMetadata({ id: "data", description: "Immutable typed relations with deterministic projection, filtering, sorting, and Table views.", kind: "host", mount: "data", exports: ["Relation", "Project", "Filter", "Sort", "TableView", "Schema", "Rows"], groups: ["Data"], permissions: [], provides: ["rix.data.relation@1"], schemas: ["rix.data.relation@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:data" }, { sourcePath: "bundled:data", kind: "host" });
  catalog.registerInstaller("data", install7);
  catalog.addMetadata({ id: "document", description: "Numbered portable reports with labels, forward references, captions, and small semantic themes.", kind: "host", mount: "document", exports: ["Report", "Label", "Ref", "Theme", "References"], groups: ["Documents"], permissions: [], provides: ["rix.document.report@1"], schemas: ["rix.document.report@1", "rix.document.theme@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:document" }, { sourcePath: "bundled:document", kind: "host" });
  catalog.registerInstaller("document", install8);
  catalog.addMetadata({ id: "draw", description: "Convenient 2D drawing helpers that produce core Graphics nodes.", kind: "host", mount: "draw", exports: ["Line", "Polygon", "Label", "Box", "Circle"], groups: ["Draw"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:draw" }, { sourcePath: "bundled:draw", kind: "host" });
  catalog.registerInstaller("draw", install);
  catalog.addMetadata({ id: "exact-algebras", description: "Exact rational quaternion and octonion values.", kind: "rix", mount: "exactAlgebras", exports: ["Quaternion", "Octonion", "Components", "Conjugate", "NormSquared", "Inverse"], groups: ["Exact"], permissions: [], provides: ["rix.exact-algebras@1"], schemas: ["rix.exact-cayley-dickson@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:exact-algebras" }, { source: `/**
id: exact-algebras
description: Exact rational quaternion and octonion values.
kind: rix
mount: exactAlgebras
exports: [Quaternion, Octonion, Components, Conjugate, NormSquared, Inverse]
groups: [Exact]
permissions: []
provides: [rix.exact-algebras@1]
schemas: [rix.exact-cayley-dickson@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

ExactAlgebraRational(value, label ?= "component") -> {;
    exact = value ~!: :Rational;
    exact == _ ?: .Error(@"Exact algebra @{label} must be an Integer or Rational") ?_ exact;
};

ExactAlgebraZeroes(count) -> {;
    result := [];
    {@ index = 1; index <= @count; {; @result ~= @result.Push(0); }; index += 1 };
    result;
};

ExactAlgebraConcat(left, right) -> {;
    result := left.Map((value) -> value);
    {@ index = 1; index <= @right.Len(); {; @result ~= @result.Push(@right[index]); }; index += 1 };
    result;
};

ExactAlgebraValue(components) -> {;
    dimension = components.Len();
    dimension == 4 || dimension == 8
      ?: _
      ?_ .Error("Exact Cayley-Dickson values require 4 or 8 components");
    value = {=
        valueKind = dimension == 4 ?: :exactQuaternion ?_ :exactOctonion,
        schema = "rix.exact-cayley-dickson@1",
        type = dimension == 4 ?: :exact_quaternion ?_ :exact_octonion,
        dimension = dimension,
        components = components.Map((component) -> ExactAlgebraRational(component))
    };
    value.__type = "ExactAlgebra";
    value._type = dimension == 4 ?: "exact_quaternion" ?_ "exact_octonion";
    value._proto = {=
        Components = (self) -> self[:components],
        Conjugate = (self) -> ExactAlgebraConjugate(self),
        NormSquared = (self) -> ExactAlgebraNormSquared(self),
        Inverse = (self) -> ExactAlgebraInverse(self),
        Record = (self) -> self
    };
    .ImmutableValue(value);
};

ExactAlgebraConstruct(dimension, name, values) -> {;
    values.Len() <= dimension ?: _ ?_ .Error(@"@{name} accepts at most @{dimension} components");
    ExactAlgebraValue(ExactAlgebraConcat(values, ExactAlgebraZeroes(dimension - values.Len())));
};

ExactQuaternion(a ?= 0, b ?= 0, c ?= 0, d ?= 0) -> ExactAlgebraConstruct(4, "Quaternion", [a,b,c,d]);
ExactOctonion(a ?= 0, b ?= 0, c ?= 0, d ?= 0, e ?= 0, f ?= 0, g ?= 0, h ?= 0) ->
    ExactAlgebraConstruct(8, "Octonion", [a,b,c,d,e,f,g,h]);

ExactAlgebraIs(value) -> value ? :ExactAlgebra;
ExactAlgebraRequire(value, label ?= "value") -> ExactAlgebraIs(value) ?: value ?_ .Error(@"@{label} must be a quaternion or octonion");
ExactAlgebraScalar(value) -> (value ? :Integer) || (value ? :Rational);
ExactAlgebraOperand(value) -> ExactAlgebraIs(value) || ExactAlgebraScalar(value);

ExactAlgebraConjugateSplit(components) -> {;
    half = components.Len() // 2;
    ExactAlgebraConcat(ExactAlgebraConjugateComponents(components.Slice(1,half+1)), components.Slice(half+1).Map((value) -> -value));
};

ExactAlgebraConjugateComponents(components) ->
    components.Len() == 1 ?: components ?_ ExactAlgebraConjugateSplit(components);

ExactAlgebraAddComponents(left, right) -> {;
    result := [];
    {@ index = 1; index <= @left.Len(); {;
        @result ~= @result.Push(@left[index] + @right[index]);
    }; index += 1 };
    result;
};

ExactAlgebraSubtractComponents(left, right) -> {;
    result := [];
    {@ index = 1; index <= @left.Len(); {;
        @result ~= @result.Push(@left[index] - @right[index]);
    }; index += 1 };
    result;
};

ExactAlgebraMultiplySplit(left, right) -> {;
    half = left.Len() // 2;
    a = left.Slice(1,half+1);
    b = left.Slice(half+1);
    c = right.Slice(1,half+1);
    d = right.Slice(half+1);
    ExactAlgebraConcat(ExactAlgebraSubtractComponents(
        ExactAlgebraMultiplyComponents(a, c),
        ExactAlgebraMultiplyComponents(ExactAlgebraConjugateComponents(d), b)
    ), ExactAlgebraAddComponents(
        ExactAlgebraMultiplyComponents(d, a),
        ExactAlgebraMultiplyComponents(b, ExactAlgebraConjugateComponents(c))
    ));
};

ExactAlgebraMultiplyComponents(left, right) ->
    left.Len() == 1 ?: [left[1] * right[1]] ?_ ExactAlgebraMultiplySplit(left, right);

ExactAlgebraDimensionBoth(left, right) ->
    left[:dimension] == right[:dimension]
      ?: left[:dimension]
      ?_ .Error("Quaternion and octonion operands must have the same dimension");
ExactAlgebraDimensionLeft(left, right) ->
    ExactAlgebraIs(right) ?: ExactAlgebraDimensionBoth(left, right) ?_ left[:dimension];
ExactAlgebraDimensionRight(right) -> ExactAlgebraIs(right) ?: right[:dimension] ?_ _;
ExactAlgebraDimension(left, right) ->
    ExactAlgebraIs(left) ?: ExactAlgebraDimensionLeft(left, right) ?_ ExactAlgebraDimensionRight(right);

ExactAlgebraPromote(value, dimension) -> {;
    ExactAlgebraIs(value)
      ?: (value[:dimension] == dimension ?: value ?_ .Error("Quaternion and octonion operands must have the same dimension"))
      ?_ ExactAlgebraValue(ExactAlgebraConcat([ExactAlgebraRational(value, "scalar operand")], ExactAlgebraZeroes(dimension - 1)));
};

ExactAlgebraPair(left, right) -> {;
    dimension = ExactAlgebraDimension(left, right);
    dimension == _ ?: .Error("Exact algebra operation requires a quaternion or octonion") ?_ _;
    a = ExactAlgebraPromote(left, dimension);
    b = ExactAlgebraPromote(right, dimension);
    {= left=a[:components], right=b[:components] };
};

ExactAlgebraAdd(left, right) -> {; pair=ExactAlgebraPair(left,right); ExactAlgebraValue(ExactAlgebraAddComponents(pair[:left],pair[:right])); };
ExactAlgebraSubtract(left, right) -> {; pair=ExactAlgebraPair(left,right); ExactAlgebraValue(ExactAlgebraSubtractComponents(pair[:left],pair[:right])); };
ExactAlgebraMultiply(left, right) -> {; pair=ExactAlgebraPair(left,right); ExactAlgebraValue(ExactAlgebraMultiplyComponents(pair[:left],pair[:right])); };
ExactAlgebraNegate(value) -> ExactAlgebraValue(ExactAlgebraRequire(value)[:components].Map((component) -> -component));
ExactAlgebraConjugate(value) -> ExactAlgebraValue(ExactAlgebraConjugateComponents(ExactAlgebraRequire(value)[:components]));

ExactAlgebraNormSquared(value) -> {;
    exact = ExactAlgebraRequire(value);
    total := 0;
    {@ index = 1; index <= @exact[:components].Len(); {;
        component = @exact[:components][index];
        @total += component * component;
    }; index += 1 };
    total;
};

ExactAlgebraInverse(value) -> {;
    exact = ExactAlgebraRequire(value);
    norm = ExactAlgebraNormSquared(exact);
    norm != 0 ?: _ ?_ .Error("Zero has no multiplicative inverse");
    ExactAlgebraValue(ExactAlgebraConjugateComponents(exact[:components]).Map((component) -> component / norm));
};

ExactAlgebraDivideScalar(left, right) -> {;
    divisor = ExactAlgebraRational(right, "divisor");
    divisor != 0 ?: _ ?_ .Error("Division by zero");
    value = ExactAlgebraPromote(left, ExactAlgebraDimension(left, right));
    ExactAlgebraValue(value[:components].Map((component) -> component / divisor));
};

ExactAlgebraDivide(left, right) ->
    ExactAlgebraIs(right)
      ?: ExactAlgebraMultiply(left, ExactAlgebraInverse(right))
      ?_ ExactAlgebraDivideScalar(left, right);

ExactAlgebraEqualDimension(left, right, dimension) -> {;
    a = ExactAlgebraPromote(left, dimension)[:components];
    b = ExactAlgebraPromote(right, dimension)[:components];
    equal := 1;
    {@ index = 1; index <= @a.Len() && @equal == 1; {;
        @a[index] == @b[index] ?: _ ?_ {; @equal ~= 0; };
    }; index += 1 };
    equal;
};

ExactAlgebraEqual(left, right) -> {;
    dimension = ExactAlgebraDimension(left, right);
    dimension == _ ?: 0 ?_ ExactAlgebraEqualDimension(left, right, dimension);
};

.TypeKnown(:ExactAlgebra) ?: _ ?_ .TypeRegister({=
    name = :ExactAlgebra,
    nativeType = :map,
    defaultTraits = [:number],
    validate = (value) -> value[:schema] == "rix.exact-cayley-dickson@1",
    proto = {= },
    installs = {=
        ADD = [{= name=:ExactAlgebraAdd, prep=(left,right)->ExactAlgebraOperand(left)&&ExactAlgebraOperand(right)&&(ExactAlgebraIs(left)||ExactAlgebraIs(right)), impl=ExactAlgebraAdd }],
        SUB = [{= name=:ExactAlgebraSub, prep=(left,right)->ExactAlgebraOperand(left)&&ExactAlgebraOperand(right)&&(ExactAlgebraIs(left)||ExactAlgebraIs(right)), impl=ExactAlgebraSubtract }],
        MUL = [{= name=:ExactAlgebraMul, prep=(left,right)->ExactAlgebraOperand(left)&&ExactAlgebraOperand(right)&&(ExactAlgebraIs(left)||ExactAlgebraIs(right)), impl=ExactAlgebraMultiply }],
        DIV = [{= name=:ExactAlgebraDiv, prep=(left,right)->ExactAlgebraIs(left)&&ExactAlgebraOperand(right), impl=ExactAlgebraDivide }],
        NEG = [{= name=:ExactAlgebraNeg, prep=(value)->ExactAlgebraIs(value), impl=ExactAlgebraNegate }],
        EQ = [{= name=:ExactAlgebraEq, prep=(left,right)->ExactAlgebraOperand(left)&&ExactAlgebraOperand(right)&&(ExactAlgebraIs(left)||ExactAlgebraIs(right)), impl=(left,right)->ExactAlgebraEqual(left,right) ?: 1 ?_ _ }],
        NEQ = [{= name=:ExactAlgebraNeq, prep=(left,right)->ExactAlgebraOperand(left)&&ExactAlgebraOperand(right)&&(ExactAlgebraIs(left)||ExactAlgebraIs(right)), impl=(left,right)->ExactAlgebraEqual(left,right) ?: _ ?_ 1 }]
    }
});

.TypeInstall(:ExactAlgebra);

exactAlgebrasNamespace = {= };
exactAlgebrasNamespace._proto = {=
    Quaternion = (self, a ?= 0, b ?= 0, c ?= 0, d ?= 0) -> ExactQuaternion(a,b,c,d),
    Octonion = (self, a ?= 0, b ?= 0, c ?= 0, d ?= 0, e ?= 0, f ?= 0, g ?= 0, h ?= 0) -> ExactOctonion(a,b,c,d,e,f,g,h),
    Components = (self, value) -> ExactAlgebraRequire(value)[:components],
    Conjugate = (self, value) -> ExactAlgebraConjugate(value),
    NormSquared = (self, value) -> ExactAlgebraNormSquared(value),
    Inverse = (self, value) -> ExactAlgebraInverse(value)
};

.Host.RegisterValue("exactAlgebras", exactAlgebrasNamespace, "Exact rational quaternion and octonion constructors and operations", ["Exact"]);
`, sourcePath: "bundled:exact-algebras", kind: "rix" });
  catalog.addMetadata({ id: "example-array-js", description: "Teaching JavaScript plugin demonstrating array sum, summary text, and reversal.", kind: "host", mount: "arrayJs", exports: ["Sum", "Describe", "Reverse"], groups: ["Examples"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:example-array-js" }, { sourcePath: "bundled:example-array-js", kind: "host" });
  catalog.registerInstaller("example-array-js", install25);
  catalog.addMetadata({ id: "example-array-rix", description: "Teaching RiX plugin demonstrating array sum, summary text, and reversal.", kind: "rix", mount: "arrayRix", exports: ["arrayRixSum", "arrayRixDescribe", "arrayRixReverse"], groups: ["Examples"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:example-array-rix" }, { source: `/**
id: example-array-rix
description: Teaching RiX plugin demonstrating array sum, summary text, and reversal.
kind: rix
mount: arrayRix
exports: [arrayRixSum, arrayRixDescribe, arrayRixReverse]
groups: [Examples]
permissions: []
defaultEnabled: false
**/

.Host.Register("arrayRixSum", (values) -> values.Reduce((total, value) -> total + value, 0), "Sum an array of Integers", ["Examples"]);
.Host.Register("arrayRixDescribe", (values) -> @"count @{values.Len()}; sum @{values.Reduce((total, value) -> total + value, 0)}", "Summarize an array of Integers", ["Examples"]);
.Host.Register("arrayRixReverse", (values) -> values.Reverse(), "Reverse an array", ["Examples"]);
`, sourcePath: "bundled:example-array-rix", kind: "rix" });
  catalog.addMetadata({ id: "float", description: "JavaScript IEEE-754 Float conversion and optional approximate math.", kind: "host", mount: "float", exports: ["Float", "Interval", "Round", "Floor", "Ceiling", "Abs", "Sqrt", "Sin", "Cos", "Tan", "Log", "Exp"], groups: ["ApproximateMath", "Float"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:float" }, { sourcePath: "bundled:float", kind: "host" });
  catalog.registerInstaller("float", install26);
  catalog.addMetadata({ id: "fracfun", description: "Form-preserving callable polynomial and rational expressions with explicit transformations and canonical projections.", kind: "host", mount: "fracfun", aliases: ["fractionFunction", "ff"], exports: ["FractionFunction", "Parse", "Var", "Fun"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], requires: ["rix.fraction@1", "rix.rational-function@1"], provides: ["rix.fraction-function@1"], schemas: ["rix.fraction-function@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:fracfun" }, { sourcePath: "bundled:fracfun", kind: "host" });
  catalog.registerInstaller("fracfun", install2);
  catalog.addMetadata({ id: "fraction", description: "Representation-sensitive unreduced integer fractions with mediant and classroom addition policies.", kind: "rix", mount: "fraction", aliases: ["frac", "f"], exports: ["Fraction", "Parse", "FromSternBrocotPath"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], provides: ["rix.fraction@1"], schemas: ["rix.fraction@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:fraction" }, { source: `/**
id: fraction
description: Representation-sensitive unreduced integer fractions with mediant and classroom addition policies.
kind: rix
mount: fraction
aliases: [frac, f]
exports: [Fraction, Parse, FromSternBrocotPath]
groups: [Algebra, Exact, Symbolic]
permissions: []
provides: [rix.fraction@1]
schemas: [rix.fraction@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

FractionInteger(value, label) -> {;
    exact = value ~!: :Integer;
    exact == _ ?: .Error(@"@{label} must be an exact integer") ?_ exact;
};

FractionParts(value) -> .SArith.FractionParts(value);
FractionNumerator(value) -> FractionParts(value)[1];
FractionDenominator(value) -> FractionParts(value)[2];
FractionIsInfinite(value) -> FractionDenominator(value) == 0;

FractionRaw(numerator, denominator ?= 1) ->
    .SArith.Fraction(FractionInteger(numerator, "Fraction numerator"), FractionInteger(denominator, "Fraction denominator"));

FractionPromote(value, label ?= "value") -> {;
    value ? :Fraction
      ?: value
      ?_ (value ? :Integer
          ?: FractionRaw(value, 1)
          ?_ (value ? :Rational
              ?: FractionRaw(value.Numerator(), value.Denominator())
              ?_ .Error(@"@{label} must be a Fraction, Rational, or exact integer")));
};

FractionFinite(value, label ?= "Fraction") -> {;
    exact = FractionPromote(value, label);
    FractionIsInfinite(exact) ?: .Error(@"@{label} must be finite") ?_ exact;
};

FractionNormalize(value) -> {;
    exact = FractionFinite(value);
    numerator = FractionNumerator(exact);
    denominator = FractionDenominator(exact);
    denominator < 0
      ?: {= numerator=-numerator, denominator=-denominator }
      ?_ {= numerator=numerator, denominator=denominator };
};

FractionGcd(left, right) -> {;
    a := left.Abs();
    b := right.Abs();
    {@ step = 1; @b != 0; {;
        remainder = @a % @b;
        @a ~= @b;
        @b ~= remainder;
    }; step += 1 };
    a;
};

FractionLcm(left, right) -> left == 0 || right == 0 ?: 0 ?_ (left // FractionGcd(left, right)) * right;

FractionCrossAdd(leftValue, rightValue, subtract ?= _) -> {;
    left = FractionFinite(leftValue, "left Fraction operand");
    right = FractionFinite(rightValue, "right Fraction operand");
    incoming = subtract ?: -FractionNumerator(right) ?_ FractionNumerator(right);
    FractionRaw(
        FractionNumerator(left) * FractionDenominator(right) + incoming * FractionDenominator(left),
        FractionDenominator(left) * FractionDenominator(right)
    );
};

FractionMultiply(leftValue, rightValue) -> {;
    left = FractionPromote(leftValue, "left Fraction operand");
    right = FractionPromote(rightValue, "right Fraction operand");
    FractionRaw(FractionNumerator(left) * FractionNumerator(right), FractionDenominator(left) * FractionDenominator(right));
};

FractionDivide(leftValue, rightValue) -> {;
    left = FractionPromote(leftValue, "left Fraction operand");
    right = FractionPromote(rightValue, "right Fraction operand");
    FractionNumerator(right) != 0 ?: _ ?_ .Error("Division by zero Fraction");
    FractionRaw(FractionNumerator(left) * FractionDenominator(right), FractionDenominator(left) * FractionNumerator(right));
};

FractionPower(value, exponent) -> {;
    exact = FractionPromote(value);
    power = FractionInteger(exponent, "Fraction exponent");
    power == 0
      ?: FractionRaw(1,1)
      ?_ power > 0
      ?: FractionRaw(FractionNumerator(exact)^power, FractionDenominator(exact)^power)
      ?_ {;
          FractionNumerator(@exact) != 0 ?: _ ?_ .Error("Zero Fraction cannot have a negative exponent");
          magnitude = -@power;
          FractionRaw(FractionDenominator(@exact)^magnitude, FractionNumerator(@exact)^magnitude);
      };
};

FractionCompare(leftValue, rightValue) -> {;
    left = FractionNormalize(leftValue);
    right = FractionNormalize(rightValue);
    a = left[:numerator] * right[:denominator];
    b = right[:numerator] * left[:denominator];
    a < b ?: -1 ?_ a > b ?: 1 ?_ 0;
};

FractionSamePair(leftValue, rightValue) -> {;
    left = FractionPromote(leftValue);
    right = FractionPromote(rightValue);
    FractionNumerator(left) == FractionNumerator(right) && FractionDenominator(left) == FractionDenominator(right);
};

FractionReduce(value) -> {;
    exact = FractionPromote(value);
    numerator = FractionNumerator(exact);
    denominator = FractionDenominator(exact);
    denominator == 0
      ?: FractionRaw(numerator < 0 ?: -1 ?_ 1, 0)
      ?_ {;
          common = FractionGcd(@numerator, @denominator);
          sign = @denominator < 0 ?: -1 ?_ 1;
          FractionRaw(sign * (@numerator // common), sign * (@denominator // common));
      };
};

FractionMediant(leftValue, rightValue) -> {;
    left = FractionPromote(leftValue);
    right = FractionPromote(rightValue);
    FractionRaw(FractionNumerator(left) + FractionNumerator(right), FractionDenominator(left) + FractionDenominator(right));
};

FractionCommonAdd(leftValue, rightValue, policy) -> {;
    left = FractionNormalize(leftValue);
    right = FractionNormalize(rightValue);
    policy == :like && left[:denominator] != right[:denominator]
      ?: .Error("AddLikeDenominator requires equal denominators")
      ?_ _;
    denominator = policy == :like ?: left[:denominator] ?_ FractionLcm(left[:denominator], right[:denominator]);
    FractionRaw(
        left[:numerator] * (denominator // left[:denominator]) + right[:numerator] * (denominator // right[:denominator]),
        denominator
    );
};

FractionExtendedGcd(a, b) -> {;
    oldR := a;
    r := b;
    oldS := 1;
    s := 0;
    {@ step = 1; @r != 0; {;
        quotient = @oldR // @r;
        nextR = @oldR - quotient * @r;
        @oldR ~= @r;
        @r ~= nextR;
        nextS = @oldS - quotient * @s;
        @oldS ~= @s;
        @s ~= nextS;
    }; step += 1 };
    {= gcd=oldR, coefficient=oldS };
};

FractionModInverse(value, modulus) -> {;
    result = FractionExtendedGcd(value, modulus);
    result[:gcd].Abs() == 1 ?: _ ?_ .Error("Farey parent modular inverse does not exist");
    ((result[:coefficient] % modulus) + modulus) % modulus;
};

FractionBaseParents(numerator, denominator) -> {;
    denominator == 1
      ?: (numerator > 0
          ?: {= leftNumerator=numerator-1, leftDenominator=1, rightNumerator=1, rightDenominator=0 }
          ?_ {= leftNumerator=-1, leftDenominator=0, rightNumerator=numerator+1, rightDenominator=1 })
      ?_ {;
          leftDenominator = FractionModInverse(@numerator, @denominator);
          leftNumerator = (@numerator * leftDenominator - 1) // @denominator;
          {=
              leftNumerator = leftNumerator,
              leftDenominator = leftDenominator,
              rightNumerator = @numerator - leftNumerator,
              rightDenominator = @denominator - leftDenominator
          };
      };
};

FractionFareyParents(value) -> {;
    normalized = FractionNormalize(value);
    numerator = normalized[:numerator];
    denominator = normalized[:denominator];
    scale = FractionGcd(numerator, denominator);
    reducedNumerator = numerator // scale;
    reducedDenominator = denominator // scale;
    reducedNumerator == 0
      ?: (scale == 1
          ?: {: FractionRaw(-1,0), FractionRaw(1,0) }
          ?_ {;
              leftDenominator = @scale // 2;
              {: FractionRaw(-1,leftDenominator), FractionRaw(1,@scale-leftDenominator) };
          })
      ?_ {;
          parents = FractionBaseParents(@reducedNumerator, @reducedDenominator);
          leftCopies := (@scale * @reducedDenominator - 2 * parents[:leftDenominator] + @reducedDenominator) // (2 * @reducedDenominator);
          leftCopies < 0 ?: {; @leftCopies ~= 0; } ?_ (leftCopies > @scale - 1 ?: {; @leftCopies ~= @scale - 1; } ?_ _);
          rightCopies = @scale - 1 - leftCopies;
          {:
              FractionRaw(parents[:leftNumerator] + leftCopies * @reducedNumerator, parents[:leftDenominator] + leftCopies * @reducedDenominator),
              FractionRaw(parents[:rightNumerator] + rightCopies * @reducedNumerator, parents[:rightDenominator] + rightCopies * @reducedDenominator)
          };
      };
};

FractionFromPath(path) -> {;
    left := FractionRaw(-1,0);
    right := FractionRaw(1,0);
    current := FractionRaw(0,1);
    {@ index = 1; index <= @path.Len(); {;
        direction = @path[index];
        direction == "L"
          ?: {; @right ~= @current; @current ~= FractionMediant(@left, @current); }
          ?_ (direction == "R"
              ?: {; @left ~= @current; @current ~= FractionMediant(@current, @right); }
              ?_ .Error("Stern-Brocot path directions must be L or R"));
    }; index += 1 };
    current;
};

FractionPath(value, maximum ?= 10000) -> {;
    exact = FractionReduce(FractionFinite(value));
    limit = FractionInteger(maximum, "Stern-Brocot path limit");
    limit >= 0 ?: _ ?_ .Error("Stern-Brocot path limit must be a nonnegative safe integer");
    left := FractionRaw(-1,0);
    right := FractionRaw(1,0);
    current := FractionRaw(0,1);
    path := [];
    {@ step = 1; !FractionSamePair(@current, @exact); {;
        FractionCompare(@exact, @current) < 0
          ?: {; @path ~= @path.Push("L"); @right ~= @current; @current ~= FractionMediant(@left, @current); }
          ?_ {; @path ~= @path.Push("R"); @left ~= @current; @current ~= FractionMediant(@current, @right); };
        @path.Len() <= @limit ?: _ ?_ .Error("Stern-Brocot path too long - this may indicate a bug in the algorithm");
    }; step += 1 };
    path;
};

FractionParent(value) -> {;
    path = FractionPath(value);
    path.Len() == 0 ?: _ ?_ FractionFromPath(path.DropLast());
};

FractionChildren(value) -> {;
    path = FractionPath(value);
    {: FractionFromPath(path.Push("L")), FractionFromPath(path.Push("R")) };
};

FractionAncestors(value) -> {;
    path = FractionPath(value);
    ancestors := [];
    {@ count = 0; count < @path.Len(); {;
        @ancestors ~= @ancestors.Push(FractionFromPath(@path.Slice(1, count + 1)));
    }; count += 1 };
    ancestors.Reverse();
};

FractionRecord(value) -> {;
    exact = FractionPromote(value);
    {=
        schema = "rix.fraction@1",
        numerator = FractionNumerator(exact),
        denominator = FractionDenominator(exact),
        reduced = FractionSamePair(exact, FractionReduce(exact)) ?: 1 ?_ _
    };
};

FractionString(value) -> {;
    numerator = FractionNumerator(value);
    denominator = FractionDenominator(value);
    denominator == 0 || denominator == 1 ?: @"@{numerator}" ?_ @"@{numerator}/@{denominator}";
};

.TypeKnown(:Fraction) ?: _ ?_ .TypeRegister({=
    name = :Fraction,
    nativeType = :Fraction,
    defaultTraits = [:number, :ordered],
    validate = (value) -> 1,
    proto = {= },
    installs = {=
        ADD = [{= name=:FractionAdd, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction))&&((left ? :Fraction)||(left ? :Integer)||(left ? :Rational))&&((right ? :Fraction)||(right ? :Integer)||(right ? :Rational)), impl=(left,right)->FractionCrossAdd(left,right) }],
        SUB = [{= name=:FractionSub, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction))&&((left ? :Fraction)||(left ? :Integer)||(left ? :Rational))&&((right ? :Fraction)||(right ? :Integer)||(right ? :Rational)), impl=(left,right)->FractionCrossAdd(left,right,1) }],
        MUL = [{= name=:FractionMul, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction))&&((left ? :Fraction)||(left ? :Integer)||(left ? :Rational))&&((right ? :Fraction)||(right ? :Integer)||(right ? :Rational)), impl=FractionMultiply }],
        DIV = [{= name=:FractionDiv, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction))&&((left ? :Fraction)||(left ? :Integer)||(left ? :Rational))&&((right ? :Fraction)||(right ? :Integer)||(right ? :Rational)), impl=FractionDivide }],
        POW = [{= name=:FractionPow, prep=(left,right)->(left ? :Fraction)&&(right ? :Integer), impl=FractionPower }],
        NEG = [{= name=:FractionNeg, prep=(value)->value ? :Fraction, impl=(value)->FractionRaw(-FractionNumerator(value),FractionDenominator(value)) }],
        EQ = [{= name=:FractionEq, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction))&&((left ? :Fraction)||(left ? :Integer)||(left ? :Rational))&&((right ? :Fraction)||(right ? :Integer)||(right ? :Rational)), impl=(left,right)->FractionSamePair(left,right) ?: 1 ?_ _ }],
        NEQ = [{= name=:FractionNeq, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction))&&((left ? :Fraction)||(left ? :Integer)||(left ? :Rational))&&((right ? :Fraction)||(right ? :Integer)||(right ? :Rational)), impl=(left,right)->FractionSamePair(left,right) ?: _ ?_ 1 }],
        LT = [{= name=:FractionLt, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction)), impl=(left,right)->FractionCompare(left,right)<0 ?: 1 ?_ _ }],
        LTE = [{= name=:FractionLte, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction)), impl=(left,right)->FractionCompare(left,right)<=0 ?: 1 ?_ _ }],
        GT = [{= name=:FractionGt, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction)), impl=(left,right)->FractionCompare(left,right)>0 ?: 1 ?_ _ }],
        GTE = [{= name=:FractionGte, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction)), impl=(left,right)->FractionCompare(left,right)>=0 ?: 1 ?_ _ }],
        COMPARE = [{= name=:FractionCompare, prep=(left,right)->((left ? :Fraction)||(right ? :Fraction)), impl=FractionCompare }]
    }
});

.TypeInstall(:Fraction);

FractionF = (value) -> FractionPromote(value);
.Host.RegisterMethod("Integer", "F", FractionF, "fraction", "fraction");
.Host.RegisterMethod("Rational", "F", FractionF, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "F", FractionF, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Fraction", (value)->value, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Numerator", FractionNumerator, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Denominator", FractionDenominator, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Rational", (value)->FractionNumerator(value)/FractionDenominator(value), "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Reduce", FractionReduce, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Scale", (value,factor)->FractionRaw(FractionNumerator(value)*FractionInteger(factor,"Fraction scale"),FractionDenominator(value)*FractionInteger(factor,"Fraction scale")), "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Negate", (value)->FractionRaw(-FractionNumerator(value),FractionDenominator(value)), "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Reciprocal", (value)->FractionNumerator(value)==0 ?: .Error("Zero Fraction has no reciprocal") ?_ FractionRaw(FractionDenominator(value),FractionNumerator(value)), "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Mediant", FractionMediant, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "AddLikeDenominator", (value,other)->FractionCommonAdd(value,other,:like), "fraction", "fraction");
.Host.RegisterMethod("Fraction", "AddLCMDenominator", (value,other)->FractionCommonAdd(value,other,:lcm), "fraction", "fraction");
.Host.RegisterMethod("Fraction", "SamePair", (value,other)->FractionSamePair(value,other) ?: 1 ?_ _, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Equivalent", (value,other)->FractionCompare(value,other)==0 ?: 1 ?_ _, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "FareyParents", FractionFareyParents, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "SternBrocotPath", FractionPath, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "SternBrocotParent", FractionParent, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "SternBrocotChildren", FractionChildren, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "SternBrocotAncestors", FractionAncestors, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "SternBrocotDepth", (value)->FractionPath(value).Len(), "fraction", "fraction");
.Host.RegisterMethod("Fraction", "IsSternBrocotValid", (value)->FractionSamePair(FractionFromPath(FractionPath(value)),FractionReduce(value)) ?: 1 ?_ _, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "IsInfinite", (value)->FractionIsInfinite(value) ?: 1 ?_ _, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "ToString", FractionString, "fraction", "fraction");
.Host.RegisterMethod("Fraction", "Record", FractionRecord, "fraction", "fraction");

FractionParse(self, body, modifiers, info) -> {;
    value = .SArith.Parse(body, [], {= });
    value ? :Fraction
      ?: value
      ?_ (((value ? :Integer)||(value ? :Rational))
          ?: FractionPromote(value)
          ?_ .Error(".fraction backticks require one concrete fraction; use .fracfun for symbolic or compound forms"));
};

fractionNamespace = (first, second ?= _) -> second == _ ?: FractionPromote(first,"fraction value") ?_ FractionRaw(first,second);
fractionNamespace._proto = {=
    Parse = FractionParse,
    Fraction = (self, first, second ?= _) -> second == _ ?: FractionPromote(first) ?_ FractionRaw(first,second),
    FromSternBrocotPath = (self, path) -> FractionFromPath(path)
};

.Host.RegisterCallableValue("fraction", fractionNamespace, "Representation-sensitive unreduced fractions", ["Algebra", "Exact", "Symbolic"]);
`, sourcePath: "bundled:fraction", kind: "rix" });
  catalog.addMetadata({ id: "geometry", description: "Exact ruler-and-compass geometry with explicit intersections and portable Graphics snapshots.", kind: "host", mount: "geometry", exports: ["Point", "Line", "Circle", "Midpoint", "PerpendicularBisector", "Circumcircle", "Intersect", "Points", "Status", "Draw"], groups: ["Geometry", "Graphics", "Exact"], permissions: [], provides: ["rix.geometry@1", "rix.geometry.intersection@1"], schemas: ["rix.geometry@1", "rix.geometry.intersection@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:geometry" }, { sourcePath: "bundled:geometry", kind: "host" });
  catalog.registerInstaller("geometry", install6);
  catalog.addMetadata({ id: "gif", description: "Deterministic animated GIF rendering from Slides, Timelines, or Snapshots through PNG frames.", kind: "host", mount: "gif", exports: ["Render"], groups: ["Renderers"], permissions: ["process", "files"], requires: ["rix.renderer.png@1"], provides: ["rix.renderer.gif@1"], targets: ["gif", "image/gif"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:gif" }, { sourcePath: "bundled:gif", kind: "host" });
  catalog.registerInstaller("gif", install24);
  catalog.addMetadata({ id: "gltf", description: "Browser-safe glTF 2.0 JSON exporter for retained Scene3D values.", kind: "host", mount: "gltf", exports: ["Render"], groups: ["Renderers", "Scene3D"], permissions: [], requires: ["rix.scene3d@1"], provides: ["rix.renderer.gltf@1"], targets: ["gltf", "model/gltf+json"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:gltf" }, { sourcePath: "bundled:gltf", kind: "host" });
  catalog.registerInstaller("gltf", install22);
  catalog.addMetadata({ id: "html", description: "Standalone semantic HTML renderer for portable RiX output trees.", kind: "host", mount: "html", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.html@1"], targets: ["html", "text/html"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:html" }, { sourcePath: "bundled:html", kind: "host" });
  catalog.registerInstaller("html", install17);
  catalog.addMetadata({ id: "latex", description: "Standalone LaTeX renderer for portable RiX documents and figures.", kind: "host", mount: "latex", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.latex@1"], targets: ["latex", "text/x-tex"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:latex" }, { sourcePath: "bundled:latex", kind: "host" });
  catalog.registerInstaller("latex", install19);
  catalog.addMetadata({ id: "linalg", description: "Exact dense linear algebra and coordinate-aware tensor transformations.", kind: "host", mount: "linalg", exports: ["Rref", "Rank", "Determinant", "Inverse", "Solve", "VectorSpace", "Frame", "Tensor", "Vector", "Covector", "ChangeMatrix", "Transform", "Transform!", "Components", "Pair", "SameTensor"], groups: ["LinearAlgebra", "Exact"], permissions: [], provides: ["rix.linear-algebra@1", "rix.tensor@1"], schemas: ["rix.linalg.result@1", "rix.linalg.vector-space@1", "rix.linalg.frame@1", "rix.linalg.tensor@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:linalg" }, { sourcePath: "bundled:linalg", kind: "host" });
  catalog.registerInstaller("linalg", install9);
  catalog.addMetadata({ id: "markdown", description: "CommonMark-oriented renderer for portable RiX documents.", kind: "host", mount: "markdown", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.markdown@1"], targets: ["markdown", "text/markdown"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:markdown" }, { sourcePath: "bundled:markdown", kind: "host" });
  catalog.registerInstaller("markdown", install16);
  catalog.addMetadata({ id: "nd", description: "Exact n-dimensional geometry with explicit affine and Cayley projection records.", kind: "host", mount: "nd", exports: ["Point", "Polyline", "Polytope", "Hypercube", "Projection", "CoordinateProjection", "CayleyRotation", "Compose", "Project", "ToScene3D"], groups: ["Geometry", "Scene3D", "Exact"], permissions: [], requires: ["rix.scene3d@1"], provides: ["rix.nd@1", "rix.nd.projection@1"], schemas: ["rix.nd@1", "rix.nd.projection@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:nd" }, { sourcePath: "bundled:nd", kind: "host" });
  catalog.registerInstaller("nd", install5);
  catalog.addMetadata({ id: "numerics", description: "Backend-neutral bounded enclosure and refinement orchestration.", kind: "rix", mount: "numerics", exports: ["Request", "WorkPolicy", "EffectiveLimits", "Enclose", "Refine", "Sample", "Capabilities", "CheckResult", "NthRoot", "Sqrt", "Kantorovich"], groups: ["Numerics"], permissions: [], requires: ["rix.oracle@1"], provides: ["rix.numerics@1", "rix.enclosable-real-consumer@1"], schemas: ["rix.numerics.refinement-request@1", "rix.numerics.enclosure@1", "rix.numerics.algorithm-real@1"], defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:numerics" }, { source: `/**
id: numerics
description: Backend-neutral bounded enclosure and refinement orchestration.
kind: rix
mount: numerics
exports: [Request, WorkPolicy, EffectiveLimits, Enclose, Refine, Sample, Capabilities, CheckResult, NthRoot, Sqrt, Kantorovich]
groups: [Numerics]
permissions: []
requires: [rix.oracle@1]
provides: [rix.numerics@1, rix.enclosable-real-consumer@1]
schemas: [rix.numerics.refinement-request@1, rix.numerics.enclosure@1, rix.numerics.algorithm-real@1]
defaultEnabled: false
**/

NumericsOption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

NumericsNonnegativeInteger(value, label) -> {;
    exact = value ~!: :Integer;
    exact >= 0 ?: exact ?_ .Error(@"@{label} must be a nonnegative Integer");
};

NumericsPositive(value, label) -> {;
    exact = value ~!: :Rational;
    exact > 0 ?: exact ?_ .Error(@"@{label} must be positive");
};

NumericsNonnegative(value, label) -> {;
    exact = value ~!: :Rational;
    exact >= 0 ?: exact ?_ .Error(@"@{label} must be nonnegative");
};

NumericsCalls(result) -> result[:work].Has("calls") ?: result[:work][:calls] ?_ 0;

NumericsAsInterval(value) -> (value ? :RationalInterval)
  ?: value
  ?_ {; exact = @value ~!: :Rational; exact:exact; };

NumericsAlgorithmCapabilities(real) -> {=
    valueKind=:numericsCapabilities,
    schema="rix.numerics.capabilities@1",
    backend=:numerics,
    representation=real[:kind],
    denotation=:singleton,
    operations=[:enclose, :refine],
    evidenceLevels=[real[:evidenceLevel]],
    certified=1,
    arbitraryRefinement=1,
    deterministic=1,
    minimumWidth=0,
    maxCalls=100000,
    maxIterations=100000
};

NumericsExactOracle(real) -> real[:constructor] == :rational;

NumericsSourceResult(real, requestedWidth, maxCalls, trace) ->
    NumericsExactOracle(real)
      ?: {;
          exact = @real[:parameters][:value] ~!: :Rational;
          interval = exact:exact;
          {=
              status=:enclosed,
              interval=interval,
              achievedWidth=0,
              approximation=.CertifiedApproximation(exact, interval, {= provider=:numerics, reason=:exactSource }),
              evidenceLevel=:proof,
              evidence={= kind=:exactScalar, property=:containment },
              work={= calls=0, iterations=0, exhausted=_ },
              trace=[]
          };
      }
      ?_ real.Refine(.RefinementRequest({=
          absoluteWidth=requestedWidth,
          maxWork=maxCalls,
          maxCalls=maxCalls,
          maxIterations=maxCalls,
          trace=trace
      }, :refine, real.NumericsCapabilities()));

NumericsUnknownAlgorithm(real, request, interval, work, reason) -> {=
    valueKind=:enclosure,
    schema="rix.numerics.enclosure@1",
    status=:unknown,
    interval=interval,
    certified=_,
    goalMet=_,
    requestedWidth=request[:absoluteWidth],
    achievedWidth=interval.Width(),
    approximation=_,
    evidenceLevel=real[:evidenceLevel],
    backend=:numerics,
    operation=request[:operation],
    trace=[],
    work=work,
    diagnostics=[reason],
    evidence={= kind=:unresolvedDomain, reason=reason },
    source=real[:provenance]
};

NumericsNthRootRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    degree = real[:degree];
    sourceWidth = requestedWidth < 1 ?: requestedWidth^degree / 4 ?_ requestedWidth / 4;
    sourceBudget = maxCalls // 2;
    sourceResult = NumericsSourceResult(real[:radicand], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    qInterval = sourceResult[:interval];
    exactZero = qInterval.Low() == 0 && qInterval.High() == 0;
    positive = qInterval.Low() >= 0;
    negative = qInterval.High() <= 0;
    odd = .Mod(degree, 2) == 1;
    domainResolved = exactZero || positive || (negative && odd);
    domainResolved ?: {;
        sign = @negative ?: -1 ?_ 1;
        workingLow = @negative ?: 0 - @qInterval.High() ?_ @qInterval.Low();
        workingHigh = @negative ?: 0 - @qInterval.Low() ?_ @qInterval.High();
        upper := @exactZero ?: 0 ?_ .Max(1, workingHigh);
        lower := @exactZero ?: 0 ?_ workingLow / (upper^(@degree - 1));
        trace := [];
        iterations := 0;
        remainingCalls = @maxCalls - @sourceCalls;
        iterationLimit = .Min(@maxIterations, remainingCalls);
        {@ step=1;
           !@exactZero && (@upper - @lower) > @requestedWidth && @iterations < @iterationLimit;
           {;
               partner = @workingHigh / (@upper^(@degree - 1));
               nextUpper = ((@degree - 1) * @upper + partner) / @degree;
               nextLower = @workingLow / (nextUpper^(@degree - 1));
               @upper ~= nextUpper;
               @lower ~= nextLower;
               @iterations += 1;
               @trace ~= @request[:trace] ?: @trace.Push({=
                   iteration=@iterations,
                   guess=@sign * @upper,
                   partner=@sign * @lower,
                   interval=@sign == 1 ?: @lower:@upper ?_ (-@upper):(-@lower),
                   actualized=1
               }) ?_ @trace;
           };
           step += 1
        };
        interval = sign == 1 ?: lower:upper ?_ (-upper):(-lower);
        achievedWidth = interval.Width();
        goalMet = achievedWidth <= @requestedWidth;
        calls = @sourceCalls + iterations;
        status = goalMet ?: :enclosed ?_ :budgetExhausted;
        candidate = interval.Midpoint();
        approximation = .CertifiedApproximation(candidate, interval, {=
            provider=:numerics,
            algorithm=:weightedNthRoot,
            degree=@degree,
            reason=status,
            actualized=1
        });
        {=
            valueKind=:enclosure,
            schema="rix.numerics.enclosure@1",
            status=status,
            interval=interval,
            certified=1,
            goalMet=goalMet,
            requestedWidth=@requestedWidth,
            achievedWidth=achievedWidth,
            approximation=approximation,
            evidenceLevel=@real[:evidenceLevel],
            backend=:numerics,
            operation=@request[:operation],
            trace=trace,
            work={=
                calls=calls,
                iterations=iterations,
                maxCalls=@maxCalls,
                maxIterations=@maxIterations,
                sourceCalls=@sourceCalls,
                exhausted=!goalMet
            },
            diagnostics=goalMet ?: [] ?_ [:workBudgetReached],
            evidence={=
                kind=:weightedArithmeticGeometricMean,
                property=:containment,
                degree=@degree,
                source=@sourceResult[:evidence]
            },
            source=@real[:provenance]
        };
    } ?_ NumericsUnknownAlgorithm(
        real,
        request,
        qInterval,
        {= calls=sourceCalls, iterations=0, maxCalls=maxCalls, exhausted=sourceCalls>=maxCalls },
        :radicandSignNotCertified
    );
};

NumericsNthRoot(value, degree ?= 2, options ?= {= }) -> {;
    n = degree ~!: :Integer;
    n >= 2 ?: _ ?_ .Error("NthRoot degree must be an Integer at least two");
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=:weightedNthRoot,
        degree=n,
        radicand=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=2, algorithm=:weightedNthRoot, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsNthRootRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsNthRootRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsIntervalMinAbs(interval) ->
    interval.ContainsZero() ?: 0 ?_ .Min(interval.Low().Abs(), interval.High().Abs());

NumericsIntervalMaxAbs(interval) -> .Max(interval.Low().Abs(), interval.High().Abs());

NumericsKantorovichRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    current := real[:initialEnclosure];
    guess := real[:initial];
    trace := [];
    calls := 0;
    iterations := 0;
    stalled := _;
    {@ step=1;
       @current.Width() > @requestedWidth && @iterations < @maxIterations && @calls + 3 <= @maxCalls && !@stalled;
       {;
           fValue = @real[:function](@guess) ~!: :Rational;
           derivativeValue = @real[:derivative](@guess) ~!: :Rational;
           derivativeValue != 0 ?: _ ?_ .Error("Kantorovich Newton step encountered a zero point derivative");
           derivativeRange = @real[:derivative](@current) ~!: :RationalInterval;
           @calls += 3;
           @iterations += 1;
           derivativeRange.ContainsZero()
             ?: {; @stalled ~= 1; }
             ?_ {;
                 newtonGuess = @guess - @fValue / @derivativeValue;
                 newtonImage = (@guess:@guess) - (@fValue:@fValue) / @derivativeRange;
                 overlaps = @current.Overlaps(newtonImage);
                 overlaps ?: _ ?_ .Error("Interval Newton contradicted the Kantorovich enclosure");
                 next = @current.Intersection(newtonImage);
                 contracted = next.Width() < @current.Width();
                 selectedGuess = next.ContainsValue(newtonGuess) ?: newtonGuess ?_ next.Midpoint();
                 @trace ~= @request[:trace] ?: @trace.Push({=
                     iteration=@iterations,
                     guess=newtonGuess,
                     candidate=selectedGuess,
                     derivative=@derivativeValue,
                     derivativeInterval=@derivativeRange,
                     interval=next,
                     errorRadius=next.Width()/2,
                     actualized=1
                 }) ?_ @trace;
                 @current ~= next;
                 @guess ~= selectedGuess;
                 contracted ?: _ ?_ {; @stalled ~= 1; };
             };
       };
       step += 1
    };
    achievedWidth = current.Width();
    goalMet = achievedWidth <= requestedWidth;
    budgetReached = iterations >= maxIterations || calls + 3 > maxCalls;
    status = goalMet ?: :enclosed ?_ (budgetReached ?: :budgetExhausted ?_ :resolutionFloor);
    candidate = current.ContainsValue(guess) ?: guess ?_ current.Midpoint();
    approximation = .CertifiedApproximation(candidate, current, {=
        provider=:numerics,
        algorithm=:kantorovichIntervalNewton,
        reason=status,
        actualized=1
    });
    {=
        valueKind=:enclosure,
        schema="rix.numerics.enclosure@1",
        status=status,
        interval=current,
        certified=1,
        goalMet=goalMet,
        requestedWidth=requestedWidth,
        achievedWidth=achievedWidth,
        approximation=approximation,
        evidenceLevel=real[:evidenceLevel],
        backend=:numerics,
        operation=request[:operation],
        trace=trace,
        work={=
            calls=calls,
            iterations=iterations,
            maxCalls=maxCalls,
            maxIterations=maxIterations,
            exhausted=!goalMet && budgetReached
        },
        diagnostics=goalMet ?: [] ?_ [stalled ?: :intervalNewtonResolutionFloor ?_ :workBudgetReached],
        evidence={=
            kind=:kantorovichWithIntervalNewton,
            property=:existenceUniquenessAndContainment,
            condition=real[:condition],
            derivativeLower=real[:derivativeLower],
            secondDerivativeUpper=real[:secondDerivativeUpper],
            assumptions=real[:assumptions]
        },
        source=real[:provenance]
    };
};

NumericsKantorovich(function, derivative, options ?= {= }) -> {;
    domain = NumericsOption(options, "interval", _) ~!: :RationalInterval;
    initial = NumericsOption(options, "initial", domain.Midpoint()) ~!: :Rational;
    domain.ContainsValue(initial) ?: _ ?_ .Error("Kantorovich initial point must lie in its interval");
    derivativeLower = NumericsPositive(
        NumericsOption(options, "derivativelower", _),
        "Kantorovich derivativeLower"
    );
    secondDerivativeUpper = NumericsNonnegative(
        NumericsOption(options, "secondderivativeupper", _),
        "Kantorovich secondDerivativeUpper"
    );
    fInitial = (initial |> function) ~!: :Rational;
    derivativeInitial = (initial |> derivative) ~!: :Rational;
    derivativeInitial != 0 ?: _ ?_ .Error("Kantorovich initial derivative must be nonzero");
    derivativeRange = NumericsAsInterval(domain |> derivative);
    derivativeRange.ContainsZero() ?: .Error("Kantorovich derivative interval must exclude zero") ?_ _;
    observedDerivativeLower = NumericsIntervalMinAbs(derivativeRange);
    observedDerivativeLower >= derivativeLower
      ?: _
      ?_ .Error("Kantorovich derivativeLower exceeds the certified interval bound");
    secondDerivativeFunction = NumericsOption(options, "secondderivative", _);
    secondDerivativeChecked = secondDerivativeFunction != _;
    secondDerivativeRange = secondDerivativeChecked
      ?: NumericsAsInterval(domain |> secondDerivativeFunction)
      ?_ _;
    secondDerivativeChecked
      ?: (NumericsIntervalMaxAbs(secondDerivativeRange) <= secondDerivativeUpper
           ?: _
           ?_ .Error("Kantorovich secondDerivativeUpper is smaller than the certified interval bound"))
      ?_ _;
    beta = (fInitial / derivativeInitial).Abs();
    condition = beta * secondDerivativeUpper / (2 * derivativeLower);
    condition <= 1/4
      ?: _
      ?_ .Error("Kantorovich condition requires beta*M/(2*m) <= 1/4");
    radius = 2 * beta;
    initialEnclosure = (initial - radius):(initial + radius);
    domain.Contains(initialEnclosure)
      ?: _
      ?_ .Error("Kantorovich certified initial ball must remain inside the supplied interval");
    evidenceLevel = NumericsOption(options, "evidencelevel", :constructorGuarantee);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=:kantorovichIntervalNewton,
        function=function,
        derivative=derivative,
        initial=initial,
        domain=domain,
        initialEnclosure=initialEnclosure,
        derivativeLower=derivativeLower,
        secondDerivativeUpper=secondDerivativeUpper,
        condition=condition,
        evidenceLevel=evidenceLevel,
        assumptions={=
            derivativeMatchesFunction=1,
            twiceDifferentiableOnDomain=1,
            secondDerivativeBound=secondDerivativeChecked ?: :intervalChecked ?_ :callerGuarantee
        },
        provenance={= plugin=:numerics, version=2, algorithm=:kantorovichIntervalNewton }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsKantorovichRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsKantorovichRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsRequest(options ?= {= }, operation ?= _, capabilities ?= _) ->
    .RefinementRequest(options, operation, capabilities);

NumericsWorkPolicy(options ?= {= }) -> NumericsRequest(options)[:work];

NumericsEffectiveLimits(request, capabilities ?= {= }) ->
    .RefinementEffectiveLimits(request, capabilities);

CheckEnclosure(result, request, capabilities ?= _) ->
    .RefinementCheck(result, request, capabilities);

CheckedEnclosure(result, request, capabilities) -> {;
    check = CheckEnclosure(result, request, capabilities);
    check[:valid] ?: result ?_ .Error("EnclosableReal provider returned an invalid enclosure record");
};

InvokeProvider(value, request, selectedOperation) ->
    selectedOperation == :enclose ?: value.Enclose(request) ?_
    selectedOperation == :refine ?: value.Refine(request) ?_
    selectedOperation == :sample ?: value.Sample(request) ?_
    .RefinementUnsupported(request, value.NumericsCapabilities(), :unknownOperation);

ProviderOperation(value, options, operation) -> {;
    capabilities = value.NumericsCapabilities();
    request = NumericsRequest(options, operation, capabilities);
    supported = .RefinementSupports(capabilities, operation);
    result = supported ?: InvokeProvider(value, request, operation)
                       ?_ .RefinementUnsupported(request, capabilities, :operationUnsupported);
    supported ?: CheckedEnclosure(result, request, capabilities) ?_ result;
};

numericsNamespace = {= };
numericsNamespace._proto = {=
    Request = (self, options ?= {= }) -> NumericsRequest(options),
    WorkPolicy = (self, options ?= {= }) -> NumericsWorkPolicy(options),
    EffectiveLimits = (self, request, capabilities ?= {= }) -> NumericsEffectiveLimits(request, capabilities),
    Enclose = (self, value, options ?= {= }) -> ProviderOperation(value, options, :enclose),
    Refine = (self, value, options ?= {= }) -> ProviderOperation(value, options, :refine),
    Sample = (self, value, options ?= {= }) -> ProviderOperation(value, options, :sample),
    NthRoot = (self, value, degree ?= 2, options ?= {= }) -> NumericsNthRoot(value, degree, options),
    Sqrt = (self, value, options ?= {= }) -> NumericsNthRoot(value, 2, options),
    Kantorovich = (self, function, derivative, options ?= {= }) -> NumericsKantorovich(function, derivative, options),
    Approximation = (self, result) -> result.Has("approximation") ?: result[:approximation] ?_ _,
    Capabilities = (self, value) -> value.NumericsCapabilities(),
    CheckResult = (self, result, options ?= {= }, capabilities ?= _) ->
        CheckEnclosure(result, NumericsRequest(options), capabilities)
};

.Host.RegisterValue("numerics", numericsNamespace, "Backend-neutral bounded enclosure and refinement orchestration", ["Numerics"]);
`, sourcePath: "bundled:numerics", kind: "rix" });
  catalog.addMetadata({ id: "optimize", description: "Exact linear-program models and deterministic Phase 1 simplex optimization.", kind: "host", mount: "optimize", exports: ["LinearProgram", "Solve", "Evaluate", "Maximize", "Minimize"], groups: ["Optimization", "Exact"], permissions: [], requires: ["rix.linear-algebra@1"], provides: ["rix.optimization@1", "rix.linear-program@1"], schemas: ["rix.optimize.linear-program@1", "rix.optimize.result@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:optimize" }, { sourcePath: "bundled:optimize", kind: "host" });
  catalog.registerInstaller("optimize", install10);
  catalog.addMetadata({ id: "oracle", description: "Exact rational-betweenness oracle demonstrations and bounded refinement.", kind: "rix", mount: "oracle", exports: ["Rational", "From", "Operation", "Query", "Answer", "Decision", "Prophecy", "WorkPolicy", "Evidence", "Ask", "AskAll", "CheckRange", "Refine"], groups: ["Numerics", "Exact"], permissions: [], provides: ["rix.oracle@1", "rix.enclosable-real@1"], schemas: ["rix.oracle@1"], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:oracle" }, { source: `/**
id: oracle
description: Exact rational-betweenness oracle demonstrations and bounded refinement.
kind: rix
mount: oracle
exports: [Rational, From, Operation, Query, Answer, Decision, Prophecy, WorkPolicy, Evidence, Ask, AskAll, CheckRange, Refine]
groups: [Numerics, Exact]
permissions: []
provides: [rix.oracle@1, rix.enclosable-real@1]
schemas: [rix.oracle@1]
defaultEnabled: false
**/

Option(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

RequirePositive(value, label) -> {;
    rational = value ~!: :Rational;
    rational > 0 ?: rational ?_ .Error(@"@{label} must be a positive rational");
};

RequireNonnegativeInteger(value, label) -> {;
    integer = value ~!: :Integer;
    integer >= 0 ?: integer ?_ .Error(@"@{label} must be a nonnegative integer");
};

AsInterval(value) -> value ~!: :RationalInterval;

IntervalLow(interval) -> AsInterval(interval).Low();
IntervalHigh(interval) -> AsInterval(interval).High();
IntervalWidth(interval) -> AsInterval(interval).Width();

OracleExactScalar(value) -> (value ? :Integer) || (value ? :Rational);
OracleValue(value) -> (value ? :Map) && value[:valueKind] == :oracle;

OracleRefinableSingleton(value) -> {;
    exact = OracleExactScalar(value);
    exact ?: 1 ?_ {;
        mapValue = @value ? :Map;
        mapValue ?: {;
            capabilities = @value.NumericsCapabilities();
            capabilities[:certified] &&
              capabilities[:arbitraryRefinement] &&
              capabilities[:denotation] == :singleton;
        } ?_ _;
    };
};

OracleBridgePair(left, right) ->
    OracleRefinableSingleton(left) && OracleRefinableSingleton(right) &&
    (!OracleExactScalar(left) || !OracleExactScalar(right));

OracleEvidenceRank(level) -> {?
    level == :proof ? 4;
    level == :constructorGuarantee ? 3;
    level == :assumed ? 2;
    level == :observed ? 1;
    0
};

OracleWeakerEvidence(left, right) ->
    OracleEvidenceRank(left) <= OracleEvidenceRank(right) ?: left ?_ right;

OracleWorkPolicy(options ?= {= }) -> {=
    valueKind = :oracleWorkPolicy,
    maxCalls = RequireNonnegativeInteger(Option(options, "maxcalls", 100), "maxCalls"),
    maxIterations = RequireNonnegativeInteger(Option(options, "maxiterations", 100), "maxIterations"),
    maxAlternatives = RequireNonnegativeInteger(Option(options, "maxalternatives", 20), "maxAlternatives"),
    seed = Option(options, "seed", 1),
    trace = Option(options, "trace", 1)
};

OracleEvidence(property, level, subject, witness ?= _, diagnostics ?= []) -> {=
    valueKind = :oracleEvidence,
    property = property,
    level = level,
    subject = subject,
    witness = witness,
    diagnostics = diagnostics
};

OracleQuery(interval, delta, auxiliary ?= _) -> {;
    exactInterval = AsInterval(interval);
    exactDelta = RequirePositive(delta, "delta");
    {=
        valueKind = :oracleQuery,
        schema = "rix.oracle.query@1",
        interval = exactInterval,
        delta = exactDelta,
        auxiliary = auxiliary
    };
};

OracleProphecy(real, interval, query ?= _, branch ?= :direct) -> {=
    valueKind = :oracleProphecy,
    schema = "rix.oracle.prophecy@1",
    interval = AsInterval(interval),
    oracle = real,
    query = query,
    provenance = {=
        constructor = real[:constructor],
        procedure = real[:procedure],
        branch = branch,
        seed = real[:seed]
    }
};

OracleAnswer(status, query, prophecy ?= _, reason ?= _, procedure ?= _) -> {;
    validStatus = {| :yes, :no, :unknown |}.Has(status);
    validStatus ?: {=
        valueKind = :oracleAnswer,
        schema = "rix.oracle.answer@1",
        status = status,
        prophecy = prophecy,
        query = query,
        auxiliary = _,
        reason = reason,
        procedure = procedure,
        evidence = _,
        work = {= calls = 1, iterations = 1 }
    } ?_ .Error("Oracle answer status must be :yes, :no, or :unknown");
};

OracleDecision(answer) -> {;
    check = OracleCheckRange(answer);
    check[:valid] ?: {?
      answer[:status] == :yes ? 1;
      answer[:status] == :no ? _;
      answer[:status] == :unknown ? .Undecided(:oracleUnknown, {=
        reason = answer[:reason],
        procedure = answer[:procedure],
        query = answer[:query],
        prophecy = answer[:prophecy],
        evidence = answer[:evidence],
        work = answer[:work]
      });
      .Error("Oracle Decision requires an answer with :yes, :no, or :unknown status")
    } ?_ .Error("Oracle Decision received an answer that violates Range");
};

BuildRationalOracle(exactValue, selectedProcedure, options) -> {;
    real = {=
        valueKind = :oracle,
        schema = "rix.oracle@1",
        kind = :complete,
        constructor = :rational,
        procedure = selectedProcedure,
        parameters = {= value = exactValue },
        eta = _,
        declaredProperties = [:range, :existence, :separation, :disjointness, :consistency, :singularity, :closure],
        choicePolicy = selectedProcedure == :randomHalo ?: :enumerable ?_ :single,
        seed = Option(options, "seed", 1),
        provenance = {= plugin = :oracle, version = 1, source = :rationalConstructor }
    };
    real._proto = {=
        Enclose = (self, request) -> OracleProtocolEnclose(self, request),
        Refine = (self, request) -> OracleProtocolEnclose(self, request),
        NumericsCapabilities = (self) -> OracleNumericsCapabilities(self)
    };
    real ~!: :Oracle;
};

RationalOracle(value, options ?= {= }) -> {;
    exactValue = value ~!: :Rational;
    procedure = Option(options, "procedure", :singular);
    allowed = {| :singular, :reflexive, :halo, :randomHalo, :bisection |};
    allowed.Has(procedure) ?: BuildRationalOracle(exactValue, procedure, options)
                           ?_ .Error("Unknown rational oracle procedure");
};

BuildSourceOracle(source) -> {;
    capabilities = source.NumericsCapabilities();
    valid = capabilities[:certified] &&
      capabilities[:arbitraryRefinement] &&
      capabilities[:denotation] == :singleton;
    valid ?: _ ?_ .Error("Oracle conversion requires one certified arbitrarily refinable singleton real");
    real = {=
        valueKind = :oracle,
        schema = "rix.oracle@1",
        kind = :adapter,
        constructor = :refinableAdapter,
        procedure = :delegatedRefinement,
        source = source,
        parameters = {= source=source },
        declaredProperties = [:range, :existence, :separation, :consistency, :singularity, :closure],
        provenance = {=
            plugin=:oracle,
            version=2,
            source=:certifiedSingletonAdapter,
            backend=capabilities[:backend]
        }
    };
    real._proto = {=
        Enclose = (self, request) -> OracleProtocolEnclose(self, request),
        Refine = (self, request) -> OracleProtocolEnclose(self, request),
        NumericsCapabilities = (self) -> OracleNumericsCapabilities(self)
    };
    .ImmutableValue(real ~!: :Oracle);
};

OracleFrom(value) -> {?
    OracleValue(value) ? value;
    OracleExactScalar(value) ? RationalOracle(value);
    OracleRefinableSingleton(value) ? BuildSourceOracle(value);
    .Error("Oracle conversion requires an exact scalar or certified refinable singleton; Float and finite set enclosures require explicit interpretation")
};

BuildArithmeticOracle(operation, left, right ?= _) -> {;
    unary = right == _;
    a = OracleFrom(left);
    b = unary ?: _ ?_ OracleFrom(right);
    real = {=
        valueKind = :oracle,
        schema = "rix.oracle@1",
        kind = :arithmetic,
        constructor = :arithmetic,
        procedure = :intervalRefinement,
        operation = operation,
        left = a,
        right = b,
        parameters = {= operation=operation, left=a, right=b },
        declaredProperties = [:range, :existence, :separation, :consistency, :singularity, :closure],
        provenance = {= plugin=:oracle, version=2, source=:arithmeticRecipe, operation=operation }
    };
    real._proto = {=
        Enclose = (self, request) -> OracleProtocolEnclose(self, request),
        Refine = (self, request) -> OracleProtocolEnclose(self, request),
        NumericsCapabilities = (self) -> OracleNumericsCapabilities(self)
    };
    .ImmutableValue(real ~!: :Oracle);
};

OracleOperation(operation, left, right ?= _) -> {?
    operation == :neg ? BuildArithmeticOracle(:neg, left);
    operation == :abs ? BuildArithmeticOracle(:abs, left);
    operation == :add ? BuildArithmeticOracle(:add, left, right);
    operation == :sub ? BuildArithmeticOracle(:sub, left, right);
    operation == :mul ? BuildArithmeticOracle(:mul, left, right);
    operation == :div ? BuildArithmeticOracle(:div, left, right);
    operation == :pow ? BuildArithmeticOracle(:pow, left, right);
    .Error("Unsupported Oracle arithmetic operation")
};

PointProphecy(real, query, branch) -> {;
    value = real[:parameters][:value];
    OracleProphecy(real, value:value, query, branch);
};

HaloProphecy(real, query, branch) -> {;
    value = real[:parameters][:value];
    interval = query[:interval];
    low = IntervalLow(interval);
    high = IntervalHigh(interval);
    prophecyLow = .Min(value, high);
    prophecyHigh = .Max(value, low);
    OracleProphecy(real, prophecyLow:prophecyHigh, query, branch);
};

SingularAnswer(real, query, procedure) -> {;
    value = real[:parameters][:value];
    interval = query[:interval];
    low = IntervalLow(interval);
    high = IntervalHigh(interval);
    inside = value >= low && value <= high;
    point = PointProphecy(real, query, procedure);
    inside ?: OracleAnswer(:yes, query, point, :contained, procedure)
           ?_ OracleAnswer(:no, query, point, :disjoint, procedure);
};

ReflexiveAnswer(real, query, procedure) -> {;
    value = real[:parameters][:value];
    interval = query[:interval];
    low = IntervalLow(interval);
    high = IntervalHigh(interval);
    inside = value >= low && value <= high;
    inside ?: OracleAnswer(:yes, query, OracleProphecy(real, interval, query, :reflexive), :contained, procedure)
           ?_ OracleAnswer(:no, query, PointProphecy(real, query, procedure), :disjoint, procedure);
};

HaloAnswer(real, query, procedure, branch, yesReason, noReason) -> {;
    value = real[:parameters][:value];
    interval = query[:interval];
    delta = query[:delta];
    low = IntervalLow(interval);
    high = IntervalHigh(interval);
    inOpenHalo = value > low - delta && value < high + delta;
    inOpenHalo ?: OracleAnswer(:yes, query, HaloProphecy(real, query, branch), yesReason, procedure)
               ?_ OracleAnswer(:no, query, PointProphecy(real, query, procedure), noReason, procedure);
};

AskWithProcedure(real, query, procedure) -> {?
    procedure == :singular ? SingularAnswer(real, query, procedure);
    procedure == :reflexive ? ReflexiveAnswer(real, query, procedure);
    procedure == :halo ? HaloAnswer(real, query, procedure, :halo, :withinHalo, :outsideHalo);
    procedure == :bisection ? HaloAnswer(real, query, procedure, :bisection, :bisectionWitness, :separated);
    OracleAnswer(:unknown, query, _, :procedureUnknown, procedure)
};

OracleCheckReturnedRange(answer, status, query, prophecy) -> {;
    interval = query[:interval];
    delta = query[:delta];
    low = IntervalLow(interval);
    high = IntervalHigh(interval);
    prophecyInterval = prophecy[:interval];
    prophecyLow = IntervalLow(prophecyInterval);
    prophecyHigh = IntervalHigh(prophecyInterval);
    intersects = prophecyHigh >= low && prophecyLow <= high;
    withinHalo = prophecyLow > low - delta && prophecyHigh < high + delta;
    valid = status == :yes ?: (intersects && withinHalo) ?_ !intersects;
    {=
        valid = valid,
        reason = valid ?: :rangeChecked ?_ :rangeViolation,
        status = status,
        intersects = intersects,
        withinHalo = withinHalo,
        answer = answer
    };
};

OracleCheckRange(answer) -> {;
    status = answer[:status];
    query = answer[:query];
    prophecy = answer[:prophecy];
    validShape = {? status == :yes ? prophecy != _;
                   status == :no ? 1;
                   status == :unknown ? prophecy == _;
                   _ };

    {? !validShape ? {= valid = _, reason = :invalidAnswerShape, answer = answer };
       status == :unknown ? {= valid = 1, reason = :unknownHasNoRangeClaim, answer = answer };
       (status == :no && prophecy == _) ? {= valid = 1, reason = :noWithoutReturnedProphecy, answer = answer };
       OracleCheckReturnedRange(answer, status, query, prophecy)
    };
};

CheckedAnswer(answer) -> {;
    check = OracleCheckRange(answer);
    check[:valid] ?: answer ?_ .Error("Oracle procedure produced an answer that violates Range");
};

OracleAsk(real, interval, delta, auxiliary ?= _) -> {;
    real[:constructor] == :rational ?: _ ?_ .Error("Phase 1 Ask supports rational oracle constructors");
    query = OracleQuery(interval, delta, auxiliary);
    procedure = real[:procedure];
    chosen = procedure == :randomHalo
        ?: (.Mod(real[:seed], 2) == 0 ?: :singular ?_ :halo)
        ?_ procedure;
    CheckedAnswer(AskWithProcedure(real, query, chosen));
};

RandomHaloAlternatives(real, interval, delta, maxAlternatives) -> {;
    query = OracleQuery(interval, delta, _);
    singular = CheckedAnswer(AskWithProcedure(real, query, :singular));
    maxAlternatives == 1 ?: [singular]
        ?_ [singular, CheckedAnswer(AskWithProcedure(real, query, :halo))];
};

OracleAskAll(real, interval, delta, options ?= {= }) -> {;
    maxAlternatives = OracleWorkPolicy(options)[:maxAlternatives];
    maxAlternatives == 0 ?: [] ?_ (
      real[:procedure] == :randomHalo
        ?: RandomHaloAlternatives(real, interval, delta, maxAlternatives)
        ?_ [OracleAsk(real, interval, delta)]
    );
};

OracleRefineRational(real, options ?= {= }) -> {;
    real[:constructor] == :rational ?: _ ?_ .Error("Phase 1 Refine supports rational oracle constructors");
    requestedWidth = RequirePositive(Option(options, "width", 1 / 1000), "width");
    maxCalls = RequireNonnegativeInteger(Option(options, "maxcalls", 100), "maxCalls");
    keepTrace = Option(options, "trace", 1);
    value = real[:parameters][:value];
    low = value - 1;
    high = value + 1;
    achievedWidth = high - low;
    calls = 0;
    trace = [];

    {@ iteration = 1; @achievedWidth > @requestedWidth && @calls < @maxCalls; {;
        midpoint = (@low + @high) / 2;
        chooseLeft = @value <= midpoint;
        nextLow = chooseLeft ?: @low ?_ midpoint;
        nextHigh = chooseLeft ?: midpoint ?_ @high;
        @low = nextLow;
        @high = nextHigh;
        @calls += 1;
        @achievedWidth = @high - @low;
        @trace = @keepTrace ?: @trace.Push({=
            iteration = iteration,
            split = midpoint,
            branch = @value <= midpoint ?: :left ?_ :right,
            interval = @low:@high,
            width = @achievedWidth,
            delta = @achievedWidth / 3,
            answer = :constructorGuarantee
        }) ?_ @trace;
      };
      iteration += 1
    };

    enclosed = achievedWidth <= requestedWidth;
    approximation = .CertifiedApproximation((low + high) / 2, low:high, {=
        reason = enclosed ?: :refined ?_ :budgetExhausted,
        requested = requestedWidth,
        achieved = achievedWidth,
        provider = :oracle
    });
    {=
        valueKind = :oracleRefinement,
        schema = "rix.oracle.refinement@1",
        status = enclosed ?: :enclosed ?_ :budgetExhausted,
        interval = low:high,
        certified = 1,
        requestedWidth = requestedWidth,
        achievedWidth = achievedWidth,
        approximation = approximation,
        evidenceLevel = :constructorGuarantee,
        trace = trace,
        work = {= calls = calls, maxCalls = maxCalls, exhausted = !enclosed },
        assumptions = [:rationalConstructor, :range, :existence, :separation],
        evidence = OracleEvidence(:enclosure, :constructorGuarantee, real, low:high)
    };
};

OraclePointRefinement(value, requestedWidth) -> {;
    exact = value ~!: :Rational;
    interval = exact:exact;
    {=
        valueKind=:oracleRefinement,
        schema="rix.oracle.refinement@1",
        status=:enclosed,
        interval=interval,
        certified=1,
        requestedWidth=requestedWidth,
        achievedWidth=0,
        approximation=.CertifiedApproximation(exact, interval, {= provider=:oracle, reason=:exactScalar }),
        evidenceLevel=:proof,
        trace=[],
        work={= calls=0, iterations=0, exhausted=_ },
        evidence=OracleEvidence(:enclosure, :proof, value, interval),
        source={= plugin=:oracle, source=:exactScalar }
    };
};

OracleRefineSource(real, options) -> {;
    source = real[:source];
    capabilities = source.NumericsCapabilities();
    requestedWidth = RequirePositive(Option(options, "width", 1/1000), "width");
    maxCalls = RequireNonnegativeInteger(Option(options, "maxcalls", 100), "maxCalls");
    maxIterations = RequireNonnegativeInteger(Option(options, "maxiterations", maxCalls), "maxIterations");
    request = .RefinementRequest({=
        absoluteWidth=requestedWidth,
        maxWork=maxCalls,
        maxCalls=maxCalls,
        maxIterations=maxIterations,
        trace=Option(options, "trace", 1)
    }, :refine, capabilities);
    result = source.Refine(request);
    check = .RefinementCheck(result, request, capabilities);
    check[:valid] ?: _ ?_ .Error("Oracle adapter received an invalid certified refinement result");
    {=
        valueKind=:oracleRefinement,
        schema="rix.oracle.refinement@1",
        status=result[:status],
        interval=result[:interval],
        certified=result[:certified],
        requestedWidth=requestedWidth,
        achievedWidth=result[:achievedWidth],
        approximation=result[:approximation],
        evidenceLevel=result[:evidenceLevel],
        trace=result[:trace],
        work=result[:work],
        evidence=result[:evidence],
        source={= plugin=:oracle, source=:adapter, provider=result[:source] }
    };
};

OracleOperandExact(real) -> real[:constructor] == :rational;

OracleOperandRefinement(real, requestedWidth, maxCalls, trace) ->
    OracleOperandExact(real)
      ?: OraclePointRefinement(real[:parameters][:value], requestedWidth)
      ?_ OracleRefine(real, {=
          width=requestedWidth,
          maxcalls=maxCalls,
          maxiterations=maxCalls,
          trace=trace
      });

OracleAbsInterval(interval) -> {;
    exact = AsInterval(interval);
    exact.ContainsZero()
      ?: 0:(.Max((-exact.Low()), exact.High()))
      ?_ (.Min(exact.Low().Abs(), exact.High().Abs())):(.Max(exact.Low().Abs(), exact.High().Abs()));
};

OracleCombineIntervals(operation, left, right, exponent ?= _) -> {?
    operation == :neg ? -left;
    operation == :abs ? OracleAbsInterval(left);
    operation == :add ? left + right;
    operation == :sub ? left - right;
    operation == :mul ? left * right;
    operation == :div ? left / right;
    operation == :pow ? left^exponent;
    .Error("Unsupported Oracle interval arithmetic operation")
};

OracleUnresolvedArithmetic(real, requestedWidth, maxCalls, calls, leftResult, rightResult, reason) -> {=
    valueKind=:oracleRefinement,
    schema="rix.oracle.refinement@1",
    status=:unknown,
    interval=0:0,
    certified=_,
    requestedWidth=requestedWidth,
    achievedWidth=0,
    approximation=_,
    evidenceLevel=:constructorGuarantee,
    trace=[{= operation=real[:operation], left=leftResult[:interval], right=rightResult[:interval] }],
    work={= calls=calls, iterations=1, maxCalls=maxCalls, exhausted=calls>=maxCalls },
    diagnostics=[reason],
    evidence={= kind=:unresolvedDomain, operation=real[:operation], reason=reason },
    source=real[:provenance]
};

OracleRefineArithmetic(real, options) -> {;
    requestedWidth = RequirePositive(Option(options, "width", 1/1000), "width");
    maxCalls = RequireNonnegativeInteger(Option(options, "maxcalls", 100), "maxCalls");
    keepTrace = Option(options, "trace", 1);
    operation = real[:operation];
    unary = operation == :neg || operation == :abs;
    leftExact = OracleOperandExact(real[:left]);
    rightExact = unary ?: 1 ?_ OracleOperandExact(real[:right]);
    leftBudget = unary ?: maxCalls
      ?_ leftExact ?: 0
      ?_ rightExact ?: maxCalls
      ?_ maxCalls // 2;
    rightBudget = unary ?: 0 ?_ maxCalls - leftBudget;
    childWidth = (operation == :add || operation == :sub || operation == :neg || operation == :abs)
      ?: requestedWidth / 2
      ?_ (requestedWidth < 1 ?: requestedWidth^2 / 8 ?_ requestedWidth / 8);
    leftResult = OracleOperandRefinement(real[:left], childWidth, leftBudget, keepTrace);
    rightResult = unary ?: _ ?_ OracleOperandRefinement(real[:right], childWidth, rightBudget, keepTrace);
    leftCalls = Option(leftResult[:work], "calls", 0);
    rightCalls = unary ?: 0 ?_ Option(rightResult[:work], "calls", 0);
    calls = leftCalls + rightCalls;
    exponentValue = operation == :pow && real[:right][:constructor] == :rational
      ?: real[:right][:parameters][:value] ~!: :Rational
      ?_ _;
    exponent = operation == :pow
      ?: (exponentValue.Denominator() == 1
           ?: exponentValue.Numerator()
           ?_ .Error("Oracle powers currently require an exact Integer exponent"))
      ?_ _;
    domainResolved = operation != :div || !(rightResult[:interval].ContainsZero());
    resultInterval = domainResolved ?: OracleCombineIntervals(
        operation,
        leftResult[:interval],
        unary ?: _ ?_ rightResult[:interval],
        exponent
    ) ?_ _;
    domainResolved
      ?: {;
          achievedWidth = @resultInterval.Width();
          goalMet = achievedWidth <= @requestedWidth;
          childExhausted = @leftResult[:status] == :budgetExhausted ||
            (!@unary && @rightResult[:status] == :budgetExhausted);
          status = goalMet ?: :enclosed ?_ (childExhausted ?: :budgetExhausted ?_ :goalNotMet);
          evidenceLevel = @unary
            ?: @leftResult[:evidenceLevel]
            ?_ OracleWeakerEvidence(@leftResult[:evidenceLevel], @rightResult[:evidenceLevel]);
          candidate = @resultInterval.Midpoint();
          approximation = .CertifiedApproximation(candidate, @resultInterval, {=
              provider=:oracle,
              reason=status,
              operation=@operation,
              actualized=1
          });
          {=
              valueKind=:oracleRefinement,
              schema="rix.oracle.refinement@1",
              status=status,
              interval=@resultInterval,
              certified=1,
              requestedWidth=@requestedWidth,
              achievedWidth=achievedWidth,
              approximation=approximation,
              evidenceLevel=evidenceLevel,
              trace=@keepTrace ?: [{=
                  operation=@operation,
                  left=@leftResult[:interval],
                  right=@unary ?: _ ?_ @rightResult[:interval],
                  interval=@resultInterval,
                  candidate=candidate,
                  actualized=1
              }] ?_ [],
              work={=
                  calls=@calls,
                  iterations=1,
                  maxCalls=@maxCalls,
                  exhausted=!goalMet && (childExhausted || @calls>=@maxCalls)
              },
              diagnostics=goalMet ?: [] ?_ [:requestedWidthNotReached],
              evidence={=
                  kind=:exactRationalIntervalArithmetic,
                  property=:containment,
                  operation=@operation,
                  operandEvidence=[@leftResult[:evidence], @unary ?: _ ?_ @rightResult[:evidence]]
              },
              source=@real[:provenance]
          };
      }
      ?_ OracleUnresolvedArithmetic(real, requestedWidth, maxCalls, calls, leftResult, rightResult, :divisorNotSeparatedFromZero);
};

OracleRefine(real, options ?= {= }) -> {?
    real[:kind] == :adapter ? OracleRefineSource(real, options);
    real[:kind] == :arithmetic ? OracleRefineArithmetic(real, options);
    OracleRefineRational(real, options)
};

OracleNumericsCapabilities(real) -> {;
    sourceCapabilities = real[:kind] == :adapter ?: real[:source].NumericsCapabilities() ?_ _;
    selectedRepresentation = real[:kind] == :adapter
      ?: :certifiedSingletonAdapter
      ?_ (real[:kind] == :arithmetic ?: :exactIntervalArithmeticRecipe ?_ :rationalBetweennessOracle);
    selectedEvidenceLevels = real[:kind] == :adapter
      ?: sourceCapabilities[:evidenceLevels]
      ?_ (real[:kind] == :arithmetic ?: [:constructorGuarantee, :proof] ?_ [:constructorGuarantee]);
    {=
        valueKind = :numericsCapabilities,
        schema = "rix.numerics.capabilities@1",
        backend = :oracle,
        representation = selectedRepresentation,
        denotation = :singleton,
        operations = [:enclose, :refine],
        evidenceLevels = selectedEvidenceLevels,
        certified = 1,
        arbitraryRefinement = 1,
        deterministic = 1,
        minimumWidth = 0,
        maxCalls = 100000,
        maxIterations = 100000,
        provider = real[:provenance]
    };
};

OracleProtocolEnclose(real, request) -> {;
    workRequest = request[:work];
    refined = OracleRefine(real, {=
        width = request[:absoluteWidth],
        maxCalls = workRequest[:maxCalls],
        trace = request[:trace]
    });
    goalMet = refined[:status] == :enclosed;
    diagnostics = refined.Has("diagnostics") ?: refined[:diagnostics] ?_ [];
    diagnostics = workRequest.Has("timeout") ?: diagnostics.Push(:timeoutNotCooperativelyEnforced) ?_ diagnostics;
    diagnostics = workRequest.Has("memory") ?: diagnostics.Push(:memoryNotCooperativelyEnforced) ?_ diagnostics;
    {=
        valueKind = :enclosure,
        schema = "rix.numerics.enclosure@1",
        status = refined[:status],
        interval = refined[:interval],
        certified = refined[:certified],
        goalMet = goalMet,
        requestedWidth = request[:absoluteWidth],
        achievedWidth = refined[:achievedWidth],
        approximation = refined[:approximation],
        evidenceLevel = refined[:evidenceLevel],
        backend = :oracle,
        operation = request[:operation],
        trace = refined[:trace],
        work = refined[:work],
        diagnostics = diagnostics,
        evidence = refined[:evidence],
        source = real[:provenance]
    };
};

.TypeKnown(:Oracle) ?: _ ?_ .TypeRegister({=
    name=:Oracle,
    nativeType=:map,
    defaultTraits=[:number, :ordered],
    convertFrom={=
        map=(x) ?- [x[:valueKind] == :oracle] -> x
    },
    validate=(x)->x[:valueKind] == :oracle,
    proto={=
        Enclose=(self, request)->OracleProtocolEnclose(self, request),
        Refine=(self, request)->OracleProtocolEnclose(self, request),
        NumericsCapabilities=(self)->OracleNumericsCapabilities(self)
    },
    installs={=
        ADD=[{= name=:CertifiedRealOracleAdd, priority=100, prep=(x,y)->OracleBridgePair(x,y), impl=(x,y)->OracleOperation(:add,x,y) }],
        SUB=[{= name=:CertifiedRealOracleSub, priority=100, prep=(x,y)->OracleBridgePair(x,y), impl=(x,y)->OracleOperation(:sub,x,y) }],
        MUL=[{= name=:CertifiedRealOracleMul, priority=100, prep=(x,y)->OracleBridgePair(x,y), impl=(x,y)->OracleOperation(:mul,x,y) }],
        DIV=[{= name=:CertifiedRealOracleDiv, priority=100, prep=(x,y)->OracleBridgePair(x,y), impl=(x,y)->OracleOperation(:div,x,y) }],
        POW=[{=
            name=:CertifiedRealOraclePow,
            priority=100,
            prep=(x,y)->OracleRefinableSingleton(x) && !OracleExactScalar(x) && (y ? :Integer),
            impl=(x,y)->OracleOperation(:pow,x,y)
        }],
        NEG=[{= name=:CertifiedRealOracleNeg, priority=100, prep=(x)->OracleRefinableSingleton(x) && !OracleExactScalar(x), impl=(x)->OracleOperation(:neg,x) }],
        ABS=[{= name=:CertifiedRealOracleAbs, priority=100, prep=(x)->OracleRefinableSingleton(x) && !OracleExactScalar(x), impl=(x)->OracleOperation(:abs,x) }]
    }
});

.TypeInstall(:Oracle);

oracleNamespace = {= };
oracleNamespace._proto = {=
    Rational = (self, value, options ?= {= }) -> RationalOracle(value, options),
    From = (self, value) -> OracleFrom(value),
    Operation = (self, operation, left, right ?= _) -> OracleOperation(operation, left, right),
    Query = (self, interval, delta, auxiliary ?= _) -> OracleQuery(interval, delta, auxiliary),
    Answer = (self, status, query, prophecy ?= _, reason ?= _) -> OracleAnswer(status, query, prophecy, reason),
    Decision = (self, answer) -> OracleDecision(answer),
    Prophecy = (self, real, interval, query ?= _) -> OracleProphecy(real, interval, query),
    WorkPolicy = (self, options ?= {= }) -> OracleWorkPolicy(options),
    Evidence = (self, property, level, subject, witness ?= _) -> OracleEvidence(property, level, subject, witness),
    Ask = (self, real, interval, delta, auxiliary ?= _) -> OracleAsk(real, interval, delta, auxiliary),
    AskAll = (self, real, interval, delta, options ?= {= }) -> OracleAskAll(real, interval, delta, options),
    CheckRange = (self, answer) -> OracleCheckRange(answer),
    Refine = (self, real, options ?= {= }) -> OracleRefine(real, options)
};

.Host.RegisterValue("oracle", oracleNamespace, "Certified singleton-real adapters, exact interval arithmetic, and rational-betweenness demonstrations", ["Numerics", "Exact"]);
`, sourcePath: "bundled:oracle", kind: "rix" });
  catalog.addMetadata({ id: "pdf", description: "PDF document and figure renderer orchestrated through LaTeX.", kind: "host", mount: "pdf", exports: ["Render"], groups: ["Renderers"], permissions: ["process", "files"], provides: ["rix.renderer.pdf@1"], targets: ["pdf", "application/pdf"], snapshot: true, deterministic: false, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:pdf" }, { sourcePath: "bundled:pdf", kind: "host" });
  catalog.registerInstaller("pdf", install21);
  catalog.addMetadata({ id: "plot", description: "Portable plotting helpers that produce core Graphics scenes.", kind: "host", mount: "plot", exports: ["Polynomial"], groups: ["Plot"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:plot" }, { sourcePath: "bundled:plot", kind: "host" });
  catalog.registerInstaller("plot", install3);
  catalog.addMetadata({ id: "png", description: "PNG snapshot renderer for core Graphics through a host rasterizer.", kind: "host", mount: "png", exports: ["Render"], groups: ["Renderers"], permissions: ["process"], provides: ["rix.renderer.png@1"], targets: ["png", "image/png"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:png" }, { sourcePath: "bundled:png", kind: "host" });
  catalog.registerInstaller("png", install20);
  catalog.addMetadata({ id: "poly", description: "Semantic callable univariate polynomials with structural and symbolic entry forms.", kind: "rix", mount: "poly", aliases: ["polynomial", "p"], exports: ["Polynomial", "Parse", "Var", "Fun", "Divide", "SyntheticDivide", "SturmSequence", "RootCount"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], provides: ["rix.polynomial@1", "rix.polynomial.algorithms@1"], schemas: ["rix.polynomial@1", "rix.polynomial.division@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:poly" }, { source: `/**
id: poly
description: Semantic callable univariate polynomials with structural and symbolic entry forms.
kind: rix
mount: poly
aliases: [polynomial, p]
exports: [Polynomial, Parse, Var, Fun, Divide, SyntheticDivide, SturmSequence, RootCount]
groups: [Algebra, Exact, Symbolic]
permissions: []
provides: [rix.polynomial@1, rix.polynomial.algorithms@1]
schemas: [rix.polynomial@1, rix.polynomial.division@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

PolyOption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

PolyIsZero(value) -> (value ~!: :Rational).Numerator() == 0;

PolyExact(value, label) -> {;
    exact = value ~!: :Rational;
    exact == _ ?: .Error(@"@{label} must be an exact Integer or Rational") ?_ exact;
};

PolyCopy(values) -> values.Map((value) -> value);

PolyTrimAscending(coefficients) -> {;
    result := PolyCopy(coefficients);
    result.Len() >= 1 ?: _ ?_ .Error("Polynomial coefficients cannot be empty");
    trimming := 1;
    {@ step = 1; (@result.Len() > 1) && (@trimming == 1); {;
        PolyIsZero(@result.Last())
          ?: {; @result ~= @result.DropLast(); }
          ?_ {; @trimming ~= 0; };
    }; step += 1 };
    result;
};

PolyExactAscending(coefficients, order ?= :ascending) -> {;
    coefficients ? :Array ?: _ ?_ .Error("Polynomial coefficients must be an Array");
    coefficients.Len() >= 1 ?: _ ?_ .Error("Polynomial coefficients cannot be empty");
    exact = coefficients.Map((coefficient) -> PolyExact(coefficient, "Polynomial coefficient"));
    ascending = order == :descending ?: exact.Reverse() ?_ order == :ascending ?: exact ?_ .Error("Polynomial coefficient order must be :ascending or :descending");
    PolyTrimAscending(ascending);
};

PolyZeroArray(length) -> {;
    result := [];
    {@ index = 1; index <= @length; {; @result ~= @result.Push(0); }; index += 1 };
    result;
};

PolyArrayAdd(left, right) -> {;
    length = left.Len() > right.Len() ?: left.Len() ?_ right.Len();
    result := [];
    {@ index = 1; index <= @length; {;
        a = index <= @left.Len() ?: @left[index] ?_ 0;
        b = index <= @right.Len() ?: @right[index] ?_ 0;
        @result ~= @result.Push(a + b);
    }; index += 1 };
    PolyTrimAscending(result);
};

PolyArrayNegate(coefficients) -> coefficients.Map((coefficient) -> -coefficient);
PolyArraySubtract(left, right) -> PolyArrayAdd(left, PolyArrayNegate(right));

PolyArrayScale(coefficients, scalar) -> {;
    exact = PolyExact(scalar, "Polynomial scalar");
    PolyTrimAscending(coefficients.Map((coefficient) -> coefficient * exact));
};

PolyArrayMultiply(left, right) -> {;
    result := PolyZeroArray(left.Len() + right.Len() - 1);
    {@ a = 1; a <= @left.Len(); {;
        {@ b = 1; b <= @right.Len(); {;
            index = @a + b - 1;
            @result ~= @result.Set(index, @result[index] + @left[@a] * @right[b]);
        }; b += 1 };
    }; a += 1 };
    PolyTrimAscending(result);
};

PolyArrayPower(coefficients, exponent) -> {;
    power = exponent ~!: :Integer;
    power >= 0 ?: _ ?_ .Error("Polynomial powers require a nonnegative exact Integer exponent");
    result := [1];
    base := coefficients;
    remaining := power;
    {@ step = 1; @remaining > 0; {;
        @remaining % 2 == 1 ?: {; @result ~= PolyArrayMultiply(@result, @base); } ?_ _;
        @remaining ~= @remaining // 2;
        @remaining > 0 ?: {; @base ~= PolyArrayMultiply(@base, @base); } ?_ _;
    }; step += 1 };
    result;
};

PolyEvaluateStep(coefficients, index, point, accumulator) ->
    index < 1 ?: accumulator ?_ PolyEvaluateStep(coefficients, index - 1, point, accumulator * point + coefficients[index]);

PolyEvaluateAscending(coefficients, point) -> PolyEvaluateStep(coefficients, coefficients.Len(), point, 0);

PolyDerivativeAscending(coefficients) -> {;
    coefficients.Len() == 1
      ?: [0]
      ?_ {;
          result := [];
          {@ power = 1; power < @coefficients.Len(); {;
              @result ~= @result.Push(@coefficients[power + 1] * power);
          }; power += 1 };
          PolyTrimAscending(result);
      };
};

PolyVariable(value) -> value.type == "string" ?: value ?_ value;

PolyRequire(value, label ?= "value") -> value ? :Polynomial ?: value ?_ .Error(@"@{label} must be a Polynomial");
PolyScalar(value) -> (value ? :Integer) || (value ? :Rational);
PolyOperand(value) -> (value ? :Polynomial) || PolyScalar(value);

PolyCurrentAscending(polynomial) -> {;
    exact = 0 |> polynomial.coefficientFunction;
    PolyExactAscending(exact, :ascending);
};

PolyCurrentCoefficients(polynomial, order ?= :descending) -> {;
    ascending = PolyCurrentAscending(PolyRequire(polynomial));
    order == :ascending ?: ascending ?_ order == :descending ?: ascending.Reverse() ?_ .Error("Coefficient order must be :ascending or :descending");
};

PolyDegree(polynomial) -> {;
    coefficients = PolyCurrentAscending(PolyRequire(polynomial));
    (coefficients.Len() == 1 && PolyIsZero(coefficients[1])) ?: -1 ?_ coefficients.Len() - 1;
};

PolySameVariable(left, right) -> {;
    left.variable == right.variable ?: 1 ?_ .Error(@"Polynomial variables must match: @{left.variable} and @{right.variable}");
};

PolyPromote(value, variable) -> value ? :Polynomial ?: value ?_ PolyFromAscending([PolyExact(value, "Polynomial operand")], variable, 0, _, [:scalar]);

PolyRecord(polynomial) -> {;
    value = PolyRequire(polynomial);
    {=
        valueKind = :polynomial,
        schema = "rix.polynomial@1",
        variable = value.variable,
        coefficients = PolyCurrentCoefficients(value),
        canonical = 1,
        equalityPolicy = :currentCanonicalCoefficients,
        reactive = value.reactive,
        provenance = value.provenance
    };
};

PolyArraysEqual(left, right) -> {;
    left.Len() == right.Len()
      ?: {;
          equal := 1;
          {@ index = 1; index <= @left.Len() && @equal == 1; {;
              @left[index] == @right[index] ?: _ ?_ {; @equal ~= 0; };
          }; index += 1 };
          equal;
      }
      ?_ 0;
};

PolyEqual(left, right) -> {;
    (left ? :Polynomial) && (right ? :Polynomial)
      ?: (left.variable == right.variable && PolyArraysEqual(PolyCurrentAscending(left), PolyCurrentAscending(right)))
      ?_ 0;
};

PolyFromAscending(coefficients, variable ?= :x, degreeBound ?= _, source ?= _, provenance ?= []) -> {;
    canonical = PolyExactAscending(coefficients, :ascending);
    provider = (unused) -> canonical;
    PolyBuild(provider, variable, degreeBound == _ ?: canonical.Len() - 1 ?_ degreeBound, source, provenance, 0);
};

PolyBuild(coefficientFunction, variable, degreeBound, source, provenance, reactive ?= 1) -> {;
    PolynomialValue = (argument) -> PolyEvaluateAscending(0 |> coefficientFunction, argument);
    PolynomialValue.schema = "rix.polynomial@1";
    PolynomialValue.variable = variable;
    PolynomialValue.degreeBound = degreeBound;
    PolynomialValue.canonical = 1;
    PolynomialValue.reactive = reactive;
    PolynomialValue.equalityPolicy = :currentCanonicalCoefficients;
    PolynomialValue.provenance = provenance;
    PolynomialValue.source = source;
    PolynomialValue.coefficientFunction = coefficientFunction;
    PolynomialValue.__type = "Polynomial";
    PolynomialValue._type = "polynomial";
    PolynomialValue._symbolicKind = "Polynomial";
    PolynomialValue._proto = {=
        P = (self) -> self,
        Polynomial = (self) -> self,
        Coefficients = (self, order ?= :descending) -> PolyCurrentCoefficients(self, order),
        AscendingCoefficients = (self) -> PolyCurrentCoefficients(self, :ascending),
        Record = (self) -> PolyRecord(self),
        Degree = (self) -> PolyDegree(self),
        Variable = (self) -> self.variable,
        Source = (self) -> self.source,
        Evaluate = (self, argument) -> PolyEvaluateAscending(PolyCurrentAscending(self), argument),
        Derivative = (self) -> PolyDerivative(self),
        Divide = (self, divisor) -> PolyDivide(self, divisor),
        DivMod = (self, divisor) -> PolyDivide(self, divisor),
        SyntheticDiv = (self, root) -> PolySyntheticDivide(self, root),
        SyntheticDivide = (self, root) -> PolySyntheticDivide(self, root),
        IsFactor = (self, candidate) -> PolyDivide(self, candidate)[:divisorIsFactor],
        SturmSequence = (self) -> PolySturmSequence(self),
        RootCount = (self, interval) -> PolyRootCount(self, interval),
        IsSquareFree = (self) -> PolyIsSquareFree(self),
        RootBound = (self) -> PolyRootBound(self),
        PrimitiveInteger = (self) -> PolyPrimitiveInteger(self)
    };
    .ImmutableValue(PolynomialValue);
};

PolyInterpolate(sourceFunction, degree) -> {;
    result := PolyZeroArray(degree + 1);
    {@ i = 0; i <= @degree; {;
        basis := [1];
        denominator := 1;
        {@ j = 0; j <= @degree; {;
            @i == j
              ?: _
              ?_ {;
                  @basis ~= PolyArrayMultiply(@basis, [-@j, 1]);
                  @denominator *= @i - @j;
              };
        }; j += 1 };
        factor = i |> @sourceFunction;
        @result ~= PolyArrayAdd(@result, PolyArrayScale(basis, factor));
    }; i += 1 };
    PolyTrimAscending(result);
};

PolyCoefficientsFromSource(sourceFunction, variable, degree) -> {;
    current := sourceFunction;
    factorial := 1;
    coefficients := [];
    {@ power = 0; power <= @degree; {;
        coefficient = (0 |> @current) / @factorial;
        @coefficients ~= @coefficients.Push(coefficient);
        power < @degree
          ?: {;
              @current ~= .Deriv(@current, @variable);
              @factorial *= @power + 1;
          }
          ?_ _;
    }; power += 1 };
    PolyTrimAscending(coefficients);
};

PolyDegreePower(node, leftDegree) -> {;
    exponentNode = node[:right];
    valid = exponentNode[:kind] == "number" ?: exponentNode.Has("integer") ?_ _;
    valid ?: _ ?_ .Error("Polynomial powers require a nonnegative exact Integer literal exponent");
    exponent = exponentNode[:integer];
    exponent >= 0 ?: leftDegree * exponent ?_ .Error("Polynomial powers require a nonnegative exact Integer exponent");
};

PolyDegreeMaximum(leftDegree, rightDegree) -> leftDegree > rightDegree ?: leftDegree ?_ rightDegree;
PolyDegreeQuotient(leftDegree, rightDegree) -> rightDegree == 0 ?: leftDegree ?_ .Error("Polynomial source has a variable-dependent denominator");

PolyDegreeBinary(node, variable) -> {;
    operation = node[:op];
    leftDegree = PolyDegreeFromNode(node[:left], variable);
    rightDegree = PolyDegreeFromNode(node[:right], variable);
    (operation == "+" || operation == "-")
      ?: PolyDegreeMaximum(leftDegree, rightDegree)
      ?_ (operation == "*"
           ?: leftDegree + rightDegree
           ?_ (operation == "/"
                ?: PolyDegreeQuotient(leftDegree, rightDegree)
                ?_ (operation == "^"
                     ?: PolyDegreePower(node, leftDegree)
                     ?_ .Error(@"Polynomial source uses unsupported operator @{operation}"))));
};

PolyDegreeFromNode(node, variable) -> {;
    kind = node[:kind];
    (kind == "number" || kind == "outer") ?: 0 ?_
    (kind == "identifier" ?: (node[:name] == variable ?: 1 ?_ 0) ?_
    (kind == "unary"
      ?: (node[:op] == "-" ?: PolyDegreeFromNode(node[:expr], variable) ?_ .Error("Polynomial source uses an unsupported unary operator"))
      ?_ (kind == "binary"
           ?: PolyDegreeBinary(node, variable)
           ?_ .Error(@"Polynomial source contains unsupported symbolic node @{kind}"))));
};

PolySymbolic(source, requestedVariable ?= _) -> {;
    compiled = requestedVariable == _ ?: .Poly(source) ?_ .Poly(source, requestedVariable);
    inspection = .InspectSpec(compiled);
    inputs = inspection[:inputs];
    inputs.Len() == 1 ?: _ ?_ .Error("Polynomial conversion requires exactly one selected input");
    variable = inputs[1];
    degree = PolyDegreeFromNode(inspection[:expression], variable);
    initial = PolyCoefficientsFromSource(compiled, variable, degree);
    provider = (unused) -> PolyCoefficientsFromSource(compiled, variable, degree);
    PolyBuild(provider, variable, degree, compiled, [:symbolicSource], 1);
};

PolyFromRecord(source, second) -> {;
    source.Has("coefficients") ?: _ ?_ .Error("Polynomial record requires coefficients");
    order = PolyOption(source, "order", :descending);
    variable = PolyOption(source, "variable", second == _ ?: :x ?_ second);
    PolyFromAscending(PolyExactAscending(source[:coefficients], order), variable, _, _, [:record]);
};

PolyConstruct(source, second ?= _) -> {;
    isPolynomial = source ? :Polynomial;
    isArray = source ? :Array;
    isMap = source ? :Map;
    isScalar = PolyScalar(source);
    isPolynomial
      ?: source
      ?_ (isArray
           ?: PolyFromAscending(PolyExactAscending(source, :descending), second == _ ?: :x ?_ second, _, _, [:coefficients])
           ?_ (isScalar
               ?: PolyFromAscending([PolyExact(source,"Polynomial coefficient")], second == _ ?: :x ?_ second, _, _, [:scalar])
               ?_ (isMap ?: PolyFromRecord(source, second) ?_ PolySymbolic(source, second))));
};

PolyBinary(left, right, operation) -> {;
    variable = (right ? :Polynomial) ?: right.variable ?_ left.variable;
    a = PolyPromote(left, variable);
    b = PolyPromote(right, variable);
    PolySameVariable(a, b);
    provider = (unused) -> operation == :add
      ?: PolyArrayAdd(PolyCurrentAscending(a), PolyCurrentAscending(b))
      ?_ operation == :subtract
           ?: PolyArraySubtract(PolyCurrentAscending(a), PolyCurrentAscending(b))
           ?_ PolyArrayMultiply(PolyCurrentAscending(a), PolyCurrentAscending(b));
    bound = operation == :multiply ?: a.degreeBound + b.degreeBound ?_ a.degreeBound > b.degreeBound ?: a.degreeBound ?_ b.degreeBound;
    PolyBuild(provider, variable, bound, _, [operation, a, b], 1);
};

PolyAdd(left, right) -> PolyBinary(left, right, :add);
PolySubtract(left, right) -> PolyBinary(left, right, :subtract);
PolyMultiply(left, right) -> PolyBinary(left, right, :multiply);
PolyNegate(polynomial) -> {;
    value = PolyRequire(polynomial);
    provider = (unused) -> PolyArrayNegate(PolyCurrentAscending(value));
    PolyBuild(provider, value.variable, value.degreeBound, _, [:negate, value], 1);
};
PolyScale(polynomial, scalar) -> {;
    value = PolyRequire(polynomial);
    exact = PolyExact(scalar, "Polynomial divisor");
    PolyIsZero(exact) ?: .Error("Polynomial division by zero") ?_ _;
    provider = (unused) -> PolyArrayScale(PolyCurrentAscending(value), 1 / exact);
    PolyBuild(provider, value.variable, value.degreeBound, _, [:scale, value, exact], 1);
};
PolyPower(polynomial, exponent) -> {;
    value = PolyRequire(polynomial);
    power = exponent ~!: :Integer;
    power >= 0 ?: _ ?_ .Error("Polynomial powers require a nonnegative exact Integer exponent");
    provider = (unused) -> PolyArrayPower(PolyCurrentAscending(value), power);
    PolyBuild(provider, value.variable, value.degreeBound * power, _, [:power, value, power], 1);
};

PolyReductionStep(remainder, denominator) -> {;
    offset = remainder.Len() - denominator.Len();
    factor = remainder.Last() / denominator.Last();
    updated := PolyCopy(remainder);
    {@ index = 1; index <= @denominator.Len(); {;
        target = index + @offset;
        @updated ~= @updated.Set(target, @updated[target] - @factor * @denominator[index]);
    }; index += 1 };
    {= remainder=PolyTrimAscending(updated), factor=factor, offset=offset };
};

PolyDivideArrays(dividend, divisor) -> {;
    numerator = PolyTrimAscending(dividend);
    denominator = PolyTrimAscending(divisor);
    (denominator.Len() == 1 && PolyIsZero(denominator[1])) ?: .Error("Polynomial division by zero") ?_ _;
    quotient := PolyZeroArray(numerator.Len() >= denominator.Len() ?: numerator.Len() - denominator.Len() + 1 ?_ 1);
    remainder := numerator;
    {@ step = 1; !(@remainder.Len() == 1 && PolyIsZero(@remainder[1])) && @remainder.Len() >= @denominator.Len(); {;
        reduction = PolyReductionStep(@remainder, @denominator);
        @quotient ~= @quotient.Set(reduction[:offset] + 1, @quotient[reduction[:offset] + 1] + reduction[:factor]);
        @remainder ~= reduction[:remainder];
    }; step += 1 };
    {= quotient=PolyTrimAscending(quotient), remainder=PolyTrimAscending(remainder) };
};

PolyDivisionRecord(dividend, divisor, quotient, remainder, method ?= :longDivision) -> {;
    factor = PolyDegree(remainder) == -1;
    record = {=
        valueKind = :polynomialDivision,
        schema = "rix.polynomial.division@1",
        dividend = dividend,
        divisor = divisor,
        quotient = quotient,
        remainder = remainder,
        method = method,
        divisorIsFactor = factor,
        verified = quotient * divisor + remainder == dividend
    };
    record._proto = {=
        Quotient = (self) -> self[:quotient],
        Remainder = (self) -> self[:remainder],
        IsFactor = (self) -> self[:divisorIsFactor],
        Record = (self) -> self
    };
    .ImmutableValue(record);
};

PolyDivide(dividend, divisor) -> {;
    left = PolyRequire(dividend, "Polynomial dividend");
    right = PolyRequire(divisor, "Polynomial divisor");
    PolySameVariable(left, right);
    arrays = PolyDivideArrays(PolyCurrentAscending(left), PolyCurrentAscending(right));
    quotient = PolyFromAscending(arrays[:quotient], left.variable, _, _, [:quotient]);
    remainder = PolyFromAscending(arrays[:remainder], left.variable, _, _, [:remainder]);
    PolyDivisionRecord(left, right, quotient, remainder);
};

PolySyntheticDivide(polynomial, root) -> {;
    value = PolyRequire(polynomial);
    divisor = PolyFromAscending([-PolyExact(root, "Synthetic-division root"), 1], value.variable, 1, _, [:syntheticDivisor]);
    result = PolyDivide(value, divisor);
    PolyDivisionRecord(value, divisor, result[:quotient], result[:remainder], :synthetic);
};

PolyRemainderArrays(dividend, divisor) -> PolyDivideArrays(dividend, divisor)[:remainder];

PolySturmArrays(coefficients) -> {;
    first = PolyTrimAscending(coefficients);
    second = PolyDerivativeAscending(first);
    sequence := [first, second];
    previous := first;
    current := second;
    {@ step = 1; !(@current.Len() == 1 && PolyIsZero(@current[1])); {;
        remainder = PolyRemainderArrays(@previous, @current);
        remainder.Len() == 1 && PolyIsZero(remainder[1])
          ?: {; @current ~= [0]; }
          ?_ {;
              next = PolyArrayNegate(@remainder);
              @sequence ~= @sequence.Push(next);
              @previous ~= @current;
              @current ~= next;
          };
    }; step += 1 };
    sequence;
};

PolySturmSequence(polynomial) -> PolySturmArrays(PolyCurrentAscending(PolyRequire(polynomial)));
PolySign(value) -> value < 0 ?: -1 ?_ value > 0 ?: 1 ?_ 0;

PolyVariationsAt(sequence, point) -> {;
    previous := 0;
    variations := 0;
    {@ index = 1; index <= @sequence.Len(); {;
        sign = PolySign(PolyEvaluateAscending(@sequence[index], @point));
        sign != 0
          ?: {;
              @previous != 0 && @previous != @sign ?: {; @variations += 1; } ?_ _;
              @previous ~= @sign;
          }
          ?_ _;
    }; index += 1 };
    variations;
};

PolyRootCount(polynomial, interval) -> {;
    value = PolyRequire(polynomial);
    exact = interval ~!: :RationalInterval;
    sequence = PolySturmSequence(value);
    PolyVariationsAt(sequence, exact.Low()) - PolyVariationsAt(sequence, exact.High());
};

PolyIsSquareFree(polynomial) -> {;
    sequence = PolySturmSequence(polynomial);
    sequence.Last().Len() == 1;
};

PolyRootBound(polynomial) -> {;
    coefficients = PolyCurrentAscending(PolyRequire(polynomial));
    leading = coefficients.Last().Abs();
    PolyIsZero(leading) ?: .Error("Zero polynomial has no finite root bound") ?_ _;
    maximum := 0;
    {@ index = 1; index < @coefficients.Len(); {;
        ratio = @coefficients[index].Abs() / @leading;
        ratio > @maximum ?: {; @maximum ~= @ratio; } ?_ _;
    }; index += 1 };
    1 + maximum;
};

PolyIntegerGcd(left, right) -> {;
    a := (left ~!: :Integer).Abs();
    b := (right ~!: :Integer).Abs();
    {@ step = 1; @b != 0; {; remainder = @a % @b; @a ~= @b; @b ~= remainder; }; step += 1 };
    a;
};

PolyIntegerCoefficient(value) -> {;
    rational = value ~!: :Rational;
    rational.Denominator() == 1
      ?: rational.Numerator()
      ?_ .Error("PrimitiveInteger requires integer polynomial coefficients");
};

PolyPrimitiveInteger(polynomial) -> {;
    coefficients = PolyCurrentAscending(PolyRequire(polynomial));
    integers = coefficients.Map((coefficient) -> PolyIntegerCoefficient(coefficient));
    content := 0;
    {@ index = 1; index <= @integers.Len(); {; @content ~= PolyIntegerGcd(@content, @integers[index]); }; index += 1 };
    PolyIsZero(content)
      ?: [0]
      ?_ {;
          primitive = @integers.Map((coefficient) -> coefficient // @content);
          primitive.Last() < 0 ?: primitive.Map((coefficient) -> -coefficient) ?_ primitive;
      };
};

PolyDerivative(polynomial) -> {;
    value = PolyRequire(polynomial);
    provider = (unused) -> PolyDerivativeAscending(PolyCurrentAscending(value));
    bound = value.degreeBound > 0 ?: value.degreeBound - 1 ?_ 0;
    PolyBuild(provider, value.variable, bound, _, [:derivative, value], 1);
};

PolyParseVariable(modifiers) -> {;
    selected := _;
    {@ index = 1; index <= @modifiers.Len(); {;
        modifier = @modifiers[index];
        upper = modifier.Upper();
        isFun = upper == "FUN";
        isVar = upper.StartsWith("VAR(");
        isFun || isVar ?: _ ?_ .Error(@"Unknown .poly modifier @{modifier}");
        isVar
          ?: {;
              @selected == _ ?: _ ?_ .Error(".poly accepts only one Var(name) modifier");
              @selected ~= @modifier.Slice(5, @modifier.Len());
          }
          ?_ _;
    }; index += 1 };
    selected;
};

PolyParse(self, body, modifiers, info) -> {;
    variable = PolyParseVariable(modifiers);
    structural = .SArith.Parse(body, [], {= });
    PolyConstruct(structural, variable);
};

.TypeKnown(:Polynomial) ?: _ ?_ .TypeRegister({=
    name = :Polynomial,
    nativeType = :function,
    defaultTraits = [:number],
    validate = (value) -> value.schema == "rix.polynomial@1",
    proto = {= },
    installs = {=
        ADD = [{= name=:PolynomialAdd, prep=(left, right)->PolyOperand(left) && PolyOperand(right) && ((left ? :Polynomial) || (right ? :Polynomial)), impl=(left, right)->PolyAdd(left, right) }],
        SUB = [{= name=:PolynomialSub, prep=(left, right)->PolyOperand(left) && PolyOperand(right) && ((left ? :Polynomial) || (right ? :Polynomial)), impl=(left, right)->PolySubtract(left, right) }],
        MUL = [{= name=:PolynomialMul, prep=(left, right)->PolyOperand(left) && PolyOperand(right) && ((left ? :Polynomial) || (right ? :Polynomial)), impl=(left, right)->PolyMultiply(left, right) }],
        DIV = [
            {= name=:PolynomialScalarDiv, prep=(left, right)->(left ? :Polynomial) && PolyScalar(right), impl=(left, right)->PolyScale(left, right) },
            {= name=:PolynomialDivNeedsRatfun, prep=(left, right)->(left ? :Polynomial) && (right ? :Polynomial), impl=(left, right)->.Error("Division by a Polynomial creates a RationalFunction; load .ratfun or use //, %, or /%") }
        ],
        POW = [{= name=:PolynomialPow, prep=(left, right)->(left ? :Polynomial) && (right ? :Integer), impl=(left, right)->PolyPower(left, right) }],
        NEG = [{= name=:PolynomialNeg, prep=(value)->value ? :Polynomial, impl=(value)->PolyNegate(value) }],
        EQ = [{= name=:PolynomialEq, prep=(left, right)->(left ? :Polynomial) && (right ? :Polynomial), impl=(left, right)->PolyEqual(left, right) }],
        NEQ = [{= name=:PolynomialNeq, prep=(left, right)->(left ? :Polynomial) && (right ? :Polynomial), impl=(left, right)->!PolyEqual(left, right) }],
        INTDIV = [{= name=:PolynomialIntDiv, prep=(left, right)->(left ? :Polynomial) && (right ? :Polynomial), impl=(left, right)->PolyDivide(left, right)[:quotient] }],
        MOD = [{= name=:PolynomialMod, prep=(left, right)->(left ? :Polynomial) && (right ? :Polynomial), impl=(left, right)->PolyDivide(left, right)[:remainder] }],
        DIVMOD = [{= name=:PolynomialDivMod, prep=(left, right)->(left ? :Polynomial) && (right ? :Polynomial), impl=(left, right)->{; result=PolyDivide(left,right); {: result[:quotient], result[:remainder] }; } }]
    }
});

.TypeInstall(:Polynomial);

polyNamespace = (source, second ?= _) -> PolyConstruct(source, second);
polyNamespace._proto = {=
    Parse = (self, body, modifiers, info) -> PolyParse(self, body, modifiers, info),
    Polynomial = (self, source, second ?= _) -> PolyConstruct(source, second),
    Divide = (self, dividend, divisor) -> PolyDivide(dividend, divisor),
    SyntheticDivide = (self, polynomial, root) -> PolySyntheticDivide(polynomial, root),
    Derivative = (self, polynomial) -> PolyDerivative(polynomial),
    SturmSequence = (self, polynomial) -> PolySturmSequence(polynomial),
    RootCount = (self, polynomial, interval) -> PolyRootCount(polynomial, interval),
    IsSquareFree = (self, polynomial) -> PolyIsSquareFree(polynomial),
    RootBound = (self, polynomial) -> PolyRootBound(polynomial),
    PrimitiveInteger = (self, polynomial) -> PolyPrimitiveInteger(polynomial),
    Var = (self) -> .Error(".poly.Var(name) is a backtick parser modifier"),
    Fun = (self) -> .Error(".poly.Fun is a backtick parser modifier")
};

.Host.RegisterCallableValue(
    "poly",
    polyNamespace,
    "Semantic callable univariate polynomials and exact coefficient algorithms",
    ["Algebra", "Exact", "Symbolic"]
);

PolyConversion = (value, variable ?= _) -> PolyConstruct(value, variable);
.Host.RegisterMethod("structural_form", "P", PolyConversion, "poly", "poly");
.Host.RegisterMethod("structural_form", "Polynomial", PolyConversion, "poly", "poly");
.Host.RegisterMethod("structural_symbol", "P", PolyConversion, "poly", "poly");
.Host.RegisterMethod("structural_symbol", "Polynomial", PolyConversion, "poly", "poly");
.Host.RegisterMethod("structural_literal", "P", PolyConversion, "poly", "poly");
.Host.RegisterMethod("structural_literal", "Polynomial", PolyConversion, "poly", "poly");
.Host.RegisterMethod("symbolic_spec", "P", PolyConversion, "poly", "poly");
.Host.RegisterMethod("symbolic_spec", "Polynomial", PolyConversion, "poly", "poly");
`, sourcePath: "bundled:poly", kind: "rix" });
  catalog.addMetadata({ id: "quarto", description: "Quarto Markdown renderer with front matter and portable figure lowering.", kind: "host", mount: "quarto", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.quarto@1"], targets: ["quarto", "text/x-quarto"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:quarto" }, { sourcePath: "bundled:quarto", kind: "host" });
  catalog.registerInstaller("quarto", install18);
  catalog.addMetadata({ id: "radix", description: "Bounded exact positional expansions and repeating-period analysis for rational values.", kind: "rix", mount: "radix", exports: ["Expansion", "Digits", "PeriodLength", "PeriodInfo", "ToString"], groups: ["Exact", "Radix"], permissions: [], provides: ["rix.radix@1"], schemas: ["rix.radix.expansion@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:radix" }, { source: `/**
id: radix
description: Bounded exact positional expansions and repeating-period analysis for rational values.
kind: rix
mount: radix
exports: [Expansion, Digits, PeriodLength, PeriodInfo, ToString]
groups: [Exact, Radix]
permissions: []
provides: [rix.radix@1]
schemas: [rix.radix.expansion@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

RadixOption(options, key, fallback ?= _) -> {;
    normalized = key.Lower();
    options == _ ?: fallback ?_ options.Has(normalized) ?: options[normalized] ?_ fallback;
};

RadixInteger(value, label) -> {;
    exact = value ~!: :Integer;
    exact == _ ?: .Error(@"@{label} must be an exact integer") ?_ exact;
};

RadixBounded(value, label, fallback, maximum ?= 1000000) -> {;
    selected = value == _ ?: fallback ?_ RadixInteger(value, label);
    selected >= 0 && selected <= maximum
      ?: selected
      ?_ .Error(@"@{label} must be between 0 and @{maximum}");
};

RadixBase(value ?= 10) -> {;
    base = RadixInteger(value, "Radix base");
    base >= 2 && base <= 65536
      ?: base
      ?_ .Error("Radix base must be between 2 and 65536");
};

RadixRational(value) -> {;
    exact = value ~!: :Rational;
    exact == _ ?: .Error("Radix operations require an exact Integer or Rational") ?_ exact;
};

RadixUnsigned(value) -> {;
    rational = RadixRational(value);
    negative = rational.Numerator() < 0;
    {=
        sign = negative ?: -1 ?_ 1,
        numerator = negative ?: -rational.Numerator() ?_ rational.Numerator(),
        denominator = rational.Denominator()
    };
};

RadixIntegerDigits(value, base) -> {;
    value == 0
      ?: [0]
      ?_ {;
          result := [];
          remaining := @value;
          {@ step = 1; @remaining > 0; {;
              @result ~= @result.Push(@remaining % @base);
              @remaining ~= @remaining // @base;
          }; step += 1 };
          result.Reverse();
      };
};

RadixExpansion(value, baseValue ?= 10, options ?= _) -> {;
    base = RadixBase(baseValue);
    maxDigits = RadixBounded(RadixOption(options, "maxDigits"), "maxDigits", 1024);
    parts = RadixUnsigned(value);
    whole = parts[:numerator] // parts[:denominator];
    remainder := parts[:numerator] % parts[:denominator];
    fractional := [];
    seen := {= };
    repeatStart := _;
    {@ step = 1; @remainder != 0 && @fractional.Len() < @maxDigits && @repeatStart == _; {;
        key = @"r@{@remainder}";
        @seen.Has(key)
          ?: {; @repeatStart ~= @seen[@key]; }
          ?_ {;
              @seen ~= @seen.Set(@key, @fractional.Len());
              @remainder *= @base;
              @fractional ~= @fractional.Push(@remainder // @parts[:denominator]);
              @remainder %= @parts[:denominator];
          };
    }; step += 1 };
    repeatStart == _ && remainder != 0 && seen.Has(@"r@{remainder}")
      ?: {; @repeatStart ~= @seen[@"r@{@remainder}"]; }
      ?_ _;
    complete = remainder == 0 || repeatStart != _;
    prefix = repeatStart == _ ?: fractional ?_ fractional.Slice(1, repeatStart + 1);
    repeating = repeatStart == _ ?: _ ?_ fractional.Slice(repeatStart + 1);
    {=
        valueKind = :radixExpansion,
        schema = "rix.radix.expansion@1",
        status = complete ?: :complete ?_ :budgetExhausted,
        base = base,
        sign = parts[:numerator] == 0 ?: 0 ?_ parts[:sign],
        integerDigits = RadixIntegerDigits(whole, base),
        nonRepeatingDigits = prefix,
        repeatingDigits = repeating,
        terminating = remainder == 0 ?: 1 ?_ _,
        repeating = repeatStart != _ ?: 1 ?_ _,
        complete = complete ?: 1 ?_ _,
        truncated = complete ?: _ ?_ 1,
        producedDigits = fractional.Len(),
        maxDigits = maxDigits,
        remainingRemainder = remainder
    };
};

RadixDigits(value, baseValue ?= 10, countValue ?= 1) -> {;
    base = RadixBase(baseValue);
    requested = countValue ? :Map ?: RadixOption(countValue, "count") ?_ countValue;
    count = RadixBounded(requested, "Digit count", 1);
    parts = RadixUnsigned(value);
    remainder := parts[:numerator] % parts[:denominator];
    digits := [];
    {@ index = 1; index <= @count; {;
        @remainder *= @base;
        @digits ~= @digits.Push(@remainder // @parts[:denominator]);
        @remainder %= @parts[:denominator];
    }; index += 1 };
    digits;
};

RadixGcd(left, right) -> {;
    a := left.Abs();
    b := right.Abs();
    {@ step = 1; @b != 0; {;
        remainder = @a % @b;
        @a ~= @b;
        @b ~= remainder;
    }; step += 1 };
    a;
};

RadixPeriodInfo(value, baseValue ?= 10, options ?= _) -> {;
    base = RadixBase(baseValue);
    maxWork = RadixBounded(RadixOption(options, "maxWork"), "maxWork", 100000);
    denominator := RadixUnsigned(value)[:denominator];
    reducing := 1;
    {@ step = 1; @reducing == 1; {;
        common = RadixGcd(@denominator, @base);
        common == 1
          ?: {; @reducing ~= 0; }
          ?_ {; @denominator //= @common; };
    }; step += 1 };
    denominator == 1
      ?: {= status=:complete, base=base, periodLength=0, work=0, maxWork=maxWork }
      ?_ maxWork == 0
      ?: {= status=:budgetExhausted, base=base, periodLength=_, work=0, maxWork=0, reducedDenominator=denominator }
      ?_ {;
          power := @base % @denominator;
          length := 1;
          {@ step = 1; @power != 1 && @length < @maxWork; {;
              @power ~= (@power * @base) % @denominator;
              @length += 1;
          }; step += 1 };
          complete = power == 1;
          {=
              status = complete ?: :complete ?_ :budgetExhausted,
              base = @base,
              periodLength = complete ?: length ?_ _,
              work = length,
              maxWork = @maxWork,
              reducedDenominator = @denominator
          };
      };
};

RadixPeriodLength(value, baseValue ?= 10, options ?= _) -> {;
    info = RadixPeriodInfo(value, baseValue, options);
    info[:periodLength] == _
      ?: .Error(@"PeriodLength exceeded maxWork=@{info[:maxWork]}; use PeriodInfo for a structured result")
      ?_ info[:periodLength];
};

RadixDigitText(values) -> {;
    values.Len() == 0
      ?: " ".Slice(1,1)
      ?_ {;
          result := "0123456789abcdefghijklmnopqrstuvwxyz"[@values[1] + 1];
          {@ index = 2; index <= @values.Len(); {;
              @result ~= @result + "0123456789abcdefghijklmnopqrstuvwxyz"[@values[index] + 1];
          }; index += 1 };
          result;
      };
};

RadixRenderText(value, baseValue ?= 10, options ?= _) -> {;
    base = RadixBase(baseValue);
    base <= 36 ?: _ ?_ .Error("Radix ToString supports bases through 36; use Expansion for larger bases");
    expansion = RadixExpansion(value, base, options);
    negative = expansion[:sign] < 0 ?: "-" ?_ " ".Slice(1,1);
    whole = RadixDigitText(expansion[:integerDigits]);
    prefix = RadixDigitText(expansion[:nonRepeatingDigits]);
    expansion[:repeatingDigits] != _
      ?: @"@{negative}@{whole}.@{prefix}(@{RadixDigitText(expansion[:repeatingDigits])})"
      ?_ (expansion[:terminating]
          ?: (prefix.Len() > 0 ?: @"@{negative}@{whole}.@{prefix}" ?_ @"@{negative}@{whole}")
          ?_ @"@{negative}@{whole}.@{prefix}…");
};

radixNamespace = {= };
radixNamespace._proto = {=
    Expansion = (self, value, base ?= 10, options ?= _) -> RadixExpansion(value, base, options),
    Digits = (self, value, base ?= 10, count ?= 1) -> RadixDigits(value, base, count),
    PeriodLength = (self, value, base ?= 10, options ?= _) -> RadixPeriodLength(value, base, options),
    PeriodInfo = (self, value, base ?= 10, options ?= _) -> RadixPeriodInfo(value, base, options),
    ToString = (self, value, baseValue ?= 10, options ?= _) -> {;
        base = RadixBase(baseValue);
        base <= 36 ?: _ ?_ .Error("Radix ToString supports bases through 36; use Expansion for larger bases");
        expansion = RadixExpansion(value, base, options);
        negative = expansion[:sign] < 0 ?: "-" ?_ " ".Slice(1,1);
        whole = RadixDigitText(expansion[:integerDigits]);
        prefix = RadixDigitText(expansion[:nonRepeatingDigits]);
        expansion[:repeatingDigits] != _
          ?: @"@{negative}@{whole}.@{prefix}(@{RadixDigitText(expansion[:repeatingDigits])})"
          ?_ (expansion[:terminating]
              ?: (prefix.Len() > 0 ?: @"@{negative}@{whole}.@{prefix}" ?_ @"@{negative}@{whole}")
              ?_ @"@{negative}@{whole}.@{prefix}…");
    }
};

.Host.RegisterValue("radix", radixNamespace, "Bounded exact positional expansions and period analysis", ["Exact", "Radix"]);

.Host.RegisterMethod("Integer", "Expansion", RadixExpansion, "radix", "radix");
.Host.RegisterMethod("Integer", "Digits", RadixDigits, "radix", "radix");
.Host.RegisterMethod("Integer", "PeriodLength", RadixPeriodLength, "radix", "radix");
.Host.RegisterMethod("Integer", "PeriodInfo", RadixPeriodInfo, "radix", "radix");
.Host.RegisterMethod("Integer", "RadixString", (value,base ?= 10,options ?= _)->.radix.ToString(value,base,options), "radix", "radix");
.Host.RegisterMethod("Rational", "Expansion", RadixExpansion, "radix", "radix");
.Host.RegisterMethod("Rational", "Digits", RadixDigits, "radix", "radix");
.Host.RegisterMethod("Rational", "PeriodLength", RadixPeriodLength, "radix", "radix");
.Host.RegisterMethod("Rational", "PeriodInfo", RadixPeriodInfo, "radix", "radix");
.Host.RegisterMethod("Rational", "RadixString", (value,base ?= 10,options ?= _)->.radix.ToString(value,base,options), "radix", "radix");
`, sourcePath: "bundled:radix", kind: "rix" });
  catalog.addMetadata({ id: "ratfun", description: "Canonical callable univariate rational functions with exact cancellation and Polynomial interoperability.", kind: "rix", mount: "ratfun", aliases: ["rationalFunction", "rf"], exports: ["RationalFunction", "Parse", "Var", "Fun"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], requires: ["rix.polynomial@1"], provides: ["rix.rational-function@1"], schemas: ["rix.rational-function@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:ratfun" }, { source: `/**
id: ratfun
description: Canonical callable univariate rational functions with exact cancellation and Polynomial interoperability.
kind: rix
mount: ratfun
aliases: [rationalFunction, rf]
exports: [RationalFunction, Parse, Var, Fun]
groups: [Algebra, Exact, Symbolic]
permissions: []
requires: [rix.polynomial@1]
provides: [rix.rational-function@1]
schemas: [rix.rational-function@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

RatfunIs(value) -> value ? :RationalFunction;
RatfunRequire(value, label ?= "value") -> RatfunIs(value) ?: value ?_ .Error(@"@{label} must be a RationalFunction");
RatfunScalar(value) -> (value ? :Integer) || (value ? :Rational);
RatfunOperand(value) -> RatfunIs(value) || (value ? :Polynomial) || RatfunScalar(value);

RatfunVariable(value) -> value == _ ?: :x ?_ value;
RatfunPolynomial(value, variable) -> value ? :Polynomial ?: value ?_ .poly(value, variable);
RatfunZero(polynomial) -> polynomial.Degree() == -1;
RatfunOne(variable) -> .poly([1], variable);

RatfunGcd(left, right) -> {;
    state := [left, right];
    {@ step = 1; @state[2].Degree() >= 0; {;
        remainder = @state[1] % @state[2];
        @state ~= [@state[2], remainder];
    }; step += 1 };
    state[1];
};

RatfunCanonical(numeratorValue, denominatorValue, variable ?= :x) -> {;
    initialNumerator = RatfunPolynomial(numeratorValue, variable);
    initialDenominator = RatfunPolynomial(denominatorValue, initialNumerator.Variable());
    state := [initialNumerator, initialDenominator];
    numerator = state[1];
    denominator = state[2];
    numerator.Variable() == denominator.Variable()
      ?: _
      ?_ .Error("RationalFunction numerator and denominator variables must match");
    RatfunZero(denominator) ?: .Error("RationalFunction denominator cannot be zero") ?_ _;
    RatfunZero(numerator)
      ?: {; @state ~= [@state[1], RatfunOne(@state[1].Variable())]; }
      ?_ {;
          common = RatfunGcd(@numerator, @denominator);
          common.Degree() >= 0
            ?: {; @state ~= [@state[1] // @common, @state[2] // @common]; }
            ?_ _;
          leading = @state[2].Coefficients()[1];
          @state ~= [@state[1] / leading, @state[2] / leading];
      };
    {: state[1], state[2] };
};

RatfunPolynomialAt(polynomial, argument) -> {;
    coefficients = polynomial.Coefficients();
    state := [RatfunPromote(0, polynomial.Variable())];
    {@ index = 1; index <= @coefficients.Len(); {;
        @state ~= [@state[1] * @argument + @coefficients[index]];
    }; index += 1 };
    state[1];
};

RatfunCompose(value, argument) -> {;
    exact = RatfunRequire(value);
    promoted = RatfunPromote(argument, exact.variable);
    RatfunPolynomialAt(exact.numerator, promoted) / RatfunPolynomialAt(exact.denominator, promoted);
};

RatfunEvaluate(value, argument) -> {;
    exact = RatfunRequire(value);
    RatfunIs(argument) || (argument ? :Polynomial)
      ?: RatfunCompose(exact, argument)
      ?_ exact.numerator.Evaluate(argument) / exact.denominator.Evaluate(argument);
};

RatfunComposeParts(numerator, denominator, argument) -> {;
    promoted=RatfunPromote(argument,numerator.Variable());
    RatfunPolynomialAt(numerator,promoted)/RatfunPolynomialAt(denominator,promoted);
};

RatfunApply(numerator, denominator, argument) -> {;
    RatfunIs(argument) || (argument ? :Polynomial)
      ?: RatfunComposeParts(numerator,denominator,argument)
      ?_ numerator.Evaluate(argument) / denominator.Evaluate(argument);
};

RatfunRecord(value) -> {;
    exact = RatfunRequire(value);
    {=
        valueKind = :rationalFunction,
        schema = "rix.rational-function@1",
        variable = exact.variable,
        numerator = exact.numerator,
        denominator = exact.denominator,
        canonical = 1,
        equalityPolicy = :canonicalReducedFractionField,
        domainPolicy = :reducedDenominatorNonzero,
        reactive = exact.reactive,
        provenance = exact.provenance
    };
};

RatfunBuild(numeratorValue, denominatorValue ?= 1, variable ?= :x, provenance ?= []) -> {;
    canonical = RatfunCanonical(numeratorValue, denominatorValue, variable);
    numerator = canonical[1];
    denominator = canonical[2];
    RationalFunctionValue = (argument) -> RatfunApply(numerator, denominator, argument);
    RationalFunctionValue.schema = "rix.rational-function@1";
    RationalFunctionValue.variable = numerator.Variable();
    RationalFunctionValue.numerator = numerator;
    RationalFunctionValue.denominator = denominator;
    RationalFunctionValue.canonical = 1;
    RationalFunctionValue.equalityPolicy = :canonicalReducedFractionField;
    RationalFunctionValue.domainPolicy = :reducedDenominatorNonzero;
    RationalFunctionValue.reactive = numerator.reactive || denominator.reactive;
    RationalFunctionValue.provenance = provenance;
    RationalFunctionValue.__type = "RationalFunction";
    RationalFunctionValue._type = "rational_function";
    RationalFunctionValue._proto = {=
        R = (self) -> self,
        RationalFunction = (self) -> self,
        Numerator = (self) -> self.numerator,
        Denominator = (self) -> self.denominator,
        Variable = (self) -> self.variable,
        Record = (self) -> RatfunRecord(self),
        Evaluate = (self, argument) -> RatfunEvaluate(self, argument),
        Compose = (self, argument) -> RatfunCompose(self, argument),
        Domain = (self) -> {=
            valueKind=:rationalFunctionDomain,
            condition="reduced denominator != 0",
            denominator=self.denominator
        }.Set("cancelledInputRestrictionsPreserved",0),
        IsPolynomial = (self) -> self.denominator.Degree() == 0 ?: 1 ?_ _,
        ToPolynomial = (self) -> self.denominator.Degree() == 0
            ?: self.numerator / self.denominator.Coefficients()[1]
            ?_ .Error("ToPolynomial requires canonical denominator 1")
    };
    .ImmutableValue(RationalFunctionValue);
};

RatfunPromote(value, variable ?= :x) -> {;
    RatfunIs(value)
      ?: value
      ?_ (((value ? :Polynomial) || RatfunScalar(value))
          ?: RatfunBuild(value, 1, (value ? :Polynomial ?: value.Variable() ?_ variable), [:promotion])
          ?_ .Error("RationalFunction operand must be exact, Polynomial, or RationalFunction"));
};

RatfunSameVariable(left, right) -> left.variable == right.variable ?: 1 ?_ .Error("RationalFunction variables must match");
RatfunAdd(leftValue, rightValue) -> {; left=RatfunPromote(leftValue); right=RatfunPromote(rightValue,left.variable); RatfunSameVariable(left,right); RatfunBuild(left.numerator*right.denominator+right.numerator*left.denominator,left.denominator*right.denominator,left.variable,[:add]); };
RatfunSubtract(leftValue, rightValue) -> RatfunAdd(leftValue, -RatfunPromote(rightValue));
RatfunMultiply(leftValue, rightValue) -> {; left=RatfunPromote(leftValue); right=RatfunPromote(rightValue,left.variable); RatfunSameVariable(left,right); RatfunBuild(left.numerator*right.numerator,left.denominator*right.denominator,left.variable,[:multiply]); };
RatfunDivide(leftValue, rightValue) -> {; left=RatfunPromote(leftValue); right=RatfunPromote(rightValue,left.variable); RatfunSameVariable(left,right); RatfunZero(right.numerator) ?: .Error("RationalFunction division by zero") ?_ RatfunBuild(left.numerator*right.denominator,left.denominator*right.numerator,left.variable,[:divide]); };
RatfunNegate(value) -> {; exact=RatfunPromote(value); RatfunBuild(-exact.numerator,exact.denominator,exact.variable,[:negate]); };
RatfunPower(value, exponent) -> {;
    exact = RatfunPromote(value);
    power = exponent ~!: :Integer;
    power == 0
      ?: RatfunBuild(1,1,exact.variable,[:power])
      ?_ (power > 0
          ?: RatfunBuild(exact.numerator^power,exact.denominator^power,exact.variable,[:power])
          ?_ RatfunBuild(exact.denominator^(-power),exact.numerator^(-power),exact.variable,[:power]));
};
RatfunEqual(leftValue, rightValue) -> {; left=RatfunPromote(leftValue); right=RatfunPromote(rightValue,left.variable); left.variable==right.variable && left.numerator==right.numerator && left.denominator==right.denominator; };

RatfunFromStructural(structural, variable ?= :x) -> {;
    structural.Head() == "Fraction"
      ?: {; args=@structural.Arguments(); RatfunBuild(.poly(args[1],@variable),.poly(args[2],@variable),@variable,[:structural]); }
      ?_ RatfunBuild(.poly(structural,variable),1,variable,[:structural]);
};

RatfunPolyFromInspect(node, variable) -> {;
    state := [node, variable];
    kind = state[1][:kind];
    kind == "number"
      ?: .poly([state[1][:integer]],state[2])
      ?_ (kind == "identifier"
          ?: (state[1][:name] == state[2] ?: .poly([1,0],state[2]) ?_ .Error(@"Unexpected RationalFunction symbol @{state[1][:name]}"))
          ?_ (kind == "unary"
              ?: (state[1][:op] == "-" ?: -RatfunPolyFromInspect(state[1][:argument],state[2]) ?_ .Error(@"Unsupported RationalFunction unary operator @{state[1][:op]}"))
              ?_ (kind == "binary"
                  ?: {;
                      leftState:=[RatfunPolyFromInspect(@state[1][:left],@state[2])];
                      op=@state[1][:op];
                      op == "+" ?: leftState[1] + RatfunPolyFromInspect(@state[1][:right],@state[2])
                        ?_ op == "-" ?: leftState[1] - RatfunPolyFromInspect(@state[1][:right],@state[2])
                        ?_ op == "*" ?: leftState[1] * RatfunPolyFromInspect(@state[1][:right],@state[2])
                        ?_ op == "^" ?: leftState[1] ^ @state[1][:right][:integer]
                        ?_ .Error(@"Operator @{op} does not form a Polynomial");
                  }
                  ?_ .Error(@"Unsupported RationalFunction symbolic node @{kind}"))));
};

RatfunFromSpec(spec, variable ?= _) -> {;
    inspected = .InspectSpec(spec);
    selected = variable == _ ?: inspected[:inputs][1] ?_ variable;
    parts = .SpecFractionParts(spec);
    parts[2] == _
      ?: RatfunBuild(.poly(parts[1],selected),1,selected,[:symbolicSpec])
      ?_ RatfunBuild(.poly(parts[1],selected),.poly(parts[2],selected),selected,[:symbolicSpec]);
};

RatfunConstruct(first, second ?= _, variable ?= :x) -> {;
    RatfunIs(first)
      ?: first
      ?_ (((first ? :Map) && first[:schema] == "rix.rational-function@1")
          ?: RatfunBuild(first[:numerator],first[:denominator],first[:variable],[:record])
          ?_ (second == _
              ?: (((first ? :Polynomial) || RatfunScalar(first))
                  ?: RatfunBuild(first,1,variable)
                  ?_ RatfunFromStructural(first,variable))
              ?_ RatfunBuild(first,second,variable)));
};

RatfunModifierVariable(modifiers) -> {;
    variable := :x;
    {@ index = 1; index <= @modifiers.Len(); {;
        modifier = @modifiers[index];
        upper = modifier.Upper();
        upper == "FUN" ?: _ ?_ upper.StartsWith("VAR(")
          ?: {; @variable ~= @modifier.Slice(5, @modifier.Len()); }
          ?_ .Error(@"Unknown .ratfun modifier @{modifier}");
    }; index += 1 };
    variable;
};

RatfunParse(self, body, modifiers, info) -> RatfunFromStructural(.SArith.Parse(body,[],{= }),RatfunModifierVariable(modifiers));

.TypeKnown(:RationalFunction) ?: _ ?_ .TypeRegister({=
    name=:RationalFunction,
    nativeType=:function,
    defaultTraits=[:number],
    validate=(value)->value.schema=="rix.rational-function@1",
    proto={= },
    installs={=
        ADD=[{= name=:RatfunAdd, priority=300, prep=(left,right)->RatfunOperand(left)&&RatfunOperand(right)&&(RatfunIs(left)||RatfunIs(right)), impl=RatfunAdd }],
        SUB=[{= name=:RatfunSub, priority=300, prep=(left,right)->RatfunOperand(left)&&RatfunOperand(right)&&(RatfunIs(left)||RatfunIs(right)), impl=RatfunSubtract }],
        MUL=[{= name=:RatfunMul, priority=300, prep=(left,right)->RatfunOperand(left)&&RatfunOperand(right)&&(RatfunIs(left)||RatfunIs(right)), impl=RatfunMultiply }],
        DIV=[{= name=:RatfunDiv, priority=300, prep=(left,right)->RatfunOperand(left)&&RatfunOperand(right)&&(RatfunIs(left)||RatfunIs(right)||(right ? :Polynomial)), impl=RatfunDivide }],
        POW=[
            {= name=:RatfunPow, priority=300, prep=(left,right)->RatfunIs(left)&&(right ? :Integer), impl=RatfunPower },
            {= name=:PolynomialNegativePow, priority=300, prep=(left,right)->(left ? :Polynomial)&&(right ? :Integer)&&right<0, impl=RatfunPower }
        ],
        NEG=[{= name=:RatfunNeg, priority=300, prep=(value)->RatfunIs(value), impl=RatfunNegate }],
        EQ=[{= name=:RatfunEq, priority=300, prep=(left,right)->RatfunOperand(left)&&RatfunOperand(right)&&(RatfunIs(left)||RatfunIs(right)), impl=(left,right)->RatfunEqual(left,right) ?: 1 ?_ _ }],
        NEQ=[{= name=:RatfunNeq, priority=300, prep=(left,right)->RatfunOperand(left)&&RatfunOperand(right)&&(RatfunIs(left)||RatfunIs(right)), impl=(left,right)->RatfunEqual(left,right) ?: _ ?_ 1 }]
    }
});
.TypeInstall(:RationalFunction);

ratfunNamespace = (first, second ?= _) -> RatfunConstruct(first,second);
ratfunNamespace._proto = {=
    Parse=RatfunParse,
    RationalFunction=(self,first,second ?= _)->RatfunConstruct(first,second),
    Var=(self)->.Error(".ratfun.Var(name) is a backtick parser modifier"),
    Fun=(self)->.Error(".ratfun.Fun is a backtick parser modifier")
};
.Host.RegisterCallableValue("ratfun",ratfunNamespace,"Canonical callable univariate rational functions",["Algebra","Exact","Symbolic"]);

RatfunConversion=(value,variable ?= :x)->RatfunFromStructural(value,variable);
RatfunSpecConversion=(value,variable ?= _)->RatfunFromSpec(value,variable);
.Host.RegisterMethod("structural_form","R",RatfunConversion,"ratfun","ratfun");
.Host.RegisterMethod("structural_symbol","R",RatfunConversion,"ratfun","ratfun");
.Host.RegisterMethod("structural_literal","R",RatfunConversion,"ratfun","ratfun");
.Host.RegisterMethod("symbolic_spec","R",RatfunSpecConversion,"ratfun","ratfun");
`, sourcePath: "bundled:ratfun", kind: "rix" });
  catalog.addMetadata({ id: "scene3d", description: "Exact retained 3D scenes with deterministic wireframe and lit Graphics snapshots.", kind: "host", mount: "scene3d", exports: ["Scene", "Group", "Transform", "Mesh", "Polyline", "PointCloud", "Material", "AmbientLight", "DirectionalLight", "PointLight", "PerspectiveCamera", "OrthographicCamera", "Snapshot"], groups: ["Scene3D", "Graphics"], permissions: [], provides: ["rix.scene3d@1"], schemas: ["rix.scene3d@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:scene3d" }, { sourcePath: "bundled:scene3d", kind: "host" });
  catalog.registerInstaller("scene3d", install4);
  catalog.addMetadata({ id: "solve", description: "Exact Phase 1 linear-system classification and symbolic-spec solving.", kind: "host", mount: "solve", exports: ["Classify", "Linear", "System"], groups: ["Solve", "Symbolic", "Exact"], permissions: [], requires: ["rix.linear-algebra@1"], provides: ["rix.system-solver@1"], schemas: ["rix.solve.system-result@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:solve" }, { sourcePath: "bundled:solve", kind: "host" });
  catalog.registerInstaller("solve", install11);
  catalog.addMetadata({ id: "stats", description: "Exact descriptive statistics with portable summary tables, histograms, and box plots.", kind: "rix", mount: "stats", aliases: ["statistics"], exports: ["Count", "Mean", "Quantile", "Median", "Variance", "SampleVariance", "Summary", "SummaryTable", "Histogram", "HistogramGraphic", "BoxPlot"], groups: ["Statistics", "Exact", "Graphics"], permissions: [], provides: ["rix.statistics@1"], schemas: ["rix.stats.summary@1", "rix.stats.histogram@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:stats" }, { source: `/**
id: stats
description: Exact descriptive statistics with portable summary tables, histograms, and box plots.
kind: rix
mount: stats
aliases: [statistics]
exports: [Count, Mean, Quantile, Median, Variance, SampleVariance, Summary, SummaryTable, Histogram, HistogramGraphic, BoxPlot]
groups: [Statistics, Exact, Graphics]
permissions: []
provides: [rix.statistics@1]
schemas: [rix.stats.summary@1, rix.stats.histogram@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

StatsOption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

StatsValues(values, allowEmpty ?= 0) -> {;
    values ? :Array ?: _ ?_ .Error("Statistics values must be an Array");
    (allowEmpty == 1 || values.Len() > 0) ?: _ ?_ .Error("Statistics requires at least one value");
    values.Map((value) -> {;
        exact = value ~!: :Rational;
        exact == _ ?: .Error("Statistics values must be exact Integers or Rationals") ?_ exact;
    });
};

StatsCount(values) -> StatsValues(values, 1).Len();

StatsSum(exactValues) -> exactValues.Reduce((sum, value) -> sum + value, 0);

StatsMean(values) -> {;
    exact = StatsValues(values);
    StatsSum(exact) / exact.Len();
};

StatsQuantile(values, probability, policy ?= :linear) -> {;
    exact = StatsValues(values).Sort();
    p = probability ~!: :Rational;
    (p >= 0 && p <= 1) ?: _ ?_ .Error("Quantile probability must be between 0 and 1");
    policy == :linear ?: _ ?_ .Error("Phase 1 supports the exact :linear quantile policy");
    rank = p * (exact.Len() - 1);
    lowerOffset = rank.Floor();
    lowerIndex = lowerOffset + 1;
    weight = rank - lowerOffset;
    lowerIndex == exact.Len()
      ?: exact[lowerIndex]
      ?_ exact[lowerIndex] + weight * (exact[lowerIndex + 1] - exact[lowerIndex]);
};

StatsMedian(values) -> StatsQuantile(values, 1/2);

StatsVariance(values, sample ?= 0) -> {;
    exact = StatsValues(values);
    sample == 1 && exact.Len() < 2 ?: .Error("Sample variance requires at least two values") ?_ _;
    mean = StatsSum(exact) / exact.Len();
    squared = exact.Reduce((sum, value) -> sum + (value - mean)^2, 0);
    squared / (sample == 1 ?: exact.Len() - 1 ?_ exact.Len());
};

StatsSummary(values) -> {;
    exact = StatsValues(values);
    sorted = exact.Sort();
    count = sorted.Len();
    mean = StatsSum(sorted) / count;
    {=
        valueKind=:statsSummary,
        schema="rix.stats.summary@1",
        count=count,
        minimum=sorted[1],
        q1=StatsQuantile(sorted, 1/4),
        median=StatsQuantile(sorted, 1/2),
        q3=StatsQuantile(sorted, 3/4),
        maximum=sorted.Last(),
        mean=mean,
        populationVariance=StatsVariance(sorted),
        sampleVariance=count >= 2 ?: StatsVariance(sorted, 1) ?_ _,
        quantilePolicy=:linearNMinusOne,
        exact=1
    };
};

StatsSummaryTable(values, options ?= {= }) -> {;
    summary = StatsSummary(values);
    caption = StatsOption(options, "caption", "Exact descriptive statistics");
    .Table(["statistic", "value"], [
        ["count", summary[:count]],
        ["minimum", summary[:minimum]],
        ["q1", summary[:q1]],
        ["median", summary[:median]],
        ["q3", summary[:q3]],
        ["maximum", summary[:maximum]],
        ["mean", summary[:mean]],
        ["population variance", summary[:populationVariance]],
        ["sample variance", summary[:sampleVariance]]
    ], {= caption=caption });
};

StatsPositiveInteger(value, label) -> {;
    integer = value ~!: :Integer;
    integer >= 1 ?: integer ?_ .Error(@"@{label} must be a positive Integer");
};

StatsZeros(length) -> {;
    result := [];
    {@ index = 1; index <= @length; {; @result ~= @result.Push(0); }; index += 1 };
    result;
};

StatsHistogram(values, binCount ?= 5) -> {;
    exact = StatsValues(values);
    count = StatsPositiveInteger(binCount, "Histogram bin count");
    minimum = exact.Sort()[1];
    maximum = exact.Sort().Last();
    constant = minimum == maximum;
    effectiveCount = constant ?: 1 ?_ count;
    width = constant ?: 0 ?_ (maximum - minimum) / effectiveCount;
    counts := StatsZeros(effectiveCount);
    {@ index = 1; index <= @exact.Len(); {;
        bin = @constant ?: 1 ?_ ((@exact[index] - @minimum) / @width).Floor() + 1;
        bin > @effectiveCount ?: {; @bin ~= @effectiveCount; } ?_ _;
        @counts ~= @counts.Set(bin, @counts[bin] + 1);
    }; index += 1 };
    bins := [];
    {@ index = 1; index <= @effectiveCount; {;
        low = @constant ?: @minimum ?_ @minimum + (index - 1) * @width;
        high = @constant ?: @maximum ?_ @minimum + index * @width;
        @bins ~= @bins.Push({=
            index=index,
            low=low,
            high=high,
            count=@counts[index],
            includesHigh=index == @effectiveCount
        });
    }; index += 1 };
    {=
        valueKind=:statsHistogram,
        schema="rix.stats.histogram@1",
        bins=bins,
        count=exact.Len(),
        minimum=minimum,
        maximum=maximum,
        width=width,
        exact=1
    };
};

StatsHistogramGraphic(value, options ?= {= }) -> {;
    histogram = value ? :Array
      ?: StatsHistogram(value, StatsOption(options, "bins", 5))
      ?_ value;
    histogram[:schema] == "rix.stats.histogram@1" ?: _ ?_ .Error("HistogramGraphic expects values or a stats histogram");
    size = StatsOption(options, "size", [420, 220]);
    fill = StatsOption(options, "fill", "#2563eb");
    margin = 28;
    chartWidth = size[1] - 2 * margin;
    chartHeight = size[2] - 2 * margin;
    bins = histogram[:bins];
    maximumCount = bins.Map((bin) -> bin[:count]).Sort().Last();
    cellWidth = chartWidth / bins.Len();
    children := [
        .Graphics.Path([[margin, margin], [margin, margin + chartHeight], [margin + chartWidth, margin + chartHeight]], {= stroke="#334155", width=1, fill="none" })
    ];
    {@ index = 1; index <= @bins.Len(); {;
        height = @chartHeight * @bins[index][:count] / @maximumCount;
        @children ~= @children.Push(.Graphics.Rectangle(
            [@margin + (index - 1) * @cellWidth + 1, @margin + @chartHeight - height],
            [@cellWidth - 2, height],
            {= fill=@fill, stroke="#1e3a8a", width=1 }
        ));
    }; index += 1 };
    .Graphics.Graphic(size, children, {=
        schema="rix.stats.histogram-graphic@1",
        histogram=histogram,
        alt="Exact histogram"
    });
};

StatsBoxPlot(values, options ?= {= }) -> {;
    summary = StatsSummary(values);
    size = StatsOption(options, "size", [420, 120]);
    fill = StatsOption(options, "fill", "#bfdbfe");
    left = 30;
    right = size[1] - 30;
    y = size[2] / 2;
    spread = summary[:maximum] - summary[:minimum];
    position = (value) -> @spread == 0 ?: (@left + @right) / 2 ?_ @left + (value - @summary[:minimum]) * (@right - @left) / @spread;
    minX = summary[:minimum] |> position;
    q1X = summary[:q1] |> position;
    medianX = summary[:median] |> position;
    q3X = summary[:q3] |> position;
    maxX = summary[:maximum] |> position;
    .Graphics.Graphic(size, [
        .Graphics.Path([[minX, y], [maxX, y]], {= stroke="#334155", width=2, fill="none" }),
        .Graphics.Path([[minX, y - 14], [minX, y + 14]], {= stroke="#334155", width=2 }),
        .Graphics.Path([[maxX, y - 14], [maxX, y + 14]], {= stroke="#334155", width=2 }),
        .Graphics.Rectangle([q1X, y - 24], [q3X - q1X, 48], {= fill=fill, stroke="#1e3a8a", width=2 }),
        .Graphics.Path([[medianX, y - 24], [medianX, y + 24]], {= stroke="#be123c", width=3 })
    ], {= schema="rix.stats.box-plot@1", summary=summary, alt="Exact box plot" });
};

statsNamespace = {= };
statsNamespace._proto = {=
    Count=(self, values)->StatsCount(values),
    Mean=(self, values)->StatsMean(values),
    Quantile=(self, values, probability, policy ?= :linear)->StatsQuantile(values, probability, policy),
    Median=(self, values)->StatsMedian(values),
    Variance=(self, values)->StatsVariance(values),
    SampleVariance=(self, values)->StatsVariance(values, 1),
    Summary=(self, values)->StatsSummary(values),
    SummaryTable=(self, values, options ?= {= })->StatsSummaryTable(values, options),
    Histogram=(self, values, binCount ?= 5)->StatsHistogram(values, binCount),
    HistogramGraphic=(self, value, options ?= {= })->StatsHistogramGraphic(value, options),
    BoxPlot=(self, values, options ?= {= })->StatsBoxPlot(values, options)
};
.Host.RegisterValue("stats", statsNamespace, "Exact descriptive statistics and portable plots", ["Statistics", "Exact", "Graphics"]);
`, sourcePath: "bundled:stats", kind: "rix" });
  catalog.addMetadata({ id: "stern-brocot", description: "Pure RiX Stern-Brocot node descriptions, visible tree records, and exact formula evaluation.", kind: "rix", mount: "sternBrocot", exports: ["Describe", "VisibleTree", "Evaluate", "sternBrocotDescribe", "sternBrocotVisibleTree", "sternBrocotEvaluate"], groups: ["Exact", "Graphics"], permissions: [], requires: ["rix.fraction@1"], provides: ["rix.stern-brocot@1"], schemas: ["rix.stern-brocot.node@1", "rix.stern-brocot.tree@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:stern-brocot" }, { source: `/**
id: stern-brocot
description: Pure RiX Stern-Brocot node descriptions, visible tree records, and exact formula evaluation.
kind: rix
mount: sternBrocot
exports: [Describe, VisibleTree, Evaluate, sternBrocotDescribe, sternBrocotVisibleTree, sternBrocotEvaluate]
groups: [Exact, Graphics]
permissions: []
requires: [rix.fraction@1]
provides: [rix.stern-brocot@1]
schemas: [rix.stern-brocot.node@1, rix.stern-brocot.tree@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

{;
    SternBrocotNodeRecord(fraction, role, level) -> {=
        fraction=fraction,
        parent=fraction.SternBrocotParent(),
        role=role,
        level=level,
        path=fraction.SternBrocotPath()
    };

    SternBrocotDescribe(fraction) -> {;
        current := fraction.F();
        path := current.SternBrocotPath();
        parents := current.FareyParents();
        children := current.SternBrocotChildren();
        rational := current.Rational() ~!: :Rational;
        {=
            schema="rix.stern-brocot.node@1",
            current=current,
            parent=current.SternBrocotParent(),
            children=children,
            ancestors=current.SternBrocotAncestors(),
            depth=current.SternBrocotDepth(),
            path=path,
            boundaries=parents,
            mediant=(parents[1].Denominator() + parents[2].Denominator() == 0)
                ?: current
                ?_ parents[1].Mediant(parents[2]),
            rational=rational,
            continuedFraction=rational.ToContinuedFraction(),
            convergents=rational.Convergents()
        }
    };

    SternBrocotVisibleTree(fraction, descendantDepth ?= 2) -> {;
        current := fraction.F();
        ancestors := current.SternBrocotAncestors();
        ancestorRecords := ancestors.Map((ancestor, index) ->
            SternBrocotNodeRecord(ancestor, "ancestor", 0 - index));
        descendantRecords := [];
        frontier := [current];
        level := 1;
        {@ tick := 0; @level <= @descendantDepth; {;
            next := @frontier.Reduce((items, item) -> {;
                children := item.SternBrocotChildren();
                items ++ [children[1], children[2]]
            }, []);
            @descendantRecords = @descendantRecords ++ next.Map(item ->
                SternBrocotNodeRecord(item, "descendant", @level));
            @frontier = next
        }; @level += 1 };
        nodes := [SternBrocotNodeRecord(current, "current", 0)]
            ++ ancestorRecords
            ++ descendantRecords;
        edges := nodes.Filter(node -> node["parent"] != _).Map(node -> {=
            parent=node["parent"],
            child=node["fraction"]
        });
        {=
            schema="rix.stern-brocot.tree@1",
            current=current,
            descendantDepth=descendantDepth,
            nodes=nodes,
            edges=edges
        }
    };

    SternBrocotEvaluate(formula, fraction) -> fraction.F().Rational() |> formula;

    sternBrocotNamespace = {= };
    sternBrocotNamespace._proto = {=
        Describe=(self, fraction)->SternBrocotDescribe(fraction),
        VisibleTree=(self, fraction, descendantDepth ?= 3)->SternBrocotVisibleTree(fraction, descendantDepth),
        Evaluate=(self, formula, fraction)->SternBrocotEvaluate(formula, fraction)
    };
    .Host.RegisterValue(
        "sternBrocot",
        sternBrocotNamespace,
        "Exact Stern-Brocot descriptions, visible trees, and formula evaluation",
        ["Exact", "Graphics"]
    );

    .Host.Register(
        "sternBrocotDescribe",
        SternBrocotDescribe,
        "Describe one exact Stern-Brocot node and its related values",
        ["Exact", "Graphics"]
    );
    .Host.Register(
        "sternBrocotVisibleTree",
        SternBrocotVisibleTree,
        "Build portable exact node and edge records around a Stern-Brocot node",
        ["Exact", "Graphics"]
    );
    .Host.Register(
        "sternBrocotEvaluate",
        SternBrocotEvaluate,
        "Evaluate a RiX callable at the selected exact rational",
        ["Exact"]
    )
}
`, sourcePath: "bundled:stern-brocot", kind: "rix" });
  catalog.addMetadata({ id: "svg", description: "Portable SVG renderer for core Graphics scenes.", kind: "host", mount: "svg", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.svg@1"], targets: ["svg", "image/svg+xml"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:svg" }, { sourcePath: "bundled:svg", kind: "host" });
  catalog.registerInstaller("svg", install13);
  catalog.addMetadata({ id: "symbolic", description: "Meta-plugin loading RiX representation-sensitive Fraction and FractionFunction workspaces.", kind: "rix", mount: "symbolic", exports: ["Fraction", "FractionFunction", "Services"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], requires: ["rix.fraction-function@1"], provides: ["rix.symbolic.formal@1"], schemas: [], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:symbolic" }, { source: `/**
id: symbolic
description: Meta-plugin loading RiX representation-sensitive Fraction and FractionFunction workspaces.
kind: rix
mount: symbolic
exports: [Fraction, FractionFunction, Services]
groups: [Algebra, Exact, Symbolic]
permissions: []
requires: [rix.fraction-function@1]
provides: [rix.symbolic.formal@1]
schemas: []
snapshot: false
deterministic: true
defaultEnabled: false
**/

symbolicNamespace = {= };
symbolicNamespace._proto = {=
    Fraction = (self, first, second ?= _) -> second == _ ?: .fraction(first) ?_ .fraction(first,second),
    FractionFunction = (self, value, variable ?= _) -> variable == _ ?: .fracfun(value) ?_ .fracfun(value,variable),
    Services = (self) -> ["fraction","fracfun","poly","ratfun"]
};

.Host.RegisterValue("symbolic",symbolicNamespace,"Representation-sensitive symbolic workspace",["Algebra","Exact","Symbolic"]);
`, sourcePath: "bundled:symbolic", kind: "rix" });
  catalog.addMetadata({ id: "terminal-ascii", description: "Deterministic strict-ASCII fallback for tables, grids, fragments, and simple Graphics.", kind: "host", mount: "terminalAscii", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.terminal-ascii@1"], targets: ["terminal-ascii", "terminal", "ascii", "txt", "text/plain"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:terminal-ascii" }, { sourcePath: "bundled:terminal-ascii", kind: "host" });
  catalog.registerInstaller("terminal-ascii", install12);
  catalog.addMetadata({ id: "tikz", description: "Editable TikZ/PGF source renderer for core Graphics scenes.", kind: "host", mount: "tikz", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.tikz@1"], targets: ["tikz", "text/x-tikz"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:tikz" }, { sourcePath: "bundled:tikz", kind: "host" });
  catalog.registerInstaller("tikz", install15);
  return catalog;
}

// src/web-control-capabilities.js
var constructors = new Map([
  ["Slider", createSliderControl],
  ["Input", createInputControl],
  ["Choice", createChoiceControl],
  ["Toggle", createToggleControl],
  ["Range", createRangeControl],
  ["Reset", createResetControl],
  ["Action", createActionControl],
  ["Hold", createHoldControl]
]);
var declarativeControls = new Map([
  ["SLIDER", { name: "Slider", minimumArguments: 2 }],
  ["INPUT", { name: "Input", minimumArguments: 1 }],
  ["CHOICE", { name: "Choice", minimumArguments: 2 }],
  ["TOGGLE", { name: "Toggle", minimumArguments: 3 }],
  ["RANGE", { name: "Range", minimumArguments: 2 }]
]);
var containerOpeners2 = new Set(["(", "[", "{", "{|", "{=", "{;", "{@", "{!", "{:"]);
var containerClosers = new Set([")", "]", "}", "|}", ";}", "@}", "!}", ":}"]);
var WEB_CONTROL_NAMES = Object.freeze([...constructors.keys()]);
function callArguments(tokens, openIndex, source) {
  const commas = [];
  let depth = 0;
  for (let index = openIndex;index < tokens.length; index += 1) {
    const token = tokens[index];
    if (containerOpeners2.has(token.value)) {
      depth += 1;
      continue;
    }
    if (containerClosers.has(token.value)) {
      depth -= 1;
      if (depth === 0) {
        const boundaries = [tokens[openIndex].pos[2], ...commas.map((comma) => comma.pos[2])];
        const ends = [...commas.map((comma) => comma.pos[0]), token.pos[0]];
        return {
          closeIndex: index,
          arguments: boundaries.map((start, argumentIndex) => source.slice(start, ends[argumentIndex]).trim())
        };
      }
      continue;
    }
    if (token.value === "," && depth === 1)
      commas.push(token);
  }
  return null;
}
function nextCodeToken(tokens, index) {
  for (let cursor = index;cursor < tokens.length; cursor += 1) {
    const token = tokens[cursor];
    if (!(token.type === "String" && token.kind === "comment"))
      return token;
  }
  return null;
}
function expandDeclarativeWebControls(source, tokenize2) {
  let tokens;
  try {
    tokens = tokenize2(source);
  } catch {
    return source;
  }
  const replacements = [];
  let depth = 0;
  for (let index = 0;index < tokens.length; index += 1) {
    const token = tokens[index];
    if (depth === 0 && token.value === "$$" && tokens[index + 1]?.type === "Identifier" && tokens[index + 1]?.kind === "User" && tokens[index + 2]?.value === ":=" && tokens[index + 3]?.value === "." && tokens[index + 4]?.type === "Identifier" && declarativeControls.has(tokens[index + 4]?.value) && tokens[index + 5]?.value === "(") {
      const declaration = declarativeControls.get(tokens[index + 4].value);
      const call = callArguments(tokens, index + 5, source);
      const following = call ? nextCodeToken(tokens, call.closeIndex + 1) : null;
      if (call && [";", null].includes(following?.value ?? null) && call.arguments.length >= declaration.minimumArguments && call.arguments[0]) {
        const name = tokens[index + 1].value;
        const controlArguments = [`$$${name}`, ...call.arguments.slice(1)].join(", ");
        replacements.push({
          start: tokens[index + 3].pos[1],
          end: tokens[call.closeIndex].pos[2],
          value: `${call.arguments[0]}; .${declaration.name}(${controlArguments}); $${name}`
        });
        index = call.closeIndex;
        continue;
      }
    }
    if (containerOpeners2.has(token.value))
      depth += 1;
    else if (containerClosers.has(token.value))
      depth = Math.max(0, depth - 1);
  }
  return replacements.sort((left, right) => right.start - left.start).reduce((result, replacement) => `${result.slice(0, replacement.start)}${replacement.value}${result.slice(replacement.end)}`, source);
}
function installWebControlCapabilities(systemContext, { onControl = null } = {}) {
  for (const [name, constructor] of constructors) {
    if (systemContext.has(name)) {
      throw new Error(`RiX-Web control shortcut conflicts with .${name}`);
    }
    systemContext.register(name, {
      pure: true,
      groups: ["Output", "Controls"],
      doc: declarativeControls.has(name.toUpperCase()) ? `RiX-Web shortcut for .Controls.${name}; supports $$name := .${name}(initial, ...)` : `RiX-Web shortcut for .Controls.${name}`,
      impl(args, context, evaluate) {
        const runtime = {
          context,
          evaluate,
          invoke: (callable, callArgs) => callWithConcreteArgs(callable, callArgs, context, evaluate)
        };
        const control = constructor(args, runtime);
        onControl?.({
          control,
          create: () => constructor(args, runtime)
        });
        return control;
      }
    });
  }
  return systemContext;
}

// src/repl-runtime.js
var helpGroups = [
  {
    title: "Start here",
    items: [
      ["2 + 3", "Evaluate an exact expression. Integers and fractions never become floats by accident."],
      ["3 / 8", "Exact division returns the rational 3/8."],
      ["2:5", "An interval with exact endpoints."],
      ["x := 7", "Store a fresh value in the current calculator session."]
    ]
  },
  {
    title: "Names and functions",
    items: [
      ["x := 3", "Create a lower-case value binding."],
      ["y = x", "Alias x's cell; in-place updates are shared."],
      ["Square(x) -> x ^ 2", "Define an uppercase callable."],
      [".SIN(x)", "Call a RiX system capability with the dot prefix."]
    ]
  },
  {
    title: "Collections",
    items: [
      ["[1, 2, 3]", "An array; indexes begin at 1."],
      ["{| 1, 2 |}", "A set."],
      ["{= a=3, b=5 }", "A map."],
      ["values[2]", "Read the second array item."]
    ]
  },
  {
    title: "Exact symbolic work",
    items: [
      ["{#x}", "Create the identity-symbol spec for x."],
      ["{#x# x^2 + 1 }", "Create a single-output symbolic expression."],
      [".Deriv(S, {#x})", "Differentiate a spec or spec-backed function exactly."],
      [".Integrate(S, {#x})", "Build a supported zero-constant antiderivative."]
    ]
  },
  {
    title: "Number views",
    items: [
      ["Numbers", "Open the number panel for decimal, exact, base, continued-fraction, and scientific presets."],
      ['*> ".[12],b,.."', "Show a bounded decimal, binary expansion, and exact mixed fraction together."],
      ['*> "cf"', "Display exact numeric results as continued fractions."],
      ['*> "sci[10]"', "Display scientific notation with ten significant digits."]
    ]
  },
  {
    title: "Intervals and graphics",
    items: [
      ["1/3:2/3", "Create an exact closed interval; endpoint orientation is retained."],
      ["Explore interval", "Open the exact number line, edit endpoints, inspect arithmetic provenance, and export SVG or HTML."],
      ["Arrow keys", "In the interval explorer, move a focused endpoint or the whole interval by the exact selected step."],
      [".Graphics", "Build portable figures that RiX Web can render and make interactive."]
    ]
  },
  {
    title: "Scripts and plugins",
    items: [
      ["Script entry", "Write several RiX statements and run them together with Ctrl/Command + Enter."],
      ["Load", "Load a local .rix file into script entry mode."],
      ['.Plugin.Load("plot")', "Load an approved browser plugin into this session."],
      ["Tab", "Complete names and methods from the current RiX context without evaluating the draft."]
    ]
  },
  {
    title: "Reactive dashboard",
    items: [
      ["$$x := 2", "Declare a reactive value; the dashboard displays it live."],
      ["$x", "Read x and record a dependency inside another reactive definition."],
      ['$$x := .Slider(2, 0:5, 1/2, "x")', "Declare x at 2 and give it an exact RiX-Web dashboard slider."],
      ['.Slider($$x, 0:5, 1/2, "x")', "Attach a dashboard slider to an existing reactive identity."],
      ["Dashboard", "Open live values, explicit controls, formulas, dependencies, and diagnostics."]
    ]
  },
  {
    title: "Calculator commands",
    items: [
      [".help", "Open this reference and its quick-start guide."],
      ['.Help("interval")', "Print matching help inline in the calculator transcript."],
      [".vars", "Show values currently held by the RiX session."],
      [".clear", "Clear the transcript and begin a new RiX session."]
    ]
  }
];
function findHelp(topic = "") {
  const query = String(topic).trim().toLowerCase();
  const groups = helpGroups.map((group) => ({
    ...group,
    items: group.items.filter(([syntax, description]) => !query || `${group.title} ${syntax} ${description}`.toLowerCase().includes(query))
  })).filter((group) => group.items.length > 0);
  return { query, groups };
}
function inlineHelpRequest(source) {
  const match = source.trim().match(/^\.Help\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))?\s*\)\s*;?$/);
  return match ? (match[1] ?? match[2] ?? match[3] ?? "").trim() : null;
}
function currentReactiveValue(source) {
  if (source?.type === "reactive_node" && typeof source.peek === "function")
    return source.peek();
  if (source?.type === "formula_sheet")
    return source;
  return;
}
function collectControlValues(value, controls, seen = new Set) {
  if (!value || typeof value !== "object" || seen.has(value))
    return;
  seen.add(value);
  if (isOutputValue(value) && value.kind?.startsWith("control_")) {
    controls.push(value);
    return;
  }
  if (isOutputValue(value) && value.kind === "control_panel") {
    for (const control of value.controls || [])
      collectControlValues(control, controls, seen);
    return;
  }
  if (!isOutputValue(value))
    return;
  for (const child of value.children || [])
    collectControlValues(child, controls, seen);
}
function diagnosticText(diagnostic) {
  return diagnostic?.message || diagnostic?.text || diagnostic?.label || String(diagnostic);
}
var FORMULA_OPERATORS = Object.freeze({
  ADD: ["+", 10],
  SUB: ["-", 10],
  MUL: ["*", 20],
  DIV: ["/", 20],
  IDIV: ["//", 20],
  MOD: ["%", 20],
  POW: ["^", 30],
  INTERVAL: [":", 5],
  EQ: ["==", 4],
  NEQ: ["!=", 4],
  LT: ["<", 4],
  LTE: ["<=", 4],
  GT: [">", 4],
  GTE: [">=", 4]
});
function readableFormula(node, parentPrecedence = 0) {
  if (!node || typeof node !== "object")
    return String(node ?? "_");
  if (node.fn === "LITERAL")
    return String(node.args?.[0] ?? "_");
  if (node.fn === "REACTIVE_READ")
    return `$${node.args?.[0]}`;
  if (node.fn === "REACTIVE_NODE")
    return `$$${node.args?.[0]}`;
  if (node.fn === "RETRIEVE")
    return String(node.args?.[0]);
  if (node.fn === "NEG")
    return `-${readableFormula(node.args?.[0], 40)}`;
  const operation = FORMULA_OPERATORS[node.fn];
  if (operation) {
    const [symbol, precedence] = operation;
    const text2 = (node.args || []).map((arg) => readableFormula(arg, precedence)).join(` ${symbol} `);
    return precedence < parentPrecedence ? `(${text2})` : text2;
  }
  if (node.fn === "SYS_CALL") {
    return `.${node.args?.[0]}(${(node.args || []).slice(1).map((arg) => readableFormula(arg)).join(", ")})`;
  }
  return irToText(node);
}
function reactiveFormulaSource(node) {
  if (node.source)
    return node.source;
  const body = node.formula?.args?.[0];
  return body?.fn ? readableFormula(body) : null;
}
function createRixRepl({ autoSeparateLines = true } = {}) {
  const registeredControls = new Map;
  const systemContext = createDefaultSystemContext({
    frozen: false,
    pluginCatalog: createBundledPluginCatalog()
  });
  installWebControlCapabilities(systemContext, {
    onControl({ control, create }) {
      registeredControls.set(`${control.targetId}\x00${control.id}`, {
        targetId: control.targetId,
        create
      });
    }
  }).freeze();
  const state = {
    context: new Context,
    registry: createDefaultRegistry(),
    systemContext
  };
  let initialNames = new Set(state.context.getAllNames());
  let separateLines = autoSeparateLines;
  const numberConfig = { input: "z[10]", display: ".." };
  const configuredFormat = (value) => formatValue(value, { context: state.context, evaluate: null });
  const applyNumberConfig = ({ input, display } = {}) => {
    if (input !== undefined) {
      parseAndEvaluate(`<* ${JSON.stringify(String(input))}`, { ...state, file: "<ratcalc-config>" });
      numberConfig.input = state.context.getEnv("numInput", String(input));
    }
    if (display !== undefined) {
      parseAndEvaluate(`*> ${JSON.stringify(String(display))}`, { ...state, file: "<ratcalc-config>" });
      numberConfig.display = state.context.getEnv("numDisplay", String(display));
    } else if (input !== undefined && state.context.getEnv("numDisplayExplicit", false) !== true) {
      numberConfig.display = state.context.getEnv("numDisplay", numberConfig.input);
    }
    return { ...numberConfig };
  };
  return {
    run(source) {
      const topic = inlineHelpRequest(source);
      if (topic !== null)
        return { type: "help", source, ...findHelp(topic) };
      try {
        const reactiveReads = new Set;
        const normalizedSource = separateLines ? normalizeReplSource(source) : source;
        const evaluationSource = expandDeclarativeWebControls(normalizedSource, tokenize);
        const result = parseAndEvaluate(evaluationSource, {
          ...state,
          file: "<ratcalc>",
          reactiveReads
        });
        const format = configuredFormat;
        const observedSource = [...reactiveReads].find((candidate) => currentReactiveValue(candidate) === result);
        const makeResponse = (value) => ({
          type: "result",
          source,
          value,
          text: format(value),
          sourceText: formatValueSource(value),
          html: isOutputValue(value) ? renderOutputHtml(value, format) : null,
          observe: observedSource ? (listener) => observedSource.subscribe(() => {
            listener(makeResponse(currentReactiveValue(observedSource)));
          }) : null
        });
        return makeResponse(result);
      } catch (error) {
        return { type: "error", source, text: error.message || String(error) };
      }
    },
    async runAsync(source) {
      const tokens = tokenize(source);
      const usesAsyncEvaluation = tokens.some((token) => token.value === "{$" || token.value === "{$$") || tokens.some((token) => token.value === "|>_" || token.value === "|>!") || /\.(?:ForEach|Reduce|Collect|First|Find|Count|Close|Retry)\s*\(/i.test(source);
      if (!usesAsyncEvaluation)
        return this.run(source);
      const topic = inlineHelpRequest(source);
      if (topic !== null)
        return { type: "help", source, ...findHelp(topic) };
      try {
        const reactiveReads = new Set;
        const normalizedSource = separateLines ? normalizeReplSource(source) : source;
        const evaluationSource = expandDeclarativeWebControls(normalizedSource, tokenize);
        const result = await parseAndEvaluateAsync(evaluationSource, {
          ...state,
          file: "<ratcalc>",
          reactiveReads
        });
        const format = configuredFormat;
        const observedSource = [...reactiveReads].find((candidate) => currentReactiveValue(candidate) === result);
        const makeResponse = (value) => ({
          type: "result",
          source,
          value,
          text: format(value),
          sourceText: formatValueSource(value),
          html: isOutputValue(value) ? renderOutputHtml(value, format) : null,
          observe: observedSource ? (listener) => observedSource.subscribe(() => {
            listener(makeResponse(currentReactiveValue(observedSource)));
          }) : null
        });
        return makeResponse(result);
      } catch (error) {
        return { type: "error", source, text: error.message || String(error) };
      }
    },
    variables() {
      return state.context.getAllNames().filter((name) => !initialNames.has(name)).map((name) => ({
        name,
        value: configuredFormat(state.context.get(name))
      }));
    },
    reactiveVariables() {
      const names = state.context.getAllNames();
      const byId = new Map;
      for (const bindingName of names) {
        const node = state.context.get(bindingName);
        if (!isReactiveNode(node))
          continue;
        const descriptor = byId.get(node.id) || {
          id: node.id,
          name: node.name,
          aliases: [],
          node
        };
        descriptor.aliases.push(bindingName);
        byId.set(node.id, descriptor);
      }
      const controls = [];
      for (const name of names)
        collectControlValues(state.context.get(name), controls);
      for (const [key, entry2] of registeredControls) {
        if (!byId.has(entry2.targetId)) {
          registeredControls.delete(key);
          continue;
        }
        try {
          controls.push(entry2.create());
        } catch {}
      }
      const controlsByTarget = new Map;
      for (const control of controls) {
        if (!control.targetId)
          continue;
        const keyed = controlsByTarget.get(control.targetId) || new Map;
        keyed.set(control.id, control);
        controlsByTarget.set(control.targetId, keyed);
      }
      return [...byId.values()].map((descriptor) => {
        const { node } = descriptor;
        const value = node.peek();
        return {
          ...descriptor,
          aliases: Object.freeze([...new Set(descriptor.aliases)].sort()),
          kind: node.kind,
          state: node.state,
          value,
          valueText: configuredFormat(value),
          sourceText: formatValueSource(value),
          formulaSource: reactiveFormulaSource(node),
          dependencies: Object.freeze([...node.dependencies].sort()),
          dependents: Object.freeze([...node.dependents].sort()),
          diagnostics: Object.freeze((node.diagnostics || []).map(diagnosticText)),
          controls: Object.freeze([...controlsByTarget.get(node.id)?.values() || []])
        };
      }).sort((left, right) => left.name.localeCompare(right.name));
    },
    subscribeReactive(listener) {
      if (typeof listener !== "function")
        throw new Error("Reactive subscriber must be a function");
      const graphs = new Set(this.reactiveVariables().map(({ node }) => node.graph));
      const unsubscribes = [...graphs].map((graph) => graph.subscribe(listener));
      return () => unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe?.());
    },
    formatValue: configuredFormat,
    sourceText: formatValueSource,
    numberConfig() {
      return {
        input: state.context.getEnv("numInput", numberConfig.input),
        display: state.context.getEnv("numDisplay", numberConfig.display)
      };
    },
    setNumberConfig(config) {
      return applyNumberConfig(config);
    },
    complete(source, cursor = String(source).length) {
      return complete(source, cursor, {
        context: state.context,
        systemContext: state.systemContext,
        formatValue: (value) => formatValue(value, { context: state.context, evaluate: null })
      });
    },
    async reset() {
      await disposeAsyncResources(state.context, { kind: "session reset" });
      state.context.clear();
      registeredControls.clear();
      initialNames = new Set(state.context.getAllNames());
      applyNumberConfig(numberConfig);
    },
    async dispose() {
      await disposeAsyncResources(state.context, { kind: "session shutdown" });
    },
    setAutoSeparateLines(enabled) {
      separateLines = Boolean(enabled);
    },
    autoSeparatesLines() {
      return separateLines;
    }
  };
}

export { findHelp, createRixRepl };

//# debugId=A37880DCF74955CB64756E2164756E21
//# sourceMappingURL=chunk-f2pwt9mm.js.map
