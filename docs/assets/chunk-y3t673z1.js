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
  install2 as install3,
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
} from "./chunk-ajnaxbh2.js";

// standard-profile.rix
var standard_profile_default = `## RiX-Web standard calculator profile.
## Keep one directly selected plugin on each line. Dependencies load automatically.
## Bare imports favor names expected in a scientific or graphical calculator;
## aliases make collisions explicit. This file is executable by the RiX CLI too.
.Plugin.Load("numerics"); .numerics[:Pow, :Sqrt, :Cbrt, :NthRoot, :Exp, :Expm1, :Log, :Log1p, :Ln, :Log2, :Log10, :Pi, :EulerGamma, :Sin, :Cos, :Tan, :Sec, :Csc, :Cot, :Sinc, :Asin, :Acos, :Atan, :Sinh, :Cosh, :Tanh, :Sech, :Csch, :Coth, :Asinh, :Acosh, :Atanh, :Radians, :Degrees, :Gamma, :LogGamma, :Erf, :Erfc, :LambertW, :J0, :J1, :Y0, :Y1, :Zeta, :Refine];
.Plugin.Load("float"); .float[:Round, :Floor, :Ceiling];
.Plugin.Load("algebra"); .algebra[:Polynomial, :Coefficients];
.Plugin.Load("linalg"); .linalg[:Rref, :Rank, :Determinant, :Inverse, :LinearSolve=:Solve];
.Plugin.Load("solve");
.Plugin.Load("stats"); .stats[:Count, :Mean, :Quantile, :Median, :Variance, :SampleVariance];
.Plugin.Load("plot"); .plot[:GraphPolynomial=:Polynomial];
.Plugin.Load("draw"); .draw[:DrawLine=:Line, :Polygon, :Label, :Box, :DrawCircle=:Circle];
.Plugin.Load("geometry"); .geometry[:Point, :Line, :Circle, :Midpoint, :PerpendicularBisector, :Circumcircle, :Intersect];
.Plugin.Load("data");
.Plugin.Load("radix");
`;

// src/plugin-profile.js
var RIX_WEB_PROFILE_NAME = "standard-v1";
var RIX_WEB_PROFILE_BEGIN = `## RIX-WEB-PROFILE-BEGIN ${RIX_WEB_PROFILE_NAME}`;
function commaValues(values) {
  return values.flatMap((value) => String(value).split(",")).map((value) => value.trim().toLowerCase()).filter(Boolean);
}
function profileEntries(source = standard_profile_default) {
  const entries = [];
  for (const rawLine of String(source).replace(/\r/g, "").split(`
`)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("##"))
      continue;
    const match = line.match(/^\.Plugin\.Load\("([^"]+)"\)/);
    if (!match)
      throw new Error(`Invalid RiX-Web profile line: ${line}`);
    entries.push({ id: match[1].toLowerCase(), source: line });
  }
  return entries;
}
var STANDARD_PLUGIN_IDS = Object.freeze(profileEntries().map(({ id }) => id));
function pluginProfileFromUrl(input = "") {
  const url = input instanceof URL ? input : new URL(String(input || "http://localhost/"), "http://localhost/");
  const modes = commaValues(url.searchParams.getAll("plugins"));
  return {
    fresh: modes.includes("fresh"),
    add: commaValues(url.searchParams.getAll("plugins-add")),
    remove: commaValues(url.searchParams.getAll("plugins-remove"))
  };
}
function normalizedSavedProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile))
    return null;
  if (!Array.isArray(profile.plugins) || typeof profile.source !== "string")
    return null;
  return {
    name: typeof profile.name === "string" ? profile.name : "saved",
    plugins: commaValues(profile.plugins),
    source: profile.source.trim(),
    warnings: []
  };
}
function resolvePluginProfile(profile = {}, availablePluginIds = []) {
  const saved = normalizedSavedProfile(profile);
  if (saved)
    return saved;
  const available = new Set(Array.from(availablePluginIds, (id) => String(id).toLowerCase()));
  const standard = profile?.fresh ? [] : profileEntries();
  const removed = new Set(commaValues(profile?.remove || []));
  const selected = standard.filter(({ id }) => !removed.has(id));
  const selectedIds = new Set(selected.map(({ id }) => id));
  const warnings = [];
  for (const id of commaValues(profile?.add || [])) {
    if (selectedIds.has(id))
      continue;
    if (available.size && !available.has(id)) {
      warnings.push(`Unknown RiX-Web plugin '${id}' was ignored.`);
      continue;
    }
    selected.push({ id, source: `.Plugin.Load(${JSON.stringify(id)});` });
    selectedIds.add(id);
  }
  return {
    name: profile?.fresh ? "fresh" : RIX_WEB_PROFILE_NAME,
    plugins: selected.map(({ id }) => id),
    source: selected.map(({ source }) => source).join(`
`),
    warnings
  };
}
function markedPluginProfile(source) {
  const match = String(source).match(/(?:^|\n)## RIX-WEB-PROFILE-BEGIN ([^\n]+)\n([\s\S]*?)\n## RIX-WEB-PROFILE-END(?=\n|$)/);
  return match ? { name: match[1].trim(), source: match[2].trim(), matchedSource: match[0] } : null;
}
function stripMarkedPluginProfile(source, expectedProfileSource = null) {
  const marked = markedPluginProfile(source);
  if (!marked)
    return String(source);
  if (expectedProfileSource !== null && marked.source !== String(expectedProfileSource).trim())
    return String(source);
  return String(source).replace(marked.matchedSource, `
`).replace(/^\s+/, "");
}

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
function install18({ systemContext }) {
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
  SQRT: { impl: unary(Math.sqrt), pure: true, doc: "Float square root" },
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
var install19 = installBrowserApproxMathPlugin;

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
  catalog.registerInstaller("canvas", install7);
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
  catalog.registerInstaller("csv", install16);
  catalog.addMetadata({ id: "data", description: "Immutable typed relations with deterministic projection, filtering, sorting, and Table views.", kind: "host", mount: "data", exports: ["Relation", "Project", "Filter", "Sort", "TableView", "Schema", "Rows"], groups: ["Data"], permissions: [], provides: ["rix.data.relation@1"], schemas: ["rix.data.relation@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:data" }, { sourcePath: "bundled:data", kind: "host" });
  catalog.registerInstaller("data", install3);
  catalog.addMetadata({ id: "document", description: "Numbered portable reports with labels, forward references, captions, and small semantic themes.", kind: "host", mount: "document", exports: ["Report", "Label", "Ref", "Theme", "References"], groups: ["Documents"], permissions: [], provides: ["rix.document.report@1"], schemas: ["rix.document.report@1", "rix.document.theme@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:document" }, { sourcePath: "bundled:document", kind: "host" });
  catalog.registerInstaller("document", install4);
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
  catalog.registerInstaller("example-array-js", install18);
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
  catalog.registerInstaller("float", install19);
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
  catalog.addMetadata({ id: "geometry", description: "Pure-RiX exact ruler-and-compass geometry with explicit intersections and portable Graphics snapshots.", kind: "rix", mount: "geometry", exports: ["Point", "Line", "Circle", "Midpoint", "PerpendicularBisector", "Circumcircle", "Intersect", "Points", "Status", "Draw"], groups: ["Geometry", "Graphics", "Exact"], permissions: [], requires: ["rix.numerics@1"], provides: ["rix.geometry@1", "rix.geometry.intersection@1"], schemas: ["rix.geometry@1", "rix.geometry.intersection@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:geometry" }, { source: `/**
id: geometry
description: Pure-RiX exact ruler-and-compass geometry with explicit intersections and portable Graphics snapshots.
kind: rix
mount: geometry
exports: [Point, Line, Circle, Midpoint, PerpendicularBisector, Circumcircle, Intersect, Points, Status, Draw]
groups: [Geometry, Graphics, Exact]
permissions: []
requires: [rix.numerics@1]
provides: [rix.geometry@1, rix.geometry.intersection@1]
schemas: [rix.geometry@1, rix.geometry.intersection@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

GeometryOption(options, key, fallback ?= _) -> options.Has(key) ?: options[key] ?_ fallback;

GeometryExact(value, label) -> {;
    exact = value ~!: :Rational;
    exact == _ ?: .Error(@"@{label} must be an exact integer or rational") ?_ exact;
};

GeometryIsZero(value) -> (value ~!: :Rational).Numerator()==0;

GeometryApproximateSqrt(value) ->
    .numerics.Refine(.numerics.Sqrt(value), {=
        absoluteWidth=1/1000000000000,
        maxWork=80
    })[:approximation].Candidate();

GeometryRequire(value, kind ?= _, label ?= "geometry value") -> {;
    valid = (value ? :Map) && value.Has("schema") && value[:schema] == "rix.geometry@1";
    valid && (kind == _ || value[:kind] == kind)
      ?: value
      ?_ .Error(@"@{label} must be a geometry @{kind == _ ?: "value" ?_ kind}");
};

GeometryProvenance(operation, inputs, details ?= _) -> {=
    operation=operation,
    inputs=inputs,
    details=details
};

GeometryValue(kind, fields) -> .DeepMutable({=
    type="geometry",
    kind=kind,
    schema="rix.geometry@1"
}.Merge(fields), _);

GeometryPointValue(x, y, operation, inputs, metadata ?= _, style ?= _) -> GeometryValue(:point, {=
    x=x,
    y=y,
    coordinates=[x, y],
    metadata=metadata,
    style=style,
    provenance=[GeometryProvenance(operation, inputs)]
});

GeometryPoint(first, second ?= _, options ?= {= }) -> {;
    settings = ((first ? :Map) && second == _) ?: first ?_ options;
    coordinates = ((first ? :Array) && second == _)
      ?: first
      ?_ ((first ? :Map) && second == _)
           ?: [GeometryOption(settings, "x"), GeometryOption(settings, "y")]
           ?_ [first, second];
    coordinates.Len() == 2 ?: _ ?_ .Error("geometry.Point coordinates must contain x and y");
    x = GeometryExact(coordinates[1], "geometry.Point x");
    y = GeometryExact(coordinates[2], "geometry.Point y");
    GeometryPointValue(x, y, "Point", [x, y], GeometryOption(settings, "metadata"), GeometryOption(settings, "style"));
};

GeometrySamePoint(left, right) -> left[:x] == right[:x] && left[:y] == right[:y];

GeometryLineValue(a, b, c, through, operation, inputs, metadata ?= _, style ?= _) -> {;
    (GeometryIsZero(a) && GeometryIsZero(b))
      ?: .Error(@"@{operation} cannot produce a degenerate line")
      ?_ GeometryValue(:line, {=
          a=a,
          b=b,
          c=c,
          through=through,
          metadata=metadata,
          style=style,
          provenance=[GeometryProvenance(operation, inputs)]
      });
};

GeometryLine(first, second ?= _, options ?= {= }) -> {;
    settings = ((first ? :Map) && second == _) ?: first ?_ options;
    firstPoint = GeometryRequire(GeometryOption(settings, "first", first), :point, "geometry.Line first point");
    secondPoint = GeometryRequire(GeometryOption(settings, "second", second), :point, "geometry.Line second point");
    GeometrySamePoint(firstPoint, secondPoint) ?: .Error("geometry.Line requires two distinct points") ?_ _;
    a = firstPoint[:y] - secondPoint[:y];
    b = secondPoint[:x] - firstPoint[:x];
    c = firstPoint[:x] * secondPoint[:y] - secondPoint[:x] * firstPoint[:y];
    GeometryLineValue(a, b, c, [firstPoint, secondPoint], "Line", [firstPoint, secondPoint],
        GeometryOption(settings, "metadata"), GeometryOption(settings, "style"));
};

GeometrySquaredDistance(first, second) -> (second[:x] - first[:x])^2 + (second[:y] - first[:y])^2;

GeometryCircleValue(center, radiusSquared, through, operation, inputs, metadata ?= _, style ?= _) -> {;
    radiusSquared > 0 ?: _ ?_ .Error(@"@{operation} requires a positive radius");
    GeometryValue(:circle, {=
        center=center,
        radiusSquared=radiusSquared,
        through=through,
        metadata=metadata,
        style=style,
        provenance=[GeometryProvenance(operation, inputs)]
    });
};

GeometryCircle(first, second ?= _, options ?= {= }) -> {;
    settings = ((first ? :Map) && second == _) ?: first ?_ options;
    center = GeometryRequire(GeometryOption(settings, "center", first), :point, "geometry.Circle center");
    candidate = GeometryOption(settings, "through", second);
    explicitRadius = GeometryOption(settings, "radius");
    explicitSquared = GeometryOption(settings, "radiussquared");
    specificationCount = (candidate != _ ?: 1 ?_ 0) + (explicitRadius != _ ?: 1 ?_ 0) + (explicitSquared != _ ?: 1 ?_ 0);
    specificationCount == 1 ?: _ ?_ .Error("geometry.Circle requires exactly one through point, radius, or radiusSquared");
    through = ((candidate ? :Map) && candidate.Has("schema"))
      ?: GeometryRequire(candidate, :point, "geometry.Circle through point")
      ?_ _;
    radiusSquared = through != _
      ?: GeometrySquaredDistance(center, through)
      ?_ explicitSquared != _
           ?: GeometryExact(explicitSquared, "geometry.Circle radiusSquared")
           ?_ GeometryExact(explicitRadius != _ ?: explicitRadius ?_ candidate, "geometry.Circle radius")^2;
    GeometryCircleValue(center, radiusSquared, through, "Circle",
        through != _ ?: [center, through] ?_ [center, radiusSquared],
        GeometryOption(settings, "metadata"), GeometryOption(settings, "style"));
};

GeometryMidpoint(first, second ?= _) -> {;
    settings = ((first ? :Map) && second == _) ?: first ?_ {= first=first, second=second };
    firstPoint = GeometryRequire(settings[:first], :point, "geometry.Midpoint first point");
    secondPoint = GeometryRequire(settings[:second], :point, "geometry.Midpoint second point");
    GeometryPointValue((firstPoint[:x] + secondPoint[:x]) / 2, (firstPoint[:y] + secondPoint[:y]) / 2,
        "Midpoint", [firstPoint, secondPoint]);
};

GeometryPerpendicularBisector(first, second ?= _, options ?= {= }) -> {;
    settings = ((first ? :Map) && second == _) ?: first ?_ options.Merge({= first=first, second=second });
    firstPoint = GeometryRequire(settings[:first], :point, "geometry.PerpendicularBisector first point");
    secondPoint = GeometryRequire(settings[:second], :point, "geometry.PerpendicularBisector second point");
    GeometrySamePoint(firstPoint, secondPoint) ?: .Error("geometry.PerpendicularBisector requires two distinct points") ?_ _;
    middle = GeometryMidpoint(firstPoint, secondPoint);
    a = secondPoint[:x] - firstPoint[:x];
    b = secondPoint[:y] - firstPoint[:y];
    c = -(a * middle[:x] + b * middle[:y]);
    GeometryLineValue(a, b, c, [middle], "PerpendicularBisector", [firstPoint, secondPoint],
        GeometryOption(settings, "metadata"), GeometryOption(settings, "style"));
};

GeometryIntersectionValue(status, points, left, right, diagnostic ?= _) -> .DeepMutable({=
    type="geometry_intersection",
    kind="intersection",
    schema="rix.geometry.intersection@1",
    status=status,
    points=points,
    exact=status == "unsupported" ?: 0 ?_ 1,
    diagnostic=diagnostic,
    provenance=[GeometryProvenance("Intersect", [left, right], diagnostic)]
}, _);

GeometryIntersectLines(left, right) -> {;
    determinant = left[:a] * right[:b] - right[:a] * left[:b];
    GeometryIsZero(determinant)
      ?: {;
          ac = @left[:a] * @right[:c] - @right[:a] * @left[:c];
          bc = @left[:b] * @right[:c] - @right[:b] * @left[:c];
          (GeometryIsZero(ac) && GeometryIsZero(bc))
            ?: GeometryIntersectionValue("coincident", [], @left, @right, "Coincident lines have infinitely many intersections")
            ?_ GeometryIntersectionValue("parallel", [], @left, @right, "Parallel lines do not intersect");
      }
      ?_ {;
          x = (@left[:b] * @right[:c] - @right[:b] * @left[:c]) / @determinant;
          y = (@left[:c] * @right[:a] - @right[:c] * @left[:a]) / @determinant;
          point = GeometryPointValue(x, y, "LineIntersection", [@left, @right]);
          GeometryIntersectionValue("one", [point], @left, @right);
      };
};

GeometryIntersect(first, second ?= _) -> {;
    settings = ((first ? :Map) && first.Has("left") && second == _) ?: first ?_ {= left=first, right=second };
    left = GeometryRequire(settings[:left], _, "geometry.Intersect left value");
    right = GeometryRequire(settings[:right], _, "geometry.Intersect right value");
    (left[:kind] == :line && right[:kind] == :line)
      ?: GeometryIntersectLines(left, right)
      ?_ GeometryIntersectionValue("unsupported", [], left, right,
          @"Phase 1 geometry.Intersect supports line-line intersections, not @{left[:kind]}-@{right[:kind]}");
};

GeometryRequireIntersection(value, label) -> ((value ? :Map) && value.Has("schema") && value[:schema] == "rix.geometry.intersection@1")
  ?: value
  ?_ .Error(@"@{label} requires a geometry intersection result");

GeometryPoints(intersection) -> GeometryRequireIntersection(intersection, "geometry.Points")[:points];
GeometryStatus(intersection) -> GeometryRequireIntersection(intersection, "geometry.Status")[:status];

GeometryCircumcircle(first, second ?= _, third ?= _, options ?= {= }) -> {;
    settings = ((first ? :Map) && second == _)
      ?: first
      ?_ options.Merge({= first=first, second=second, third=third });
    firstPoint = GeometryRequire(settings[:first], :point, "geometry.Circumcircle first point");
    secondPoint = GeometryRequire(settings[:second], :point, "geometry.Circumcircle second point");
    thirdPoint = GeometryRequire(settings[:third], :point, "geometry.Circumcircle third point");
    firstBisector = GeometryPerpendicularBisector(firstPoint, secondPoint);
    secondBisector = GeometryPerpendicularBisector(firstPoint, thirdPoint);
    centerResult = GeometryIntersect(firstBisector, secondBisector);
    centerResult[:status] == "one"
      ?: _
      ?_ .Error(@"geometry.Circumcircle requires three non-collinear points: @{centerResult[:diagnostic]}");
    center = centerResult[:points][1];
    GeometryCircleValue(center, GeometrySquaredDistance(center, firstPoint), firstPoint, "Circumcircle",
        [firstPoint, secondPoint, thirdPoint, firstBisector, secondBisector, centerResult],
        GeometryOption(settings, "metadata"), GeometryOption(settings, "style"));
};

GeometryNumericSequence(value, length, label) -> {;
    value ? :Array ?: _ ?_ .Error(@"@{label} must be a sequence");
    value.Len() == length ?: _ ?_ .Error(@"@{label} must contain @{length} values");
    value.Map((item) -> GeometryExact(item, label));
};

GeometryStyle(supplied, defaults) -> supplied == _
  ?: defaults
  ?_ (supplied ? :Map) ?: defaults.Merge(supplied) ?_ .Error("geometry style must be a map");

GeometryLineEndpoints(line, view) -> {;
    xmin = view[1]; ymin = view[2]; xmax = view[3]; ymax = view[4];
    a = line[:a]; b = line[:b]; c = line[:c];
    points := [];
    addPoint = (x, y) -> {;
        inside = x >= @xmin && x <= @xmax && y >= @ymin && y <= @ymax;
        duplicate = @points.Filter((point) -> point[1] == @x && point[2] == @y).Len() > 0;
        (inside && !duplicate) ?: {; @points ~= @points.Push([@x, @y]); } ?_ _;
    };
    !GeometryIsZero(b) ?: {; @addPoint(@xmin, -(@a*@xmin+@c)/@b); @addPoint(@xmax, -(@a*@xmax+@c)/@b); } ?_ _;
    !GeometryIsZero(a) ?: {; @addPoint(-(@b*@ymin+@c)/@a, @ymin); @addPoint(-(@b*@ymax+@c)/@a, @ymax); } ?_ _;
    points.Slice(1, 3);
};

GeometryDrawableItems(value) -> {;
    source = value ? :Array ?: value ?_ [value];
    items := [];
    {@ index = 1; index <= @source.Len(); {;
        item = @source[index];
        isIntersection = (item ? :Map) && item.Has("schema") && item[:schema] == "rix.geometry.intersection@1";
        isGeometry = (item ? :Map) && item.Has("schema") && item[:schema] == "rix.geometry@1";
        (isIntersection || isGeometry)
          ?: _
          ?_ .Error(@"geometry.Draw object @{index} must be geometry or an intersection result");
        (isIntersection && item[:status] == "one")
          ?: {; @items ~= @items.Concat(@item[:points]); }
          ?_ {; @items ~= @items.Push(@item); };
    }; index += 1 };
    items;
};

GeometryDraw(objects, options ?= {= }) -> {;
    settings = ((objects ? :Map) && objects.Has("objects")) ?: objects ?_ options.Merge({= objects=objects });
    items = GeometryDrawableItems(settings[:objects]);
    size = GeometryNumericSequence(GeometryOption(settings, "size", [640, 480]), 2, "geometry.Draw size");
    view = GeometryNumericSequence(GeometryOption(settings, "view", [-10, -10, 10, 10]), 4, "geometry.Draw view");
    xmin = view[1]; ymin = view[2]; xmax = view[3]; ymax = view[4];
    (xmax > xmin && ymax > ymin) ?: _ ?_ .Error("geometry.Draw view must satisfy xmin < xmax and ymin < ymax");
    (size[1] > 0 && size[2] > 0) ?: _ ?_ .Error("geometry.Draw size must be positive");
    scale = .Min(size[1] / (xmax - xmin), size[2] / (ymax - ymin));
    offsetX = (size[1] - (xmax - xmin) * scale) / 2;
    offsetY = (size[2] - (ymax - ymin) * scale) / 2;
    project = (point) -> [@offsetX + (point[1] - @xmin) * @scale, @size[2] - @offsetY - (point[2] - @ymin) * @scale];
    children := [];
    unresolved := 0;
    {@ index = 1; index <= @items.Len(); {;
        item = @items[index];
        isIntersection = item[:schema] == "rix.geometry.intersection@1";
        isIntersection
          ?: {;
              @unresolved += 1;
              @children ~= @children.Push(.Graphics.Text([12, 20 + @unresolved * 18], @item[:diagnostic],
                  {= fill="#b91c1c", size=13 }));
          }
          ?_ item[:kind] == :point
               ?: {;
                   center = [@item[:x], @item[:y]] |> @project;
                   @children ~= @children.Push(.Graphics.Circle(center, 5,
                       GeometryStyle(@item[:style], {= fill="#6d28d9", stroke="#ffffff", width=2 })));
               }
               ?_ item[:kind] == :line
                    ?: {;
                        endpoints = GeometryLineEndpoints(@item, @view);
                        endpoints.Len() == 2
                          ?: {; @children ~= @children.Push(.Graphics.Path(@endpoints.Map(@project),
                              GeometryStyle(@item[:style], {= stroke="#2563eb", width=2, fill="none" }))); }
                          ?_ _;
                    }
                    ?_ item[:kind] == :circle
                         ?: {;
                             center = [@item[:center][:x], @item[:center][:y]] |> @project;
                             radius = GeometryApproximateSqrt(@item[:radiusSquared]) * @scale;
                             @children ~= @children.Push(.Graphics.Circle(center, radius,
                                 GeometryStyle(@item[:style], {= fill="none", stroke="#d97706", width=2 })));
                         }
                         ?_ .Error(@"geometry.Draw does not support geometry kind '@{item[:kind]}'");
    }; index += 1 };
    .Graphics.Graphic(size, children, {=
        source="rix.geometry@1",
        projection="uniform-fit",
        unresolved=unresolved
    });
};

geometryNamespace = {= };
geometryNamespace._proto = {=
    Point=(self, first, second ?= _, options ?= {= })->GeometryPoint(first, second, options),
    Line=(self, first, second ?= _, options ?= {= })->GeometryLine(first, second, options),
    Circle=(self, first, second ?= _, options ?= {= })->GeometryCircle(first, second, options),
    Midpoint=(self, first, second ?= _)->GeometryMidpoint(first, second),
    PerpendicularBisector=(self, first, second ?= _, options ?= {= })->GeometryPerpendicularBisector(first, second, options),
    Circumcircle=(self, first, second ?= _, third ?= _, options ?= {= })->GeometryCircumcircle(first, second, third, options),
    Intersect=(self, first, second ?= _)->GeometryIntersect(first, second),
    Points=(self, intersection)->GeometryPoints(intersection),
    Status=(self, intersection)->GeometryStatus(intersection),
    Draw=(self, objects, options ?= {= })->GeometryDraw(objects, options)
};
.Host.RegisterValue("geometry", geometryNamespace, "Pure exact ruler-and-compass geometry and portable Graphics snapshots", ["Geometry", "Graphics", "Exact"]);
`, sourcePath: "bundled:geometry", kind: "rix" });
  catalog.addMetadata({ id: "gif", description: "Deterministic animated GIF rendering from Slides, Timelines, or Snapshots through PNG frames.", kind: "host", mount: "gif", exports: ["Render"], groups: ["Renderers"], permissions: ["process", "files"], requires: ["rix.renderer.png@1"], provides: ["rix.renderer.gif@1"], targets: ["gif", "image/gif"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:gif" }, { sourcePath: "bundled:gif", kind: "host" });
  catalog.registerInstaller("gif", install17);
  catalog.addMetadata({ id: "gltf", description: "Browser-safe glTF 2.0 JSON exporter for retained Scene3D values.", kind: "host", mount: "gltf", exports: ["Render"], groups: ["Renderers", "Scene3D"], permissions: [], requires: ["rix.scene3d@1"], provides: ["rix.renderer.gltf@1"], targets: ["gltf", "model/gltf+json"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:gltf" }, { sourcePath: "bundled:gltf", kind: "host" });
  catalog.registerInstaller("gltf", install15);
  catalog.addMetadata({ id: "html", description: "Standalone semantic HTML renderer for portable RiX output trees.", kind: "host", mount: "html", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.html@1"], targets: ["html", "text/html"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:html" }, { sourcePath: "bundled:html", kind: "host" });
  catalog.registerInstaller("html", install10);
  catalog.addMetadata({ id: "latex", description: "Standalone LaTeX renderer for portable RiX documents and figures.", kind: "host", mount: "latex", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.latex@1"], targets: ["latex", "text/x-tex"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:latex" }, { sourcePath: "bundled:latex", kind: "host" });
  catalog.registerInstaller("latex", install12);
  catalog.addMetadata({ id: "linalg", description: "Pure-RiX exact dense linear algebra and coordinate-aware tensor transformations.", kind: "rix", mount: "linalg", exports: ["Rref", "Rank", "Determinant", "Inverse", "Solve", "VectorSpace", "Frame", "Tensor", "Vector", "Covector", "ChangeMatrix", "Transform", "Transform!", "Components", "Pair", "SameTensor"], groups: ["LinearAlgebra", "Exact"], permissions: [], provides: ["rix.linear-algebra@1", "rix.tensor@1"], schemas: ["rix.linalg.result@1", "rix.linalg.vector-space@1", "rix.linalg.frame@1", "rix.linalg.tensor@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:linalg" }, { source: `/**
id: linalg
description: Pure-RiX exact dense linear algebra and coordinate-aware tensor transformations.
kind: rix
mount: linalg
exports: [Rref, Rank, Determinant, Inverse, Solve, VectorSpace, Frame, Tensor, Vector, Covector, ChangeMatrix, Transform, Transform!, Components, Pair, SameTensor]
groups: [LinearAlgebra, Exact]
permissions: []
provides: [rix.linear-algebra@1, rix.tensor@1]
schemas: [rix.linalg.result@1, rix.linalg.vector-space@1, rix.linalg.frame@1, rix.linalg.tensor@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

linalgState := {= nextSpaceIdentity=0, nextFrameIdentity=0, nextTensorIdentity=0 };
linalgState._mutable=1;
LinalgNextIdentity(kind) -> {;
    kind==:space
      ?: {; @linalgState[:nextspaceidentity] += 1; @linalgState[:nextspaceidentity]; }
      ?_ (kind==:frame
          ?: {; @linalgState[:nextframeidentity] += 1; @linalgState[:nextframeidentity]; }
          ?_ {; @linalgState[:nexttensoridentity] += 1; @linalgState[:nexttensoridentity]; });
};

LinalgOption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

LinalgExact(value, label ?= "value") -> {;
    exact = value ~!: :Rational;
    exact == _ ?: .Error(@"@{label} must be an exact Integer or Rational") ?_ exact;
};
LinalgIsZero(value) -> (value ~!: :Rational).Numerator()==0;

LinalgPositiveInteger(value, label) -> {;
    integer = value ~!: :Integer;
    integer >= 1 ?: integer ?_ .Error(@"@{label} must be a positive Integer");
};

LinalgVectorValues(value, label ?= "vector") -> {;
    isArray = value ? :Array;
    isShapedVector = value ? :Shaped ?: value.Shape().Len() == 1 ?_ _;
    (isArray || isShapedVector) ?: _ ?_ .Error(@"@{label} must be an Array or rank-1 tensor");
    length = isArray ?: value.Len() ?_ value.Size();
    result := [];
    {@ index = 1; index <= @length; {;
        @result ~= @result.Push(LinalgExact(@value[index], @"@{@label} entry @{index}"));
    }; index += 1 };
    result;
};

LinalgMatrixRows(value, label ?= "matrix") -> {;
    isShapedMatrix = value ? :Shaped ?: value.Shape().Len() == 2 ?_ _;
    isRows = value ? :Array;
    (isShapedMatrix || isRows) ?: _ ?_ .Error(@"@{@label} must be a rank-2 tensor or Array of rows");
    rows := [];
    isShapedMatrix
      ?: {;
          shape = @value.Shape();
          rowCount = shape[1];
          columnCount = shape[2];
          rowCount >= 1 && columnCount >= 1 ?: _ ?_ .Error(@"@{@label} cannot be empty");
          {@ row = 1; row <= @rowCount; {;
              entries := [];
              {@ column = 1; column <= @columnCount; {;
                  @entries ~= @entries.Push(LinalgExact(@value[@row,column], @"@{@label} entry @{@row},@{column}"));
              }; column += 1 };
              @rows ~= @rows.Push(entries);
          }; row += 1 };
      }
      ?_ {;
          @value.Len() >= 1 ?: _ ?_ .Error(@"@{@label} cannot be empty");
          {@ row = 1; row <= @value.Len(); {;
              @rows ~= @rows.Push(LinalgVectorValues(@value[row], @"@{@label} row @{row}"));
          }; row += 1 };
      };
    columns = rows[1].Len();
    columns >= 1 ?: _ ?_ .Error(@"@{label} cannot be empty");
    rows.All((row)->row.Len()==columns) ?: rows ?_ .Error(@"@{label} rows must have equal lengths");
};

LinalgFlattenRows(rows) -> {;
    flat := [];
    {@ row = 1; row <= @rows.Len(); {;
        {@ column = 1; column <= @rows[@row].Len(); {;
            @flat ~= @flat.Push(@rows[@row][column]);
        }; column += 1 };
    }; row += 1 };
    flat;
};

LinalgVectorTensor(values) -> values ~!: :Shaped;

LinalgShapedFromFlat(flat, shape) -> (flat ~!: :Shaped).Reshape(shape);

LinalgMatrixTensor(rows) -> {;
    rows.Len() >= 1 && rows[1].Len() >= 1 ?: _ ?_ .Error("Matrix cannot be empty");
    value = LinalgShapedFromFlat(LinalgFlattenRows(rows), {: rows.Len(), rows[1].Len() });
    value.__type = "Matrix";
    value;
};

LinalgZeros(count) -> {;
    result := [];
    {@ index = 1; index <= @count; {; @result ~= @result.Push(0); }; index += 1 };
    result;
};

LinalgIdentityRows(size) -> {;
    rows := [];
    {@ row = 1; row <= @size; {;
        entries := [];
        {@ column = 1; column <= @size; {;
            @entries ~= @entries.Push(@row == column ?: 1 ?_ 0);
        }; column += 1 };
        @rows ~= @rows.Push(entries);
    }; row += 1 };
    rows;
};

LinalgCopyRows(source) -> source.Map((row)->row.Map((value)->LinalgExact(value)));

LinalgTransposeRows(rows) -> {;
    result := [];
    {@ column = 1; column <= @rows[1].Len(); {;
        rowValues := [];
        {@ row = 1; row <= @rows.Len(); {; @rowValues ~= @rowValues.Push(@rows[row][@column]); }; row += 1 };
        @result ~= @result.Push(rowValues);
    }; column += 1 };
    result;
};

LinalgDot(left, right) -> {;
    sum := 0;
    {@ index = 1; index <= @left.Len(); {; @sum += @left[index] * @right[index]; }; index += 1 };
    sum;
};

LinalgMultiplyRows(left, right) -> {;
    left[1].Len() == right.Len() ?: _ ?_ .Error("Matrix multiplication dimensions must agree");
    columns = right[1].Len();
    result := [];
    {@ row = 1; row <= @left.Len(); {;
        entries := [];
        {@ column = 1; column <= @columns; {;
            sum := 0;
            {@ index = 1; index <= @right.Len(); {;
                @sum += @left[@row][index] * @right[index][@column];
            }; index += 1 };
            @entries ~= @entries.Push(sum);
        }; column += 1 };
        @result ~= @result.Push(entries);
    }; row += 1 };
    result;
};

LinalgMultiplyMatrixVector(rows, values) -> {;
    rows[1].Len() == values.Len() ?: _ ?_ .Error("Matrix/vector dimensions must agree");
    rows.Map((row)->LinalgDot(row, values));
};

LinalgFindPivot(rows, startRow, column) -> {;
    selected := 0;
    {@ row = @startRow; row <= @rows.Len() && @selected == 0; {;
        LinalgIsZero(@rows[row][@column]) ?: _ ?_ {; @selected ~= @row; };
    }; row += 1 };
    selected;
};

LinalgRrefRows(source, coefficientColumns ?= _) -> {;
    rows := LinalgCopyRows(source);
    columns = coefficientColumns == _ ?: rows[1].Len() ?_ coefficientColumns;
    pivots := [];
    pivotRow := 1;
    {@ column = 1; column <= @columns && @pivotRow <= @rows.Len(); {;
        selected = LinalgFindPivot(@rows, @pivotRow, column);
        selected != 0
          ?: {;
              @selected != @pivotRow
                ?: {;
                    swap = @rows[@pivotRow];
                    @rows ~= @rows.Set(@pivotRow, @rows[@selected]).Set(@selected, swap);
                }
                ?_ _;
              pivot = @rows[@pivotRow][@column];
              LinalgIsZero(pivot) == _
                ?: {;
                    normalized = @rows[@pivotRow].Map((value)->value/@pivot);
                    @rows ~= @rows.Set(@pivotRow, normalized);
                    {@ row = 1; row <= @rows.Len(); {;
                        row != @pivotRow && LinalgIsZero(@rows[row][@column]) == _
                          ?: {;
                              factor = @rows[@row][@column];
                              replacement = @rows[@row].Map((value,index)->value-@factor*@normalized[index]);
                              @rows ~= @rows.Set(@row,replacement);
                          }
                          ?_ _;
                    }; row += 1 };
                    @pivots ~= @pivots.Push(@column);
                    @pivotRow += 1;
                }
                ?_ _;
          }
          ?_ _;
    }; column += 1 };
    {= rows=rows, pivots=pivots };
};

LinalgInverseRows(source) -> {;
    source.Len() == source[1].Len() ?: _ ?_ .Error("Inverse requires a square matrix");
    size = source.Len();
    identity = LinalgIdentityRows(size);
    augmented = source.Map((row,index)->row.Concat(identity[index]));
    reduced = LinalgRrefRows(augmented,size);
    reduced[:pivots].Len() == size ?: _ ?_ .Error("Matrix is singular");
    reduced[:rows].Map((row)->row.Slice(size+1));
};

LinalgDeterminantRows(source) -> {;
    source.Len() == source[1].Len() ?: _ ?_ .Error("Determinant requires a square matrix");
    rows := LinalgCopyRows(source);
    determinant := 1;
    singular := 0;
    {@ column = 1; column <= @rows.Len() && @singular == 0; {;
        selected = LinalgFindPivot(@rows,column,column);
        selected == 0
          ?: {; @singular ~= 1; @determinant ~= 0; }
          ?_ {;
              @selected != @column
                ?: {;
                    swap = @rows[@column];
                    @rows ~= @rows.Set(@column,@rows[@selected]).Set(@selected,swap);
                    @determinant ~= -@determinant;
                }
                ?_ _;
              pivot = @rows[@column][@column];
              @determinant *= pivot;
              {@ row = @column+1; row <= @rows.Len(); {;
                  LinalgIsZero(@rows[row][@column]) == _
                    ?: {;
                        factor = @rows[@row][@column]/@pivot;
                        replacement = @rows[@row].Map((value,index)->value-@factor*@rows[@column][index]);
                        @rows ~= @rows.Set(@row,replacement);
                    }
                    ?_ _;
              }; row += 1 };
          };
    }; column += 1 };
    determinant;
};

LinalgResult(fields) -> {;
    result = {= schema="rix.linalg.result@1", exact=1 }.Merge(fields);
    result;
};

LinalgSolveValues(matrixValue, vectorValue) -> {;
    matrix = LinalgMatrixRows(matrixValue,"Solve matrix");
    vector = LinalgVectorValues(vectorValue,"Solve right-hand side");
    matrix.Len() == vector.Len() ?: _ ?_ .Error("Solve right-hand side length must equal the matrix row count");
    columns = matrix[1].Len();
    augmented = matrix.Map((row,index)->row.Concat([vector[index]]));
    fullyReduced = LinalgRrefRows(augmented);
    reduced = {= rows=fullyReduced[:rows], pivots=fullyReduced[:pivots].Filter((column)->column<=columns) };
    inconsistent = reduced[:rows].Any((row)->row.Slice(1,columns+1).All((value)->LinalgIsZero(value)) && LinalgIsZero(row[columns+1])==_);
    inconsistent
      ?: LinalgResult({=
          status="inconsistent", solution=_, particular=_, nullspace=[],
          rank=reduced[:pivots].Len(), rref=LinalgMatrixTensor(reduced[:rows]), pivots=reduced[:pivots]
      })
      ?_ {;
          particular := LinalgZeros(@columns);
          {@ row = 1; row <= @reduced[:pivots].Len(); {;
              pivotColumn = @reduced[:pivots][row];
              @particular ~= @particular.Set(pivotColumn,@reduced[:rows][row][@columns+1]);
          }; row += 1 };
          freeColumns := [];
          {@ column = 1; column <= @columns; {;
              @reduced[:pivots].Includes(column) ?: _ ?_ {; @freeColumns ~= @freeColumns.Push(@column); };
          }; column += 1 };
          nullspace := [];
          {@ freeIndex = 1; freeIndex <= @freeColumns.Len(); {;
              freeColumn = @freeColumns[freeIndex];
              basis := LinalgZeros(@columns).Set(freeColumn,1);
              {@ row = 1; row <= @reduced[:pivots].Len(); {;
                  pivotColumn = @reduced[:pivots][row];
                  @basis ~= @basis.Set(pivotColumn,-@reduced[:rows][row][@freeColumn]);
              }; row += 1 };
              @nullspace ~= @nullspace.Push(LinalgVectorTensor(basis));
          }; freeIndex += 1 };
          solution = LinalgVectorTensor(particular);
          LinalgResult({=
              status=freeColumns.Len()==0 ?: "unique" ?_ "underdetermined",
              solution=solution, particular=solution, nullspace=nullspace,
              rank=@reduced[:pivots].Len(), rref=LinalgMatrixTensor(@reduced[:rows]), pivots=@reduced[:pivots]
          });
      };
};

LinalgRref(value) -> LinalgMatrixTensor(LinalgRrefRows(LinalgMatrixRows(value,"Rref matrix"))[:rows]);
LinalgRank(value) -> LinalgRrefRows(LinalgMatrixRows(value,"Rank matrix"))[:pivots].Len();
LinalgDeterminant(value) -> LinalgDeterminantRows(LinalgMatrixRows(value,"Determinant matrix"));
LinalgInverse(value) -> LinalgMatrixTensor(LinalgInverseRows(LinalgMatrixRows(value,"Inverse matrix")));
LinalgSolve(first, second ?= _) -> second == _ && (first ? :Map)
  ?: LinalgSolveValues(first[:A],first[:b])
  ?_ LinalgSolveValues(first,second);

LinalgSpaceIs(value) -> (value ? :Map) && value[:schema]=="rix.linalg.vector-space@1";
LinalgFrameIs(value) -> (value ? :Map) && value[:schema]=="rix.linalg.frame@1";
LinalgTensorIs(value) -> (value ? :Map) && value[:schema]=="rix.linalg.tensor@1";

LinalgRequireSpace(value) -> LinalgSpaceIs(value) ?: value ?_ .Error("Expected a linalg VectorSpace");
LinalgRequireFrame(value) -> LinalgFrameIs(value)
  ?: value
  ?_ (LinalgSpaceIs(value) ?: .Error("Tensor components require a Frame, not a bare VectorSpace") ?_ .Error("Expected a linalg Frame"));
LinalgRequireTensor(value) -> LinalgTensorIs(value) ?: value ?_ .Error("Expected a coordinate-aware Vector, Covector, or Tensor");

LinalgVectorSpace(first, second ?= _, options ?= {= }) -> {;
    settings = first ? :Map ?: first ?_ options.Merge({= name=first, dimension=second });
    name = LinalgOption(settings,"name","V");
    dimension = LinalgPositiveInteger(LinalgOption(settings,"dimension",_),"Vector-space dimension");
    over = LinalgOption(settings,"over",:Rational);
    (over==:Rational || over==:rational || over=="Rational" || over=="rational")
      ?: _ ?_ .Error("Phase 1 VectorSpace currently requires over=:Rational");
    lineageLimit = LinalgPositiveInteger(LinalgOption(settings,"lineagelimit",30),"Tensor lineage limit");
    value = {=
        valueKind=:vectorSpace, schema="rix.linalg.vector-space@1",
        identity={= valueKind=:vectorSpaceIdentity }, spaceIdentity=LinalgNextIdentity(:space), name=name, dimension=dimension,
        over=:Rational, metadata=LinalgOption(settings,"metadata",_), definingFrame=_, lineageLimit=lineageLimit
    };
    value.__type="VectorSpace";
    value.identity=value[:identity];
    value.spaceIdentity=value[:spaceidentity];
    value.name=value[:name]; value.dimension=value[:dimension]; value.over=value[:over];
    value.metadata=value[:metadata]; value.definingFrame=_; value.lineageLimit=lineageLimit;
    value;
};

LinalgFrame(spaceValue, specification ?= _, basisArgument ?= _, options ?= {= }) -> {;
    space = LinalgRequireSpace(spaceValue);
    settings = specification ? :Map
      ?: specification.Merge({= space=space })
      ?_ options.Merge({= space=space, name=specification, basis=basisArgument });
    basisValue = LinalgOption(settings,"basis",_);
    defining = basisValue==:defining || basisValue=="defining" || (basisValue==_ && space[:definingframe]==_);
    defining && space[:definingframe]!=_ ?: .Error("VectorSpace already has a defining Frame") ?_ _;
    name = LinalgOption(settings,"name",space[:definingframe]==_ ?: "defining" ?_ "frame");
    requestedRelative = LinalgOption(settings,"relativeto",_);
    relativeTo = defining ?: _ ?_ LinalgRequireFrame(requestedRelative==_ ?: space[:definingframe] ?_ requestedRelative);
    defining || relativeTo[:spaceidentity] == space[:spaceidentity] ?: _ ?_ .Error("relativeTo Frame must belong to the same VectorSpace");
    localBasis = defining ?: LinalgIdentityRows(space[:dimension]) ?_ LinalgMatrixRows(basisValue,"Frame basis");
    localBasis.Len()==space[:dimension] && localBasis[1].Len()==space[:dimension]
      ?: _ ?_ .Error(@"Frame basis must be @{space[:dimension]}x@{space[:dimension]}");
    defining ?: _ ?_ LinalgInverseRows(localBasis);
    absoluteBasis = defining ?: localBasis ?_ LinalgMultiplyRows(LinalgMatrixRows(relativeTo[:basis]),localBasis);
    inverse = LinalgInverseRows(absoluteBasis);
    value = {=
        valueKind=:frame, schema="rix.linalg.frame@1", name=name, space=space,
        spaceIdentity=space[:spaceidentity], frameIdentity=LinalgNextIdentity(:frame),
        relativeTo=relativeTo, localBasis=LinalgMatrixTensor(localBasis),
        basis=LinalgMatrixTensor(absoluteBasis), inverseBasis=LinalgMatrixTensor(inverse),
        defining=defining ?: 1 ?_ _, metadata=LinalgOption(settings,"metadata",_)
    };
    value.__type="Frame";
    value.name=value[:name]; value.space=space; value.spaceIdentity=value[:spaceidentity];
    value.frameIdentity=value[:frameidentity]; value.relativeTo=relativeTo;
    value.localBasis=value[:localbasis]; value.basis=value[:basis]; value.inverseBasis=value[:inversebasis];
    value.defining=value[:defining]; value.metadata=value[:metadata];
    defining ?: {; @space[:definingframe]=@value; @space.definingFrame=@value; } ?_ _;
    value;
};

LinalgChangeRows(sourceValue,targetValue) -> {;
    source=LinalgRequireFrame(sourceValue); target=LinalgRequireFrame(targetValue);
    source[:spaceidentity]==target[:spaceidentity] ?: _ ?_ .Error("Frames must belong to the same VectorSpace");
    LinalgMultiplyRows(LinalgMatrixRows(target[:inversebasis]),LinalgMatrixRows(source[:basis]));
};
LinalgChangeMatrix(source,target) -> LinalgMatrixTensor(LinalgChangeRows(source,target));

LinalgVariance(value) -> (value==:down || value==:covariant || value=="down" || value=="covariant")
  ?: 1
  ?_ ((value==:up || value==:contravariant || value=="up" || value=="contravariant")
      ?: _ ?_ .Error("Tensor variance entries must be :up/:contravariant or :down/:covariant"));

LinalgSlot(frameValue,dualValue) -> {;
    frame=LinalgRequireFrame(frameValue);
    slot={= frame=frame, spaceIdentity=frame[:spaceidentity], frameIdentity=frame[:frameidentity], dual=dualValue ?: 1 ?_ _ };
    slot.frame=frame; slot.spaceIdentity=slot[:spaceidentity]; slot.frameIdentity=slot[:frameidentity]; slot.dual=slot[:dual];
    slot;
};

LinalgNormalizeSlots(components,framesValue,varianceValue ?= _) -> {;
    rank=components.Shape().Len();
    frames = LinalgFrameIs(framesValue)
      ?: LinalgZeros(rank).Map((unused)->framesValue)
      ?_ framesValue;
    frames ? :Array ?: _ ?_ .Error("Tensor frames must be a Frame or Array of Frames");
    frames.Len()==rank ?: _ ?_ .Error(@"Tensor components rank @{rank} does not match @{frames.Len()} slots");
    duals = varianceValue==_ ?: LinalgZeros(rank) ?_ varianceValue.Map((entry)->LinalgVariance(entry));
    duals.Len()==rank ?: _ ?_ .Error(@"Tensor variance must contain @{rank} entries");
    slots := [];
    shape=components.Shape();
    {@ axis=1; axis<=@rank; {;
        frame=LinalgRequireFrame(@frames[axis]);
        @shape[axis]==frame.space[:dimension]
          ?: _ ?_ .Error(@"Tensor axis @{axis} has size @{shape[axis]} but Frame @{frame[:name]} has dimension @{frame.space[:dimension]}");
        @slots ~= @slots.Push(LinalgSlot(frame,@duals[axis]));
    }; axis+=1 };
    slots;
};

LinalgTensorType(slots) -> slots.Len()==1 ?: (slots[1].dual ?: "Covector" ?_ "Vector") ?_ "Tensor";

LinalgSyncTensor(value) -> {;
    value.components=value[:components]; value.slots=value[:slots];
    value.frame=value[:slots].Len()==1 ?: value[:slots][1][:frame] ?_ _;
    value.identity=value[:identity]; value.representationIdentity=value[:representationidentity];
    value.equivalentTo=value[:equivalentto]; value.origin=value[:origin];
    value.transform=value[:transform]; value.derivedFrom=value[:derivedfrom];
    value;
};

LinalgRecordRepresentation(identity,value) -> {;
    identity[:origin]==_ ?: {; @identity[:origin]=@value; } ?_ _;
    reps := identity[:representations].Push(value);
    reps.Len()>identity[:lineagelimit]+1
      ?: {;
          evicted=@reps[2];
          @reps ~= @reps.RemoveAt(2);
          evicted[:equivalentto]=_; evicted.equivalentTo=_;
      }
      ?_ _;
    identity[:representations]=reps;
    value;
};

LinalgTensorValue(components,slots,lineage ?= {= }) -> {;
    typeName=LinalgTensorType(slots);
    identityKey=lineage.Has("identitykey") ?: lineage[:identitykey] ?_ LinalgNextIdentity(:tensor);
    identity=lineage.Has("identity")
      ?: lineage.identity
      ?_ {= valueKind=:tensorIdentity, origin=_, representations=[],
            lineageLimit=slots.Map((slot)->slot[:frame][:space][:lineagelimit]).Sort()[1] };
    value={=
        valueKind=:coordinateTensor, schema="rix.linalg.tensor@1", components=components, slots=slots,
        identity=identity, identityKey=identityKey, representationIdentity={= valueKind=:tensorRepresentationIdentity },
        equivalentTo=LinalgOption(lineage,"equivalentto",_), origin=LinalgOption(lineage,"origin",identity[:origin]),
        transform=LinalgOption(lineage,"transform",_), viewOf=LinalgOption(lineage,"viewof",_),
        derivedFrom=LinalgOption(lineage,"derivedfrom",[])
    };
    value.__type=typeName; value._mutable=1;
    value._proto={=
        Components=(self)->self[:components],
        Frame=(self)->self[:slots].Len()==1 ?: self[:slots][1][:frame] ?_ _,
        Frames=(self)->self[:slots].Map((slot)->slot[:frame]),
        Transform=(self,target)->LinalgTransform(self,target),
        Pair=(self,other)->LinalgPair(self,other),
        SameTensor=(self,other)->LinalgSameTensor(self,other)
    };
    value._proto["Transform!"]=(self,target)->LinalgTransformBang(self,target);
    identity[:origin]==_ ?: {; @identity[:origin]=@value; @value[:origin]=@value; } ?_ _;
    LinalgSyncTensor(value);
    value.components=components; value.slots=slots; value.identity=identity; value.identityKey=identityKey;
    LinalgRecordRepresentation(identity,value);
};

LinalgTensor(components,frames,variance ?= _,options ?= {= }) -> {;
    components ? :Shaped ?: _ ?_ .Error("Vector/Tensor components must be Shaped");
    slots=LinalgNormalizeSlots(components,frames,variance);
    LinalgTensorValue(components,slots);
};
LinalgVector(components,frame,options ?= {= })->LinalgTensor(LinalgVectorTensor(LinalgVectorValues(components,"Vector components")),frame,[:up],options);
LinalgCovector(components,frame,options ?= {= })->LinalgTensor(LinalgVectorTensor(LinalgVectorValues(components,"Covector components")),frame,[:down],options);

LinalgTypedShaped(requested,components,slotRecords) -> {;
    slots=slotRecords.Map((slot)->LinalgSlot(slot[:frame],requested==:Covector ?: 1 ?_ slot[:dual]));
    (requested==:Vector || requested==:Covector) && slots.Len()!=1
      ?: .Error(@"@{@requested} requires exactly one Frame annotation") ?_ _;
    slots.Len()==components.Shape().Len()
      ?: _ ?_ .Error(@"@{@requested} header declares @{@slots.Len()} slots for rank-@{@components.Shape().Len()} components");
    LinalgTensorValue(components,slots);
};

LinalgStrides(shape) -> {;
    result := [];
    {@ axis=1; axis<=@shape.Len(); {;
        stride := 1;
        {@ index=@axis+1; index<=@shape.Len(); {; @stride *= @shape[index]; }; index+=1 };
        @result ~= @result.Push(stride);
    }; axis+=1 };
    result;
};

LinalgTupleForLinear(linear,shape,strides) -> {;
    remainder := linear;
    result := [];
    {@ axis=1; axis<=@shape.Len(); {;
        coordinate=@remainder//@strides[axis];
        @result ~= @result.Push(coordinate);
        @remainder %= @strides[axis];
    }; axis+=1 };
    result;
};

LinalgTransformAxis(tensor,axis,matrix) -> {;
    shape=tensor.Shape(); strides=LinalgStrides(shape); input=tensor.Flatten();
    output := [];
    {@ linear=0; linear<@input.Size(); {;
        target=LinalgTupleForLinear(linear,@shape,@strides);
        sum := 0;
        {@ sourceIndex=0; sourceIndex<@shape[@axis]; {;
            sourceTuple := @target.Set(@axis,sourceIndex);
            sourceLinear := 0;
            {@ coordinate=1; coordinate<=@sourceTuple.Len(); {;
                @sourceLinear += @sourceTuple[coordinate]*@strides[coordinate];
            }; coordinate+=1 };
            @sum += @matrix[@target[@axis]+1][sourceIndex+1]*@input[sourceLinear+1];
        }; sourceIndex+=1 };
        @output ~= @output.Push(sum);
    }; linear+=1 };
    LinalgShapedFromFlat(output,shape);
};

LinalgTargetFrames(value,targetValue) -> {;
    targets=LinalgFrameIs(targetValue) ?: value[:slots].Map((slot)->targetValue) ?_ targetValue;
    targets ? :Array ?: _ ?_ .Error("Transform target Frames must be a Frame or Array");
    targets.Len()==value[:slots].Len() ?: targets ?_ .Error(@"Transform requires @{value[:slots].Len()} target Frames");
};

LinalgTransformed(value,targets) -> {;
    components := value[:components]; changes := [];
    {@ axis=1; axis<=@value[:slots].Len(); {;
        slot=@value[:slots][axis]; target=LinalgRequireFrame(@targets[axis]);
        slot[:spaceidentity]==target[:spaceidentity]
          ?: _ ?_ .Error(@"Target Frame @{target[:name]} does not belong to tensor slot @{axis}'s VectorSpace");
        change=LinalgChangeRows(slot[:frame],target);
        applied=slot[:dual] ?: LinalgInverseRows(LinalgTransposeRows(change)) ?_ change;
        @components ~= LinalgTransformAxis(@components,axis,applied);
        @changes ~= @changes.Push(LinalgMatrixTensor(applied));
    }; axis+=1 };
    {= components=components, changes=changes };
};

LinalgTransform(value,targetValue) -> {;
    exact=LinalgRequireTensor(value); targets=LinalgTargetFrames(exact,targetValue);
    transformed=LinalgTransformed(exact,targets);
    slots=exact[:slots].Map((slot,axis)->LinalgSlot(targets[axis],slot[:dual]));
    lineage={=
        identity=exact[:identity], identityKey=exact[:identitykey], equivalentTo=exact, origin=exact[:identity][:origin], viewOf=exact[:viewof],
        transform={= kind=:coordinateChange, sources=exact[:slots].Map((slot)->slot[:frame]), targets=targets, matrices=transformed[:changes] }
    };
    lineage.identity=exact.identity;
    LinalgTensorValue(transformed[:components],slots,lineage);
};

LinalgSnapshot(value) -> {;
    snapshot={=
        valueKind=value[:valuekind], schema=value[:schema], components=value[:components], slots=value[:slots],
        identity=value[:identity], identityKey=value[:identitykey], representationIdentity=value[:representationidentity],
        equivalentTo=value[:equivalentto], origin=value[:origin], transform=value[:transform],
        viewOf=value[:viewof], derivedFrom=value[:derivedfrom]
    };
    snapshot.__type=value.__type; snapshot._mutable=1; snapshot._proto=value._proto;
    LinalgSyncTensor(snapshot);
    snapshot.identity=value.identity; snapshot.identityKey=value[:identitykey]; snapshot.slots=value.slots; snapshot.components=value.components;
};

LinalgTransformBang(value,targetValue) -> {;
    exact=LinalgRequireTensor(value); identity=exact.identity; sourceSlots=exact[:slots];
    targets=LinalgTargetFrames(exact,targetValue); previous=LinalgSnapshot(exact);
    identity[:representations].Len()==1
      ?: {;
          @identity[:origin]=@previous;
          reps=@identity[:representations];
          @identity[:representations]=reps.Set(1,@previous);
      }
      ?_ _;
    transformed=LinalgTransformed(exact,targets);
    exact[:components]=transformed[:components];
    exact[:representationidentity]={= valueKind=:tensorRepresentationIdentity };
    exact[:slots]=exact[:slots].Map((slot,axis)->LinalgSlot(targets[axis],slot[:dual]));
    exact[:equivalentto]=previous; exact[:origin]=identity[:origin];
    exact[:transform]={= kind=:coordinateChange, sources=sourceSlots.Map((slot)->slot[:frame]), targets=targets, matrices=transformed[:changes] };
    LinalgSyncTensor(exact);
    exact.identity=identity; exact.identityKey=exact[:identitykey]; exact.slots=exact[:slots]; exact.components=exact[:components];
    LinalgRecordRepresentation(identity,exact);
};

LinalgComponents(value)->LinalgRequireTensor(value)[:components];
LinalgSameTensor(left,right)->LinalgRequireTensor(left)[:identitykey]==LinalgRequireTensor(right)[:identitykey] ?: 1 ?_ _;

LinalgPair(firstValue,secondValue) -> {;
    first=LinalgRequireTensor(firstValue); second=LinalgRequireTensor(secondValue);
    covector=first.__type=="Covector" ?: first ?_ second.__type=="Covector" ?: second ?_ _;
    vector=first.__type=="Vector" ?: first ?_ second.__type=="Vector" ?: second ?_ _;
    covector!=_ && vector!=_ && first[:slots].Len()==1 && second[:slots].Len()==1
      ?: _ ?_ .Error("Pair requires one Vector and one Covector");
    covector[:slots][1][:spaceidentity]==vector[:slots][1][:spaceidentity]
      ?: _ ?_ .Error("Vector and Covector must belong to the same VectorSpace");
    aligned=vector[:slots][1][:frameidentity]==covector[:slots][1][:frameidentity] ?: vector ?_ LinalgTransform(vector,covector[:slots][1][:frame]);
    LinalgDot(LinalgVectorValues(covector[:components]),LinalgVectorValues(aligned[:components]));
};

LinalgCompatible(left,right) -> left[:slots].Len()==right[:slots].Len() &&
  left[:slots].All((slot,axis)->slot[:spaceidentity]==right[:slots][axis][:spaceidentity] && slot[:dual]==right[:slots][axis][:dual]);

LinalgCombine(operation,leftValue,rightValue) -> {;
    left=LinalgRequireTensor(leftValue); right=LinalgRequireTensor(rightValue);
    LinalgCompatible(left,right) ?: _ ?_ .Error(@"@{operation} requires tensors with the same ordered VectorSpace slots and variance");
    aligned=left[:slots].All((slot,axis)->slot[:frameidentity]==right[:slots][axis][:frameidentity])
      ?: right ?_ LinalgTransform(right,left[:slots].Map((slot)->slot[:frame]));
    a=left[:components].Flatten(); b=aligned[:components].Flatten();
    values=[];
    values=a.Map((entry,index)->operation==:add ?: entry+b[index] ?_ entry-b[index]);
    LinalgTensorValue(LinalgShapedFromFlat(values.Flatten(),left[:components].Shape()),left[:slots],{= derivedFrom=[left,right] });
};

LinalgScale(operation,value,scalarValue,scalarFirst ?= _) -> {;
    tensor=LinalgRequireTensor(value); scalar=LinalgExact(scalarValue,"Tensor scalar");
    values=tensor[:components].Map((entry)->operation==:mul ?: entry*scalar ?_ scalarFirst ?: scalar/entry ?_ entry/scalar);
    LinalgTensorValue(values,tensor[:slots],{= derivedFrom=[tensor] });
};

.TypeKnown(:LinalgTensor) ?: _ ?_ .TypeRegister({=
    name=:LinalgTensor, nativeType=:map, validate=(value)->LinalgTensorIs(value), proto={= },
    installs={=
        ADD=[{= name=:LinalgTensorAddition, priority=400, prep=(left,right)->LinalgTensorIs(left)&&LinalgTensorIs(right), impl=(left,right)->LinalgCombine(:add,left,right) }],
        SUB=[{= name=:LinalgTensorSubtraction, priority=400, prep=(left,right)->LinalgTensorIs(left)&&LinalgTensorIs(right), impl=(left,right)->LinalgCombine(:sub,left,right) }],
        MUL=[{= name=:LinalgTensorScaling, priority=400, prep=(left,right)->LinalgTensorIs(left)!=LinalgTensorIs(right), impl=(left,right)->LinalgTensorIs(left) ?: LinalgScale(:mul,left,right) ?_ LinalgScale(:mul,right,left,1) }],
        DIV=[{= name=:LinalgTensorDivision, priority=400, prep=(left,right)->LinalgTensorIs(left)&&!LinalgTensorIs(right), impl=(left,right)->LinalgScale(:div,left,right) }]
    }
});
.TypeInstall(:LinalgTensor);

linalgNamespace={= };
linalgNamespace._mutable=1;
linalgNamespace._proto={=
    Rref=(self,value)->LinalgRref(value), Rank=(self,value)->LinalgRank(value),
    Determinant=(self,value)->LinalgDeterminant(value), Inverse=(self,value)->LinalgInverse(value),
    Solve=(self,first,second ?= _)->second==_ ?: LinalgSolve(first) ?_ LinalgSolveValues(first,second),
    VectorSpace=(self,first,second ?= _,options ?= {= })->LinalgVectorSpace(first,second,options),
    Frame=(self,space,specification ?= _,basis ?= _,options ?= {= })->LinalgFrame(space,specification,basis,options),
    Tensor=(self,components,frames,variance ?= _,options ?= {= })->LinalgTensor(components,frames,variance,options),
    Vector=(self,components,frame,options ?= {= })->LinalgVector(components,frame,options),
    Covector=(self,components,frame,options ?= {= })->LinalgCovector(components,frame,options),
    ChangeMatrix=(self,source,target)->LinalgChangeMatrix(source,target),
    Transform=(self,value,target)->LinalgTransform(value,target),
    Components=(self,value)->LinalgComponents(value), Pair=(self,left,right)->LinalgPair(left,right),
    SameTensor=(self,left,right)->LinalgSameTensor(left,right)
};
linalgNamespace._proto["Transform!"]=(self,value,target)->LinalgTransformBang(value,target);
linalgNamespace._proto["TRANSFORM!"]=(self,value,target)->LinalgTransformBang(value,target);

.Host.RegisterValue("linalg",linalgNamespace,"Pure-RiX exact dense linear algebra and coordinate-aware tensors",["LinearAlgebra","Exact"]);
.Host.RegisterShapedConstructor("Vector",(components,slots)->LinalgTypedShaped(:Vector,components,slots));
.Host.RegisterShapedConstructor("Covector",(components,slots)->LinalgTypedShaped(:Covector,components,slots));
.Host.RegisterShapedConstructor("Tensor",(components,slots)->LinalgTypedShaped(:Tensor,components,slots));
.Host.RegisterMethod("Matrix","Rref",(value)->LinalgRref(value),"linalg","linalg");
.Host.RegisterMethod("Matrix","Rank",(value)->LinalgRank(value),"linalg","linalg");
.Host.RegisterMethod("Matrix","Determinant",(value)->LinalgDeterminant(value),"linalg","linalg");
.Host.RegisterMethod("Matrix","Inverse",(value)->LinalgInverse(value),"linalg","linalg");
`, sourcePath: "bundled:linalg", kind: "rix" });
  catalog.addMetadata({ id: "markdown", description: "CommonMark-oriented renderer for portable RiX documents.", kind: "host", mount: "markdown", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.markdown@1"], targets: ["markdown", "text/markdown"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:markdown" }, { sourcePath: "bundled:markdown", kind: "host" });
  catalog.registerInstaller("markdown", install9);
  catalog.addMetadata({ id: "nd", description: "Pure-RiX exact n-dimensional geometry with affine and Cayley projection records and explicit Scene3D adaptation.", kind: "rix", mount: "nd", exports: ["Point", "Polyline", "Polytope", "Hypercube", "Projection", "CoordinateProjection", "CayleyRotation", "Compose", "Project", "ToScene3D"], groups: ["Geometry", "Scene3D", "Exact"], permissions: [], requires: ["rix.scene3d@1"], provides: ["rix.nd@1", "rix.nd.projection@1"], schemas: ["rix.nd@1", "rix.nd.projection@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:nd" }, { source: `/**
id: nd
description: Pure-RiX exact n-dimensional geometry with affine and Cayley projection records and explicit Scene3D adaptation.
kind: rix
mount: nd
exports: [Point, Polyline, Polytope, Hypercube, Projection, CoordinateProjection, CayleyRotation, Compose, Project, ToScene3D]
groups: [Geometry, Scene3D, Exact]
permissions: []
requires: [rix.scene3d@1]
provides: [rix.nd@1, rix.nd.projection@1]
schemas: [rix.nd@1, rix.nd.projection@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

NDOption(options,key,fallback ?= _)->options.Has(key) ?: options[key] ?_ fallback;
NDExact(value,label)->{; exact=value ~!: :Rational; exact==_ ?: .Error(@"@{label} must be an exact Integer or Rational") ?_ exact; };
NDInteger(value,label)->{; integer=value ~!: :Integer; integer==_ ?: .Error(@"@{label} must be an Integer") ?_ integer; };

NDValue(kind,fields)->.DeepMutable({= type="nd_geometry",kind=kind,schema="rix.nd@1" }.Merge(fields),_);
NDIsGeometry(value)->(value ? :Map)&&value.Has("schema")&&value[:schema]=="rix.nd@1"&&value[:type]=="nd_geometry";
NDIsProjection(value)->(value ? :Map)&&value.Has("schema")&&value[:schema]=="rix.nd.projection@1"&&value[:type]=="nd_projection";

NDProvenance(settings)->NDOption(settings,"provenance",[]);
NDPoints(value,label,dimension ?= _)->{;
    value ? :Array ?: _ ?_ .Error(@"@{label} must be an Array");
    selected:=dimension;
    result:=[];
    {@ index=1;index<=@value.Len();{;
        point=@value[index]; point ? :Array ?: _ ?_ .Error(@"@{label} @{index} must be an Array");
        @selected==_ ?: {; @selected ~= @point.Len(); } ?_ _;
        point.Len()==@selected ?: _ ?_ .Error(@"@{label} @{index} must have dimension @{@selected}");
        @selected>=1 ?: _ ?_ .Error(@"@{label} points cannot be empty");
        @result ~= @result.Push(point.Map((coordinate)->NDExact(coordinate,@label)));
    };index+=1};
    {= dimension=selected==_ ?: 0 ?_ selected, values=result };
};

NDEdges(value,vertexCount,label)->{;
    value ? :Array ?: _ ?_ .Error(@"@{label} must be an Array");
    value.Map((edge)->{;
        edge ? :Array ?: _ ?_ .Error(@"@{label} edge must be an Array");
        edge.Len()==2 ?: _ ?_ .Error(@"@{label} edge must contain two indices");
        pair=edge.Map((entry)->NDInteger(entry,@"@{label} index"));
        pair.Filter((entry)->entry<1||entry>@vertexCount).Len()==0 ?: pair ?_ .Error(@"@{label} indices must be between 1 and @{vertexCount}");
    });
};

NDPoint(coordinates,options ?= {= })->{;
    settings=coordinates ? :Map ?: coordinates ?_ options.Merge({= coordinates=coordinates });
    values=settings[:coordinates]; values ? :Array ?: _ ?_ .Error("nd.Point coordinates must be an Array");
    values.Len()>0 ?: _ ?_ .Error("nd.Point requires at least one coordinate");
    NDValue(:point,{= dimension=values.Len(),coordinates=values.Map((coordinate)->NDExact(coordinate,"nd.Point coordinate")),provenance=NDProvenance(settings),metadata=NDOption(settings,"metadata") });
};

NDPolyline(points,options ?= {= })->{;
    settings=points ? :Map ?: points ?_ options.Merge({= points=points }); normalized=NDPoints(settings[:points],"nd.Polyline point");
    normalized[:values].Len()>=2 ?: _ ?_ .Error("nd.Polyline requires at least two points");
    NDValue(:polyline,{= dimension=normalized[:dimension],points=normalized[:values],closed=NDOption(settings,"closed",0) ?: 1 ?_ 0,provenance=NDProvenance(settings),metadata=NDOption(settings,"metadata"),style=NDOption(settings,"style") });
};

NDPolytope(vertices,edges ?= _,options ?= {= })->{;
    settings=vertices ? :Map ?: vertices ?_ options.Merge({= vertices=vertices,edges=edges }); normalized=NDPoints(settings[:vertices],"nd.Polytope vertex");
    normalized[:values].Len()>0 ?: _ ?_ .Error("nd.Polytope requires vertices");
    NDValue(:polytope,{= dimension=normalized[:dimension],vertices=normalized[:values],edges=NDEdges(settings[:edges],normalized[:values].Len(),"nd.Polytope edge"),provenance=NDProvenance(settings),metadata=NDOption(settings,"metadata"),style=NDOption(settings,"style") });
};

NDProjectionValue(matrix,offset,method,provenance ?= [])->{;
    matrix ? :Array ?: _ ?_ .Error("nd.Projection matrix must be an Array");
    matrix.Len()>0 ?: _ ?_ .Error("nd.Projection matrix cannot be empty");
    rows=matrix.Map((row)->{; row ? :Array ?: _ ?_ .Error("nd.Projection matrix rows must be Arrays"); row.Map((value)->NDExact(value,"nd.Projection matrix coordinate")); });
    source=rows[1].Len(); source>0 ?: _ ?_ .Error("nd.Projection matrix cannot be empty");
    rows.Filter((row)->row.Len()!=@source).Len()==0 ?: _ ?_ .Error("nd.Projection matrix rows must have equal lengths");
    offset ? :Array ?: _ ?_ .Error("nd.Projection offset must be an Array");
    offset.Len()==rows.Len() ?: _ ?_ .Error(@"nd.Projection offset must have @{rows.Len()} coordinates");
    .DeepMutable({= type="nd_projection",kind=:affine,schema="rix.nd.projection@1",sourceDimension=source,targetDimension=rows.Len(),matrix=rows,offset=offset.Map((value)->NDExact(value,"nd.Projection offset")),method=method,provenance=provenance },_);
};

NDProjection(matrix,offset ?= _,options ?= {= })->{;
    settings=matrix ? :Map ?: matrix ?_ options.Merge({= matrix=matrix,offset=offset });
    rows=settings[:matrix]; zeroOffset=rows.Map((row)->0);
    NDProjectionValue(rows,NDOption(settings,"offset",zeroOffset),NDOption(settings,"method","affine"),NDProvenance(settings));
};

NDCoordinateProjection(sourceDimension,axes ?= _)->{;
    settings=sourceDimension ? :Map ?: sourceDimension ?_ {= sourceDimension=sourceDimension,axes=axes };
    source=NDInteger(settings[:sourceDimension],"nd.CoordinateProjection source dimension"); selected=settings[:axes];
    selected ? :Array ?: _ ?_ .Error("nd.CoordinateProjection axes must be an Array");
    normalized=selected.Map((axis)->NDInteger(axis,"nd.CoordinateProjection axis"));
    unique=normalized.Reduce((result,axis)->result.Has(axis) ?: result ?_ result.Set(axis,1),{= });
    (source>=1&&normalized.Len()>=1&&unique.Len()==normalized.Len()&&normalized.Filter((axis)->axis<1||axis>@source).Len()==0)
      ?: _ ?_ .Error("nd.CoordinateProjection axes must be unique indices in the source dimension");
    rows=normalized.Map((axis)->{; row:=[]; {@ index=1;index<=@source;{; @row ~= @row.Push(index==@axis ?: 1 ?_ 0); };index+=1}; row; });
    NDProjectionValue(rows,normalized.Map((axis)->0),"coordinate",[{= axes=normalized }]);
};

NDIsCayleyInfinity(value)->value==.Complex[:infinity];

NDCayleyRotation(dimension,axis1 ?= _,axis2 ?= _,t ?= _)->{;
    settings=dimension ? :Map ?: dimension ?_ {= dimension=dimension,axis1=axis1,axis2=axis2,t=t };
    size=NDInteger(settings[:dimension],"nd.CayleyRotation dimension"); first=NDInteger(settings[:axis1],"nd.CayleyRotation axis1"); second=NDInteger(settings[:axis2],"nd.CayleyRotation axis2");
    (size>=2&&first>=1&&second>=1&&first<=size&&second<=size&&first!=second) ?: _ ?_ .Error("nd.CayleyRotation axes must be distinct indices in the dimension");
    parameter=settings[:t];
    infinity=NDIsCayleyInfinity(parameter);
    cosine=infinity ?: -1 ?_ {; exact=NDExact(@parameter,"nd.CayleyRotation t"); (1-exact^2)/(1+exact^2); };
    sine=infinity ?: 0 ?_ {; exact=NDExact(@parameter,"nd.CayleyRotation t"); 2*exact/(1+exact^2); };
    matrix:=[];
    {@ row=1;row<=@size;{; values:=[]; {@ column=1;column<=@size;{; @values ~= @values.Push(@row==column ?: 1 ?_ 0); };column+=1}; @matrix ~= @matrix.Push(values); };row+=1};
    matrix ~= matrix.Set(first,matrix[first].Set(first,cosine).Set(second,-sine));
    matrix ~= matrix.Set(second,matrix[second].Set(first,sine).Set(second,cosine));
    offset:=[]; {@ index=1;index<=@size;{; @offset ~= @offset.Push(0); };index+=1};
    NDProjectionValue(matrix,offset,"cayley-rotation",[{= axes=[first,second],parameter=parameter,projectiveInfinity=infinity ?: 1 ?_ 0 }]);
};

NDApply(matrix,vector,offset)->{;
    result:=[];
    {@ row=1;row<=@matrix.Len();{; value:=@offset[row]; {@ column=1;column<=@vector.Len();{; @value += @matrix[@row][column]*@vector[column]; };column+=1}; @result ~= @result.Push(value); };row+=1};
    result;
};

NDMultiply(left,right)->{;
    left[1].Len()==right.Len() ?: _ ?_ .Error("nd.Compose projection dimensions do not match");
    result:=[];
    {@ row=1;row<=@left.Len();{; values:=[]; {@ column=1;column<=@right[1].Len();{; value:=0; {@ index=1;index<=@right.Len();{; @value += @left[@row][index]*@right[index][@column]; };index+=1}; @values ~= @values.Push(value); };column+=1}; @result ~= @result.Push(values); };row+=1};
    result;
};

NDCompose(after,before ?= _)->{;
    settings=((after ? :Map)&&after.Has("after")&&before==_) ?: after ?_ {= after=after,before=before };
    next=settings[:after]; previous=settings[:before];
    (NDIsProjection(next)&&NDIsProjection(previous)) ?: _ ?_ .Error("nd.Compose requires two projections");
    previous[:targetDimension]==next[:sourceDimension] ?: _ ?_ .Error("nd.Compose projection dimensions do not match");
    NDProjectionValue(NDMultiply(next[:matrix],previous[:matrix]),NDApply(next[:matrix],previous[:offset],next[:offset]),"composition",previous[:provenance].Concat(next[:provenance]));
};

NDCoordinates(coordinates,projection,label)->{;
    coordinates.Len()==projection[:sourceDimension] ?: _ ?_ .Error(@"@{label} dimension @{coordinates.Len()} does not match projection source dimension @{projection[:sourceDimension]}");
    NDApply(projection[:matrix],coordinates,projection[:offset]);
};

NDProject(geometry,projection ?= _)->{;
    settings=((geometry ? :Map)&&geometry.Has("geometry")&&projection==_) ?: geometry ?_ {= geometry=geometry,projection=projection };
    source=settings[:geometry]; transform=settings[:projection];
    NDIsGeometry(source) ?: _ ?_ .Error("nd.Project geometry must be n-dimensional geometry"); NDIsProjection(transform) ?: _ ?_ .Error("nd.Project requires an nd.Projection");
    trace=source[:provenance].Push(transform);
    source[:kind]==:point
      ?: NDValue(:point,source.Merge({= dimension=transform[:targetDimension],coordinates=NDCoordinates(source[:coordinates],transform,"nd.Point"),provenance=trace }))
      ?_ source[:kind]==:polyline
           ?: NDValue(:polyline,source.Merge({= dimension=transform[:targetDimension],points=source[:points].Map((point)->NDCoordinates(point,@transform,"nd.Polyline")),provenance=trace }))
           ?_ source[:kind]==:polytope
                ?: NDValue(:polytope,source.Merge({= dimension=transform[:targetDimension],vertices=source[:vertices].Map((point)->NDCoordinates(point,@transform,"nd.Polytope")),provenance=trace }))
                ?_ .Error(@"nd.Project does not support geometry kind '@{source[:kind]}'");
};

NDHypercube(dimension,size ?= 2)->{;
    settings=dimension ? :Map ?: dimension ?_ {= dimension=dimension,size=size };
    dimensions=NDInteger(settings[:dimension],"nd.Hypercube dimension"); (dimensions>=1&&dimensions<=10) ?: _ ?_ .Error("nd.Hypercube dimension must be between 1 and 10");
    half=NDExact(NDOption(settings,"size",2),"nd.Hypercube size")/2;
    vertices:=[[]]; edges:=[];
    {@ axis=1;axis<=@dimensions;{;
        count=@vertices.Len(); next:=[];
        {@ index=1;index<=@count;{; @next ~= @next.Push(@vertices[index].Push(-@half)); };index+=1};
        {@ index=1;index<=@count;{; @next ~= @next.Push(@vertices[index].Push(@half)); };index+=1};
        copied=@edges.Map((edge)->[edge[1]+@count,edge[2]+@count]); connecting:=[];
        {@ index=1;index<=@count;{; @connecting ~= @connecting.Push([index,index+@count]); };index+=1};
        @edges ~= @edges.Concat(copied).Concat(connecting); @vertices ~= next;
    };axis+=1};
    NDPolytope(vertices,edges);
};

NDToScene3D(geometry,options ?= {= })->{;
    settings=((geometry ? :Map)&&geometry.Has("geometry")) ?: geometry ?_ options.Merge({= geometry=geometry }); source=settings[:geometry];
    NDIsGeometry(source) ?: _ ?_ .Error("nd.ToScene3D requires n-dimensional geometry");
    source[:dimension]==3 ?: _ ?_ .Error(@"nd.ToScene3D requires dimension 3; explicitly project dimension @{source[:dimension]} first");
    style=NDOption(settings,"style",NDOption(source,"style",{= })); style=style==_ ?: {= } ?_ style;
    children:=[];
    source[:kind]==:point
      ?: {; @children ~= [.scene3d.PointCloud([@source[:coordinates]],@style)]; }
      ?_ source[:kind]==:polyline
           ?: {; @children ~= [.scene3d.Polyline(@source[:points],@style.Merge({= closed=@source[:closed] }))]; }
           ?_ source[:kind]==:polytope
                ?: {; @children ~= @source[:edges].Map((edge)->.scene3d.Polyline([@source[:vertices][edge[1]],@source[:vertices][edge[2]]],@style)); }
                ?_ .Error(@"nd.ToScene3D does not support geometry kind '@{source[:kind]}'");
    sceneOptions={= metadata={= source="rix.nd@1",projectionCount=source[:provenance].Len() } };
    camera=NDOption(settings,"camera"); sceneOptions=camera==_ ?: sceneOptions ?_ sceneOptions.Set("camera",camera);
    .scene3d.Scene([.scene3d.Group(children)],sceneOptions);
};

ndNamespace={= };
ndNamespace._proto={=
    Point=(self,coordinates,options ?= {= })->NDPoint(coordinates,options),
    Polyline=(self,points,options ?= {= })->NDPolyline(points,options),
    Polytope=(self,vertices,edges ?= _,options ?= {= })->NDPolytope(vertices,edges,options),
    Hypercube=(self,dimension,size ?= 2)->NDHypercube(dimension,size),
    Projection=(self,matrix,offset ?= _,options ?= {= })->NDProjection(matrix,offset,options),
    CoordinateProjection=(self,sourceDimension,axes ?= _)->NDCoordinateProjection(sourceDimension,axes),
    CayleyRotation=(self,dimension,axis1 ?= _,axis2 ?= _,t ?= _)->NDCayleyRotation(dimension,axis1,axis2,t),
    Compose=(self,after,before ?= _)->NDCompose(after,before),
    Project=(self,geometry,projection ?= _)->NDProject(geometry,projection),
    ToScene3D=(self,geometry,options ?= {= })->NDToScene3D(geometry,options)
};
.Host.RegisterValue("nd",ndNamespace,"Pure-RiX exact n-dimensional geometry and explicit projections",["Geometry","Scene3D","Exact"]);
`, sourcePath: "bundled:nd", kind: "rix" });
  catalog.addMetadata({ id: "numerics", description: "Backend-neutral bounded enclosure and refinement orchestration.", kind: "rix", mount: "numerics", exports: ["Request", "WorkPolicy", "EffectiveLimits", "Enclose", "Refine", "Sample", "Capabilities", "CheckResult", "NthRoot", "Sqrt", "Cbrt", "Pow", "Exp", "Expm1", "Log", "Log1p", "Ln", "Log2", "Log10", "Pi", "EulerGamma", "Sin", "Cos", "Tan", "Sec", "Csc", "Cot", "Sinc", "Asin", "Acos", "Atan", "Arcsin", "Arccos", "Arctan", "Sinh", "Cosh", "Tanh", "Sech", "Csch", "Coth", "Asinh", "Acosh", "Atanh", "Arsinh", "Arcosh", "Artanh", "Radians", "Degrees", "Gamma", "LogGamma", "Erf", "Erfc", "LambertW", "J0", "J1", "Y0", "Y1", "BesselJ0", "BesselJ1", "BesselY0", "BesselY1", "Zeta", "Kantorovich"], groups: ["Numerics"], permissions: [], requires: ["rix.oracle@1"], provides: ["rix.numerics@1", "rix.enclosable-real-consumer@1"], schemas: ["rix.numerics.refinement-request@1", "rix.numerics.enclosure@1", "rix.numerics.algorithm-real@1"], defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:numerics" }, { source: `/**
id: numerics
description: Backend-neutral bounded enclosure and refinement orchestration.
kind: rix
mount: numerics
exports: [Request, WorkPolicy, EffectiveLimits, Enclose, Refine, Sample, Capabilities, CheckResult, NthRoot, Sqrt, Cbrt, Pow, Exp, Expm1, Log, Log1p, Ln, Log2, Log10, Pi, EulerGamma, Sin, Cos, Tan, Sec, Csc, Cot, Sinc, Asin, Acos, Atan, Arcsin, Arccos, Arctan, Sinh, Cosh, Tanh, Sech, Csch, Coth, Asinh, Acosh, Atanh, Arsinh, Arcosh, Artanh, Radians, Degrees, Gamma, LogGamma, Erf, Erfc, LambertW, J0, J1, Y0, Y1, BesselJ0, BesselJ1, BesselY0, BesselY1, Zeta, Kantorovich]
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

NumericsExpSeriesInterval(sum, tail, scale, negative) -> {;
    lowerPositive = sum^scale;
    upperPositive = (sum + tail)^scale;
    negative
      ?: (1 / upperPositive):(1 / lowerPositive)
      ?_ lowerPositive:upperPositive;
};

NumericsExpRationalBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    negative = exact < 0;
    reduced := negative ?: -exact ?_ exact;
    scale := 1;
    rangeIterations := 0;
    {@ step=1;
       @reduced > 1/2 && @rangeIterations < @maxIterations;
       {;
           @reduced /= 2;
           @scale *= 2;
           @rangeIterations += 1;
       };
       step += 1
    };
    ready = reduced <= 1/2;
    n := 0;
    term := 1;
    sum := 1;
    nextTerm := reduced;
    tail := reduced == 0 ?: 0 ?_ nextTerm / (1 - reduced / 2);
    interval := NumericsExpSeriesInterval(sum, tail, scale, negative);
    seriesIterations := 0;
    {@ step=1;
       @ready && @interval.Width() > @tolerance
         && @rangeIterations + @seriesIterations < @maxIterations;
       {;
           @n += 1;
           @term *= @reduced / @n;
           @sum += @term;
           @nextTerm = @term * @reduced / (@n + 1);
           @tail = @reduced == 0
             ?: 0
             ?_ @nextTerm / (1 - @reduced / (@n + 2));
           @interval = NumericsExpSeriesInterval(@sum, @tail, @scale, @negative);
           @seriesIterations += 1;
       };
       step += 1
    };
    {=
        interval=interval,
        ready=ready,
        goalMet=ready && interval.Width() <= tolerance,
        iterations=rangeIterations + seriesIterations,
        rangeIterations=rangeIterations,
        seriesIterations=seriesIterations
    };
};

NumericsLogSeriesInterval(sum, tail, log2Sum, log2Tail, binaryPower) -> {;
    reducedLow = 2 * sum;
    reducedHigh = 2 * (sum + tail);
    log2Low = 2 * log2Sum;
    log2High = 2 * (log2Sum + log2Tail);
    binaryPower >= 0
      ?: (reducedLow + binaryPower * log2Low):(reducedHigh + binaryPower * log2High)
      ?_ (reducedLow + binaryPower * log2High):(reducedHigh + binaryPower * log2Low);
};

NumericsLogTail(argument, nextDegree) ->
    argument == 0
      ?: 0
      ?_ argument^nextDegree / (nextDegree * (1 - argument^2));

NumericsLogRationalBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    exact > 0 ?: _ ?_ .Error("Natural logarithm requires a positive value");
    reduced := exact;
    binaryPower := 0;
    rangeIterations := 0;
    {@ step=1;
       (@reduced < 1 || @reduced >= 2) && @rangeIterations < @maxIterations;
       {;
           @reduced >= 2
             ?: {; @reduced /= 2; @binaryPower += 1; }
             ?_ {; @reduced *= 2; @binaryPower -= 1; };
           @rangeIterations += 1;
       };
       step += 1
    };
    ready = reduced >= 1 && reduced < 2;
    argument = (reduced - 1) / (reduced + 1);
    log2Argument = 1/3;
    degree := 1;
    term := argument;
    log2Term := log2Argument;
    sum := argument;
    log2Sum := log2Argument;
    nextDegree := 3;
    tail := NumericsLogTail(argument, nextDegree);
    log2Tail := binaryPower == 0 ?: 0 ?_ NumericsLogTail(log2Argument, nextDegree);
    interval := NumericsLogSeriesInterval(sum, tail, log2Sum, log2Tail, binaryPower);
    seriesIterations := 0;
    {@ step=1;
       @ready && @interval.Width() > @tolerance
         && @rangeIterations + @seriesIterations < @maxIterations;
       {;
           @nextDegree = @degree + 2;
           @term *= @argument^2 * @degree / @nextDegree;
           @log2Term *= @log2Argument^2 * @degree / @nextDegree;
           @sum += @term;
           @log2Sum += @log2Term;
           @degree = @nextDegree;
           @tail = NumericsLogTail(@argument, @degree + 2);
           @log2Tail = @binaryPower == 0
             ?: 0
             ?_ NumericsLogTail(@log2Argument, @degree + 2);
           @interval = NumericsLogSeriesInterval(
               @sum, @tail, @log2Sum, @log2Tail, @binaryPower
           );
           @seriesIterations += 1;
       };
       step += 1
    };
    {=
        interval=interval,
        ready=ready,
        goalMet=ready && interval.Width() <= tolerance,
        iterations=rangeIterations + seriesIterations,
        rangeIterations=rangeIterations,
        seriesIterations=seriesIterations
    };
};

NumericsClampUnitInterval(interval) ->
    .Max(-1, interval.Low()):.Min(1, interval.High());

NumericsTrigTaylorBounds(value, tolerance, maxIterations, kind) -> {;
    exact = value ~!: :Rational;
    absolute = exact.Abs();
    cosine = kind == :cosine;
    sinc = kind == :sinc;
    degree := cosine ?: 0 ?_ (sinc ?: 0 ?_ 1);
    term := cosine ?: 1 ?_ (sinc ?: 1 ?_ exact);
    sum := term;
    remainder := cosine
      ?: absolute
      ?_ (sinc ?: absolute/2 ?_ absolute^2/2);
    interval := NumericsClampUnitInterval((sum - remainder):(sum + remainder));
    iterations := 0;
    {@ step=1;
       @interval.Width() > @tolerance && @iterations < @maxIterations;
       {;
           factor = @sinc
             ?: -(@exact^2) / ((@degree + 2) * (@degree + 3))
             ?_ -(@exact^2) / ((@degree + 1) * (@degree + 2));
           @term *= factor;
           @sum += @term;
           remainderFactor = @sinc
             ?: @absolute^2 / ((@degree + 3) * (@degree + 4))
             ?_ @absolute^2 / ((@degree + 2) * (@degree + 3));
           @remainder *= remainderFactor;
           @degree += 2;
           @interval = NumericsClampUnitInterval(
               (@sum - @remainder):(@sum + @remainder)
           );
           @iterations += 1;
       };
       step += 1
    };
    {=
        interval=interval,
        ready=1,
        goalMet=interval.Width() <= tolerance,
        iterations=iterations
    };
};

NumericsAtanSmallBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    exact.Abs() <= 1/2 ?: _ ?_ .Error("Internal arctangent series argument exceeds 1/2");
    term := exact;
    sum := exact;
    degree := 1;
    next := -exact^3 / 3;
    interval := .Min(sum, sum + next):.Max(sum, sum + next);
    iterations := 0;
    {@ step=1;
       @interval.Width() > @tolerance && @iterations < @maxIterations;
       {;
           @term = @next;
           @sum += @term;
           @degree += 2;
           @next = -@term * @exact^2 * @degree / (@degree + 2);
           @interval = .Min(@sum, @sum + @next):.Max(@sum, @sum + @next);
           @iterations += 1;
       };
       step += 1
    };
    {=
        interval=interval,
        ready=1,
        goalMet=interval.Width() <= tolerance,
        iterations=iterations
    };
};

## Machin's identity: pi = 16 atan(1/5) - 4 atan(1/239).
NumericsPiRationalBounds(tolerance, maxIterations) -> {;
    perSeries = .Max(0, maxIterations // 2);
    first = NumericsAtanSmallBounds(1/5, tolerance/32, perSeries);
    second = NumericsAtanSmallBounds(1/239, tolerance/8, maxIterations - perSeries);
    interval = 16 * first[:interval] - 4 * second[:interval];
    {=
        interval=interval,
        ready=first[:ready] && second[:ready],
        goalMet=interval.Width() <= tolerance,
        iterations=first[:iterations] + second[:iterations]
    };
};

NumericsAtanRationalBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    negative = exact < 0;
    absolute = exact.Abs();
    halfBudget = .Max(0, maxIterations // 2);
    absoluteResult = absolute <= 1/2
      ?: NumericsAtanSmallBounds(absolute, tolerance, maxIterations)
      ?_ {;
          pi = NumericsPiRationalBounds(@tolerance, @halfBudget);
          reduced = @absolute > 1
            ?: 1 / @absolute
            ?_ (@absolute - 1) / (@absolute + 1);
          residual = NumericsAtanSmallBounds(reduced, @tolerance/2, @maxIterations - @halfBudget);
          interval = @absolute > 1
            ?: pi[:interval] / 2 - residual[:interval]
            ?_ pi[:interval] / 4 + residual[:interval];
          {=
              interval=interval,
              ready=pi[:ready] && residual[:ready],
              goalMet=interval.Width() <= @tolerance,
              iterations=pi[:iterations] + residual[:iterations]
          };
      };
    resultInterval = negative
      ?: (-absoluteResult[:interval].High()):(-absoluteResult[:interval].Low())
      ?_ absoluteResult[:interval];
    {=
        interval=resultInterval,
        ready=absoluteResult[:ready],
        goalMet=resultInterval.Width() <= tolerance,
        iterations=absoluteResult[:iterations]
    };
};

NumericsAlternatingSeriesInterval(sum, next) ->
    .Min(sum, sum + next):.Max(sum, sum + next);

NumericsSpecialSeriesBounds(value, tolerance, maxIterations, kind) -> {;
    exact = value ~!: :Rational;
    absolute = exact.Abs();
    erfCore = kind == :erfCore;
    bessel0 = kind == :besselJ0;
    term := bessel0 ?: 1 ?_ (erfCore ?: exact ?_ exact/2);
    sum := term;
    index := 0;
    next := erfCore
      ?: -exact^3/3
      ?_ (bessel0 ?: -(exact^2)/4 ?_ -(exact^3)/16);
    decreasing := next.Abs() <= term.Abs();
    fallback = erfCore
      ?: (exact < 0 ?: exact:0 ?_ 0:exact)
      ?_ ((-1):1);
    interval := decreasing ?: NumericsAlternatingSeriesInterval(sum, next) ?_ fallback;
    iterations := 0;
    {@ step=1;
       @interval.Width() > @tolerance && @iterations < @maxIterations;
       {;
           @term = @next;
           @sum += @term;
           @index += 1;
           @next = @erfCore
             ?: -@term * @exact^2 * (2*@index + 1)
                 / ((@index + 1) * (2*@index + 3))
             ?_ (@bessel0
                 ?: -@term * @exact^2 / (4 * (@index + 1)^2)
                 ?_ -@term * @exact^2 / (4 * (@index + 1) * (@index + 2)));
           @decreasing = @next.Abs() <= @term.Abs();
           @interval = @decreasing
             ?: NumericsAlternatingSeriesInterval(@sum, @next)
             ?_ @fallback;
           @iterations += 1;
       };
       step += 1
    };
    {=
        interval=interval,
        ready=decreasing,
        goalMet=decreasing && interval.Width() <= tolerance,
        iterations=iterations,
        lipschitz=1
    };
};

NumericsBesselYSeriesBounds(value, tolerance, maxIterations, kind) -> {;
    exact = value ~!: :Rational;
    absolute = exact.Abs();
    zeroOrder = kind == :besselY0Core;
    index := zeroOrder ?: 1 ?_ 0;
    harmonic := zeroOrder ?: 1 ?_ 0;
    nextHarmonic := zeroOrder ?: 3/2 ?_ 1;
    term := zeroOrder ?: exact^2/4 ?_ exact/2;
    sum := term;
    next := zeroOrder
      ?: -term * exact^2 * nextHarmonic / (16*harmonic)
      ?_ -5*term*exact^2/16;
    magnitude = 3^(absolute.Ceil()+1) * (absolute+1)^2;
    fallback = (-magnitude):magnitude;
    decreasing := next.Abs() <= term.Abs();
    interval := decreasing ?: NumericsAlternatingSeriesInterval(sum, next) ?_ fallback;
    iterations := 0;
    {@ step=1;
       @interval.Width() > @tolerance && @iterations < @maxIterations;
       {;
           @term = @next;
           @sum += @term;
           @index += 1;
           @harmonic += 1/@index;
           @nextHarmonic = @harmonic + 1/(@index+1);
           futureHarmonic = @nextHarmonic + 1/(@index+2);
           @next = @zeroOrder
             ?: -@term * @exact^2 * @nextHarmonic
                 / (4 * (@index+1)^2 * @harmonic)
             ?_ -@term * @exact^2 * (@nextHarmonic + futureHarmonic)
                 / (4 * (@index+1) * (@index+2) * (@harmonic + @nextHarmonic));
           @decreasing = @next.Abs() <= @term.Abs();
           @interval = @decreasing
             ?: NumericsAlternatingSeriesInterval(@sum, @next)
             ?_ @fallback;
           @iterations += 1;
       };
       step += 1
    };
    {=
        interval=interval,
        ready=decreasing,
        goalMet=decreasing && interval.Width() <= tolerance,
        iterations=iterations,
        lipschitz=magnitude
    };
};

NumericsEulerGammaRationalBounds(tolerance, maxIterations) -> {;
    n := 1;
    harmonic := 1;
    iterations := 0;
    remainderWidth := 1/2 - 1/4;
    {@ step=1;
       @remainderWidth > @tolerance/2 && @iterations < @maxIterations;
       {;
           @n += 1;
           @harmonic += 1/@n;
           @remainderWidth = 1/(2*@n) - 1/(2*(@n+1));
           @iterations += 1;
       };
       step += 1
    };
    logBounds = NumericsLogRationalBounds(
        n, tolerance/4, .Max(0, maxIterations-iterations)
    );
    remainder = (1/(2*(n+1))):(1/(2*n));
    interval = harmonic - logBounds[:interval] - remainder;
    iterations += logBounds[:iterations];
    {=
        interval=interval,
        ready=logBounds[:ready],
        goalMet=logBounds[:ready] && interval.Width() <= tolerance,
        iterations=iterations
    };
};

NumericsBesselYRationalBounds(value, tolerance, maxIterations, kind) -> {;
    exact = value ~!: :Rational;
    exact > 0 ?: _ ?_ .Error("Bessel Y0 and Y1 currently require a positive real value");
    perPart = .Max(1, maxIterations//6);
    partTolerance = tolerance/(8*(exact.Abs()+1));
    pi = NumericsPiRationalBounds(partTolerance, perPart);
    gamma = NumericsEulerGammaRationalBounds(partTolerance, perPart);
    logarithm = NumericsLogRationalBounds(exact/2, partTolerance, perPart);
    zeroOrder = kind == :besselY0;
    bessel = NumericsSpecialSeriesBounds(
        exact, partTolerance, perPart, zeroOrder ?: :besselJ0 ?_ :besselJ1
    );
    core = NumericsBesselYSeriesBounds(
        exact, partTolerance, perPart, zeroOrder ?: :besselY0Core ?_ :besselY1Core
    );
    common = logarithm[:interval] + gamma[:interval];
    interval = zeroOrder
      ?: 2/pi[:interval] * (common*bessel[:interval] + core[:interval])
      ?_ 2/pi[:interval] * common*bessel[:interval]
          - 2/(pi[:interval]*(exact:exact)) - core[:interval]/pi[:interval];
    iterations = pi[:iterations] + gamma[:iterations] + logarithm[:iterations]
      + bessel[:iterations] + core[:iterations];
    ready = pi[:ready] && gamma[:ready] && logarithm[:ready]
      && bessel[:ready] && core[:ready];
    {=
        interval=interval,
        ready=ready,
        goalMet=ready && interval.Width() <= tolerance,
        iterations=iterations
    };
};

NumericsLogGammaRationalBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    exact > 0 ?: _ ?_ .Error("LogGamma currently requires a positive real value");
    y := exact;
    shifts := 0;
    shiftLimit = .Max(0, maxIterations // 4);
    {@ step=1;
       @y <= 1 && @shifts < @shiftLimit;
       {; @y += 1; @shifts += 1; };
       step += 1
    };
    z := y - 1;
    stirlingWidth := 1/(12*z) - 1/(12*z + 1);
    {@ step=1;
       @stirlingWidth > @tolerance/4 && @shifts < @shiftLimit;
       {;
           @y += 1;
           @z += 1;
           @shifts += 1;
           @stirlingWidth = 1/(12*@z) - 1/(12*@z + 1);
       };
       step += 1
    };
    slots = shifts + 3;
    perLog = .Max(0, (maxIterations - shifts) // slots);
    logTolerance = tolerance / (16 * (z.Abs() + shifts + 1));
    logY = NumericsLogRationalBounds(z, logTolerance, perLog);
    pi = NumericsPiRationalBounds(logTolerance, perLog);
    log2PiLow = NumericsLogRationalBounds(2*pi[:interval].Low(), logTolerance, perLog);
    log2PiHigh = NumericsLogRationalBounds(2*pi[:interval].High(), logTolerance, perLog);
    log2Pi = log2PiLow[:interval].Low():log2PiHigh[:interval].High();
    recurrence := 0:0;
    recurrenceIterations := 0;
    {@ index=0; index < @shifts;
       {;
           factorLog = NumericsLogRationalBounds(
               @exact + index, @logTolerance, @perLog
           );
           @recurrence += factorLog[:interval];
           @recurrenceIterations += factorLog[:iterations];
       };
       index += 1
    };
    correction = (1/(12*z + 1)):(1/(12*z));
    interval = (z + 1/2)*logY[:interval] - z + log2Pi/2
      + correction - recurrence;
    iterations = shifts + logY[:iterations] + pi[:iterations]
      + log2PiLow[:iterations] + log2PiHigh[:iterations]
      + recurrenceIterations;
    ready = logY[:ready] && pi[:ready] && log2PiLow[:ready] && log2PiHigh[:ready];
    {=
        interval=interval,
        ready=ready,
        goalMet=ready && interval.Width() <= tolerance,
        iterations=iterations
    };
};

NumericsGammaRationalBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    halfBudget = .Max(0, maxIterations//2);
    logarithm = NumericsLogGammaRationalBounds(
        exact, tolerance/16, halfBudget
    );
    low = NumericsExpRationalBounds(
        logarithm[:interval].Low(), tolerance/4, maxIterations-halfBudget
    );
    high = logarithm[:interval].Low() == logarithm[:interval].High()
      ?: low
      ?_ NumericsExpRationalBounds(
          logarithm[:interval].High(), tolerance/4, maxIterations-halfBudget
      );
    interval = low[:interval].Low():high[:interval].High();
    {=
        interval=interval,
        ready=logarithm[:ready] && low[:ready] && high[:ready],
        goalMet=logarithm[:ready] && low[:ready] && high[:ready]
          && interval.Width() <= tolerance,
        iterations=logarithm[:iterations] + low[:iterations]
          + (logarithm[:interval].Low() == logarithm[:interval].High() ?: 0 ?_ high[:iterations])
    };
};

NumericsLambertProductBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    scale = .Max(1, exact.Abs());
    exponential = NumericsExpRationalBounds(
        exact, tolerance/(2*scale), maxIterations
    );
    {=
        interval=(exact:exact) * exponential[:interval],
        ready=exponential[:ready],
        iterations=exponential[:iterations]
    };
};

NumericsLambertWRationalBounds(value, tolerance, maxIterations, branch) -> {;
    exact = value ~!: :Rational;
    (branch == 0 || branch == -1) ?: _ ?_ .Error("LambertW branch must be 0 or -1");
    branch == -1 && exact >= 0
      ?: .Error("LambertW branch -1 requires a negative argument")
      ?_ _;
    exact == 0
      ?: {= interval=0:0, ready=1, goalMet=1, iterations=0 }
      ?_ {;
          eBounds = NumericsExpRationalBounds(1, @tolerance/16, .Max(0, @maxIterations//8));
          branchPoint = (-1/eBounds[:interval].Low()):(-1/eBounds[:interval].High());
          @exact >= branchPoint.High()
            ?: _
            ?_ .Error("LambertW real branch domain could not be certified");
          branchLog = @branch == -1
            ?: NumericsLogRationalBounds(
                -@exact, @tolerance/16, .Max(0, @maxIterations//8)
            )
            ?_ {= interval=0:0, ready=1, iterations=0 };
          lower := @branch == 0
            ?: (@exact < 0 ?: -1 ?_ 0)
            ?_ 2*branchLog[:interval].Low();
          upper := @branch == 0 ?: (@exact < 0 ?: 0 ?_ .Max(1, @exact)) ?_ -1;
          iterations := eBounds[:iterations] + branchLog[:iterations];
          searchReady := 0;
          interval := lower:upper;
          {@ step=1;
             @searchReady == 0 && @interval.Width() > @tolerance
               && @iterations < @maxIterations;
             {;
                 midpoint = @interval.Midpoint();
                 product = NumericsLambertProductBounds(
                     midpoint, @tolerance^2/64, .Max(0, @maxIterations - @iterations)
                 );
                 @iterations += product[:iterations];
                 below = product[:interval].High() < @exact;
                 above = product[:interval].Low() > @exact;
                 moveLower = @branch == 0 ?: below ?_ above;
                 moveUpper = @branch == 0 ?: above ?_ below;
                 newLower = moveLower ?: midpoint ?_ @interval.Low();
                 newUpper = moveUpper ?: midpoint ?_ @interval.High();
                 @interval = newLower:newUpper;
                 @iterations = (!below && !above) ?: @maxIterations ?_ @iterations;
             };
             step += 1
          };
          {=
              interval=interval,
              ready=searchReady == 0,
              goalMet=searchReady == 0 && interval.Width() <= @tolerance,
              iterations=iterations
          };
      };
};

NumericsPositivePowerRationalBounds(base, exponent, tolerance, maxIterations) -> {;
    exactBase = base ~!: :Rational;
    exactExponent = exponent ~!: :Rational;
    exactBase > 0 ?: _ ?_ .Error("Positive power bound requires a positive base");
    halfBudget = .Max(0, maxIterations//2);
    logBounds = NumericsLogRationalBounds(
        exactBase, tolerance/(4*(exactExponent.Abs()+1)), halfBudget
    );
    exponentInterval = exactExponent * logBounds[:interval];
    lowExp = NumericsExpRationalBounds(
        exponentInterval.Low(), tolerance/4, maxIterations-halfBudget
    );
    highExp = exponentInterval.Low() == exponentInterval.High()
      ?: lowExp
      ?_ NumericsExpRationalBounds(
          exponentInterval.High(), tolerance/4, maxIterations-halfBudget
      );
    interval = lowExp[:interval].Low():highExp[:interval].High();
    {=
        interval=interval,
        ready=logBounds[:ready] && lowExp[:ready] && highExp[:ready],
        iterations=logBounds[:iterations] + lowExp[:iterations]
          + (exponentInterval.Low() == exponentInterval.High() ?: 0 ?_ highExp[:iterations])
    };
};

NumericsZetaRationalBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    exact > 1 ?: _ ?_ .Error("Zeta currently requires a real argument greater than 1");
    selectionBudget = .Max(1, maxIterations//4);
    n := 4;
    remainder := (exact*(exact+1)*(exact+2)/720):(exact*(exact+1)*(exact+2)/720);
    selectionIterations := 0;
    {@ step=1;
       @remainder.High() > @tolerance/8 && @selectionIterations < @selectionBudget;
       {;
           power = NumericsPositivePowerRationalBounds(
               @n, -(@exact+3), @tolerance/64,
               .Max(1, @selectionBudget-@selectionIterations)
           );
           @selectionIterations += power[:iterations];
           @remainder = (@exact*(@exact+1)*(@exact+2)/720) * power[:interval];
           @n = @remainder.High() > @tolerance/8 ?: 2*@n ?_ @n;
       };
       step += 1
    };
    termCount = n - 1;
    perTerm = .Max(1, (maxIterations-selectionIterations)//(termCount+5));
    sum := 1:1;
    termIterations := 0;
    {@ index=2; index < @n;
       {;
           term = NumericsPositivePowerRationalBounds(
               index, -@exact, @tolerance/(16*@n), @perTerm
           );
           @sum += term[:interval];
           @termIterations += term[:iterations];
       };
       index += 1
    };
    tailPower = NumericsPositivePowerRationalBounds(
        n, 1-exact, tolerance/32, perTerm
    );
    halfPower = NumericsPositivePowerRationalBounds(
        n, -exact, tolerance/32, perTerm
    );
    correctionPower = NumericsPositivePowerRationalBounds(
        n, -(exact+1), tolerance/32, perTerm
    );
    remainderPower = NumericsPositivePowerRationalBounds(
        n, -(exact+3), tolerance/64, perTerm
    );
    center = sum + tailPower[:interval]/(exact-1)
      + halfPower[:interval]/2 + exact*correctionPower[:interval]/12;
    error = exact*(exact+1)*(exact+2)*remainderPower[:interval].High()/720;
    interval = (center.Low()-error):(center.High()+error);
    iterations = selectionIterations + termIterations + tailPower[:iterations]
      + halfPower[:iterations] + correctionPower[:iterations] + remainderPower[:iterations];
    ready = tailPower[:ready] && halfPower[:ready]
      && correctionPower[:ready] && remainderPower[:ready];
    {=
        interval=interval,
        ready=ready,
        goalMet=ready && interval.Width() <= tolerance,
        iterations=iterations
    };
};

NumericsElementaryResult(real, request, interval, work, goalMet, evidence) -> {;
    status = goalMet ?: :enclosed ?_ :budgetExhausted;
    approximation = .CertifiedApproximation(interval.Midpoint(), interval, {=
        provider=:numerics,
        algorithm=real[:kind],
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
        requestedWidth=request[:absoluteWidth],
        achievedWidth=interval.Width(),
        approximation=approximation,
        evidenceLevel=real[:evidenceLevel],
        backend=:numerics,
        operation=request[:operation],
        trace=[],
        work=work,
        diagnostics=goalMet ?: [] ?_ [:workBudgetReached],
        evidence=evidence,
        source=real[:provenance]
    };
};

NumericsElementaryRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    sourceWidth = requestedWidth < 1 ?: requestedWidth^2 / 16 ?_ requestedWidth / 16;
    sourceBudget = .Max(0, maxCalls // 3);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    logDomain = real[:kind] == :naturalLog;
    domainResolved = logDomain ?: sourceInterval.Low() > 0 ?_ 1;
    domainResolved ?: {;
        remaining = .Max(0, .Min(@maxIterations, @maxCalls - @sourceCalls));
        endpointBudget = .Max(0, remaining // 2);
        tolerance = @requestedWidth / 4;
        lowerBounds = @logDomain
          ?: NumericsLogRationalBounds(@sourceInterval.Low(), tolerance, endpointBudget)
          ?_ NumericsExpRationalBounds(@sourceInterval.Low(), tolerance, endpointBudget);
        sameEndpoint = @sourceInterval.Low() == @sourceInterval.High();
        upperBounds = sameEndpoint
          ?: lowerBounds
          ?_ (@logDomain
              ?: NumericsLogRationalBounds(@sourceInterval.High(), tolerance, endpointBudget)
              ?_ NumericsExpRationalBounds(@sourceInterval.High(), tolerance, endpointBudget));
        ready = lowerBounds[:ready] && upperBounds[:ready];
        ready ?: {;
            interval = @lowerBounds[:interval].Low():@upperBounds[:interval].High();
            endpointIterations = @lowerBounds[:iterations]
              + (@sameEndpoint ?: 0 ?_ @upperBounds[:iterations]);
            calls = @sourceCalls + endpointIterations;
            goalMet = interval.Width() <= @requestedWidth;
            NumericsElementaryResult(@real, @request, interval, {=
                calls=calls,
                iterations=endpointIterations,
                maxCalls=@maxCalls,
                maxIterations=@maxIterations,
                sourceCalls=@sourceCalls,
                exhausted=!goalMet
            }, goalMet, {=
                kind=:rationalSeriesBounds,
                property=:containment,
                algorithm=@real[:kind],
                source=@sourceResult[:evidence]
            });
        } ?_ NumericsUnknownAlgorithm(
            @real,
            @request,
            @sourceInterval,
            {= calls=@sourceCalls, iterations=0, maxCalls=@maxCalls, exhausted=1 },
            :rangeReductionBudgetExhausted
        );
    } ?_ NumericsUnknownAlgorithm(
        real,
        request,
        sourceInterval,
        {= calls=sourceCalls, iterations=0, maxCalls=maxCalls, exhausted=sourceCalls>=maxCalls },
        :logDomainNotCertified
    );
};

NumericsPiRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    limit = .Min(maxCalls, maxIterations);
    bounds = NumericsPiRationalBounds(request[:absoluteWidth], limit);
    goalMet = bounds[:goalMet];
    NumericsElementaryResult(real, request, bounds[:interval], {=
        calls=bounds[:iterations],
        iterations=bounds[:iterations],
        maxCalls=maxCalls,
        maxIterations=maxIterations,
        exhausted=!goalMet
    }, goalMet, {=
        kind=:machinFormula,
        property=:containment,
        identity="pi=16*atan(1/5)-4*atan(1/239)"
    });
};

NumericsEulerGammaRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    limit = .Min(maxCalls, maxIterations);
    bounds = NumericsEulerGammaRationalBounds(request[:absoluteWidth], limit);
    goalMet = bounds[:goalMet];
    NumericsElementaryResult(real, request, bounds[:interval], {=
        calls=bounds[:iterations],
        iterations=bounds[:iterations],
        maxCalls=maxCalls,
        maxIterations=maxIterations,
        exhausted=!goalMet
    }, goalMet, {=
        kind=:harmonicLogBounds,
        property=:containment,
        identity="EulerGamma=limit(H_n-log(n))"
    });
};

NumericsTrigRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    sourceWidth = requestedWidth / 4;
    sourceBudget = .Max(0, maxCalls // 2);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    midpoint = sourceInterval.Midpoint();
    radius = sourceInterval.Width() / 2;
    remaining = .Max(0, .Min(maxIterations, maxCalls - sourceCalls));
    pointBounds = NumericsTrigTaylorBounds(midpoint, requestedWidth/2, remaining, real[:kind]);
    interval = NumericsClampUnitInterval(
        (pointBounds[:interval].Low() - radius):(pointBounds[:interval].High() + radius)
    );
    iterations = pointBounds[:iterations];
    calls = sourceCalls + iterations;
    goalMet = interval.Width() <= requestedWidth;
    NumericsElementaryResult(real, request, interval, {=
        calls=calls,
        iterations=iterations,
        maxCalls=maxCalls,
        maxIterations=maxIterations,
        sourceCalls=sourceCalls,
        exhausted=!goalMet
    }, goalMet, {=
        kind=:rationalTaylorWithLipschitzLift,
        property=:containment,
        algorithm=real[:kind],
        source=sourceResult[:evidence]
    });
};

NumericsSpecialSeriesRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    sourceWidth = requestedWidth / 4;
    sourceBudget = .Max(0, maxCalls // 2);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    midpoint = sourceInterval.Midpoint();
    radius = sourceInterval.Width() / 2;
    remaining = .Max(0, .Min(maxIterations, maxCalls - sourceCalls));
    yCore = real[:kind] == :besselY0Core || real[:kind] == :besselY1Core;
    pointBounds = yCore
      ?: NumericsBesselYSeriesBounds(midpoint, requestedWidth/2, remaining, real[:kind])
      ?_ NumericsSpecialSeriesBounds(midpoint, requestedWidth/2, remaining, real[:kind]);
    lift = pointBounds[:lipschitz] * radius;
    interval = (pointBounds[:interval].Low() - lift)
      :(pointBounds[:interval].High() + lift);
    bounded = !yCore && real[:kind] != :erfCore;
    interval = bounded ?: NumericsClampUnitInterval(interval) ?_ interval;
    iterations = pointBounds[:iterations];
    calls = sourceCalls + iterations;
    goalMet = pointBounds[:ready] && interval.Width() <= requestedWidth;
    NumericsElementaryResult(real, request, interval, {=
        calls=calls,
        iterations=iterations,
        maxCalls=maxCalls,
        maxIterations=maxIterations,
        sourceCalls=sourceCalls,
        exhausted=!goalMet
    }, goalMet, {=
        kind=:certifiedAlternatingSeries,
        property=:containment,
        algorithm=real[:kind],
        source=sourceResult[:evidence]
    });
};

NumericsLogGammaRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    sourceWidth = requestedWidth^2 / 64;
    sourceBudget = .Max(0, maxCalls // 3);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    domainResolved = sourceInterval.Low() > 0;
    domainResolved ?: {;
        midpoint = @sourceInterval.Midpoint();
        radius = @sourceInterval.Width()/2;
        derivativeBound = 1/@sourceInterval.Low()
          + .Max(@sourceInterval.Low().Abs(), @sourceInterval.High().Abs()) + 2;
        remaining = .Max(0, .Min(@maxIterations, @maxCalls - @sourceCalls));
        pointBounds = NumericsLogGammaRationalBounds(
            midpoint, @requestedWidth/2, remaining
        );
        interval = (pointBounds[:interval].Low() - derivativeBound*radius)
          :(pointBounds[:interval].High() + derivativeBound*radius);
        iterations = pointBounds[:iterations];
        calls = @sourceCalls + iterations;
        goalMet = pointBounds[:ready] && interval.Width() <= @requestedWidth;
        NumericsElementaryResult(@real, @request, interval, {=
            calls=calls,
            iterations=iterations,
            maxCalls=@maxCalls,
            maxIterations=@maxIterations,
            sourceCalls=@sourceCalls,
            exhausted=!goalMet
        }, goalMet, {=
            kind=:stirlingRobbinsBounds,
            property=:containment,
            algorithm=:logGamma,
            source=@sourceResult[:evidence]
        });
    } ?_ NumericsUnknownAlgorithm(
        real,
        request,
        sourceInterval,
        {= calls=sourceCalls, iterations=0, maxCalls=maxCalls, exhausted=sourceCalls>=maxCalls },
        :logGammaPositiveDomainNotCertified
    );
};

NumericsGammaRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    sourceWidth = requestedWidth^2/256;
    sourceBudget = .Max(0, maxCalls//3);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    domainResolved = sourceInterval.Low() > 0;
    domainResolved ?: {;
        midpoint = @sourceInterval.Midpoint();
        radius = @sourceInterval.Width()/2;
        remaining = .Max(0, .Min(@maxIterations, @maxCalls-@sourceCalls));
        pointBounds = NumericsGammaRationalBounds(
            midpoint, @requestedWidth/2, remaining
        );
        gammaBound = 3^((@sourceInterval.High()^2).Ceil()+2)
          * (1 + 1/@sourceInterval.Low());
        derivativeBound = gammaBound * (1/@sourceInterval.Low()
          + @sourceInterval.High().Abs() + 2);
        interval = (pointBounds[:interval].Low()-derivativeBound*radius)
          :(pointBounds[:interval].High()+derivativeBound*radius);
        iterations = pointBounds[:iterations];
        calls = @sourceCalls + iterations;
        goalMet = pointBounds[:ready] && interval.Width() <= @requestedWidth;
        NumericsElementaryResult(@real, @request, interval, {=
            calls=calls,
            iterations=iterations,
            maxCalls=@maxCalls,
            maxIterations=@maxIterations,
            sourceCalls=@sourceCalls,
            exhausted=!goalMet
        }, goalMet, {=
            kind=:stirlingThenExponentialBounds,
            property=:containment,
            algorithm=:gamma,
            source=@sourceResult[:evidence]
        });
    } ?_ NumericsUnknownAlgorithm(
        real,
        request,
        0:.Max(1,maxCalls),
        {= calls=sourceCalls, iterations=0, maxCalls=maxCalls, exhausted=1 },
        :gammaPositiveDomainNotCertified
    );
};

NumericsLambertWRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    sourceWidth = requestedWidth^2 / 64;
    sourceBudget = .Max(0, maxCalls // 3);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    remaining = .Max(0, .Min(maxIterations, maxCalls - sourceCalls));
    thresholdExp = NumericsExpRationalBounds(1, requestedWidth/32, .Max(0, remaining//8));
    branchPoint = (-1/thresholdExp[:interval].Low()):(-1/thresholdExp[:interval].High());
    domainResolved = sourceInterval.Low() >= branchPoint.High()
      && (real[:branch] == 0 || sourceInterval.High() < 0);
    domainResolved ?: {;
        endpointBudget = .Max(0, @remaining // 2);
        decreasing = @real[:branch] == -1;
        lowerSource = decreasing ?: @sourceInterval.High() ?_ @sourceInterval.Low();
        upperSource = decreasing ?: @sourceInterval.Low() ?_ @sourceInterval.High();
        lower = NumericsLambertWRationalBounds(
            lowerSource, @requestedWidth/4, endpointBudget, @real[:branch]
        );
        sameEndpoint = lowerSource == upperSource;
        upper = sameEndpoint
          ?: lower
          ?_ NumericsLambertWRationalBounds(
              upperSource, @requestedWidth/4, @remaining - endpointBudget, @real[:branch]
          );
        interval = lower[:interval].Low():upper[:interval].High();
        endpointIterations = lower[:iterations] + (sameEndpoint ?: 0 ?_ upper[:iterations]);
        calls = @sourceCalls + @thresholdExp[:iterations] + endpointIterations;
        goalMet = lower[:ready] && upper[:ready] && interval.Width() <= @requestedWidth;
        NumericsElementaryResult(@real, @request, interval, {=
            calls=calls,
            iterations=@thresholdExp[:iterations] + endpointIterations,
            maxCalls=@maxCalls,
            maxIterations=@maxIterations,
            sourceCalls=@sourceCalls,
            exhausted=!goalMet
        }, goalMet, {=
            kind=:certifiedMonotoneBisection,
            property=:containment,
            algorithm=:lambertW,
            branch=@real[:branch],
            source=@sourceResult[:evidence]
        });
    } ?_ NumericsUnknownAlgorithm(
        real,
        request,
        real[:branch] == 0 ?: ((-1):(.Max(1, sourceInterval.High()))) ?_ ((-maxCalls):(-1)),
        {= calls=sourceCalls + thresholdExp[:iterations], iterations=thresholdExp[:iterations], maxCalls=maxCalls, exhausted=1 },
        :lambertWDomainNotCertified
    );
};

NumericsZetaRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    sourceWidth = requestedWidth^2 / 64;
    sourceBudget = .Max(0, maxCalls//3);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    domainResolved = sourceInterval.Low() > 1;
    domainResolved ?: {;
        remaining = .Max(0, .Min(@maxIterations, @maxCalls-@sourceCalls));
        endpointBudget = .Max(0, remaining//2);
        lower = NumericsZetaRationalBounds(
            @sourceInterval.High(), @requestedWidth/4, endpointBudget
        );
        sameEndpoint = @sourceInterval.Low() == @sourceInterval.High();
        upper = sameEndpoint
          ?: lower
          ?_ NumericsZetaRationalBounds(
              @sourceInterval.Low(), @requestedWidth/4, remaining-endpointBudget
          );
        interval = lower[:interval].Low():upper[:interval].High();
        endpointIterations = lower[:iterations] + (sameEndpoint ?: 0 ?_ upper[:iterations]);
        calls = @sourceCalls + endpointIterations;
        goalMet = lower[:ready] && upper[:ready] && interval.Width() <= @requestedWidth;
        NumericsElementaryResult(@real, @request, interval, {=
            calls=calls,
            iterations=endpointIterations,
            maxCalls=@maxCalls,
            maxIterations=@maxIterations,
            sourceCalls=@sourceCalls,
            exhausted=!goalMet
        }, goalMet, {=
            kind=:eulerMaclaurinBounds,
            property=:containment,
            algorithm=:zeta,
            source=@sourceResult[:evidence]
        });
    } ?_ NumericsUnknownAlgorithm(
        real,
        request,
        1:(1 + 1/.Max(1, sourceInterval.High().Abs())),
        {= calls=sourceCalls, iterations=0, maxCalls=maxCalls, exhausted=1 },
        :zetaGreaterThanOneDomainNotCertified
    );
};

NumericsBesselYRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    sourceWidth = requestedWidth^2/256;
    sourceBudget = .Max(0, maxCalls//3);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    domainResolved = sourceInterval.Low() > 0;
    domainResolved ?: {;
        midpoint = @sourceInterval.Midpoint();
        radius = @sourceInterval.Width()/2;
        remaining = .Max(0, .Min(@maxIterations, @maxCalls-@sourceCalls));
        pointBounds = NumericsBesselYRationalBounds(
            midpoint, @requestedWidth/2, remaining, @real[:kind]
        );
        derivativeBound = 3^(@sourceInterval.High().Abs().Ceil()+2)
          * (@sourceInterval.High().Abs()+1)^3 * (1 + 1/@sourceInterval.Low());
        interval = (pointBounds[:interval].Low()-derivativeBound*radius)
          :(pointBounds[:interval].High()+derivativeBound*radius);
        iterations = pointBounds[:iterations];
        calls = @sourceCalls + iterations;
        goalMet = pointBounds[:ready] && interval.Width() <= @requestedWidth;
        NumericsElementaryResult(@real, @request, interval, {=
            calls=calls,
            iterations=iterations,
            maxCalls=@maxCalls,
            maxIterations=@maxIterations,
            sourceCalls=@sourceCalls,
            exhausted=!goalMet
        }, goalMet, {=
            kind=:besselHarmonicSeriesBounds,
            property=:containment,
            algorithm=@real[:kind],
            source=@sourceResult[:evidence]
        });
    } ?_ NumericsUnknownAlgorithm(
        real,
        request,
        (-maxCalls):maxCalls,
        {= calls=sourceCalls, iterations=0, maxCalls=maxCalls, exhausted=1 },
        :besselYPositiveDomainNotCertified
    );
};

NumericsAsinRationalBounds(value, tolerance, maxIterations) -> {;
    exact = value ~!: :Rational;
    exact >= -1 && exact <= 1 ?: _ ?_ .Error("Inverse sine requires a value from -1 through 1");
    exact == 0
      ?: {= interval=0:0, ready=1, goalMet=1, iterations=0 }
      ?_ (exact.Abs() == 1
          ?: {;
              pi = NumericsPiRationalBounds(2*@tolerance, @maxIterations);
              interval = @exact > 0
                ?: pi[:interval] / 2
                ?_ (-pi[:interval].High()/2):(-pi[:interval].Low()/2);
              {=
                  interval=interval,
                  ready=pi[:ready],
                  goalMet=interval.Width() <= @tolerance,
                  iterations=pi[:iterations]
              };
          }
          ?_ {;
              rootBudget = .Max(0, @maxIterations // 3);
              root = NumericsNthRoot(1 - @exact^2, 2);
              rootResult = root.Refine({=
                  absoluteWidth=@tolerance/8,
                  maxWork=rootBudget,
                  maxCalls=rootBudget,
                  maxIterations=rootBudget
              });
              rootInterval = rootResult[:interval];
              quotient = (@exact:@exact) / rootInterval;
              remaining = .Max(0, @maxIterations - NumericsCalls(rootResult));
              endpointBudget = .Max(0, remaining // 2);
              lower = NumericsAtanRationalBounds(quotient.Low(), @tolerance/4, endpointBudget);
              upper = quotient.Low() == quotient.High()
                ?: lower
                ?_ NumericsAtanRationalBounds(quotient.High(), @tolerance/4, remaining - endpointBudget);
              interval = lower[:interval].Low():upper[:interval].High();
              iterations = NumericsCalls(rootResult) + lower[:iterations]
                + (quotient.Low() == quotient.High() ?: 0 ?_ upper[:iterations]);
              {=
                  interval=interval,
                  ready=lower[:ready] && upper[:ready],
                  goalMet=interval.Width() <= @tolerance,
                  iterations=iterations
              };
          });
};

NumericsAcosRationalBounds(value, tolerance, maxIterations) -> {;
    halfBudget = .Max(0, maxIterations // 2);
    pi = NumericsPiRationalBounds(tolerance, halfBudget);
    asin = NumericsAsinRationalBounds(value, tolerance/2, maxIterations - halfBudget);
    interval = pi[:interval] / 2 - asin[:interval];
    {=
        interval=interval,
        ready=pi[:ready] && asin[:ready],
        goalMet=interval.Width() <= tolerance,
        iterations=pi[:iterations] + asin[:iterations]
    };
};

NumericsInversePointBounds(value, tolerance, maxIterations, kind) -> {?
    kind == :arctangent ? NumericsAtanRationalBounds(value, tolerance, maxIterations);
    kind == :arcsine ? NumericsAsinRationalBounds(value, tolerance, maxIterations);
    kind == :arccosine ? NumericsAcosRationalBounds(value, tolerance, maxIterations);
    .Error("Unknown inverse trigonometric algorithm")
};

NumericsInverseTrigRefine(real, rawRequest, operation) -> {;
    capabilities = NumericsAlgorithmCapabilities(real);
    request = .RefinementRequest(rawRequest, operation, capabilities);
    requestedWidth = request[:absoluteWidth];
    maxCalls = request[:work][:maxCalls];
    maxIterations = request[:work][:maxIterations];
    restricted = real[:kind] != :arctangent;
    sourceWidth = restricted
      ?: (requestedWidth < 1 ?: requestedWidth^2 / 16 ?_ requestedWidth / 16)
      ?_ requestedWidth / 4;
    sourceBudget = .Max(0, maxCalls // 3);
    sourceResult = NumericsSourceResult(real[:input], sourceWidth, sourceBudget, request[:trace]);
    sourceCalls = NumericsCalls(sourceResult);
    sourceInterval = sourceResult[:interval];
    domainResolved = restricted
      ?: (sourceInterval.Low() >= -1 && sourceInterval.High() <= 1)
      ?_ 1;
    domainResolved ?: {;
        remaining = .Max(0, .Min(@maxIterations, @maxCalls - @sourceCalls));
        endpointBudget = .Max(0, remaining // 2);
        decreasing = @real[:kind] == :arccosine;
        lowerSource = decreasing ?: @sourceInterval.High() ?_ @sourceInterval.Low();
        upperSource = decreasing ?: @sourceInterval.Low() ?_ @sourceInterval.High();
        lower = NumericsInversePointBounds(
            lowerSource, @requestedWidth/4, endpointBudget, @real[:kind]
        );
        sameEndpoint = lowerSource == upperSource;
        upper = sameEndpoint
          ?: lower
          ?_ NumericsInversePointBounds(
              upperSource, @requestedWidth/4, remaining - endpointBudget, @real[:kind]
          );
        interval = lower[:interval].Low():upper[:interval].High();
        endpointIterations = lower[:iterations] + (sameEndpoint ?: 0 ?_ upper[:iterations]);
        calls = @sourceCalls + endpointIterations;
        goalMet = interval.Width() <= @requestedWidth;
        NumericsElementaryResult(@real, @request, interval, {=
            calls=calls,
            iterations=endpointIterations,
            maxCalls=@maxCalls,
            maxIterations=@maxIterations,
            sourceCalls=@sourceCalls,
            exhausted=!goalMet
        }, goalMet, {=
            kind=:monotoneEndpointBounds,
            property=:containment,
            algorithm=@real[:kind],
            source=@sourceResult[:evidence]
        });
    } ?_ NumericsUnknownAlgorithm(
        real,
        request,
        real[:kind] == :arccosine ?: (0:4) ?_ ((-2):2),
        {= calls=sourceCalls, iterations=0, maxCalls=maxCalls, exhausted=sourceCalls>=maxCalls },
        :inverseTrigDomainNotCertified
    );
};

NumericsPiAlgorithm() -> {;
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=:pi,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=4, algorithm=:machinPi }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsPiRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsPiRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsEulerGammaAlgorithm() -> {;
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=:eulerGamma,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=5, algorithm=:harmonicEulerGamma }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsEulerGammaRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsEulerGammaRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsTrigAlgorithm(value, kind) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=kind,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=4, algorithm=kind, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsTrigRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsTrigRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsInverseTrigAlgorithm(value, kind) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=kind,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=4, algorithm=kind, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsInverseTrigRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsInverseTrigRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsSpecialSeriesAlgorithm(value, kind) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=kind,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=5, algorithm=kind, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsSpecialSeriesRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsSpecialSeriesRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsLogGammaAlgorithm(value) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=:logGamma,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=5, algorithm=:stirlingLogGamma, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsLogGammaRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsLogGammaRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsGammaAlgorithm(value) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=:gamma,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=5, algorithm=:stirlingGamma, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsGammaRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsGammaRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsLambertWAlgorithm(value, branch) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=:lambertW,
        branch=branch,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=5, algorithm=:lambertW, branch=branch, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsLambertWRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsLambertWRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsZetaAlgorithm(value) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=:zeta,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=5, algorithm=:eulerMaclaurinZeta, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsZetaRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsZetaRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsBesselYAlgorithm(value, kind) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=kind,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=5, algorithm=kind, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsBesselYRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsBesselYRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsNaturalAlgorithm(value, kind) -> {;
    source = .oracle.From(value);
    real = {=
        valueKind=:numericsAlgorithmReal,
        schema="rix.numerics.algorithm-real@1",
        kind=kind,
        input=source,
        evidenceLevel=:proof,
        provenance={= plugin=:numerics, version=3, algorithm=kind, source=value }
    };
    real._proto = {=
        Enclose=(self, request ?= {= })->NumericsElementaryRefine(self, request, :enclose),
        Refine=(self, request ?= {= })->NumericsElementaryRefine(self, request, :refine),
        NumericsCapabilities=(self)->NumericsAlgorithmCapabilities(self)
    };
    .ImmutableValue(real);
};

NumericsPow(value, exponent) -> {;
    rational = exponent ~!: :Rational;
    numerator = rational.Numerator();
    denominator = rational.Denominator();
    denominator == 1
      ?: value^numerator
      ?_ {;
          root = NumericsNthRoot(@value, @denominator);
          @numerator == 1 ?: root ?_ root^@numerator;
      };
};

NumericsNaturalExp(value) -> NumericsNaturalAlgorithm(value, :naturalExp);

NumericsNaturalLog(value) -> NumericsNaturalAlgorithm(value, :naturalLog);

NumericsExp(value, base ?= _) -> {;
    exactExponent = value ~: :Rational;
    base == _
      ?: NumericsNaturalExp(value)
      ?_ (exactExponent != _
          ?: NumericsPow(base, exactExponent)
          ?_ NumericsNaturalExp(value * NumericsNaturalLog(base)));
};

NumericsLog(value, base ?= _) ->
    base == _
      ?: NumericsNaturalLog(value)
      ?_ NumericsNaturalLog(value) / NumericsNaturalLog(base);

NumericsSin(value) -> NumericsTrigAlgorithm(value, :sine);

NumericsCos(value) -> NumericsTrigAlgorithm(value, :cosine);

NumericsTan(value) -> NumericsSin(value) / NumericsCos(value);

NumericsSec(value) -> 1 / NumericsCos(value);

NumericsCsc(value) -> 1 / NumericsSin(value);

NumericsCot(value) -> NumericsCos(value) / NumericsSin(value);

NumericsAsin(value) -> NumericsInverseTrigAlgorithm(value, :arcsine);

NumericsAcos(value) -> NumericsInverseTrigAlgorithm(value, :arccosine);

NumericsAtan(value) -> NumericsInverseTrigAlgorithm(value, :arctangent);

NumericsSinh(value) -> (NumericsNaturalExp(value) - NumericsNaturalExp(-value)) / 2;

NumericsCosh(value) -> (NumericsNaturalExp(value) + NumericsNaturalExp(-value)) / 2;

NumericsTanh(value) -> {;
    doubled = NumericsNaturalExp(2*value);
    (doubled - 1) / (doubled + 1);
};

NumericsSech(value) -> 1 / NumericsCosh(value);

NumericsCsch(value) -> 1 / NumericsSinh(value);

NumericsCoth(value) -> 1 / NumericsTanh(value);

NumericsAsinh(value) -> NumericsNaturalLog(
    value + NumericsNthRoot(value^2 + 1, 2)
);

NumericsAcosh(value) -> NumericsNaturalLog(
    value + NumericsNthRoot(value^2 - 1, 2)
);

NumericsAtanh(value) -> NumericsNaturalLog((1 + value) / (1 - value)) / 2;

NumericsSinc(value) -> NumericsTrigAlgorithm(value, :sinc);

NumericsRadians(value) -> value * NumericsPiAlgorithm() / 180;

NumericsDegrees(value) -> value * 180 / NumericsPiAlgorithm();

NumericsErf(value) -> 2 * NumericsSpecialSeriesAlgorithm(value, :erfCore)
  / NumericsNthRoot(NumericsPiAlgorithm(), 2);

NumericsBesselJ0(value) -> NumericsSpecialSeriesAlgorithm(value, :besselJ0);

NumericsBesselJ1(value) -> NumericsSpecialSeriesAlgorithm(value, :besselJ1);

NumericsBesselY0(value) -> NumericsBesselYAlgorithm(value, :besselY0);

NumericsBesselY1(value) -> NumericsBesselYAlgorithm(value, :besselY1);

NumericsLogGamma(value) -> NumericsLogGammaAlgorithm(value);

NumericsGamma(value) -> NumericsGammaAlgorithm(value);

NumericsLambertW(value, branch ?= 0) -> {;
    exactBranch = branch ~!: :Integer;
    (exactBranch == 0 || exactBranch == -1)
      ?: NumericsLambertWAlgorithm(value, exactBranch)
      ?_ .Error("LambertW branch must be 0 or -1");
};

NumericsZeta(value) -> NumericsZetaAlgorithm(value);

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
    Cbrt = (self, value, options ?= {= }) -> NumericsNthRoot(value, 3, options),
    Pow = (self, value, exponent) -> NumericsPow(value, exponent),
    Exp = (self, value, base ?= _) -> NumericsExp(value, base),
    Expm1 = (self, value) -> NumericsNaturalExp(value) - 1,
    Log = (self, value, base ?= _) -> NumericsLog(value, base),
    Log1p = (self, value) -> NumericsNaturalLog(1 + value),
    Ln = (self, value) -> NumericsLog(value),
    Log2 = (self, value) -> NumericsLog(value, 2),
    Log10 = (self, value) -> NumericsLog(value, 10),
    Pi = (self) -> NumericsPiAlgorithm(),
    EulerGamma = (self) -> NumericsEulerGammaAlgorithm(),
    Sin = (self, value) -> NumericsSin(value),
    Cos = (self, value) -> NumericsCos(value),
    Tan = (self, value) -> NumericsTan(value),
    Sec = (self, value) -> NumericsSec(value),
    Csc = (self, value) -> NumericsCsc(value),
    Cot = (self, value) -> NumericsCot(value),
    Sinc = (self, value) -> NumericsSinc(value),
    Asin = (self, value) -> NumericsAsin(value),
    Acos = (self, value) -> NumericsAcos(value),
    Atan = (self, value) -> NumericsAtan(value),
    Arcsin = (self, value) -> NumericsAsin(value),
    Arccos = (self, value) -> NumericsAcos(value),
    Arctan = (self, value) -> NumericsAtan(value),
    Sinh = (self, value) -> NumericsSinh(value),
    Cosh = (self, value) -> NumericsCosh(value),
    Tanh = (self, value) -> NumericsTanh(value),
    Sech = (self, value) -> NumericsSech(value),
    Csch = (self, value) -> NumericsCsch(value),
    Coth = (self, value) -> NumericsCoth(value),
    Asinh = (self, value) -> NumericsAsinh(value),
    Acosh = (self, value) -> NumericsAcosh(value),
    Atanh = (self, value) -> NumericsAtanh(value),
    Arsinh = (self, value) -> NumericsAsinh(value),
    Arcosh = (self, value) -> NumericsAcosh(value),
    Artanh = (self, value) -> NumericsAtanh(value),
    Radians = (self, value) -> NumericsRadians(value),
    Degrees = (self, value) -> NumericsDegrees(value),
    Gamma = (self, value) -> NumericsGamma(value),
    LogGamma = (self, value) -> NumericsLogGamma(value),
    Erf = (self, value) -> NumericsErf(value),
    Erfc = (self, value) -> 1 - NumericsErf(value),
    LambertW = (self, value, branch ?= 0) -> NumericsLambertW(value, branch),
    J0 = (self, value) -> NumericsBesselJ0(value),
    J1 = (self, value) -> NumericsBesselJ1(value),
    BesselJ0 = (self, value) -> NumericsBesselJ0(value),
    BesselJ1 = (self, value) -> NumericsBesselJ1(value),
    Y0 = (self, value) -> NumericsBesselY0(value),
    Y1 = (self, value) -> NumericsBesselY1(value),
    BesselY0 = (self, value) -> NumericsBesselY0(value),
    BesselY1 = (self, value) -> NumericsBesselY1(value),
    Zeta = (self, value) -> NumericsZeta(value),
    Kantorovich = (self, function, derivative, options ?= {= }) -> NumericsKantorovich(function, derivative, options),
    Approximation = (self, result) -> result.Has("approximation") ?: result[:approximation] ?_ _,
    Capabilities = (self, value) -> value.NumericsCapabilities(),
    CheckResult = (self, result, options ?= {= }, capabilities ?= _) ->
        CheckEnclosure(result, NumericsRequest(options), capabilities)
};

.Host.RegisterValue("numerics", numericsNamespace, "Backend-neutral bounded enclosure and refinement orchestration", ["Numerics"]);
`, sourcePath: "bundled:numerics", kind: "rix" });
  catalog.addMetadata({ id: "optimize", description: "Pure-RiX exact linear-program models and deterministic Phase 1 simplex optimization.", kind: "rix", mount: "optimize", exports: ["LinearProgram", "Solve", "Evaluate", "Maximize", "Minimize"], groups: ["Optimization", "Exact"], permissions: [], requires: ["rix.linear-algebra@1"], provides: ["rix.optimization@1", "rix.linear-program@1"], schemas: ["rix.optimize.linear-program@1", "rix.optimize.result@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:optimize" }, { source: `/**
id: optimize
description: Pure-RiX exact linear-program models and deterministic Phase 1 simplex optimization.
kind: rix
mount: optimize
exports: [LinearProgram, Solve, Evaluate, Maximize, Minimize]
groups: [Optimization, Exact]
permissions: []
requires: [rix.linear-algebra@1]
provides: [rix.optimization@1, rix.linear-program@1]
schemas: [rix.optimize.linear-program@1, rix.optimize.result@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

OptimizeOption(options, key, fallback) -> options.Has(key) ?: options[key] ?_ fallback;

OptimizeExact(value, label) -> {;
    exact = value ~!: :Rational;
    exact == _ ?: .Error(@"@{label} must contain only exact Integers or Rationals") ?_ exact;
};

OptimizeVector(value, label ?= "Vector") -> {;
    isArray = value ? :Array;
    isShapedVector = value ? :Shaped ?: value.Rank() == 1 ?_ _;
    (isArray || isShapedVector) ?: _ ?_ .Error(@"@{label} must be an Array or rank-1 Shaped value");
    length = isArray ?: value.Len() ?_ value.Size();
    result := [];
    {@ index = 1; index <= @length; {;
        @result ~= @result.Push(OptimizeExact(@value[index], @label));
    }; index += 1 };
    result;
};

OptimizeMatrix(value, label ?= "Matrix") -> {;
    (value ? :Shaped) ?: _ ?_ .Error(@"@{label} must be a rank-2 Shaped or Matrix value");
    value.Rank() == 2 ?: _ ?_ .Error(@"@{label} must have rank 2");
    shape = value.Shape();
    rowCount = shape[1];
    columnCount = shape[2];
    rowCount >= 1 && columnCount >= 1 ?: _ ?_ .Error(@"@{label} cannot be empty");
    rows := [];
    {@ row = 1; row <= @rowCount; {;
        entries := [];
        {@ column = 1; column <= @columnCount; {;
            @entries ~= @entries.Push(OptimizeExact(@value[@row,column], @label));
        }; column += 1 };
        @rows ~= @rows.Push(entries);
    }; row += 1 };
    rows;
};

OptimizeVectorTensor(values) -> values ~!: :Shaped;

OptimizeMatrixTensor(rows) -> {;
    rowCount = rows.Len();
    columnCount = rows[1].Len();
    flat := [];
    {@ row = 1; row <= @rowCount; {;
        {@ column = 1; column <= @columnCount; {;
            @flat ~= @flat.Push(@rows[@row][column]);
        }; column += 1 };
    }; row += 1 };
    (flat ~!: :Shaped).Reshape({: rowCount, columnCount });
};

OptimizeZeros(count) -> {;
    result := [];
    {@ index = 1; index <= @count; {; @result ~= @result.Push(0); }; index += 1 };
    result;
};

OptimizeIdentityRow(length, oneAt) -> {;
    result := [];
    {@ index = 1; index <= @length; {;
        @result ~= @result.Push(index == @oneAt ?: 1 ?_ 0);
    }; index += 1 };
    result;
};

OptimizeConcat(left, right) -> {;
    result := left.Map((value) -> value);
    {@ index = 1; index <= @right.Len(); {; @result ~= @result.Push(@right[index]); }; index += 1 };
    result;
};

OptimizeDot(left, right) -> {;
    sum := 0;
    {@ index = 1; index <= @left.Len(); {; @sum += @left[index] * @right[index]; }; index += 1 };
    sum;
};

OptimizeSense(value) -> {;
    isMinimum = value == :min || value == :minimize || value == "min" || value == "minimize";
    isMaximum = value == :max || value == :maximize || value == "max" || value == "maximize";
    (isMinimum || isMaximum) ?: _ ?_ .Error("Linear-program sense must be :max or :min");
    isMinimum ?: :min ?_ :max;
};

OptimizeProgram(objective, matrix, bounds, options ?= {= }) -> {;
    exactObjective = OptimizeVector(objective, "Linear-program objective");
    exactMatrix = OptimizeMatrix(matrix, "Linear-program constraint matrix");
    exactBounds = OptimizeVector(bounds, "Linear-program bounds");
    exactMatrix[1].Len() == exactObjective.Len()
      ?: _
      ?_ .Error("Linear-program objective length must equal the matrix column count");
    exactMatrix.Len() == exactBounds.Len()
      ?: _
      ?_ .Error("Linear-program bounds length must equal the matrix row count");
    relation = OptimizeOption(options, "relation", "<=");
    relation == "<=" ?: _ ?_ .Error("Phase 1 linear programs require A*x <= b");
    program = {=
        valueKind = :linearProgram,
        schema = "rix.optimize.linear-program@1",
        objective = OptimizeVectorTensor(exactObjective),
        A = OptimizeMatrixTensor(exactMatrix),
        b = OptimizeVectorTensor(exactBounds),
        sense = OptimizeSense(OptimizeOption(options, "sense", :max)),
        variableCount = exactObjective.Len(),
        constraintCount = exactMatrix.Len(),
        relation = "<=",
        nonnegative = 1,
        name = OptimizeOption(options, "name", _),
        exact = 1
    };
    program.__type = "LinearProgram";
    program.objective = program[:objective];
    program.A = program[:A];
    program.b = program[:b];
    program.sense = program[:sense];
    program.variableCount = program[:variableCount];
    program.constraintCount = program[:constraintCount];
    program.relation = program[:relation];
    program.nonnegative = program[:nonnegative];
    program.name = program[:name];
    program.exact = program[:exact];
    program._proto = {=
        Solve = (self, solveOptions ?= {= }) -> OptimizeSolve(self, solveOptions),
        Evaluate = (self, point) -> OptimizeEvaluate(self, point),
        Record = (self) -> self
    };
    .ImmutableValue(program);
};

OptimizeRequireProgram(value) -> {;
    valid = value ? :Map ?: value[:schema] == "rix.optimize.linear-program@1" ?_ _;
    valid ?: value ?_ .Error("Expected an optimize LinearProgram");
};

OptimizeResult(program, fields) -> {;
    result = {=
        valueKind = :optimizationResult,
        schema = "rix.optimize.result@1",
        program = program,
        method = :exactPrimalSimplex,
        exact = 1
    }.Merge(fields);
    result.__type = "OptimizationResult";
    result.schema = result[:schema];
    result.program = result[:program];
    result.method = result[:method];
    result.exact = result[:exact];
    result.status = result[:status];
    result.solution = result[:solution];
    result.objectiveValue = result[:objectiveValue];
    result.iterations = result[:iterations];
    result.enteringVariable = result[:enteringVariable];
    result.tableau = result[:tableau];
    result.diagnostics = result[:diagnostics];
    result.slacks = result[:slacks];
    result.feasible = result[:feasible];
    result.basis = result[:basis];
    result._proto = {= Record=(self)->self };
    .ImmutableValue(result);
};

OptimizePivot(tableau, pivotRow, pivotColumn) -> {;
    pivotValue = tableau[pivotRow][pivotColumn];
    normalized = tableau[pivotRow].Map((value) -> value / pivotValue);
    result := tableau.Set(pivotRow, normalized);
    {@ row = 1; row <= @result.Len(); {;
        row != @pivotRow && @result[row][@pivotColumn] != 0
          ?: {;
              factor = @result[@row][@pivotColumn];
              replacement = @result[@row].Map((value, column) -> value - @factor * @normalized[column]);
              @result ~= @result.Set(@row, replacement);
          }
          ?_ _;
    }; row += 1 };
    result;
};

OptimizeInitialTableau(program) -> {;
    matrix = OptimizeMatrix(program[:A]);
    bounds = OptimizeVector(program[:b]);
    objective = OptimizeVector(program[:objective]);
    constraintCount = matrix.Len();
    rows := [];
    {@ row = 1; row <= @constraintCount; {;
        withSlack = OptimizeConcat(@matrix[row], OptimizeIdentityRow(@constraintCount, row));
        @rows ~= @rows.Push(OptimizeConcat(withSlack, [@bounds[row]]));
    }; row += 1 };
    effective = program[:sense] == :min ?: objective.Map((value) -> -value) ?_ objective;
    rows ~= rows.Push(OptimizeConcat(effective.Map((value) -> -value), OptimizeConcat(OptimizeZeros(constraintCount), [0])));
    rows;
};

OptimizeFirstNegative(row, lastColumn) -> {;
    found := 0;
    {@ column = 1; column <= @lastColumn && @found == 0; {;
        @row[column] < 0 ?: {; @found ~= @column; } ?_ _;
    }; column += 1 };
    found;
};

OptimizeLeavingRow(tableau, basis, entering, constraintCount, rhsColumn) -> {;
    leaving := 0;
    bestRatio := _;
    {@ row = 1; row <= @constraintCount; {;
        coefficient = @tableau[row][@entering];
        coefficient > 0
          ?: {;
              ratio = @tableau[@row][@rhsColumn] / @coefficient;
              better = @bestRatio == _ || ratio < @bestRatio || (ratio == @bestRatio && @basis[@row] < @basis[@leaving]);
              better ?: {; @bestRatio ~= @ratio; @leaving ~= @row; } ?_ _;
          }
          ?_ _;
    }; row += 1 };
    leaving;
};

OptimizeSolve(value, options ?= {= }) -> {;
    program = OptimizeRequireProgram(value);
    maxIterations = OptimizeOption(options, "maxiterations", 10000) ~!: :Integer;
    maxIterations >= 1 ?: _ ?_ .Error("Simplex maxIterations must be positive");
    objective = OptimizeVector(program[:objective]);
    matrix = OptimizeMatrix(program[:A]);
    bounds = OptimizeVector(program[:b]);
    bounds.All((bound) -> bound >= 0)
      ?: _
      ?_ .Error("Phase 1 simplex requires nonnegative b so x=0 is an initial feasible point");
    variableCount = objective.Len();
    constraintCount = matrix.Len();
    totalColumns = variableCount + constraintCount;
    rhsColumn = totalColumns + 1;
    tableau := OptimizeInitialTableau(program);
    basis := [];
    {@ index = 1; index <= @constraintCount; {;
        @basis ~= @basis.Push(@variableCount + index);
    }; index += 1 };
    iterations := 0;
    status := :running;
    entering := 0;
    {@ step = 1; @status == :running && @iterations < @maxIterations; {;
        objectiveRow = @tableau[@constraintCount + 1];
        @entering ~= OptimizeFirstNegative(objectiveRow, @totalColumns);
        @entering == 0
          ?: {; @status ~= :optimal; }
          ?_ {;
              leaving = OptimizeLeavingRow(@tableau, @basis, @entering, @constraintCount, @rhsColumn);
              leaving == 0
                ?: {; @status ~= :unbounded; }
                ?_ {;
                    @tableau ~= OptimizePivot(@tableau, @leaving, @entering);
                    @basis ~= @basis.Set(@leaving, @entering);
                    @iterations += 1;
                };
          };
    }; step += 1 };
    status == :running ?: {; @status ~= :iterationLimit; } ?_ _;

    status == :unbounded
      ?: OptimizeResult(program, {=
          status="unbounded",
          solution=_,
          objectiveValue=_,
          iterations=iterations,
          enteringVariable=entering,
          tableau=OptimizeMatrixTensor(tableau),
          diagnostics=["No leaving row exists for the selected improving direction"]
      })
      ?_ status == :iterationLimit
           ?: OptimizeResult(program, {=
               status="iterationLimit",
               solution=_,
               objectiveValue=_,
               iterations=iterations,
               tableau=OptimizeMatrixTensor(tableau),
               diagnostics=["Simplex iteration limit reached"]
           })
           ?_ {;
               solution := OptimizeZeros(@variableCount);
               {@ row = 1; row <= @constraintCount; {;
                   column = @basis[row];
                   column <= @variableCount
                     ?: {; @solution ~= @solution.Set(@column, @tableau[@row][@rhsColumn]); }
                     ?_ _;
               }; row += 1 };
               slacks := [];
               {@ row = 1; row <= @constraintCount; {;
                   @slacks ~= @slacks.Push(@bounds[row] - OptimizeDot(@matrix[row], @solution));
               }; row += 1 };
               OptimizeResult(@program, {=
                   status="optimal",
                   solution=OptimizeVectorTensor(solution),
                   objectiveValue=OptimizeDot(@objective, solution),
                   slacks=OptimizeVectorTensor(slacks),
                   feasible=slacks.All((slack)->slack >= 0),
                   iterations=@iterations,
                   basis=@basis,
                   tableau=OptimizeMatrixTensor(@tableau),
                   diagnostics=[]
               });
           };
};

OptimizeEvaluate(value, point) -> {;
    program = OptimizeRequireProgram(value);
    exactPoint = OptimizeVector(point, "Linear-program point");
    exactPoint.Len() == program[:variableCount]
      ?: _
      ?_ .Error("Point dimension does not match the LinearProgram");
    matrix = OptimizeMatrix(program[:A]);
    bounds = OptimizeVector(program[:b]);
    lhs = matrix.Map((row) -> OptimizeDot(row, exactPoint));
    slacks = bounds.Map((bound, row) -> bound - lhs[row]);
    result = {=
        valueKind=:optimizationEvaluation,
        objectiveValue=OptimizeDot(OptimizeVector(program[:objective]), exactPoint),
        feasible=exactPoint.All((entry)->entry >= 0) && slacks.All((slack)->slack >= 0),
        lhs=OptimizeVectorTensor(lhs),
        slacks=OptimizeVectorTensor(slacks)
    };
    result.__type = "OptimizationEvaluation";
    result.objectiveValue = result[:objectiveValue];
    result.feasible = result[:feasible];
    result.lhs = result[:lhs];
    result.slacks = result[:slacks];
    .ImmutableValue(result);
};

OptimizeConvenience(objective, matrix, bounds, options, sense) -> {;
    configured = options.Merge({= sense=sense });
    OptimizeSolve(OptimizeProgram(objective, matrix, bounds, configured), options);
};

optimizeNamespace = {= };
optimizeNamespace._proto = {=
    LinearProgram=(self, objective, matrix, bounds, options ?= {= })->OptimizeProgram(objective, matrix, bounds, options),
    Solve=(self, program, options ?= {= })->OptimizeSolve(program, options),
    Evaluate=(self, program, point)->OptimizeEvaluate(program, point),
    Maximize=(self, objective, matrix, bounds, options ?= {= })->OptimizeConvenience(objective, matrix, bounds, options, :max),
    Minimize=(self, objective, matrix, bounds, options ?= {= })->OptimizeConvenience(objective, matrix, bounds, options, :min)
};

.Host.RegisterValue("optimize", optimizeNamespace, "Pure-RiX exact linear programs and deterministic simplex optimization", ["Optimization", "Exact"]);
`, sourcePath: "bundled:optimize", kind: "rix" });
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
  catalog.registerInstaller("pdf", install14);
  catalog.addMetadata({ id: "plot", description: "Pure-RiX exact polynomial sampling that lowers to portable core Graphics scenes.", kind: "rix", mount: "plot", exports: ["Polynomial"], groups: ["Plot", "Graphics", "Exact"], permissions: [], provides: ["rix.plot@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:plot" }, { source: `/**
id: plot
description: Pure-RiX exact polynomial sampling that lowers to portable core Graphics scenes.
kind: rix
mount: plot
exports: [Polynomial]
groups: [Plot, Graphics, Exact]
permissions: []
provides: [rix.plot@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

PlotOption(options, key, fallback ?= _) -> options.Has(key) ?: options[key] ?_ fallback;

PlotExact(value, label) -> {;
    exact = value ~!: :Rational;
    exact == _ ?: .Error(@"@{label} must be an exact Integer or Rational") ?_ exact;
};

PlotExactArray(values, label) -> {;
    values ? :Array ?: _ ?_ .Error(@"@{label} must be an Array");
    values.Map((value) -> PlotExact(value, @label));
};

PlotPositiveSamples(value) -> {;
    samples = value ~!: :Integer;
    (samples >= 2 && samples <= 10000)
      ?: samples
      ?_ .Error("Polynomial plot samples must be between 2 and 10000");
};

PlotStyle(settings, fallbackStroke, fallbackWidth) -> {;
    supplied = PlotOption(settings, "style", {= });
    supplied ? :Map ?: _ ?_ .Error("Polynomial plot style must be a map");
    style = {= stroke=fallbackStroke, width=fallbackWidth, fill="none" }.Merge(supplied);
    style = settings.Has("stroke") ?: style.Merge({= stroke=settings[:stroke] }) ?_ style;
    style = settings.Has("width") ?: style.Merge({= width=settings[:width] }) ?_ style;
    style;
};

PlotEvaluate(coefficients, x) -> coefficients.Reduce((total, coefficient) -> total * @x + coefficient, 0);

PlotReadSeries(coefficientsValue, settings, index, samples, xMin, xMax, primary) -> {;
    coefficients = PlotExactArray(coefficientsValue, @"Polynomial plot series @{index} coefficients");
    coefficients.Len() >= 2 ?: _ ?_ .Error(@"Polynomial plot series @{index} requires at least two coefficients");
    data := [];
    {@ sampleIndex = 1; sampleIndex <= @samples; {;
        x = @xMin + (@xMax - @xMin) * (sampleIndex - 1) / (@samples - 1);
        @data ~= @data.Push([x, PlotEvaluate(@coefficients, x)]);
    }; sampleIndex += 1 };
    {=
        data=data,
        style=PlotStyle(settings, primary ?: "#2563eb" ?_ "#b45309", primary ?: 3 ?_ 2),
        label=PlotOption(settings, "label")
    };
};

PlotReadMark(entry, index) -> {;
    entry ? :Map ?: _ ?_ .Error(@"Polynomial plot mark @{index} must be a map");
    point = PlotOption(entry, "point");
    point ? :Array ?: _ ?_ .Error(@"Polynomial plot mark @{index} point must be an Array");
    point.Len() == 2 ?: _ ?_ .Error(@"Polynomial plot mark @{index} point must contain x and y coordinates");
    {=
        point=[PlotExact(point[1], @"Polynomial plot mark @{index} x"), PlotExact(point[2], @"Polynomial plot mark @{index} y")],
        label=PlotOption(entry, "label"),
        style=PlotOption(entry, "style", {= fill="#be123c", stroke="#fff", width=2 }),
        labelStyle=PlotOption(entry, "labelstyle", {= size=13 }),
        radius=PlotExact(PlotOption(entry, "radius", 5), @"Polynomial plot mark @{index} radius")
    };
};

PlotReadTick(entry, index) -> {;
    entry ? :Map ?: _ ?_ .Error(@"Polynomial plot tick @{index} must be a map");
    {=
        x=PlotExact(PlotOption(entry, "x"), @"Polynomial plot tick @{index} x"),
        label=PlotOption(entry, "label"),
        style=PlotOption(entry, "style", {= stroke="#334155", width=2 }),
        labelStyle=PlotOption(entry, "labelstyle", {= size=13, anchor="middle" })
    };
};

PlotFixedYBounds(value) -> {;
    value ? :Array ?: _ ?_ .Error("Polynomial plot yDomain must be an Array");
    value.Len() == 2 ?: _ ?_ .Error("Polynomial plot yDomain must have a lower and upper bound");
    lower = PlotExact(value[1], "Polynomial plot yDomain lower bound");
    upper = PlotExact(value[2], "Polynomial plot yDomain upper bound");
    lower < upper ?: [lower, upper] ?_ .Error("Polynomial plot yDomain must increase");
};

PlotAutomaticYBounds(series, marks) -> {;
    values := [0];
    {@ seriesIndex = 1; seriesIndex <= @series.Len(); {;
        points = @series[seriesIndex][:data];
        {@ pointIndex = 1; pointIndex <= @points.Len(); {;
            @values ~= @values.Push(@points[pointIndex][2]);
        }; pointIndex += 1 };
    }; seriesIndex += 1 };
    {@ markIndex = 1; markIndex <= @marks.Len(); {;
        @values ~= @values.Push(@marks[markIndex][:point][2]);
    }; markIndex += 1 };
    lower := values[1];
    upper := values[1];
    {@ valueIndex = 2; valueIndex <= @values.Len(); {;
        @lower ~= @values[valueIndex] < @lower ?: @values[valueIndex] ?_ @lower;
        @upper ~= @values[valueIndex] > @upper ?: @values[valueIndex] ?_ @upper;
    }; valueIndex += 1 };
    equal = lower == upper;
    lower = equal ?: lower - 1 ?_ lower;
    upper = equal ?: upper + 1 ?_ upper;
    padding = (upper - lower) * 2/25;
    [lower - padding, upper + padding];
};

PlotPolynomial(coefficientsValue, domain, options ?= {= }) -> {;
    coefficients = PlotExactArray(coefficientsValue, "Polynomial coefficients");
    coefficients.Len() >= 2 ?: _ ?_ .Error("Plot.Polynomial requires at least two coefficients");
    domain ? :Array ?: _ ?_ .Error("Polynomial plot domain must be an Array");
    domain.Len() == 2 ?: _ ?_ .Error("Polynomial plot domain must have a lower and upper bound");
    xMin = PlotExact(domain[1], "Polynomial plot lower bound");
    xMax = PlotExact(domain[2], "Polynomial plot upper bound");
    xMin < xMax ?: _ ?_ .Error("Polynomial plot domain must increase");
    options ? :Map ?: _ ?_ .Error("Polynomial plot options must be a map");

    size = PlotOption(options, "size", [640, 360]);
    size ? :Array ?: _ ?_ .Error("Polynomial plot size must be an Array");
    size.Len() == 2 ?: _ ?_ .Error("Polynomial plot size must contain positive width and height");
    width = PlotExact(size[1], "Polynomial plot size 1");
    height = PlotExact(size[2], "Polynomial plot size 2");
    (width > 0 && height > 0) ?: _ ?_ .Error("Polynomial plot size must contain positive width and height");
    samples = PlotPositiveSamples(PlotOption(options, "samples", 161));
    margin = PlotExact(PlotOption(options, "margin", 36), "Polynomial plot margin");
    (margin >= 0 && margin * 2 < .Min(width, height)) ?: _ ?_ .Error("Polynomial plot margin is too large for its size");

    series := [PlotReadSeries(coefficients, options, 1, samples, xMin, xMax, 1)];
    extraSeries = PlotOption(options, "series", []);
    extraSeries ? :Array ?: _ ?_ .Error("Polynomial plot series must be an Array");
    {@ index = 1; index <= @extraSeries.Len(); {;
        entry = @extraSeries[index];
        entry ? :Map ?: _ ?_ .Error(@"Polynomial plot series @{index + 1} must be a map");
        entry.Has("coefficients") ?: _ ?_ .Error(@"Polynomial plot series @{index + 1} requires coefficients");
        @series ~= @series.Push(PlotReadSeries(entry[:coefficients], entry, index + 1, @samples, @xMin, @xMax, 0));
    }; index += 1 };

    marks := [];
    markEntries = PlotOption(options, "marks", []);
    markEntries ? :Array ?: _ ?_ .Error("Polynomial plot marks must be an Array");
    {@ index = 1; index <= @markEntries.Len(); {;
        @marks ~= @marks.Push(PlotReadMark(@markEntries[index], index));
    }; index += 1 };

    ticks := [];
    tickEntries = PlotOption(options, "ticks", []);
    tickEntries ? :Array ?: _ ?_ .Error("Polynomial plot ticks must be an Array");
    {@ index = 1; index <= @tickEntries.Len(); {;
        @ticks ~= @ticks.Push(PlotReadTick(@tickEntries[index], index));
    }; index += 1 };

    yBounds = options.Has("ydomain") ?: PlotFixedYBounds(options[:ydomain]) ?_ PlotAutomaticYBounds(series, marks);
    yMin = yBounds[1];
    yMax = yBounds[2];
    toPoint = (point) -> [
        @margin + (point[1] - @xMin) / (@xMax - @xMin) * (@width - @margin * 2),
        @height - @margin - (point[2] - @yMin) / (@yMax - @yMin) * (@height - @margin * 2)
    ];
    axisStyle = {= stroke="#64748b", width=1, dash="3 3", fill="none" };
    children := [];
    (yMin <= 0 && yMax >= 0)
      ?: {; @children ~= @children.Push(.Graphics.Path([[@xMin, 0] |> @toPoint, [@xMax, 0] |> @toPoint], @axisStyle)); }
      ?_ _;
    (xMin <= 0 && xMax >= 0)
      ?: {; @children ~= @children.Push(.Graphics.Path([[0, @yMin] |> @toPoint, [0, @yMax] |> @toPoint], @axisStyle)); }
      ?_ _;

    {@ index = 1; index <= @series.Len(); {;
        @children ~= @children.Push(.Graphics.Path(@series[index][:data].Map(@toPoint), @series[index][:style]));
    }; index += 1 };
    {@ index = 1; index <= @ticks.Len(); {;
        tick = @ticks[index];
        position = [tick[:x], 0] |> @toPoint;
        @children ~= @children.Push(.Graphics.Path([[position[1], position[2] - 5], [position[1], position[2] + 5]], tick[:style]));
        tick[:label] != _
          ?: {; @children ~= @children.Push(.Graphics.Text([@position[1], @position[2] + 20], @tick[:label], @tick[:labelstyle])); }
          ?_ _;
    }; index += 1 };
    {@ index = 1; index <= @marks.Len(); {;
        mark = @marks[index];
        position = mark[:point] |> @toPoint;
        @children ~= @children.Push(.Graphics.Circle(position, mark[:radius], mark[:style]));
        mark[:label] != _
          ?: {; @children ~= @children.Push(.Graphics.Text([@position[1] + 9, @position[2] - 9], @mark[:label], @mark[:labelstyle])); }
          ?_ _;
    }; index += 1 };

    labeled := series.Filter((entry) -> entry[:label] != _);
    {@ index = 1; index <= @labeled.Len(); {;
        entry = @labeled[index];
        y = @margin + 16 + (index - 1) * 18;
        @children ~= @children.Push(.Graphics.Path([[@margin + 2, y - 5], [@margin + 18, y - 5]], entry[:style]));
        @children ~= @children.Push(.Graphics.Text([@margin + 24, y], entry[:label], {= size=13 }));
    }; index += 1 };

    .Graphics.Graphic([width, height], children, {= kind="polynomial_plot", schema="rix.plot@1" });
};

plotNamespace = {= };
plotNamespace._proto = {=
    Polynomial=(self, coefficients, domain, options ?= {= })->PlotPolynomial(coefficients, domain, options)
};
.Host.RegisterValue("plot", plotNamespace, "Pure exact polynomial sampling into portable Graphics", ["Plot", "Graphics", "Exact"]);
`, sourcePath: "bundled:plot", kind: "rix" });
  catalog.addMetadata({ id: "png", description: "PNG snapshot renderer for core Graphics through a host rasterizer.", kind: "host", mount: "png", exports: ["Render"], groups: ["Renderers"], permissions: ["process"], provides: ["rix.renderer.png@1"], targets: ["png", "image/png"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:png" }, { sourcePath: "bundled:png", kind: "host" });
  catalog.registerInstaller("png", install13);
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
  catalog.registerInstaller("quarto", install11);
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
  catalog.addMetadata({ id: "scene3d", description: "Pure-RiX exact retained 3D scenes, explicit realization and projection, and portable Graphics snapshots.", kind: "rix", mount: "scene3d", exports: ["Scene", "Group", "Transform", "Mesh", "Polyline", "PointCloud", "ParametricCurve", "Axes", "Annotation", "Material", "AmbientLight", "DirectionalLight", "PointLight", "PerspectiveCamera", "OrthographicCamera", "OrbitCamera", "Realize", "Project", "Snapshot"], groups: ["Scene3D", "Graphics", "Exact"], permissions: [], requires: ["rix.numerics@1"], provides: ["rix.scene3d@1", "rix.scene3d.realized@1", "rix.scene3d.projected@1", "rix.scene3d.orbit@1"], schemas: ["rix.scene3d@1", "rix.scene3d.realized@1", "rix.scene3d.projected@1", "rix.scene3d.orbit@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:scene3d" }, { source: `/**
id: scene3d
description: Pure-RiX exact retained 3D scenes, explicit realization and projection, and portable Graphics snapshots.
kind: rix
mount: scene3d
exports: [Scene, Group, Transform, Mesh, Polyline, PointCloud, ParametricCurve, Axes, Annotation, Material, AmbientLight, DirectionalLight, PointLight, PerspectiveCamera, OrthographicCamera, OrbitCamera, Realize, Project, Snapshot]
groups: [Scene3D, Graphics, Exact]
permissions: []
requires: [rix.numerics@1]
provides: [rix.scene3d@1, rix.scene3d.realized@1, rix.scene3d.projected@1, rix.scene3d.orbit@1]
schemas: [rix.scene3d@1, rix.scene3d.realized@1, rix.scene3d.projected@1, rix.scene3d.orbit@1]
snapshot: true
deterministic: true
defaultEnabled: false
**/

S3Option(options, key, fallback ?= _) -> options.Has(key) ?: options[key] ?_ fallback;

S3Exact(value, label) -> {;
    exact = value ~!: :Rational;
    exact == _ ?: .Error(@"@{label} must be an exact Integer or Rational") ?_ exact;
};

S3Integer(value, label) -> {;
    integer = value ~!: :Integer;
    integer == _ ?: .Error(@"@{label} must be an Integer") ?_ integer;
};

S3Vector(value, dimension, label) -> {;
    value ? :Array ?: _ ?_ .Error(@"@{label} must be an Array");
    value.Len() == dimension ?: _ ?_ .Error(@"@{label} must contain @{dimension} coordinates");
    value.Map((coordinate) -> S3Exact(coordinate, @label));
};

S3Value(kind, fields) -> .DeepMutable({=
    type=kind == :scene ?: "output" ?_ "scene3d_node",
    kind=kind == :scene ?: "scene3d" ?_ kind,
    schema="rix.scene3d@1"
}.Merge(fields), _);

S3IsNode(value) -> (value ? :Map) && value.Has("schema") && value[:schema] == "rix.scene3d@1" && value[:type] == "scene3d_node";
S3RequireNode(value, label) -> S3IsNode(value) ?: value ?_ .Error(@"@{label} must be a Scene3D node");
S3IsScene(value) -> (value ? :Map) && value.Has("schema") && value[:schema] == "rix.scene3d@1" && value[:kind] == "scene3d";

S3Children(value, label) -> {;
    value ? :Array ?: _ ?_ .Error(@"@{label} must be an Array");
    value.Map((child) -> S3RequireNode(child, @label));
};

S3MaterialValues(material) -> ((material ? :Map) && S3IsNode(material) && material[:kind] == :material)
  ?: material[:values]
  ?_ {= };

S3Style(settings) -> {;
    material = S3Option(settings, "material");
    values = S3MaterialValues(material);
    .DeepMutable({=
        color=S3Option(settings, "color", S3Option(values, "color", "#275dad")),
        width=S3Exact(S3Option(settings, "width", S3Option(values, "width", 1)), "Scene3D style width"),
        opacity=S3Exact(S3Option(settings, "opacity", S3Option(values, "opacity", 1)), "Scene3D style opacity"),
        material=material
    }, _);
};

S3OptionalString(settings, key, label) -> {;
    value = S3Option(settings, key);
    value == _ ?: _ ?_ ((value ? :String) && value.Len() > 0
      ?: value
      ?_ .Error(@"@{label} must be a nonempty String"));
};

S3Interaction(settings, label) -> {=
    pickid=S3OptionalString(settings, "id", @"@{label} id"),
    label=S3OptionalString(settings, "label", @"@{label} label")
};

S3LeafFields(settings, label) -> S3Interaction(settings, label).Merge({=
    metadata=S3Option(settings, "metadata")
});

S3Material(color ?= "#275dad", opacity ?= 1, width ?= 1) -> {;
    settings = color ? :Map ?: color ?_ {= color=color, opacity=opacity, width=width };
    S3Value(:material, {= values=.DeepMutable({=
        color=S3Option(settings, "color", "#275dad"),
        opacity=S3Exact(S3Option(settings, "opacity", 1), "scene3d.Material opacity"),
        width=S3Exact(S3Option(settings, "width", 1), "scene3d.Material width")
    }, _) });
};

S3LightColor(settings, fallback ?= "#ffffff") -> S3Option(settings, "color", fallback);
S3LightIntensity(settings, label) -> {;
    intensity = S3Exact(S3Option(settings, "intensity", 1), @"@{label} intensity");
    intensity >= 0 ?: intensity ?_ .Error(@"@{label} intensity must be nonnegative");
};

S3AmbientLight(color ?= "#ffffff", intensity ?= 1) -> {;
    settings = color ? :Map ?: color ?_ {= color=color, intensity=intensity };
    S3Value(:ambient_light, {=
        color=S3LightColor(settings),
        intensity=S3LightIntensity(settings, "scene3d.AmbientLight")
    });
};

S3DirectionalLight(direction, options ?= {= }) -> {;
    settings = direction ? :Map ?: direction ?_ options.Merge({= direction=direction });
    vector = S3Vector(settings[:direction], 3, "scene3d.DirectionalLight direction");
    S3Dot(vector, vector) > 0 ?: _ ?_ .Error("scene3d.DirectionalLight direction must not be zero");
    S3Value(:directional_light, {=
        direction=vector,
        color=S3LightColor(settings),
        intensity=S3LightIntensity(settings, "scene3d.DirectionalLight")
    });
};

S3PointLight(position, options ?= {= }) -> {;
    settings = position ? :Map ?: position ?_ options.Merge({= position=position });
    S3Value(:point_light, {=
        position=S3Vector(settings[:position], 3, "scene3d.PointLight position"),
        color=S3LightColor(settings),
        intensity=S3LightIntensity(settings, "scene3d.PointLight")
    });
};

S3Triangles(value, vertexCount) -> {;
    value ? :Array ?: _ ?_ .Error("scene3d.Mesh triangles must be an Array");
    value.Map((triangle) -> {;
        triangle ? :Array ?: _ ?_ .Error("scene3d.Mesh triangle must be an Array");
        triangle.Len() == 3 ?: _ ?_ .Error("scene3d.Mesh triangle must contain three indices");
        result = triangle.Map((entry) -> S3Integer(entry, "scene3d.Mesh triangle index"));
        result.Filter((entry) -> entry < 1 || entry > @vertexCount).Len() == 0
          ?: result
          ?_ .Error(@"scene3d.Mesh triangle indices must be between 1 and @{vertexCount}");
    });
};

S3Mesh(vertices, triangles, options ?= {= }) -> {;
    settings = vertices ? :Map ?: vertices ?_ options.Merge({= vertices=vertices, triangles=triangles });
    points = settings[:vertices].Map((vertex) -> S3Vector(vertex, 3, "scene3d.Mesh vertex"));
    points.Len() > 0 ?: _ ?_ .Error("scene3d.Mesh requires at least one vertex");
    S3Value(:mesh, {=
        vertices=points,
        triangles=S3Triangles(settings[:triangles], points.Len()),
        style=S3Style(settings)
    }.Merge(S3LeafFields(settings, "scene3d.Mesh")));
};

S3Polyline(points, options ?= {= }) -> {;
    settings = points ? :Map ?: points ?_ options.Merge({= points=points });
    normalized = settings[:points].Map((point) -> S3Vector(point, 3, "scene3d.Polyline point"));
    normalized.Len() >= 2 ?: _ ?_ .Error("scene3d.Polyline requires at least two points");
    S3Value(:polyline, {=
        points=normalized,
        closed=S3Option(settings, "closed", 0)==1 ?: 1 ?_ 0,
        style=S3Style(settings)
    }.Merge(S3LeafFields(settings, "scene3d.Polyline")));
};

S3PointCloud(points, options ?= {= }) -> {;
    settings = points ? :Map ?: points ?_ options.Merge({= points=points });
    normalized = settings[:points].Map((point) -> S3Vector(point, 3, "scene3d.PointCloud point"));
    normalized.Len() > 0 ?: _ ?_ .Error("scene3d.PointCloud requires at least one point");
    S3Value(:point_cloud, {=
        points=normalized,
        radius=S3Exact(S3Option(settings, "radius", 3), "scene3d.PointCloud radius"),
        style=S3Style(settings)
    }.Merge(S3LeafFields(settings, "scene3d.PointCloud")));
};

S3ParametricCurve(curve, domain, options ?= {= }) -> {;
    settings = curve ? :Map ?: curve ?_ options.Merge({= curve=curve, domain=domain });
    interval = settings[:domain];
    low = S3Exact(interval.Low(), "scene3d.ParametricCurve domain low");
    high = S3Exact(interval.High(), "scene3d.ParametricCurve domain high");
    high > low ?: _ ?_ .Error("scene3d.ParametricCurve domain must have increasing endpoints");
    samples = S3Integer(S3Option(settings, "samples", 33), "scene3d.ParametricCurve samples");
    (samples >= 2 && samples <= 4096) ?: _ ?_ .Error("scene3d.ParametricCurve samples must be between 2 and 4096");
    step = (high-low)/(samples-1);
    points := [];
    {@ index=1; index<=@samples; {;
        parameter = @low+(index-1)*@step;
        @points ~= @points.Push(S3Vector(@settings[:curve](parameter), 3, "scene3d.ParametricCurve point"));
    }; index+=1 };
    sourceMetadata = S3Option(settings, "metadata", {= });
    sourceMetadata == _ ?: {; @sourceMetadata ~= {= }; } ?_ _;
    sourceMetadata ? :Map ?: _ ?_ .Error("scene3d.ParametricCurve metadata must be a Map");
    S3Polyline(points, settings.Merge({=
        metadata=sourceMetadata.Merge({=
            producer="parametric_curve", domain=low:high, samples=samples, exact=1
        })
    }));
};

S3Annotation(position, text, options ?= {= }) -> {;
    settings = position ? :Map ?: position ?_ options.Merge({= position=position, text=text });
    content = settings[:text];
    content ? :String ?: _ ?_ .Error("scene3d.Annotation text must be a String");
    size = S3Exact(S3Option(settings, "size", 14), "scene3d.Annotation size");
    size > 0 ?: _ ?_ .Error("scene3d.Annotation size must be positive");
    S3Value(:annotation, {=
        position=S3Vector(settings[:position], 3, "scene3d.Annotation position"),
        text=content,
        style={=
            color=S3Option(settings, "color", "#111827"),
            size=size,
            anchor=S3Option(settings, "anchor", "middle"),
            weight=S3Option(settings, "weight")
        }
    }.Merge(S3LeafFields(settings, "scene3d.Annotation")));
};

S3Axes(options ?= {= }) -> {;
    settings = options;
    origin = S3Vector(S3Option(settings, "origin", [0,0,0]), 3, "scene3d.Axes origin");
    length = S3Exact(S3Option(settings, "length", 1), "scene3d.Axes length");
    length > 0 ?: _ ?_ .Error("scene3d.Axes length must be positive");
    width = S3Exact(S3Option(settings, "width", 2), "scene3d.Axes width");
    labels = S3Option(settings, "labels", 1)==1 ?: 1 ?_ 0;
    prefix = S3OptionalString(settings, "id", "scene3d.Axes id");
    names = ["x","y","z"];
    colors = [S3Option(settings,"xColor","#dc2626"),S3Option(settings,"yColor","#16a34a"),S3Option(settings,"zColor","#2563eb")];
    children := [];
    {@ axis=1; axis<=3; {;
        endpoint = [1,2,3].Map((coordinate)->@origin[coordinate]+(coordinate==@axis ?: @length ?_ 0));
        axisId = @prefix==_ ?: _ ?_ @"@{@prefix}.@{@names[axis]}";
        @children ~= @children.Push(S3Polyline([@origin,endpoint], {=
            color=@colors[axis],width=@width,id=axisId,label=@"@{@names[axis]} axis"
        }));
        @labels ?: {;
            @children ~= @children.Push(S3Annotation(@endpoint,@names[@axis],{=
                color=@colors[@axis],size=S3Option(@settings,"labelSize",14),id=@axisId==_ ?: _ ?_ @"@{@axisId}.label",label=@"@{@names[@axis]} axis label"
            }));
        } ?_ _;
    }; axis+=1 };
    S3Group(children,{= metadata={= producer="axes",origin=origin,length=length } });
};

S3Group(children, options ?= {= }) -> {;
    settings = children ? :Map ?: children ?_ options.Merge({= children=children });
    S3Value(:group, {= children=S3Children(settings[:children], "scene3d.Group children"), metadata=S3Option(settings, "metadata") });
};

S3Identity() -> [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

S3Transform(children, options ?= {= }) -> {;
    settings = children ? :Map ?: children ?_ options.Merge({= children=children });
    matrix := S3Option(settings, "matrix", S3Identity());
    matrix ? :Array ?: _ ?_ .Error("scene3d.Transform matrix must be an Array");
    matrix.Len() == 16 ?: _ ?_ .Error("scene3d.Transform matrix must contain 16 row-major values");
    matrix ~= matrix.Map((value) -> S3Exact(value, "scene3d.Transform matrix value"));
    translate = S3Option(settings, "translate");
    translate != _ ?: {;
        vector = S3Vector(@translate, 3, "scene3d.Transform translate");
        @matrix ~= @matrix.Set(4, vector[1]).Set(8, vector[2]).Set(12, vector[3]);
    } ?_ _;
    scale = S3Option(settings, "scale");
    scale != _ ?: {;
        values = @scale ? :Array ?: S3Vector(@scale, 3, "scene3d.Transform scale") ?_ [S3Exact(@scale, "scene3d.Transform scale"), S3Exact(@scale, "scene3d.Transform scale"), S3Exact(@scale, "scene3d.Transform scale")];
        @matrix ~= @matrix.Set(1, values[1]).Set(6, values[2]).Set(11, values[3]);
    } ?_ _;
    S3Value(:transform, {= children=S3Children(settings[:children], "scene3d.Transform children"), matrix=matrix, metadata=S3Option(settings, "metadata") });
};

S3Camera(projection, position, target ?= _, options ?= {= }) -> {;
    settings = position ? :Map ?: position ?_ options.Merge({= position=position, target=target });
    near = S3Exact(S3Option(settings, "near", 1/100), "Scene3D camera near");
    far = S3Exact(S3Option(settings, "far", 1000), "Scene3D camera far");
    (near > 0 && far > near) ?: _ ?_ .Error("Scene3D camera requires 0 < near < far");
    S3Value(:camera, {=
        projection=projection,
        position=S3Vector(settings[:position], 3, "Scene3D camera position"),
        target=S3Vector(settings[:target], 3, "Scene3D camera target"),
        up=S3Vector(S3Option(settings, "up", [0,0,1]), 3, "Scene3D camera up"),
        fov=S3Exact(S3Option(settings, "fov", 50), "Scene3D camera fov"),
        near=near,
        far=far,
        scale=S3Option(settings, "scale")
    });
};

S3PerspectiveCamera(position, target ?= _, options ?= {= }) -> S3Camera("perspective", position, target, options);
S3OrthographicCamera(position, target ?= _, options ?= {= }) -> S3Camera("orthographic", position, target, options);
S3OrbitCamera(target, options ?= {= }) -> {;
    settings = target ? :Map ?: target ?_ options.Merge({= target=target });
    center = S3Vector(settings[:target], 3, "scene3d.OrbitCamera target");
    radius = S3Exact(S3Option(settings, "radius", 6), "scene3d.OrbitCamera radius");
    height = S3Exact(S3Option(settings, "height", 3), "scene3d.OrbitCamera height");
    radius > 0 ?: _ ?_ .Error("scene3d.OrbitCamera radius must be positive");
    parameter = S3Option(settings, "turn", 0);
    infinity = parameter == .Complex[:infinity];
    cosine = infinity ?: -1 ?_ {; exact=S3Exact(@parameter,"scene3d.OrbitCamera turn"); (1-exact^2)/(1+exact^2); };
    sine = infinity ?: 0 ?_ {; exact=S3Exact(@parameter,"scene3d.OrbitCamera turn"); 2*exact/(1+exact^2); };
    position = [center[1]+radius*cosine,center[2]+radius*sine,center[3]+height];
    projection = S3Option(settings, "projection", "perspective");
    (projection=="perspective" || projection=="orthographic") ?: _ ?_ .Error("scene3d.OrbitCamera projection must be 'perspective' or 'orthographic'");
    camera = S3Camera(projection,position,center,settings);
    S3Value(:camera,camera.Merge({=
        orbit=.DeepMutable({=
            schema="rix.scene3d.orbit@1",parameterization="cayley",axis=[0,0,1],
            target=center,radius=radius,height=height,turn=parameter,projectiveInfinity=infinity ?: 1 ?_ 0
        },_)
    }));
};
S3DefaultCamera() -> S3PerspectiveCamera([4,4,3], [0,0,0]);

S3Multiply4(left, right) -> {;
    result := [];
    {@ row = 1; row <= 4; {;
        {@ column = 1; column <= 4; {;
            value := 0;
            {@ index = 1; index <= 4; {;
                @value += @left[(@row-1)*4+index] * @right[(index-1)*4+@column];
            }; index += 1 };
            @result ~= @result.Push(value);
        }; column += 1 };
    }; row += 1 };
    result;
};

S3TransformPoint(matrix, point) -> [
    matrix[1]*point[1] + matrix[2]*point[2] + matrix[3]*point[3] + matrix[4],
    matrix[5]*point[1] + matrix[6]*point[2] + matrix[7]*point[3] + matrix[8],
    matrix[9]*point[1] + matrix[10]*point[2] + matrix[11]*point[3] + matrix[12]
];

S3MeshSegments(triangles) -> {;
    segments := [];
    seen := {= };
    {@ index = 1; index <= @triangles.Len(); {;
        triangle = @triangles[index];
        pairs = [[triangle[1],triangle[2]],[triangle[2],triangle[3]],[triangle[3],triangle[1]]];
        {@ pairIndex = 1; pairIndex <= @pairs.Len(); {;
            pair = @pairs[pairIndex];
            ordered = pair[1] < pair[2] ?: pair ?_ [pair[2],pair[1]];
            key = @"@{ordered[1]}:@{ordered[2]}";
            !(@seen.Has(key)) ?: {; @seen ~= @seen.Set(@key, 1); @segments ~= @segments.Push(@ordered); } ?_ _;
        }; pairIndex += 1 };
    }; index += 1 };
    segments;
};

S3PrimitiveFields(child) -> {=
    pickid=S3Option(child,"pickid"),
    label=S3Option(child,"label"),
    metadata=S3Option(child,"metadata")
};

S3Collect(children, parent) -> {;
    result := [];
    {@ index = 1; index <= @children.Len(); {;
        child = @children[index];
        kind = child[:kind];
        kind == :group
          ?: {; @result ~= @result.Concat(S3Collect(@child[:children], @parent)); }
          ?_ kind == :transform
               ?: {; @result ~= @result.Concat(S3Collect(@child[:children], S3Multiply4(@parent, @child[:matrix]))); }
               ?_ kind == :mesh
                    ?: {;
                        points = @child[:vertices].Map((point) -> S3TransformPoint(@parent, point));
                        @result ~= @result.Push(.DeepMutable({=
                            kind=:mesh, points=points, segments=S3MeshSegments(@child[:triangles]),
                            triangles=@child[:triangles], style=@child[:style]
                        }.Merge(S3PrimitiveFields(@child)), _));
                    }
                    ?_ kind == :polyline
                         ?: {;
                             points = @child[:points].Map((point) -> S3TransformPoint(@parent, point));
                             segments := [];
                             {@ pointIndex = 1; pointIndex < @points.Len(); {;
                                 @segments ~= @segments.Push([pointIndex, pointIndex+1]);
                             }; pointIndex += 1 };
                             (@child[:closed]==1 && points.Len() > 2) ?: {; @segments ~= @segments.Push([@points.Len(),1]); } ?_ _;
                             @result ~= @result.Push(.DeepMutable({= kind=:lines, points=points, segments=segments, style=@child[:style] }.Merge(S3PrimitiveFields(@child)), _));
                         }
                         ?_ kind == :point_cloud
                              ?: {; @result ~= @result.Push(.DeepMutable({=
                                  kind=:points, points=@child[:points].Map((point) -> S3TransformPoint(@parent, point)),
                                  radius=@child[:radius], style=@child[:style]
                              }.Merge(S3PrimitiveFields(@child)), _)); }
                              ?_ kind == :annotation
                                   ?: {; @result ~= @result.Push(.DeepMutable({=
                                       kind=:annotation,points=[S3TransformPoint(@parent,@child[:position])],
                                       text=@child[:text],style=@child[:style]
                                   }.Merge(S3PrimitiveFields(@child)),_)); }
                              ?_ ((kind == :material || kind == :camera)
                                  ?: _
                                  ?_ .Error(@"Unsupported Scene3D node '@{kind}'"));
    }; index += 1 };
    result;
};

S3Picking(primitives) -> {;
    result := {= };
    {@ index=1; index<=@primitives.Len(); {;
        primitive = @primitives[index];
        id = primitive[:pickid];
        id != _ ?: {;
            @result.Has(@id) ?: .Error(@"Duplicate Scene3D picking id '@{@id}'") ?_ _;
            @result ~= @result.Set(@id,{= primitive=@index,kind=@primitive[:kind],label=@primitive[:label] });
        } ?_ _;
    }; index+=1 };
    result;
};

S3Realized(children) -> {;
    primitives = S3Collect(children,S3Identity());
    .DeepMutable({=
        type="scene3d_realized",
        schema="rix.scene3d.realized@1",
        coordinateSystem={= handedness="right", up="z", units="unspecified" },
        primitives=primitives,
        picking=S3Picking(primitives)
    }, _);
};

S3Scene(children, options ?= {= }) -> {;
    settings = children ? :Map ?: children ?_ options.Merge({= children=children });
    normalized = S3Children(settings[:children], "scene3d.Scene children");
    camera = S3Option(settings, "camera", S3DefaultCamera());
    (S3IsNode(camera) && camera[:kind] == :camera) ?: _ ?_ .Error("scene3d.Scene camera must be a Scene3D camera");
    lights = S3Option(settings, "lights", []);
    lights ? :Array ?: _ ?_ .Error("scene3d.Scene lights must be an Array");
    lights.Filter((light) -> !(S3IsNode(light) && [:ambient_light,:directional_light,:point_light].Filter((kind)->kind==light[:kind]).Len()>0)).Len() == 0
      ?: _
      ?_ .Error("scene3d.Scene lights must contain Scene3D lights");
    S3Value(:scene, {=
        children=normalized,
        camera=camera,
        lights=lights,
        metadata=S3Option(settings, "metadata"),
        coordinateSystem={= handedness="right", up="z", units="unspecified" },
        realized=S3Realized(normalized)
    });
};

S3Realize(scene) -> S3IsScene(scene) ?: scene[:realized] ?_ .Error("scene3d.Realize requires a Scene3D scene");

S3Subtract(left, right) -> [left[1]-right[1],left[2]-right[2],left[3]-right[3]];
S3Dot(left, right) -> left[1]*right[1]+left[2]*right[2]+left[3]*right[3];
S3Cross(left, right) -> [
    left[2]*right[3]-left[3]*right[2],
    left[3]*right[1]-left[1]*right[3],
    left[1]*right[2]-left[2]*right[1]
];

S3ApproximateSqrt(value) ->
    .numerics.Refine(.numerics.Sqrt(value), {=
        absoluteWidth=1/1000000,
        maxWork=30
    })[:approximation].Candidate();

S3Normalize(vector, label) -> {;
    squared = S3Dot(vector, vector);
    squared > 0 ?: _ ?_ .Error(@"@{label} must not be zero or collinear with the view direction");
    length = S3ApproximateSqrt(squared);
    vector.Map((coordinate) -> coordinate / @length);
};

S3Frame(camera) -> {;
    forward = S3Normalize(S3Subtract(camera[:target],camera[:position]), "Camera view direction");
    right = S3Normalize(S3Cross(forward,camera[:up]), "Camera up vector");
    .DeepMutable({= position=camera[:position], forward=forward, right=right, up=S3Cross(right,forward) }, _);
};

S3CameraPoint(point, frame) -> {;
    delta = S3Subtract(point,frame[:position]);
    [S3Dot(delta,frame[:right]),S3Dot(delta,frame[:up]),S3Dot(delta,frame[:forward])];
};

S3ClipDepth(first, second, near, far) -> {;
    rejected = (first[3] < near && second[3] < near) || (first[3] > far && second[3] > far);
    rejected ?: _ ?_ {;
        start := @first;
        finish := @second;
        {@ planeIndex = 1; planeIndex <= 2; {;
            plane = planeIndex == 1 ?: @near ?_ @far;
            startOutside = planeIndex == 1 ?: @start[3] < plane ?_ @start[3] > plane;
            finishOutside = planeIndex == 1 ?: @finish[3] < plane ?_ @finish[3] > plane;
            startOutside != finishOutside ?: {;
                ratio = (@plane-@start[3])/(@finish[3]-@start[3]);
                cut = [1,2,3].Map((coordinate) -> @start[coordinate]+(@finish[coordinate]-@start[coordinate])*@ratio);
                @startOutside ?: {; @start ~= @cut; } ?_ {; @finish ~= @cut; };
            } ?_ _;
        }; planeIndex += 1 };
        [start,finish];
    };
};

S3BoundedApprox(value) -> {;
    exact = value ~!: :Rational;
    (exact*1000000000000).Round()/1000000000000;
};

S3Tan(value) -> {;
    square = value^2;
    denominator := 47;
    {@ index = 23; index >= 1; {;
        @denominator ~= S3BoundedApprox((2*index-1)-@square/@denominator);
    }; index -= 1 };
    S3BoundedApprox(value/denominator);
};

S3StyleMap(style, fill ?= _, color ?= _) -> fill != _
  ?: {= fill=color == _ ?: style[:color] ?_ color, stroke=color == _ ?: style[:color] ?_ color, width=style[:width], opacity=style[:opacity] }
  ?_ {= stroke=style[:color], fill="none", width=style[:width], opacity=style[:opacity] };

S3HexDigit(character) -> {;
    digits = {= ("0")=0,("1")=1,("2")=2,("3")=3,("4")=4,("5")=5,("6")=6,("7")=7,("8")=8,("9")=9,("a")=10,("b")=11,("c")=12,("d")=13,("e")=14,("f")=15 };
    lower = character.Lower();
    digits.Has(lower) ?: digits[lower] ?_ .Error("Scene3D lit snapshots require hexadecimal material colors");
};

S3Rgb(color) -> {;
    valid = color ? :String && (color.Len()==4 || color.Len()==7) && color[1]=="#";
    valid ?: _ ?_ .Error("Scene3D lit snapshots require hexadecimal material colors");
    source = color.Len()==4 ?: @"#@{color[2]}@{color[2]}@{color[3]}@{color[3]}@{color[4]}@{color[4]}" ?_ color;
    [2,4,6].Map((index) -> 16*S3HexDigit(@source[index])+S3HexDigit(@source[index+1]));
};

S3HexByte(value) -> {;
    exact = value ~!: :Rational;
    clamped = .Max(0,.Min(255,exact.Round()));
    digits = "0123456789abcdef";
    @"@{digits[clamped//16+1]}@{digits[clamped%16+1]}";
};

S3LitColor(style, triangle, lights) -> {;
    normal = S3Normalize(S3Cross(S3Subtract(triangle[2],triangle[1]),S3Subtract(triangle[3],triangle[1])), "Scene3D triangle");
    center = [1,2,3].Map((coordinate) -> (triangle[1][coordinate]+triangle[2][coordinate]+triangle[3][coordinate])/3);
    illumination := [0,0,0];
    active = lights.Len()>0 ?: lights ?_ [S3AmbientLight()];
    {@ lightIndex = 1; lightIndex <= @active.Len(); {;
        light = @active[lightIndex];
        factor := light[:intensity];
        light[:kind] == :directional_light
          ?: {; direction=S3Normalize(@light[:direction].Map((entry)->-entry),"Directional light direction"); @factor *= .Abs(S3Dot(@normal,direction)); }
          ?_ light[:kind] == :point_light
               ?: {; direction=S3Normalize(S3Subtract(@light[:position],@center),"Point light position"); @factor *= .Abs(S3Dot(@normal,direction)); }
               ?_ _;
        lightRgb = S3Rgb(light[:color]);
        @illumination ~= [1,2,3].Map((channel)->@illumination[channel]+@factor*@lightRgb[channel]/255);
    }; lightIndex += 1 };
    base = S3Rgb(style[:color]);
    values = [1,2,3].Map((channel)->@base[channel]*.Min(1,@illumination[channel]));
    @"#@{S3HexByte(values[1])}@{S3HexByte(values[2])}@{S3HexByte(values[3])}";
};

S3ProjectedFields(primitive, sourcePrimitive) -> {=
    pickid=primitive[:pickid],label=primitive[:label],sourcePrimitive=sourcePrimitive
};

S3ProjectedPicking(primitives) -> {;
    result := {= };
    {@ index=1; index<=@primitives.Len(); {;
        primitive = @primitives[index];
        id = primitive[:pickid];
        id != _ ?: {;
            existing = @result.Has(@id) ?: @result[@id] ?_ {= indices=[],kind=@primitive[:kind],label=@primitive[:label] };
            @result ~= @result.Set(@id,existing.Set("indices",existing[:indices].Push(@index)));
        } ?_ _;
    }; index+=1 };
    result;
};

S3Project(scene, options ?= {= }) -> {;
    S3IsScene(scene) ?: _ ?_ .Error("scene3d.Project requires a Scene3D scene");
    mode = S3Option(options,"mode","wireframe");
    (mode=="wireframe" || mode=="lit") ?: _ ?_ .Error("scene3d.Project mode must be 'wireframe' or 'lit'");
    size = S3Vector(S3Option(options,"size",[640,480]),2,"scene3d.Project size");
    width=size[1]; height=size[2];
    (width>0 && height>0) ?: _ ?_ .Error("scene3d.Project size must be positive");
    camera=S3Option(options,"camera",scene[:camera]);
    (S3IsNode(camera)&&camera[:kind]==:camera) ?: _ ?_ .Error("scene3d.Project camera must be a Scene3D camera");
    frame=S3Frame(camera);
    near=camera[:near]; far=camera[:far]; aspect=width/height;
    realized=scene[:realized];
    primitives=realized[:primitives].Map((primitive)->primitive.Merge({=
        worldPoints=primitive[:points], points=primitive[:points].Map((point)->S3CameraPoint(point,@frame))
    }));
    allPoints := [];
    {@ primitiveIndex=1; primitiveIndex<=@primitives.Len(); {; @allPoints ~= @allPoints.Concat(@primitives[primitiveIndex][:points]); }; primitiveIndex+=1 };
    project := _;
    approximation := {= viewNormalization="numerics-certified-sqrt" };
    camera[:projection]=="perspective"
      ?: {;
          fov=@camera[:fov]; (fov>0&&fov<180) ?: _ ?_ .Error("Perspective camera fov must be between 0 and 180 degrees");
          halfRadians=fov*3141592653589793/1000000000000000/360;
          focal=1/S3Tan(halfRadians);
          @project ~= (point)->[(1+point[1]*@focal/(point[3]*@aspect))*@width/2,(1-point[2]*@focal/point[3])*@height/2];
          @approximation ~= @approximation.Merge({= perspectiveTangent={= method="rational-continued-fraction", terms=24, decimalPlaces=12, pi="3141592653589793/1000000000000000" } });
      }
      ?_ {;
          bounds := @allPoints.Len()>0 ?: [@allPoints[1][1],@allPoints[1][1],@allPoints[1][2],@allPoints[1][2]] ?_ [0,0,0,0];
          {@ pointIndex=2; pointIndex<=@allPoints.Len(); {;
              point=@allPoints[pointIndex];
              @bounds ~= [.Min(@bounds[1],point[1]),.Max(@bounds[2],point[1]),.Min(@bounds[3],point[2]),.Max(@bounds[4],point[2])];
          }; pointIndex+=1 };
          centerX=(bounds[1]+bounds[2])/2; centerY=(bounds[3]+bounds[4])/2;
          spanX=bounds[2]-bounds[1]; spanY=bounds[4]-bounds[3];
          requested=@camera[:scale];
          vertical=requested!=_ ?: S3Exact(requested,"Orthographic camera scale") ?_ .Max(spanY,spanX/@aspect,1)*28/25;
          @project ~= (point)->[@width/2+(point[1]-@centerX)*@height/@vertical,@height/2-(point[2]-@centerY)*@height/@vertical];
      };
    projected := [];
    segments:=0; faces:=0; pointCount:=0; annotationCount:=0;
    mode=="lit" ?: {;
        faceValues := [];
        {@ primitiveIndex=1; primitiveIndex<=@primitives.Len(); {;
            primitive=@primitives[primitiveIndex];
            primitive[:kind]==:mesh ?: {;
                {@ triangleIndex=1; triangleIndex<=@primitive[:triangles].Len(); {;
                    indices=@primitive[:triangles][triangleIndex];
                    cameraPoints=indices.Map((index)->@primitive[:points][index]);
                    visible=cameraPoints.Filter((point)->point[3]<@near||point[3]>@far).Len()==0;
                    visible ?: {;
                        worldPoints=@indices.Map((index)->@primitive[:worldPoints][index]);
                        depth=(@cameraPoints[1][3]+@cameraPoints[2][3]+@cameraPoints[3][3])/3;
                        @faceValues ~= @faceValues.Push({= kind=:face, points=@cameraPoints.Map(@project), worldPoints=worldPoints, style=@primitive[:style], depth=depth }.Merge(S3ProjectedFields(@primitive,@primitiveIndex)));
                    } ?_ _;
                }; triangleIndex+=1 };
            } ?_ _;
        }; primitiveIndex+=1 };
        {@ index=2; index<=@faceValues.Len(); {;
            cursor:=index;
            {@ step=@index; @cursor>1 && @faceValues[@cursor-1][:depth]<@faceValues[@cursor][:depth]; {;
                previous=@faceValues[@cursor-1]; current=@faceValues[@cursor];
                @faceValues ~= @faceValues.Set(@cursor-1,current).Set(@cursor,previous); @cursor-=1;
            }; step+=1 };
        }; index+=1 };
        @projected ~= @projected.Concat(faceValues); @faces ~= faceValues.Len();
    } ?_ _;
    {@ primitiveIndex=1; primitiveIndex<=@primitives.Len(); {;
        primitive=@primitives[primitiveIndex];
        ((primitive[:kind]==:lines)||(primitive[:kind]==:mesh&&@mode=="wireframe")) ?: {;
            {@ segmentIndex=1; segmentIndex<=@primitive[:segments].Len(); {;
                indices=@primitive[:segments][segmentIndex]; clipped=S3ClipDepth(@primitive[:points][indices[1]],@primitive[:points][indices[2]],@near,@far);
                clipped!=_ ?: {; @projected ~= @projected.Push({= kind=:segment, points=@clipped.Map(@project), style=@primitive[:style] }.Merge(S3ProjectedFields(@primitive,@primitiveIndex))); @segments+=1; } ?_ _;
            }; segmentIndex+=1 };
        } ?_ primitive[:kind]==:points ?: {;
            {@ pointIndex=1; pointIndex<=@primitive[:points].Len(); {;
                point=@primitive[:points][pointIndex];
                (point[3]>=@near&&point[3]<=@far) ?: {; @projected ~= @projected.Push({= kind=:point, point=@project(@point), radius=@primitive[:radius], style=@primitive[:style] }.Merge(S3ProjectedFields(@primitive,@primitiveIndex))); @pointCount+=1; } ?_ _;
            }; pointIndex+=1 };
        } ?_ primitive[:kind]==:annotation ?: {;
            point=@primitive[:points][1];
            (point[3]>=@near&&point[3]<=@far) ?: {;
                @projected ~= @projected.Push({= kind=:annotation,point=@project(@point),text=@primitive[:text],style=@primitive[:style] }.Merge(S3ProjectedFields(@primitive,@primitiveIndex)));
                @annotationCount+=1;
            } ?_ _;
        } ?_ _;
    }; primitiveIndex+=1 };
    .DeepMutable({=
        type="scene3d_projected", schema="rix.scene3d.projected@1", mode=mode, size=size,
        camera=camera, frame=frame, primitives=projected, approximation=approximation,
        picking=S3ProjectedPicking(projected),
        work={= primitives=realized[:primitives].Len(), segments=segments, faces=faces, points=pointCount, annotations=annotationCount }
    }, _);
};

S3Snapshot(scene, options ?= {= }) -> {;
    projected=S3Project(scene,options);
    children := [];
    {@ index=1; index<=@projected[:primitives].Len(); {;
        primitive=@projected[:primitives][index];
        primitive[:kind]==:face
          ?: {; color=S3LitColor(@primitive[:style],@primitive[:worldPoints],@scene[:lights]); @children ~= @children.Push(.Graphics.Path(@primitive[:points],S3StyleMap(@primitive[:style],1,color))); }
          ?_ primitive[:kind]==:segment
               ?: {; @children ~= @children.Push(.Graphics.Path(@primitive[:points],S3StyleMap(@primitive[:style]))); }
               ?_ primitive[:kind]==:point
                    ?: {; @children ~= @children.Push(.Graphics.Circle(@primitive[:point],@primitive[:radius],S3StyleMap(@primitive[:style],1))); }
                    ?_ primitive[:kind]==:annotation
                         ?: {; @children ~= @children.Push(.Graphics.Text(@primitive[:point],@primitive[:text],{=
                             fill=@primitive[:style][:color],size=@primitive[:style][:size],anchor=@primitive[:style][:anchor],weight=@primitive[:style][:weight]
                         })); }
                    ?_ _;
    }; index+=1 };
    diagnostic=(projected[:mode]=="wireframe"&&scene[:lights].Len()>0)
      ?: [{= level="info",code="scene3d-wireframe-ignores-lights",message="Wireframe snapshots do not evaluate Scene3D lights." }]
      ?_ [];
    {=
        value=.Graphics.Graphic(projected[:size],children,{= schema="rix.graphics@1",source="rix.scene3d@1",mode=projected[:mode] }),
        resolved=1, uncertainty=[], work=projected[:work],
        source={= schema="rix.scene3d@1",projection=projected[:camera][:projection],mode=projected[:mode],approximation=projected[:approximation] },
        diagnostics=diagnostic, picking=projected[:picking], projected=projected
    };
};

scene3dNamespace={= };
scene3dNamespace._proto={=
    Scene=(self,children,options ?= {= })->S3Scene(children,options),
    Group=(self,children,options ?= {= })->S3Group(children,options),
    Transform=(self,children,options ?= {= })->S3Transform(children,options),
    Mesh=(self,vertices,triangles ?= _,options ?= {= })->S3Mesh(vertices,triangles,options),
    Polyline=(self,points,options ?= {= })->S3Polyline(points,options),
    PointCloud=(self,points,options ?= {= })->S3PointCloud(points,options),
    ParametricCurve=(self,curve,domain ?= _,options ?= {= })->S3ParametricCurve(curve,domain,options),
    Axes=(self,options ?= {= })->S3Axes(options),
    Annotation=(self,position,text ?= _,options ?= {= })->S3Annotation(position,text,options),
    Material=(self,color ?= "#275dad",opacity ?= 1,width ?= 1)->S3Material(color,opacity,width),
    AmbientLight=(self,color ?= "#ffffff",intensity ?= 1)->S3AmbientLight(color,intensity),
    DirectionalLight=(self,direction,options ?= {= })->S3DirectionalLight(direction,options),
    PointLight=(self,position,options ?= {= })->S3PointLight(position,options),
    PerspectiveCamera=(self,position,target ?= _,options ?= {= })->S3PerspectiveCamera(position,target,options),
    OrthographicCamera=(self,position,target ?= _,options ?= {= })->S3OrthographicCamera(position,target,options),
    OrbitCamera=(self,target,options ?= {= })->S3OrbitCamera(target,options),
    Realize=(self,scene)->S3Realize(scene),
    Project=(self,scene,options ?= {= })->S3Project(scene,options),
    Snapshot=(self,scene,options ?= {= })->S3Snapshot(scene,options)
};
.Host.RegisterValue("scene3d",scene3dNamespace,"Pure-RiX exact retained 3D scenes with explicit realization and projection",["Scene3D","Graphics","Exact"]);
`, sourcePath: "bundled:scene3d", kind: "rix" });
  catalog.addMetadata({ id: "solve", description: "Pure-RiX exact Phase 1 linear-system classification and symbolic-spec solving.", kind: "rix", mount: "solve", exports: ["Classify", "Linear", "System"], groups: ["Solve", "Symbolic", "Exact"], permissions: [], requires: ["rix.linear-algebra@1"], provides: ["rix.system-solver@1"], schemas: ["rix.solve.system-result@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:solve" }, { source: `/**
id: solve
description: Pure-RiX exact Phase 1 linear-system classification and symbolic-spec solving.
kind: rix
mount: solve
exports: [Classify, Linear, System]
groups: [Solve, Symbolic, Exact]
permissions: []
requires: [rix.linear-algebra@1]
provides: [rix.system-solver@1]
schemas: [rix.solve.system-result@1]
snapshot: false
deterministic: true
defaultEnabled: false
**/

SolveOption(options,key,fallback ?= _) -> (options ? :Map) && options.Has(key) ?: options[key] ?_ fallback;
SolveExact(value,label ?= "solve value") -> {;
    exact=value ~!: :Rational;
    exact==_ ?: .Error(@"@{label} must be an exact Integer or Rational") ?_ exact;
};
SolveIsZero(value)->(value ~!: :Rational).Numerator()==0;
SolveZeros(count)->{;
    result:=[];
    {@ index=1; index<=@count; {; @result ~= @result.Push(0); }; index+=1 };
    result;
};
SolveArray(values)->{;
    result:=[];
    {@ index=1; index<=@values.Len(); {; @result ~= @result.Push(@values[index]); }; index+=1 };
    result;
};
SolveIndexOf(values,requested)->{;
    found:=_;
    {@ index=1; index<=@values.Len() && @found==_; {;
        @values[index]==@requested ?: {; @found ~= @index; } ?_ _;
    }; index+=1 };
    found;
};
SolveIncludes(values,requested)->SolveIndexOf(values,requested)!=_;

SolveForm(coefficients,constant)->{= coefficients=coefficients, constant=constant };
SolveScalar(form)->form[:coefficients].All((value)->SolveIsZero(value));
SolveAddForms(left,right,sign ?= 1)->SolveForm(
    left[:coefficients].Map((value,index)->value+sign*right[:coefficients][index]),
    left[:constant]+sign*right[:constant]
);
SolveScaleForm(form,scalar)->SolveForm(form[:coefficients].Map((value)->value*scalar),form[:constant]*scalar);

SolveLiteral(node)->{;
    node[:kind]=="number" ?: _ ?_ .Error("Expected a symbolic number node");
    node.Has("integer") ?: SolveExact(node[:integer],"symbolic literal") ?_ SolveExact(node[:value],"symbolic literal");
};

SolveLinearForm(node,unknowns,constants)->{;
    kind=node[:kind];
    kind=="number"
      ?: SolveForm(SolveZeros(unknowns.Len()),SolveLiteral(node))
      ?_ ((kind=="identifier" || kind=="outer")
          ?: {;
              name=@node[:name]; index=SolveIndexOf(@unknowns,name);
              index!=_
                ?: SolveForm(SolveZeros(@unknowns.Len()).Set(index,1),0)
                ?_ (@constants.Has(name)
                    ?: SolveForm(SolveZeros(@unknowns.Len()),@constants[name])
                    ?_ .Error(@"Linear system needs an exact value for '@{name}'"));
          }
          ?_ (kind=="unary"
              ?: (node[:op]=="-"
                  ?: SolveScaleForm(SolveLinearForm(node[:expr],unknowns,constants),-1)
                  ?_ .Error("Unsupported unary operation in a Phase 1 linear system"))
              ?_ (kind=="binary"
                  ?: {;
                      operation=@node[:op];
                      left=SolveLinearForm(@node[:left],@unknowns,@constants);
                      right=SolveLinearForm(@node[:right],@unknowns,@constants);
                      operation=="+" ?: SolveAddForms(left,right) ?_
                      operation=="-" ?: SolveAddForms(left,right,-1) ?_
                      operation=="*" ?: (SolveScalar(left)
                          ?: SolveScaleForm(right,left[:constant])
                          ?_ (SolveScalar(right)
                              ?: SolveScaleForm(left,right[:constant])
                              ?_ .Error("Nonlinear product found in a Phase 1 linear system"))) ?_
                      operation=="/" ?: (SolveScalar(right) && !SolveIsZero(right[:constant])
                          ?: SolveScaleForm(left,1/right[:constant])
                          ?_ .Error("Linear-system division requires a nonzero exact scalar denominator")) ?_
                      operation=="^" ?: {;
                          exponent=SolveLiteral(@node[:right]);
                          exponent.Denominator()==1 && exponent.Numerator()==1 ?: @left ?_
                          (exponent.Denominator()==1 && exponent.Numerator()==0
                              ?: SolveForm(SolveZeros(@unknowns.Len()),1)
                              ?_ .Error("Nonlinear power found in a Phase 1 linear system"));
                      }
                      ?_ .Error(@"Unsupported symbolic operation '@{operation}' in a Phase 1 linear system");
                  }
                  ?_ .Error("Unsupported symbolic node in a Phase 1 linear system"))));
};

SolveDependencies(node)->{;
    kind=node[:kind];
    (kind=="identifier" || kind=="outer")
      ?: [node[:name]]
      ?_ (kind=="unary"
          ?: SolveDependencies(node[:expr])
          ?_ (kind=="binary"
              ?: SolveDependencies(node[:left]).Concat(SolveDependencies(node[:right])).Unique()
              ?_ []));
};

SolveValues(options)->{;
    incoming=SolveOption(options,"values",{= });
    incoming ? :Map ?: _ ?_ .Error("solve values must be a map");
    incoming.ReduceKeys((result,name,value)->result.Set(name,SolveExact(value,@"solve value '@{name}'")),{= });
};

SolveRoles(spec,options)->{;
    roles=.SpecRoles(spec,SolveOption(options,"roles",{= }));
    outputs=SolveArray(roles[:outputs].Len()>0 ?: roles[:outputs] ?_ roles[:unassigned]);
    outputs.Len()>0 ?: _ ?_ .Error("solve.System needs output roles or unassigned symbols to solve for");
    {= roles=roles, outputs=outputs };
};

SolveConstants(statements,unknowns,initial)->{;
    constants:=initial;
    pending:=[];
    {@ index=1; index<=@statements.Len(); {;
        statement=@statements[index];
        statement[:kind]=="define" && !SolveIncludes(@unknowns,statement[:target])
          ?: {; @pending ~= @pending.Push(@statement); } ?_ _;
    }; index+=1 };
    {@ pass=1; pass<=@statements.Len() && @pending.Len()>0; {;
        next:=[];
        {@ index=1; index<=@pending.Len(); {;
            statement=@pending[index];
            dependencies=SolveDependencies(statement[:expr]);
            ready=dependencies.All((name)->@constants.Has(name) && !SolveIncludes(@unknowns,name));
            ready
              ?: {;
                  form=SolveLinearForm(@statement[:expr],@unknowns,@constants);
                  SolveScalar(form) ?: _ ?_ .Error("Symbolic constant definition is not scalar");
                  @constants[@statement[:target]]=form[:constant];
              }
              ?_ {; @next ~= @next.Push(@statement); };
        }; index+=1 };
        @pending ~= next;
    }; pass+=1 };
    pending.Len()==0
      ?: constants
      ?_ .Error(@"Unresolved symbolic definitions: @{pending.Map((statement)->statement[:target]).Join(", ")}");
};

SolveSystemResult(spec,roles,outputs,equationCount,linear)->{;
    particular=linear[:particular];
    solution=particular==_
      ?: _
      ?_ {;
          values=@particular.Flatten(); namedSolution={= };
          {@ index=1; index<=@outputs.Len(); {; @namedSolution[@outputs[index]]=@values[index]; }; index+=1 };
          namedSolution;
      };
    result={=
        valueKind=:systemSolution, schema="rix.solve.system-result@1",
        status=linear[:status], classification="linearEqualities", exact=1,
        spec=spec, unknowns=outputs, solution=solution, solutionVector=particular,
        equations=equationCount, linearResult=linear, roles=roles
    };
    result.__type="SystemSolution";
    result;
};

SolveClassify(spec)->{;
    inspected=.InspectSpec(spec);
    statements=SolveArray(inspected[:statements]); operations:=[];
    {@ index=1; index<=@statements.Len(); {;
        statement=@statements[index];
        @operations ~= @operations.Push(statement[:kind]=="define" ?: "define" ?_ statement[:expr][:op]);
    }; index+=1 };
    hasInequality=operations.Any((operation)->operation=="<" || operation=="<=" || operation==">" || operation==">=");
    hasEquality=operations.Includes("==") || operations.Includes("define");
    {= kind=hasInequality ?: "constrainedSystem" ?_ (hasEquality ?: "equalitySystem" ?_ "expression"),
       linearCandidate=hasInequality ?: _ ?_ 1, operations=operations };
};

SolveDefinitionEquation(statement,outputs,constants)->SolveAddForms(
    SolveLinearForm({= kind="identifier", name=statement[:target] },outputs,constants),
    SolveLinearForm(statement[:expr],outputs,constants),-1
);
SolveConstraintEquation(statement,outputs,constants)->{;
    expression=statement[:expr];
    expression[:op]=="=="
      ?: SolveAddForms(
          SolveLinearForm(expression[:left],outputs,constants),
          SolveLinearForm(expression[:right],outputs,constants),-1
      )
      ?_ .Error(@"Phase 1 solve.System supports exact equalities, not '@{expression[:op]}'");
};
SolveEquation(statement,outputs,constants)->
    (statement[:kind]=="define" && SolveIncludes(outputs,statement[:target]))
      ?: SolveDefinitionEquation(statement,outputs,constants)
      ?_ ((statement[:kind]=="constraint") ?: SolveConstraintEquation(statement,outputs,constants) ?_ _);

SolveSystem(spec,options ?= {= })->{;
    inspected=.InspectSpec(spec);
    inspected[:kind]=="systemSpec" ?: _ ?_ .Error("solve.System expects a symbolic specification");
    roleInfo=SolveRoles(spec,options); outputs=roleInfo[:outputs]; statements=SolveArray(inspected[:statements]);
    constants=SolveConstants(statements,outputs,SolveValues(options));
    equations:=[];
    {@ index=1; index<=@statements.Len(); {;
        candidate=SolveEquation(@statements[index],@outputs,@constants);
        candidate ? :Map ?: {; @equations ~= @equations.Push(@candidate); } ?_ _;
    }; index+=1 };
    equations.Len()>0 ?: _ ?_ .Error("solve.System found no equations");
    matrix=equations.Map((equation)->equation[:coefficients]);
    bounds=equations.Map((equation)->-equation[:constant]);
    linear=.linalg.Solve(matrix,bounds);
    SolveSystemResult(spec,roleInfo[:roles],outputs,equations.Len(),linear);
};

SolveLinear(matrix,bounds)->{;
    linear=.linalg.Solve(matrix,bounds);
    result={=
        valueKind=:systemSolution, schema="rix.solve.system-result@1",
        status=linear[:status], classification="linearMatrix", exact=1,
        solution=linear[:particular], linearResult=linear
    };
    result.__type="SystemSolution";
    result;
};

solveNamespace={= };
solveNamespace._proto={=
    Classify=(self,spec)->SolveClassify(spec),
    Linear=(self,matrix,bounds)->SolveLinear(matrix,bounds),
    System=(self,spec,options ?= {= })->SolveSystem(spec,options)
};
.Host.RegisterValue("solve",solveNamespace,"Pure-RiX exact linear-system classification and symbolic-spec solving",["Solve","Symbolic","Exact"]);
`, sourcePath: "bundled:solve", kind: "rix" });
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
  catalog.registerInstaller("svg", install6);
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
  catalog.registerInstaller("terminal-ascii", install5);
  catalog.addMetadata({ id: "tikz", description: "Editable TikZ/PGF source renderer for core Graphics scenes.", kind: "host", mount: "tikz", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.tikz@1"], targets: ["tikz", "text/x-tikz"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:tikz" }, { sourcePath: "bundled:tikz", kind: "host" });
  catalog.registerInstaller("tikz", install8);
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

// src/certified-decimal-display.js
function rationalParts(value) {
  if (value instanceof Integer)
    return [value.value, 1n];
  if (value instanceof Rational)
    return [value.numerator, value.denominator];
  throw new TypeError("Certified decimal display requires rational endpoints");
}
function powerOfTen(exponent) {
  return 10n ** BigInt(exponent);
}
function compareFractions(leftNumerator, leftDenominator, rightNumerator, rightDenominator) {
  const difference = leftNumerator * rightDenominator - rightNumerator * leftDenominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}
function roundFraction(numerator, denominator) {
  const negative = numerator < 0n;
  const absolute = negative ? -numerator : numerator;
  const rounded = (absolute * 2n + denominator) / (denominator * 2n);
  return negative ? -rounded : rounded;
}
function roundedDecimalUnits(numerator, denominator, places) {
  if (places >= 0)
    return roundFraction(numerator * powerOfTen(places), denominator);
  return roundFraction(numerator, denominator * powerOfTen(-places));
}
function decimalText(units, places) {
  const negative = units < 0n;
  let digits = String(negative ? -units : units);
  if (places <= 0) {
    digits += "0".repeat(-places);
    return `${negative ? "-" : ""}${digits}`;
  }
  digits = digits.padStart(places + 1, "0");
  const split = digits.length - places;
  return `${negative ? "-" : ""}${digits.slice(0, split)}.${digits.slice(split)}`;
}
function lastPlaceOffsetText(units, places) {
  return String(places >= 0 ? units : units * powerOfTen(-places));
}
function decimalExponent(numerator, denominator) {
  let exponent = String(numerator).length - String(denominator).length;
  const belowCandidate = exponent >= 0 ? numerator < denominator * powerOfTen(exponent) : numerator * powerOfTen(-exponent) < denominator;
  if (belowCandidate)
    exponent -= 1;
  return exponent;
}
function requiredErrorUnits(centerUnits, places, lowNumerator, lowDenominator, highNumerator, highDenominator) {
  const centerNumerator = places >= 0 ? centerUnits : centerUnits * powerOfTen(-places);
  const centerDenominator = places >= 0 ? powerOfTen(places) : 1n;
  const lowDistanceNumerator = centerNumerator * lowDenominator - lowNumerator * centerDenominator;
  const highDistanceNumerator = highNumerator * centerDenominator - centerNumerator * highDenominator;
  const [distanceNumerator, distanceDenominator] = compareFractions(lowDistanceNumerator, centerDenominator * lowDenominator, highDistanceNumerator, centerDenominator * highDenominator) >= 0 ? [lowDistanceNumerator, centerDenominator * lowDenominator] : [highDistanceNumerator, centerDenominator * highDenominator];
  const scaleNumerator = places >= 0 ? powerOfTen(places) : 1n;
  const scaleDenominator = places >= 0 ? 1n : powerOfTen(-places);
  const numerator = distanceNumerator * scaleNumerator;
  const denominator = distanceDenominator * scaleDenominator;
  return (numerator + denominator - 1n) / denominator;
}
function terminatingDecimal(numerator, denominator) {
  let remaining = denominator;
  let twos = 0;
  let fives = 0;
  while (remaining % 2n === 0n) {
    remaining /= 2n;
    twos += 1;
  }
  while (remaining % 5n === 0n) {
    remaining /= 5n;
    fives += 1;
  }
  if (remaining !== 1n)
    return null;
  const places = Math.max(twos, fives);
  const units = numerator * 2n ** BigInt(places - twos) * 5n ** BigInt(places - fives);
  return { units, places };
}
function formatCertifiedIntervalDecimal(interval) {
  if (!(interval instanceof RationalInterval)) {
    throw new TypeError("Certified decimal display requires a RationalInterval");
  }
  const [lowNumerator, lowDenominator] = rationalParts(interval.low);
  const [highNumerator, highDenominator] = rationalParts(interval.high);
  const midpointNumerator = lowNumerator * highDenominator + highNumerator * lowDenominator;
  const midpointDenominator = 2n * lowDenominator * highDenominator;
  const widthNumerator = highNumerator * lowDenominator - lowNumerator * highDenominator;
  const widthDenominator = lowDenominator * highDenominator;
  if (widthNumerator === 0n) {
    const exact = terminatingDecimal(lowNumerator, lowDenominator);
    if (exact)
      return `${decimalText(exact.units, exact.places)}[+-0]`;
  }
  let places = widthNumerator === 0n ? 6 : 1 - decimalExponent(widthNumerator, 2n * widthDenominator);
  while (true) {
    const centerUnits = roundedDecimalUnits(midpointNumerator, midpointDenominator, places);
    const errorUnits = requiredErrorUnits(centerUnits, places, lowNumerator, lowDenominator, highNumerator, highDenominator);
    if (errorUnits <= 99n) {
      return `${decimalText(centerUnits, places)}[+-${lastPlaceOffsetText(errorUnits, places)}]`;
    }
    places -= 1;
  }
}
function certifiedEnclosureInterval(value) {
  if (value?.type !== "map" || !(value.entries instanceof Map))
    return null;
  if (value.entries.get("schema")?.value !== "rix.numerics.enclosure@1")
    return null;
  if (value.entries.get("certified")?.value !== 1n)
    return null;
  const interval = value.entries.get("interval");
  return interval instanceof RationalInterval ? interval : null;
}
function isAutomaticallyPresentableReal(value) {
  if (value?.type !== "map" || !(value.entries instanceof Map))
    return false;
  return value.entries.get("schema")?.value === "rix.numerics.algorithm-real@1";
}

// src/repl-runtime.js
var AUTOMATIC_REAL_DISPLAY = Object.freeze({
  absoluteWidth: "1/1000",
  maxWork: 50
});
var AUTOMATIC_REAL_VALUE_NAME = "rixwebautomaticdisplayvalue";
var helpGroups = [
  {
    title: "Start here",
    description: "Learn the smallest useful exact expressions, intervals, and assignments.",
    items: [
      ["2 + 3", "Evaluate an exact expression. Integers and fractions never become floats by accident."],
      ["3 / 8", "Exact division returns the rational 3/8."],
      ["2:5", "An interval with exact endpoints."],
      ["x := 7", "Store a fresh value in the current calculator session."]
    ]
  },
  {
    title: "Names and functions",
    description: "Create values, aliases, user functions, and system-capability calls.",
    items: [
      ["x := 3", "Create a lower-case value binding."],
      ["y = x", "Alias x's cell; in-place updates are shared."],
      ["Square(x) -> x ^ 2", "Define an uppercase callable."],
      ["Refine(Sin(Pi()/6), {= absoluteWidth=1/1000 })", "Refine a certified radian-based Numerics result."],
      [".numerics.Sin(x)", "Call the same certified operation through its explicit plugin namespace."]
    ]
  },
  {
    title: "Collections",
    description: "Work with arrays, sets, maps, and indexed values.",
    items: [
      ["[1, 2, 3]", "An array; indexes begin at 1."],
      ["{| 1, 2 |}", "A set."],
      ["{= a=3, b=5 }", "A map."],
      ["values[2]", "Read the second array item."]
    ]
  },
  {
    title: "Exact symbolic work",
    description: "Build symbolic expressions and perform exact differentiation and integration.",
    items: [
      ["{#x}", "Create the identity-symbol spec for x."],
      ["{#x# x^2 + 1 }", "Create a single-output symbolic expression."],
      [".Deriv(S, {#x})", "Differentiate a spec or spec-backed function exactly."],
      [".Integrate(S, {#x})", "Build a supported zero-constant antiderivative."]
    ]
  },
  {
    title: "Number views",
    description: "Choose decimal, fractional, continued-fraction, scientific, and base displays.",
    items: [
      ["Exp(3)", "Refinable real results automatically show a certified decimal[+-offset] ball; the offset uses the last shown digit, with width 1/1000 and a work limit of 50."],
      ["Numbers", "Open the number panel for decimal, exact, base, continued-fraction, and scientific presets."],
      ['*> ".[12],b,.."', "Show a bounded decimal, binary expansion, and exact mixed fraction together."],
      ['*> "cf"', "Display exact numeric results as continued fractions."],
      ['*> "sci[10]"', "Display scientific notation with ten significant digits."]
    ]
  },
  {
    title: "Intervals and graphics",
    description: "Explore exact intervals and create portable interactive graphics.",
    items: [
      ["1/3:2/3", "Create an exact closed interval; endpoint orientation is retained."],
      ["Explore interval", "Open the exact number line, edit endpoints, inspect arithmetic provenance, and export SVG or HTML."],
      ["Arrow keys", "In the interval explorer, move a focused endpoint or the whole interval by the exact selected step."],
      [".Graphics", "Build portable figures that RiX Web can render and make interactive."]
    ]
  },
  {
    title: "Scripts and plugins",
    description: "Run multiline programs, manage sessions, and use the preloaded browser plugin profile.",
    items: [
      ["Script entry", "Write several RiX statements and run them together with Ctrl/Command + Enter."],
      ["Save", "Download a restorable .rix-session file with its plugin profile, commands, settings, current input, and reactive inputs."],
      ["Export .rix", "Download portable RiX source whose plugin profile and commands run with the command-line runner."],
      ["Load", "Restore a .rix-session file completely, or open a local .rix file in script input."],
      ["Copy transcript", "Copy the visible command-and-result transcript to the clipboard."],
      [".Plugin.List()", "List the browser-approved catalog; the standard calculator profile loads its curated subset."],
      ['.Plugin.Load("example-array-rix")', "Explicitly load an optional teaching entry from the Examples group."],
      ["Tab", "Complete names and methods from the current RiX context without evaluating the draft."]
    ]
  },
  {
    title: "Reactive dashboard",
    description: "Create live values, controls, formulas, and dependency-driven models.",
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
    description: "Use built-in commands for help, variables, and session clearing.",
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
    items: group.items.filter(([syntax, description]) => !query || `${group.title} ${group.description} ${syntax} ${description}`.toLowerCase().includes(query))
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
function createWebSessionState(registeredControls, profileRequest, autoLoadPlugins) {
  const pluginCatalog = createBundledPluginCatalog();
  const systemContext = createDefaultSystemContext({
    frozen: false,
    pluginCatalog
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
    systemContext,
    pluginCatalog,
    pluginProfile: resolvePluginProfile(autoLoadPlugins ? profileRequest : { fresh: true }, pluginCatalog.list().map(({ id }) => id))
  };
  if (state.pluginProfile.source) {
    parseAndEvaluate(state.pluginProfile.source, { ...state, file: "<rix-web-plugin-profile>" });
  }
  return state;
}
function createRixRepl({ autoSeparateLines = true, autoLoadPlugins = true, pluginProfile = {} } = {}) {
  const registeredControls = new Map;
  let profileRequest = pluginProfile;
  let state = createWebSessionState(registeredControls, profileRequest, autoLoadPlugins);
  let initialNames = new Set(state.context.getAllNames());
  let separateLines = autoSeparateLines;
  const numberConfig = { input: "z[10]", display: ".." };
  const configuredFormat = (value) => formatValue(value, { context: state.context, evaluate: null });
  const automaticallyRefinedInterval = (value) => {
    if (!isAutomaticallyPresentableReal(value))
      return null;
    state.context.push(new Map([[AUTOMATIC_REAL_VALUE_NAME, value]]));
    try {
      const enclosure = parseAndEvaluate(`.numerics.Refine(${AUTOMATIC_REAL_VALUE_NAME}, {= absoluteWidth=${AUTOMATIC_REAL_DISPLAY.absoluteWidth}, maxWork=${AUTOMATIC_REAL_DISPLAY.maxWork} })`, { ...state, file: "<rix-web-automatic-display>" });
      return certifiedEnclosureInterval(enclosure);
    } catch {
      return null;
    } finally {
      state.context.pop();
    }
  };
  const presentationFormat = (value) => {
    const interval = automaticallyRefinedInterval(value);
    return interval ? formatCertifiedIntervalDecimal(interval) : configuredFormat(value);
  };
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
          text: presentationFormat(value),
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
          text: presentationFormat(value),
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
        value: presentationFormat(state.context.get(name))
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
          valueText: presentationFormat(value),
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
    pluginProfile() {
      return {
        name: state.pluginProfile.name,
        plugins: [...state.pluginProfile.plugins],
        source: state.pluginProfile.source,
        warnings: [...state.pluginProfile.warnings]
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
    async reset(options = {}) {
      await disposeAsyncResources(state.context, { kind: "session reset" });
      registeredControls.clear();
      if (options.pluginProfile)
        profileRequest = options.pluginProfile;
      state = createWebSessionState(registeredControls, profileRequest, autoLoadPlugins);
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

export { pluginProfileFromUrl, stripMarkedPluginProfile, findHelp, createRixRepl };

//# debugId=B0C6AC9D9CE6D3C064756E2164756E21
//# sourceMappingURL=chunk-y3t673z1.js.map
