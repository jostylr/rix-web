import {
  Context,
  Integer,
  PluginCatalog,
  Rational,
  RationalInterval,
  complete,
  createDefaultRegistry,
  createDefaultSystemContext,
  disposeAsyncResources,
  formatValue,
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
  install24 as install25,
  install25 as install26,
  install3 as install4,
  install4 as install5,
  install5 as install6,
  install6 as install7,
  install7 as install8,
  install8 as install9,
  install9 as install10,
  installRegisteredTypes,
  isOutputValue,
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
} from "./chunk-2aw4havg.js";

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
function install27({ systemContext }) {
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
    prep(args) {
      return args.length >= arity && args.some(isFloat);
    },
    impl(args) {
      return float(fn(...args.map(numberFrom2)));
    }
  };
}
function compareVariant(name, relation) {
  return {
    name,
    prep(args) {
      return args.length === 2 && args.some(isFloat);
    },
    impl(args) {
      return relation(numberFrom2(args[0]), numberFrom2(args[1])) ? new Integer(1n) : null;
    }
  };
}
function prepareFloatComparison(args, _context, evaluate) {
  if (args.length !== 2 || !args.some(isFloat))
    return false;
  try {
    return { args: args.map((value) => requireFloat(value, evaluate)) };
  } catch {
    return false;
  }
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
var install28 = installBrowserApproxMathPlugin;

// src/generated/bundled-plugin-catalog.js
function createBundledPluginCatalog() {
  const catalog = new PluginCatalog;
  catalog.addMetadata({ id: "algebra", description: "Canonical exact univariate polynomials with verified division and portable synthetic-division Grids.", kind: "host", mount: "algebra", exports: ["Polynomial", "Coefficients", "Record", "Evaluate", "Equal", "Divide", "SyntheticDivide", "Quotient", "Remainder", "IsFactor", "Grid"], groups: ["Algebra", "Exact"], permissions: [], requires: ["rix.rational-function@1"], provides: ["rix.algebra.division@1"], schemas: ["rix.algebra.division@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:algebra" }, { sourcePath: "bundled:algebra", kind: "host" });
  catalog.registerInstaller("algebra", install7);
  catalog.addMetadata({ id: "ball", description: "Certified rational midpoint-radius balls and nested square-root refinement.", kind: "rix", mount: "ball", exports: ["Ball", "Interval", "Sqrt", "Midpoint", "Radius", "Lower", "Upper", "Contains", "RoundOut", "Record"], groups: ["Numerics", "Exact"], permissions: [], provides: ["rix.ball@1", "rix.enclosable-real@1"], schemas: ["rix.ball@1", "rix.ball.nested-real@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:ball" }, { source: `/**
id: ball
description: Certified rational midpoint-radius balls and nested square-root refinement.
kind: rix
mount: ball
exports: [Ball, Interval, Sqrt, Midpoint, Radius, Lower, Upper, Contains, RoundOut, Record]
groups: [Numerics, Exact]
permissions: []
provides: [rix.ball@1, rix.enclosable-real@1]
schemas: [rix.ball@1, rix.ball.nested-real@1]
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
        ADD = [{= name=:BallAdd, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallAdd(x, y) }],
        SUB = [{= name=:BallSub, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallSub(x, y) }],
        MUL = [{= name=:BallMul, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallMul(x, y) }],
        DIV = [{= name=:BallDiv, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallDiv(x, y) }],
        NEG = [{= name=:BallNeg, prep=(x) -> x ? :Ball, impl=(x) -> BallNeg(x) }],
        EQ = [{= name=:BallEq, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> BallEq(x, y) }],
        NEQ = [{= name=:BallNeq, prep=(x, y) -> (x ? :Ball) || (y ? :Ball), impl=(x, y) -> !BallEq(x, y) }]
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
  catalog.registerInstaller("canvas", install17);
  catalog.addMetadata({ id: "cauchy", description: "Rational Cauchy sequences with explicit certified tail bounds and moduli.", kind: "rix", mount: "cauchy", exports: ["Sequence", "Certified", "Geometric", "Term", "TailBound", "Modulus", "Enclosure", "Record"], groups: ["Numerics", "Exact"], permissions: [], provides: ["rix.cauchy@1", "rix.refinable@1", "rix.enclosable-real@1"], schemas: ["rix.cauchy.sequence@1", "rix.cauchy.real@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:cauchy" }, { source: `/**
id: cauchy
description: Rational Cauchy sequences with explicit certified tail bounds and moduli.
kind: rix
mount: cauchy
exports: [Sequence, Certified, Geometric, Term, TailBound, Modulus, Enclosure, Record]
groups: [Numerics, Exact]
permissions: []
provides: [rix.cauchy@1, rix.refinable@1, rix.enclosable-real@1]
schemas: [rix.cauchy.sequence@1, rix.cauchy.real@1]
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
  catalog.addMetadata({ id: "continued-fraction", description: "Finite and lazy simple continued fractions with exact convergents and certified enclosures.", kind: "rix", mount: "continuedFraction", aliases: ["cf"], exports: ["Finite", "Lazy", "Periodic", "Sqrt2", "FromRational", "Coefficient", "Coefficients", "Convergent", "Convergents", "Enclosure", "ErrorInterval", "Record"], groups: ["Numerics", "Exact"], permissions: [], provides: ["rix.continued-fraction@1", "rix.refinable@1", "rix.enclosable-real@1"], schemas: ["rix.continued-fraction.finite@1", "rix.continued-fraction.lazy@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:continued-fraction" }, { source: `/**
id: continued-fraction
description: Finite and lazy simple continued fractions with exact convergents and certified enclosures.
kind: rix
mount: continuedFraction
aliases: [cf]
exports: [Finite, Lazy, Periodic, Sqrt2, FromRational, Coefficient, Coefficients, Convergent, Convergents, Enclosure, ErrorInterval, Record]
groups: [Numerics, Exact]
permissions: []
provides: [rix.continued-fraction@1, rix.refinable@1, rix.enclosable-real@1]
schemas: [rix.continued-fraction.finite@1, rix.continued-fraction.lazy@1]
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
          exact = CFConvergent(real, count == _ ?: real[:length] ?_ count);
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
  catalog.registerInstaller("csv", install26);
  catalog.addMetadata({ id: "data", description: "Immutable typed relations with deterministic projection, filtering, sorting, and Table views.", kind: "host", mount: "data", exports: ["Relation", "Project", "Filter", "Sort", "TableView", "Schema", "Rows"], groups: ["Data"], permissions: [], provides: ["rix.data.relation@1"], schemas: ["rix.data.relation@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:data" }, { sourcePath: "bundled:data", kind: "host" });
  catalog.registerInstaller("data", install12);
  catalog.addMetadata({ id: "document", description: "Numbered portable reports with labels, forward references, captions, and small semantic themes.", kind: "host", mount: "document", exports: ["Report", "Label", "Ref", "Theme", "References"], groups: ["Documents"], permissions: [], provides: ["rix.document.report@1"], schemas: ["rix.document.report@1", "rix.document.theme@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:document" }, { sourcePath: "bundled:document", kind: "host" });
  catalog.registerInstaller("document", install13);
  catalog.addMetadata({ id: "draw", description: "Convenient 2D drawing helpers that produce core Graphics nodes.", kind: "host", mount: "draw", exports: ["Line", "Polygon", "Label", "Box", "Circle"], groups: ["Draw"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:draw" }, { sourcePath: "bundled:draw", kind: "host" });
  catalog.registerInstaller("draw", install);
  catalog.addMetadata({ id: "example-array-js", description: "Teaching JavaScript plugin demonstrating array sum, summary text, and reversal.", kind: "host", mount: "arrayJs", exports: ["Sum", "Describe", "Reverse"], groups: ["Examples"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:example-array-js" }, { sourcePath: "bundled:example-array-js", kind: "host" });
  catalog.registerInstaller("example-array-js", install27);
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
  catalog.registerInstaller("float", install28);
  catalog.addMetadata({ id: "fracfun", description: "Form-preserving callable polynomial and rational expressions with explicit transformations and canonical projections.", kind: "host", mount: "fracfun", aliases: ["fractionFunction", "ff"], exports: ["FractionFunction", "Parse", "Var", "Fun"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], requires: ["rix.fraction@1", "rix.rational-function@1"], provides: ["rix.fraction-function@1"], schemas: ["rix.fraction-function@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:fracfun" }, { sourcePath: "bundled:fracfun", kind: "host" });
  catalog.registerInstaller("fracfun", install3);
  catalog.addMetadata({ id: "fraction", description: "Representation-sensitive unreduced integer fractions with mediant and classroom addition policies.", kind: "host", mount: "fraction", aliases: ["frac", "f"], exports: ["Fraction", "Parse", "FromSternBrocotPath"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], provides: ["rix.fraction@1"], schemas: ["rix.fraction@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:fraction" }, { sourcePath: "bundled:fraction", kind: "host" });
  catalog.registerInstaller("fraction", install2);
  catalog.addMetadata({ id: "geometry", description: "Exact ruler-and-compass geometry with explicit intersections and portable Graphics snapshots.", kind: "host", mount: "geometry", exports: ["Point", "Line", "Circle", "Midpoint", "PerpendicularBisector", "Circumcircle", "Intersect", "Points", "Status", "Draw"], groups: ["Geometry", "Graphics", "Exact"], permissions: [], provides: ["rix.geometry@1", "rix.geometry.intersection@1"], schemas: ["rix.geometry@1", "rix.geometry.intersection@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:geometry" }, { sourcePath: "bundled:geometry", kind: "host" });
  catalog.registerInstaller("geometry", install11);
  catalog.addMetadata({ id: "gltf", description: "Browser-safe glTF 2.0 JSON exporter for retained Scene3D values.", kind: "host", mount: "gltf", exports: ["Render"], groups: ["Renderers", "Scene3D"], permissions: [], requires: ["rix.scene3d@1"], provides: ["rix.renderer.gltf@1"], targets: ["gltf", "model/gltf+json"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:gltf" }, { sourcePath: "bundled:gltf", kind: "host" });
  catalog.registerInstaller("gltf", install25);
  catalog.addMetadata({ id: "html", description: "Standalone semantic HTML renderer for portable RiX output trees.", kind: "host", mount: "html", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.html@1"], targets: ["html", "text/html"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:html" }, { sourcePath: "bundled:html", kind: "host" });
  catalog.registerInstaller("html", install20);
  catalog.addMetadata({ id: "latex", description: "Standalone LaTeX renderer for portable RiX documents and figures.", kind: "host", mount: "latex", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.latex@1"], targets: ["latex", "text/x-tex"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:latex" }, { sourcePath: "bundled:latex", kind: "host" });
  catalog.registerInstaller("latex", install22);
  catalog.addMetadata({ id: "markdown", description: "CommonMark-oriented renderer for portable RiX documents.", kind: "host", mount: "markdown", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.markdown@1"], targets: ["markdown", "text/markdown"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:markdown" }, { sourcePath: "bundled:markdown", kind: "host" });
  catalog.registerInstaller("markdown", install19);
  catalog.addMetadata({ id: "nd", description: "Exact n-dimensional geometry with explicit affine and Cayley projection records.", kind: "host", mount: "nd", exports: ["Point", "Polyline", "Polytope", "Hypercube", "Projection", "CoordinateProjection", "CayleyRotation", "Compose", "Project", "ToScene3D"], groups: ["Geometry", "Scene3D", "Exact"], permissions: [], requires: ["rix.scene3d@1"], provides: ["rix.nd@1", "rix.nd.projection@1"], schemas: ["rix.nd@1", "rix.nd.projection@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:nd" }, { sourcePath: "bundled:nd", kind: "host" });
  catalog.registerInstaller("nd", install10);
  catalog.addMetadata({ id: "numerics", description: "Backend-neutral bounded enclosure and refinement orchestration.", kind: "rix", mount: "numerics", exports: ["Request", "WorkPolicy", "EffectiveLimits", "Enclose", "Refine", "Sample", "Capabilities", "CheckResult"], groups: ["Numerics"], permissions: [], provides: ["rix.numerics@1", "rix.enclosable-real-consumer@1"], schemas: ["rix.numerics.refinement-request@1", "rix.numerics.enclosure@1"], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:numerics" }, { source: `/**
id: numerics
description: Backend-neutral bounded enclosure and refinement orchestration.
kind: rix
mount: numerics
exports: [Request, WorkPolicy, EffectiveLimits, Enclose, Refine, Sample, Capabilities, CheckResult]
groups: [Numerics]
permissions: []
provides: [rix.numerics@1, rix.enclosable-real-consumer@1]
schemas: [rix.numerics.refinement-request@1, rix.numerics.enclosure@1]
defaultEnabled: false
**/

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
    Approximation = (self, result) -> result.Has("approximation") ?: result[:approximation] ?_ _,
    Capabilities = (self, value) -> value.NumericsCapabilities(),
    CheckResult = (self, result, options ?= {= }, capabilities ?= _) ->
        CheckEnclosure(result, NumericsRequest(options), capabilities)
};

.Host.RegisterValue("numerics", numericsNamespace, "Backend-neutral bounded enclosure and refinement orchestration", ["Numerics"]);
`, sourcePath: "bundled:numerics", kind: "rix" });
  catalog.addMetadata({ id: "oracle", description: "Exact rational-betweenness oracle demonstrations and bounded refinement.", kind: "rix", mount: "oracle", exports: ["Rational", "Query", "Answer", "Decision", "Prophecy", "WorkPolicy", "Evidence", "Ask", "AskAll", "CheckRange", "Refine"], groups: ["Numerics", "Exact"], permissions: [], provides: ["rix.oracle@1", "rix.enclosable-real@1"], schemas: ["rix.oracle@1"], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:oracle" }, { source: `/**
id: oracle
description: Exact rational-betweenness oracle demonstrations and bounded refinement.
kind: rix
mount: oracle
exports: [Rational, Query, Answer, Decision, Prophecy, WorkPolicy, Evidence, Ask, AskAll, CheckRange, Refine]
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
    real;
};

RationalOracle(value, options ?= {= }) -> {;
    exactValue = value ~!: :Rational;
    procedure = Option(options, "procedure", :singular);
    allowed = {| :singular, :reflexive, :halo, :randomHalo, :bisection |};
    allowed.Has(procedure) ?: BuildRationalOracle(exactValue, procedure, options)
                           ?_ .Error("Unknown rational oracle procedure");
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

OracleRefine(real, options ?= {= }) -> {;
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
        requestedWidth = requestedWidth,
        achievedWidth = achievedWidth,
        approximation = approximation,
        trace = trace,
        work = {= calls = calls, maxCalls = maxCalls, exhausted = !enclosed },
        assumptions = [:rationalConstructor, :range, :existence, :separation],
        evidence = OracleEvidence(:enclosure, :constructorGuarantee, real, low:high)
    };
};

OracleNumericsCapabilities(real) -> {=
    valueKind = :numericsCapabilities,
    schema = "rix.numerics.capabilities@1",
    backend = :oracle,
    representation = :rationalBetweennessOracle,
    operations = [:enclose, :refine],
    evidenceLevels = [:constructorGuarantee],
    certified = 1,
    arbitraryRefinement = 1,
    deterministic = 1,
    minimumWidth = 0,
    provider = real[:provenance]
};

OracleProtocolEnclose(real, request) -> {;
    workRequest = request[:work];
    refined = OracleRefine(real, {=
        width = request[:absoluteWidth],
        maxCalls = workRequest[:maxCalls],
        trace = request[:trace]
    });
    goalMet = refined[:status] == :enclosed;
    diagnostics = [];
    diagnostics = workRequest.Has("timeout") ?: diagnostics.Push(:timeoutNotCooperativelyEnforced) ?_ diagnostics;
    diagnostics = workRequest.Has("memory") ?: diagnostics.Push(:memoryNotCooperativelyEnforced) ?_ diagnostics;
    {=
        valueKind = :enclosure,
        schema = "rix.numerics.enclosure@1",
        status = refined[:status],
        interval = refined[:interval],
        certified = 1,
        goalMet = goalMet,
        requestedWidth = request[:absoluteWidth],
        achievedWidth = refined[:achievedWidth],
        approximation = refined[:approximation],
        evidenceLevel = :constructorGuarantee,
        backend = :oracle,
        operation = request[:operation],
        trace = refined[:trace],
        work = refined[:work],
        diagnostics = diagnostics,
        evidence = refined[:evidence],
        source = real[:provenance]
    };
};

oracleNamespace = {= };
oracleNamespace._proto = {=
    Rational = (self, value, options ?= {= }) -> RationalOracle(value, options),
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

.Host.RegisterValue("oracle", oracleNamespace, "Exact rational-betweenness oracle demonstrations and bounded refinement", ["Numerics", "Exact"]);
`, sourcePath: "bundled:oracle", kind: "rix" });
  catalog.addMetadata({ id: "pdf", description: "PDF document and figure renderer orchestrated through LaTeX.", kind: "host", mount: "pdf", exports: ["Render"], groups: ["Renderers"], permissions: ["process", "files"], provides: ["rix.renderer.pdf@1"], targets: ["pdf", "application/pdf"], snapshot: true, deterministic: false, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:pdf" }, { sourcePath: "bundled:pdf", kind: "host" });
  catalog.registerInstaller("pdf", install24);
  catalog.addMetadata({ id: "plot", description: "Portable plotting helpers that produce core Graphics scenes.", kind: "host", mount: "plot", exports: ["Polynomial"], groups: ["Plot"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:plot" }, { sourcePath: "bundled:plot", kind: "host" });
  catalog.registerInstaller("plot", install8);
  catalog.addMetadata({ id: "png", description: "PNG snapshot renderer for core Graphics through a host rasterizer.", kind: "host", mount: "png", exports: ["Render"], groups: ["Renderers"], permissions: ["process"], provides: ["rix.renderer.png@1"], targets: ["png", "image/png"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:png" }, { sourcePath: "bundled:png", kind: "host" });
  catalog.registerInstaller("png", install23);
  catalog.addMetadata({ id: "poly", description: "Semantic callable univariate polynomials with structural and symbolic entry forms.", kind: "host", mount: "poly", aliases: ["polynomial", "p"], exports: ["Polynomial", "Parse", "Var", "Fun"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], provides: ["rix.polynomial@1"], schemas: ["rix.polynomial@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:poly" }, { sourcePath: "bundled:poly", kind: "host" });
  catalog.registerInstaller("poly", install4);
  catalog.addMetadata({ id: "quarto", description: "Quarto Markdown renderer with front matter and portable figure lowering.", kind: "host", mount: "quarto", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.quarto@1"], targets: ["quarto", "text/x-quarto"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:quarto" }, { sourcePath: "bundled:quarto", kind: "host" });
  catalog.registerInstaller("quarto", install21);
  catalog.addMetadata({ id: "radix", description: "Bounded exact positional expansions and repeating-period analysis for rational values.", kind: "host", mount: "radix", exports: ["Expansion", "Digits", "PeriodLength", "PeriodInfo", "ToString"], groups: ["Exact", "Radix"], permissions: [], defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], provides: [], schemas: [], targets: [], snapshot: false, deterministic: false, operatorFiles: [], ignore: false, sourcePath: "bundled:radix" }, { sourcePath: "bundled:radix", kind: "host" });
  catalog.registerInstaller("radix", install15);
  catalog.addMetadata({ id: "ratfun", description: "Canonical callable univariate rational functions with exact cancellation and Polynomial interoperability.", kind: "host", mount: "ratfun", aliases: ["rationalFunction", "rf"], exports: ["RationalFunction", "Parse", "Var", "Fun"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], requires: ["rix.polynomial@1"], provides: ["rix.rational-function@1"], schemas: ["rix.rational-function@1"], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:ratfun" }, { sourcePath: "bundled:ratfun", kind: "host" });
  catalog.registerInstaller("ratfun", install5);
  catalog.addMetadata({ id: "scene3d", description: "Exact retained 3D scenes with deterministic wireframe and lit Graphics snapshots.", kind: "host", mount: "scene3d", exports: ["Scene", "Group", "Transform", "Mesh", "Polyline", "PointCloud", "Material", "AmbientLight", "DirectionalLight", "PointLight", "PerspectiveCamera", "OrthographicCamera", "Snapshot"], groups: ["Scene3D", "Graphics"], permissions: [], provides: ["rix.scene3d@1"], schemas: ["rix.scene3d@1"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:scene3d" }, { sourcePath: "bundled:scene3d", kind: "host" });
  catalog.registerInstaller("scene3d", install9);
  catalog.addMetadata({ id: "svg", description: "Portable SVG renderer for core Graphics scenes.", kind: "host", mount: "svg", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.svg@1"], targets: ["svg", "image/svg+xml"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:svg" }, { sourcePath: "bundled:svg", kind: "host" });
  catalog.registerInstaller("svg", install16);
  catalog.addMetadata({ id: "symbolic", description: "Meta-plugin loading RiX representation-sensitive Fraction and FractionFunction workspaces.", kind: "host", mount: "symbolic", exports: ["Fraction", "FractionFunction", "Services"], groups: ["Algebra", "Exact", "Symbolic"], permissions: [], requires: ["rix.fraction-function@1"], provides: ["rix.symbolic.formal@1"], schemas: [], snapshot: false, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], optional: [], targets: [], operatorFiles: [], ignore: false, sourcePath: "bundled:symbolic" }, { sourcePath: "bundled:symbolic", kind: "host" });
  catalog.registerInstaller("symbolic", install6);
  catalog.addMetadata({ id: "terminal-ascii", description: "Deterministic strict-ASCII fallback for tables, grids, fragments, and simple Graphics.", kind: "host", mount: "terminalAscii", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.terminal-ascii@1"], targets: ["terminal-ascii", "terminal", "ascii", "txt", "text/plain"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:terminal-ascii" }, { sourcePath: "bundled:terminal-ascii", kind: "host" });
  catalog.registerInstaller("terminal-ascii", install14);
  catalog.addMetadata({ id: "tikz", description: "Editable TikZ/PGF source renderer for core Graphics scenes.", kind: "host", mount: "tikz", exports: ["Render"], groups: ["Renderers"], permissions: [], provides: ["rix.renderer.tikz@1"], targets: ["tikz", "text/x-tikz"], snapshot: true, deterministic: true, defaultEnabled: false, operatorDefinitions: [], aliases: [], requires: [], optional: [], schemas: [], operatorFiles: [], ignore: false, sourcePath: "bundled:tikz" }, { sourcePath: "bundled:tikz", kind: "host" });
  catalog.registerInstaller("tikz", install18);
  return catalog;
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
function createRixRepl({ autoSeparateLines = true } = {}) {
  const state = {
    context: new Context,
    registry: createDefaultRegistry(),
    systemContext: createDefaultSystemContext({ pluginCatalog: createBundledPluginCatalog() })
  };
  let initialNames = new Set(state.context.getAllNames());
  let separateLines = autoSeparateLines;
  return {
    run(source) {
      const topic = inlineHelpRequest(source);
      if (topic !== null)
        return { type: "help", source, ...findHelp(topic) };
      try {
        const reactiveReads = new Set;
        const result = parseAndEvaluate(separateLines ? normalizeReplSource(source) : source, {
          ...state,
          file: "<ratcalc>",
          reactiveReads
        });
        const format = (value) => formatValue(value, { context: state.context, evaluate: null });
        const observedSource = [...reactiveReads].find((candidate) => currentReactiveValue(candidate) === result);
        const makeResponse = (value) => ({
          type: "result",
          source,
          value,
          text: format(value),
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
        const result = await parseAndEvaluateAsync(separateLines ? normalizeReplSource(source) : source, {
          ...state,
          file: "<ratcalc>",
          reactiveReads
        });
        const format = (value) => formatValue(value, { context: state.context, evaluate: null });
        const observedSource = [...reactiveReads].find((candidate) => currentReactiveValue(candidate) === result);
        const makeResponse = (value) => ({
          type: "result",
          source,
          value,
          text: format(value),
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
        value: formatValue(state.context.get(name), { context: state.context, evaluate: null })
      }));
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
      initialNames = new Set(state.context.getAllNames());
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

//# debugId=C1F47BD09C519B5364756E2164756E21
//# sourceMappingURL=chunk-taa0m5nf.js.map
