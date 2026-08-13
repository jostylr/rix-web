import {
  BaseSystem,
  Context,
  Fraction,
  Integer,
  Rational,
  RationalInterval,
  createDefaultRegistry,
  createDefaultSystemContext,
  formatValue,
  parseAndEvaluate
} from "./chunk-qn5vyjst.js";

// ../packages/reals/src/index.js
var LN2_CF = [0, 1, 2, 3, 1, 6, 3, 1, 1, 2, 1, 1, 6, 1, 6, 1, 1, 4, 1, 2, 4, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
var E_CF = [2, 1, 2, 1, 1, 4, 1, 1, 6, 1, 1, 8, 1, 1, 10, 1, 1, 12, 1, 1, 14, 1, 1, 16, 1, 1, 18, 1, 1, 20, 1, 1, 22, 1, 1, 24, 1, 1, 26, 1, 1, 28, 1, 1, 30, 1, 1, 32, 1, 1, 34, 1, 1, 36, 1, 1, 38, 1, 1, 40];
function continuedFractionApproximation(coefficients, terms) {
  if (terms === 0 || coefficients.length === 0) {
    return new Rational(0);
  }
  let num = new Integer(1);
  let den = new Integer(0);
  for (let i = Math.min(terms, coefficients.length) - 1;i >= 0; i--) {
    [num, den] = [den.add(num.multiply(new Integer(coefficients[i]))), num];
  }
  return new Rational(num.value, den.value);
}
function isZero(rational) {
  return rational.numerator === 0n;
}
function isNegative(rational) {
  return rational.numerator < 0n;
}
function floor(rational) {
  if (rational.denominator === 1n) {
    return new Rational(rational.numerator);
  }
  const quotient = rational.numerator / rational.denominator;
  const remainder = rational.numerator % rational.denominator;
  if (remainder === 0n || rational.numerator >= 0n) {
    return new Rational(quotient);
  } else {
    return new Rational(quotient - 1n);
  }
}
function parsePrecision(precision) {
  if (precision === undefined) {
    return { epsilon: new Rational(1, 1e6), negative: true };
  }
  if (precision < 0) {
    const denominator = new Integer(10).pow(-precision);
    return { epsilon: new Rational(1, denominator.value), negative: true };
  } else {
    return { epsilon: new Rational(1, precision), negative: false };
  }
}
function createTightRationalInterval(value, precision) {
  const { epsilon } = parsePrecision(precision);
  const epsilonDecimal = epsilon.toNumber();
  const lowerDecimal = value - epsilonDecimal;
  const upperDecimal = value + epsilonDecimal;
  const precisionScale = Math.min(1e9, Math.max(1e6, Math.ceil(1 / epsilonDecimal)));
  const lower = new Rational(Math.floor(lowerDecimal * precisionScale), precisionScale);
  const upper = new Rational(Math.ceil(upperDecimal * precisionScale), precisionScale);
  return new RationalInterval(lower, upper);
}
function getConstant(cfCoefficients, precision) {
  const { epsilon } = parsePrecision(precision);
  let terms = 2;
  let prev = continuedFractionApproximation(cfCoefficients, terms - 1);
  let curr = continuedFractionApproximation(cfCoefficients, terms);
  while (terms < cfCoefficients.length && curr.subtract(prev).abs().compareTo(epsilon) > 0) {
    terms++;
    prev = curr;
    curr = continuedFractionApproximation(cfCoefficients, terms);
  }
  const lower = prev.compareTo(curr) < 0 ? prev : curr;
  const upper = prev.compareTo(curr) > 0 ? prev : curr;
  return new RationalInterval(lower, upper);
}
var E = (precision) => getConstant(E_CF, precision);
function EXP(x, precision) {
  if (x === undefined) {
    return E(precision);
  }
  const { epsilon } = parsePrecision(precision);
  if (x instanceof RationalInterval) {
    const lower = EXP(x.low, precision);
    const upper = EXP(x.high, precision);
    return new RationalInterval(lower.low, upper.high);
  }
  if (!(x instanceof Rational)) {
    x = new Rational(x);
  }
  if (isZero(x)) {
    return new RationalInterval(new Rational(1), new Rational(1));
  }
  const ln2Interval = getConstant(LN2_CF, precision);
  const ln2Approx = ln2Interval.low.add(ln2Interval.high).divide(new Rational(2));
  const k = floor(x.divide(ln2Approx));
  const r = x.subtract(k.multiply(ln2Approx));
  if (isNegative(r)) {
    const kAdjusted = k.subtract(new Rational(1));
    const rAdjusted = x.subtract(kAdjusted.multiply(ln2Approx));
    return EXP(rAdjusted, precision).multiply(new Rational(new Integer(2).pow(kAdjusted.numerator >= 0n ? kAdjusted.numerator : -kAdjusted.numerator).value, 1));
  }
  let expR;
  let sum = new Rational(1);
  let term = new Rational(1);
  let n = 1;
  let converged = false;
  while (term.abs().compareTo(epsilon) > 0 && n < 50) {
    term = term.multiply(r).divide(new Rational(n));
    sum = sum.add(term);
    n++;
    if (sum.denominator > 1000000000n || term.denominator > 1000000000n) {
      break;
    }
    if (term.abs().compareTo(epsilon) <= 0) {
      converged = true;
      break;
    }
  }
  if (converged && sum.denominator <= 1000000000n) {
    const errorBound = term.abs().multiply(new Rational(2));
    expR = new RationalInterval(sum.subtract(errorBound), sum.add(errorBound));
  } else {
    const rDecimal = r.toNumber();
    const expRDecimal = Math.exp(rDecimal);
    expR = createTightRationalInterval(expRDecimal, precision);
  }
  if (isZero(k)) {
    return expR;
  }
  const twoToK = new Rational(new Integer(2).pow(k.numerator >= 0n ? k.numerator : -k.numerator).value, 1);
  if (isNegative(k)) {
    return expR.divide(twoToK);
  } else {
    return expR.multiply(twoToK);
  }
}
function LN(x, precision) {
  const { epsilon } = parsePrecision(precision);
  if (x instanceof RationalInterval) {
    if (isNegative(x.low) || isZero(x.low)) {
      throw new Error("LN: argument must be positive");
    }
    const lower = LN(x.low, precision);
    const upper = LN(x.high, precision);
    return new RationalInterval(lower.low, upper.high);
  }
  if (!(x instanceof Rational)) {
    x = new Rational(x);
  }
  if (isNegative(x) || isZero(x)) {
    throw new Error("LN: argument must be positive");
  }
  if (x.equals(new Rational(1))) {
    return new RationalInterval(new Rational(0), new Rational(0));
  }
  let k = 0;
  let xScaled = x;
  if (x.compareTo(new Rational(1)) > 0) {
    while (xScaled.compareTo(new Rational(2)) >= 0) {
      xScaled = xScaled.divide(new Rational(2));
      k++;
    }
  } else {
    while (xScaled.compareTo(new Rational(1)) < 0) {
      xScaled = xScaled.multiply(new Rational(2));
      k--;
    }
  }
  const y = xScaled.subtract(new Rational(1));
  let lnM;
  let sum = new Rational(0);
  let term = y;
  let n = 1;
  let converged = false;
  while (term.abs().compareTo(epsilon) > 0 && n < 50) {
    sum = sum.add(term.divide(new Rational(n)));
    n++;
    term = term.multiply(y).negate();
    if (sum.denominator > 1000000000n || term.denominator > 1000000000n) {
      break;
    }
    if (term.abs().compareTo(epsilon) <= 0) {
      converged = true;
      break;
    }
  }
  if (converged && sum.denominator <= 1000000000n) {
    const errorBound = term.abs().divide(new Rational(n));
    lnM = new RationalInterval(sum.subtract(errorBound), sum.add(errorBound));
  } else {
    const xScaledDecimal = xScaled.toNumber();
    const lnMDecimal = Math.log(xScaledDecimal);
    lnM = createTightRationalInterval(lnMDecimal, precision);
  }
  if (k === 0) {
    return lnM;
  }
  const ln2Interval = getConstant(LN2_CF, precision);
  const kLn2 = ln2Interval.multiply(new Rational(k));
  return lnM.add(kLn2);
}
function newtonRoot(q, n, precision) {
  const { epsilon } = parsePrecision(precision);
  if (!(q instanceof Rational)) {
    q = new Rational(q);
  }
  if (n <= 0) {
    throw new Error("Root degree must be positive");
  }
  if (n === 1) {
    return new RationalInterval(q, q);
  }
  if (isNegative(q) && n % 2 === 0) {
    throw new Error("Even root of negative number");
  }
  const qDecimal = q.toNumber();
  const initialGuess = Math.pow(qDecimal, 1 / n);
  let a = new Rational(Math.round(initialGuess * 1000), 1000);
  let iterations = 0;
  const maxIterations = 100;
  while (iterations < maxIterations) {
    let aPower = a;
    for (let i = 1;i < n - 1; i++) {
      aPower = aPower.multiply(a);
    }
    const b = q.divide(aPower);
    const diff = b.subtract(a).abs();
    if (diff.compareTo(epsilon) <= 0) {
      const lower = a.compareTo(b) < 0 ? a : b;
      const upper = a.compareTo(b) > 0 ? a : b;
      return new RationalInterval(lower, upper);
    }
    if (a.denominator > 100000000000n || b.denominator > 100000000000n) {
      const aDecimal = a.toNumber();
      const bDecimal = b.toNumber();
      if (!isNaN(aDecimal) && !isNaN(bDecimal)) {
        const lowerDecimal = Math.min(aDecimal, bDecimal);
        const upperDecimal = Math.max(aDecimal, bDecimal);
        const precisionScale = 1e7;
        const lowerRational = new Rational(Math.floor(lowerDecimal * precisionScale), precisionScale);
        const upperRational = new Rational(Math.ceil(upperDecimal * precisionScale), precisionScale);
        return new RationalInterval(lowerRational, upperRational);
      }
    }
    a = a.add(b.subtract(a).divide(new Rational(n)));
    iterations++;
  }
  throw new Error("Newton's method did not converge");
}
function rationalIntervalPower(base, exponent, precision) {
  if (exponent instanceof Integer) {
    exponent = exponent.toRational();
  } else if (typeof exponent === "bigint") {
    exponent = new Rational(exponent);
  } else if (typeof exponent === "number") {
    exponent = new Rational(exponent);
  }
  if (exponent instanceof Rational && exponent.denominator <= 10n) {
    const root = newtonRoot(base, Number(exponent.denominator), precision);
    if (exponent.numerator === 1n) {
      return root;
    }
    let result = root;
    const numeratorNum = Number(exponent.numerator);
    for (let i = 1;i < Math.abs(numeratorNum); i++) {
      result = result.multiply(root);
    }
    if (numeratorNum < 0) {
      return new RationalInterval(new Rational(1), new Rational(1)).divide(result);
    }
    return result;
  }
  const lnBase = LN(base, precision);
  const product = lnBase.multiply(exponent);
  if (product instanceof RationalInterval) {
    return EXP(product, precision);
  } else {
    return EXP(product, precision);
  }
}

// ../packages/parser/src/index.js
var DEFAULT_PRECISION = -6;
function parseDecimalUncertainty(str, options = {}) {
  const allowIntegerRangeNotation = options.allowIntegerRangeNotation !== false;
  const inputBase = options.inputBase || BaseSystem.DECIMAL;
  const uncertaintyMatch = str.match(/^(-?[@\w./:^]+)\[([^\]]+)\]((?:[Ee][+-]?[\w]+|\_?\^-?[\w]+)?)$/);
  if (!uncertaintyMatch) {
    throw new Error("Invalid uncertainty format");
  }
  const baseStr = uncertaintyMatch[1];
  const uncertaintyStr = uncertaintyMatch[2];
  const trailingPart = uncertaintyMatch[3];
  if (uncertaintyStr.includes(",")) {
    throw new Error("Decimal interval notation requires ':' between bracketed values");
  }
  const finalize = (interval) => {
    if (trailingPart) {
      const multiplier = parseRepeatingDecimalOrRegular("1" + trailingPart, inputBase);
      return interval.multiply(multiplier);
    }
    return interval;
  };
  const afterDecimalMatch = baseStr.match(/^(-?[\w./:^]+\.)$/);
  if (afterDecimalMatch && !uncertaintyStr.includes("+") && !uncertaintyStr.includes("-")) {
    return finalize(parseDecimalPointUncertainty(baseStr, uncertaintyStr, inputBase, options));
  }
  const baseValue = parseBaseNotation(baseStr, inputBase, { ...options, typeAware: true });
  const decimalMatch = baseStr.match(/\.([\w^/_]+)$/);
  const baseDecimalPlaces = decimalMatch ? decimalMatch[1].length : 0;
  let result;
  if (uncertaintyStr.includes(":") && !uncertaintyStr.includes("+") && !uncertaintyStr.includes("-")) {
    if (baseDecimalPlaces === 0 && !allowIntegerRangeNotation) {
      throw new Error("Range notation on integer bases is not supported in this context");
    }
    const rangeParts = uncertaintyStr.split(/\s*:\s*/);
    if (rangeParts.length !== 2 || rangeParts.some((part) => part.length === 0)) {
      throw new Error("Range notation must have exactly two values separated by colon");
    }
    const lowerUncertainty = rangeParts[0].trim();
    const upperUncertainty = rangeParts[1].trim();
    const hasConfusingENotation = inputBase.base === 10 && (baseStr.includes("E") || baseStr.includes("e")) || baseStr.includes("_^");
    if (hasConfusingENotation) {
      throw new Error("Uncertainty notation cannot be used with scientific notation in the base value");
    }
    const isValidForBase = (s) => {
      if (inputBase.isValidString(s.replace(".", "")))
        return true;
      if (inputBase.base <= 36) {
        return inputBase.isValidString(s.replace(".", "").toLowerCase());
      }
      return false;
    };
    if (!isValidForBase(lowerUncertainty) || !isValidForBase(upperUncertainty)) {
      throw new Error(`Range values must be valid for base ${inputBase.base}`);
    }
    const lowerBoundStr = baseStr + lowerUncertainty;
    const upperBoundStr = baseStr + upperUncertainty;
    const lowerBoundResult = parseBaseNotation(lowerBoundStr, inputBase, { ...options, typeAware: true });
    const upperBoundResult = parseBaseNotation(upperBoundStr, inputBase, { ...options, typeAware: true });
    let lowerBound = lowerBoundResult instanceof Integer ? lowerBoundResult.toRational() : lowerBoundResult;
    let upperBound = upperBoundResult instanceof Integer ? upperBoundResult.toRational() : upperBoundResult;
    result = lowerBound.greaterThan(upperBound) ? new RationalInterval(upperBound, lowerBound) : new RationalInterval(lowerBound, upperBound);
  } else if (uncertaintyStr.startsWith("+-") || uncertaintyStr.startsWith("-+")) {
    const offsetStr = uncertaintyStr.substring(2);
    if (!offsetStr) {
      throw new Error("Symmetric notation must have a valid number after +- or -+");
    }
    const offset = parseRepeatingDecimalOrRegular(offsetStr, inputBase);
    const baseVal = BigInt(inputBase.base);
    if (baseDecimalPlaces === 0 && !baseStr.includes(".")) {
      const upperBound = baseValue.add(offset);
      const lowerBound = baseValue.subtract(offset);
      result = new RationalInterval(lowerBound, upperBound);
    } else {
      const lastPlaceScale = new Rational(1).divide(new Rational(baseVal).pow(baseDecimalPlaces));
      const scaledOffset = offset.multiply(lastPlaceScale);
      const upperBound = baseValue.add(scaledOffset);
      const lowerBound = baseValue.subtract(scaledOffset);
      result = new RationalInterval(lowerBound, upperBound);
    }
  } else {
    const relativeParts = uncertaintyStr.split(/\s*:\s*/).map((s) => s.trim());
    if (relativeParts.length > 2 || relativeParts.length === 0) {
      throw new Error("Relative notation must have one or two values separated by colon");
    }
    const hasConfusingENotation = inputBase.base === 10 && (baseStr.includes("E") || baseStr.includes("e")) || baseStr.includes("_^");
    if (hasConfusingENotation) {
      throw new Error("Uncertainty notation cannot be used with scientific notation in the base value");
    }
    let positiveOffset = null;
    let negativeOffset = null;
    for (const part of relativeParts) {
      if (part.startsWith("+")) {
        if (positiveOffset !== null)
          throw new Error("Only one positive offset allowed");
        const offsetStr = part.substring(1);
        if (!offsetStr)
          throw new Error("Offset must be a valid number");
        positiveOffset = parseRepeatingDecimalOrRegular(offsetStr, inputBase);
      } else if (part.startsWith("-")) {
        if (negativeOffset !== null)
          throw new Error("Only one negative offset allowed");
        const offsetStr = part.substring(1);
        if (!offsetStr)
          throw new Error("Offset must be a valid number");
        negativeOffset = parseRepeatingDecimalOrRegular(offsetStr, inputBase);
      } else {
        throw new Error("Relative notation values must start with + or -");
      }
    }
    if (positiveOffset === null)
      positiveOffset = new Integer(0);
    if (negativeOffset === null)
      negativeOffset = new Integer(0);
    const baseVal = BigInt(inputBase.base);
    let upperBound, lowerBound;
    if (baseDecimalPlaces === 0 && !baseStr.includes(".")) {
      upperBound = baseValue.add(positiveOffset);
      lowerBound = baseValue.subtract(negativeOffset);
    } else {
      const lastPlaceScale = new Rational(1).divide(new Rational(baseVal).pow(baseDecimalPlaces));
      const scaledPositiveOffset = positiveOffset.multiply(lastPlaceScale);
      const scaledNegativeOffset = negativeOffset.multiply(lastPlaceScale);
      upperBound = baseValue.add(scaledPositiveOffset);
      lowerBound = baseValue.subtract(scaledNegativeOffset);
    }
    result = new RationalInterval(lowerBound, upperBound);
  }
  return finalize(result);
}
function parseDecimalPointUncertainty(baseStr, uncertaintyStr, baseSystem = BaseSystem.DECIMAL, options = {}) {
  if (uncertaintyStr.includes(":")) {
    const rangeParts = uncertaintyStr.split(/\s*:\s*/);
    if (rangeParts.length !== 2 || rangeParts.some((part) => part.length === 0)) {
      throw new Error("Range notation must have exactly two values separated by colon");
    }
    const lowerStr = rangeParts[0].trim();
    const upperStr = rangeParts[1].trim();
    const lowerBound = parseDecimalPointEndpoint(baseStr, lowerStr, baseSystem, options);
    const upperBound = parseDecimalPointEndpoint(baseStr, upperStr, baseSystem, options);
    return new RationalInterval(lowerBound, upperBound);
  } else {
    throw new Error("Invalid uncertainty format for decimal point notation");
  }
}
function parseDecimalPointEndpoint(baseStr, endpointStr, baseSystem = BaseSystem.DECIMAL, options = {}) {
  if (endpointStr.startsWith("#")) {
    const fullStr = baseStr + endpointStr;
    return parseRepeatingDecimal(fullStr);
  } else {
    const fullStr = baseStr + endpointStr;
    try {
      const result = parseBaseNotation(fullStr, baseSystem, { ...options, typeAware: true });
      return result instanceof Integer ? result.toRational() : result;
    } catch (e) {
      throw new Error(`Invalid endpoint format: ${endpointStr}`);
    }
  }
}
function parseRepeatingDecimalOrRegular(str, baseSystem = BaseSystem.DECIMAL) {
  if (str.includes("#")) {
    let eNotationIndex = -1;
    let eNotationType = null;
    const explicitSciIndex = str.indexOf("_^");
    if (explicitSciIndex !== -1) {
      eNotationIndex = explicitSciIndex;
      eNotationType = "_^";
    } else if (baseSystem.base === 10) {
      const eIndex = str.toUpperCase().indexOf("E");
      if (eIndex !== -1) {
        eNotationIndex = eIndex;
        eNotationType = "E";
      }
    }
    if (eNotationIndex !== -1) {
      const repeatingPart = str.substring(0, eNotationIndex);
      const exponentPart = str.substring(eNotationIndex + (eNotationType === "_^" ? 2 : 1));
      const absExponentPart = exponentPart.startsWith("-") ? exponentPart.substring(1) : exponentPart;
      if (!baseSystem.isValidString(absExponentPart)) {
        throw new Error(`${eNotationType} notation exponent must be a valid integer in base ${baseSystem.base}`);
      }
      const baseValue = parseRepeatingDecimal(repeatingPart);
      const exponent = baseSystem.toDecimal(exponentPart);
      const scaleBaseNum = eNotationType === "E" ? 10 : baseSystem.base;
      const scaleBaseRatio = new Rational(BigInt(scaleBaseNum));
      let scale;
      if (exponent >= 0n) {
        scale = scaleBaseRatio.pow(exponent);
      } else {
        scale = new Rational(1).divide(scaleBaseRatio.pow(-exponent));
      }
      return baseValue.multiply(scale);
    } else {
      return parseRepeatingDecimal(str);
    }
  } else {
    return parseBaseNotation(str, baseSystem);
  }
}
function parseRepeatingDecimal(str) {
  if (!str || typeof str !== "string") {
    throw new Error("Input must be a non-empty string");
  }
  str = str.trim();
  if (str.includes("[") && str.includes("]")) {
    return parseDecimalUncertainty(str, { allowIntegerRangeNotation: false });
  }
  if (str.includes(":")) {
    return parseRepeatingDecimalInterval(str);
  }
  const isNegative2 = str.startsWith("-");
  if (isNegative2) {
    str = str.substring(1);
  }
  if (!str.includes("#")) {
    return parseNonRepeatingDecimal(str, isNegative2);
  }
  const parts = str.split("#");
  if (parts.length !== 2) {
    throw new Error('Invalid repeating decimal format. Use format like "0.12#45"');
  }
  const [nonRepeatingPart, repeatingPart] = parts;
  if (!/^\d+$/.test(repeatingPart)) {
    throw new Error("Repeating part must contain only digits");
  }
  if (repeatingPart === "0") {
    try {
      const decimalParts2 = nonRepeatingPart.split(".");
      if (decimalParts2.length > 2) {
        throw new Error("Invalid decimal format - multiple decimal points");
      }
      const integerPart2 = decimalParts2[0] || "0";
      const fractionalPart2 = decimalParts2[1] || "";
      if (!/^\d*$/.test(integerPart2) || !/^\d*$/.test(fractionalPart2)) {
        throw new Error("Decimal must contain only digits and at most one decimal point");
      }
      let numerator2, denominator2;
      if (!fractionalPart2) {
        numerator2 = BigInt(integerPart2);
        denominator2 = 1n;
      } else {
        numerator2 = BigInt(integerPart2 + fractionalPart2);
        denominator2 = 10n ** BigInt(fractionalPart2.length);
      }
      const rational = new Rational(numerator2, denominator2);
      return isNegative2 ? rational.negate() : rational;
    } catch (error) {
      throw new Error(`Invalid decimal format: ${error.message}`);
    }
  }
  const decimalParts = nonRepeatingPart.split(".");
  if (decimalParts.length > 2) {
    throw new Error("Invalid decimal format - multiple decimal points");
  }
  const integerPart = decimalParts[0] || "0";
  const fractionalPart = decimalParts[1] || "";
  if (!/^\d*$/.test(integerPart) || !/^\d*$/.test(fractionalPart)) {
    throw new Error("Non-repeating part must contain only digits and at most one decimal point");
  }
  const n = fractionalPart.length;
  const m = repeatingPart.length;
  const abcStr = integerPart + fractionalPart + repeatingPart;
  const abStr = integerPart + fractionalPart;
  const abc = BigInt(abcStr);
  const ab = BigInt(abStr);
  const powerOfTenN = 10n ** BigInt(n);
  const powerOfTenM = 10n ** BigInt(m);
  const denominator = powerOfTenN * (powerOfTenM - 1n);
  const numerator = abc - ab;
  let result = new Rational(numerator, denominator);
  return isNegative2 ? result.negate() : result;
}
function parseNonRepeatingDecimal(str, isNegative2) {
  const decimalParts = str.split(".");
  if (decimalParts.length > 2) {
    throw new Error("Invalid decimal format - multiple decimal points");
  }
  const integerPart = decimalParts[0] || "0";
  const fractionalPart = decimalParts[1] || "";
  if (!/^\d+$/.test(integerPart) || !/^\d*$/.test(fractionalPart)) {
    throw new Error("Decimal must contain only digits and at most one decimal point");
  }
  if (!fractionalPart) {
    const rational = new Rational(integerPart);
    return isNegative2 ? rational.negate() : rational;
  }
  const lastDigitPlace = 10n ** BigInt(fractionalPart.length + 1);
  const baseValue = BigInt(integerPart + fractionalPart);
  let lower, upper;
  if (isNegative2) {
    const lowerNumerator = -(baseValue * 10n + 5n);
    const upperNumerator = -(baseValue * 10n - 5n);
    lower = new Rational(lowerNumerator, lastDigitPlace);
    upper = new Rational(upperNumerator, lastDigitPlace);
  } else {
    const lowerNumerator = baseValue * 10n - 5n;
    const upperNumerator = baseValue * 10n + 5n;
    lower = new Rational(lowerNumerator, lastDigitPlace);
    upper = new Rational(upperNumerator, lastDigitPlace);
  }
  return new RationalInterval(lower, upper);
}
function parseRepeatingDecimalInterval(str) {
  const parts = str.split(":");
  if (parts.length !== 2) {
    throw new Error('Invalid interval format. Use format like "0.#3:0.5#0"');
  }
  const leftEndpoint = parseRepeatingDecimal(parts[0].trim());
  const rightEndpoint = parseRepeatingDecimal(parts[1].trim());
  if (leftEndpoint instanceof RationalInterval || rightEndpoint instanceof RationalInterval) {
    throw new Error("Nested intervals are not supported");
  }
  return new RationalInterval(leftEndpoint, rightEndpoint);
}
function parseBaseNotation(numberStr, baseSystem, options = {}) {
  if (/\[[0-9a-zA-Z]+\]$/.test(numberStr) && !numberStr.startsWith("0z[")) {
    throw new Error(`Bracket base notation (Value[Base]) is no longer supported. Use prefix notation (0xValue, 0bValue) or the BASE command. Offending string: '${numberStr}'`);
  }
  let isNegative2 = false;
  if (numberStr.startsWith("-")) {
    isNegative2 = true;
    numberStr = numberStr.substring(1);
  }
  const customBaseMatch = numberStr.match(/^0z\[(\d+)\]/i);
  if (customBaseMatch) {
    const baseValue = parseInt(customBaseMatch[1], 10);
    try {
      baseSystem = BaseSystem.fromBase(baseValue);
    } catch (e) {
      throw new Error(`Invalid custom base '0z[${baseValue}]': ${e.message}`);
    }
    numberStr = numberStr.substring(customBaseMatch[0].length);
  } else {
    const prefixMatch = numberStr.match(/^0([a-zA-Z])/);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      const registeredBase = BaseSystem.getSystemForPrefix(prefix);
      if (registeredBase) {
        baseSystem = registeredBase;
        numberStr = numberStr.substring(2);
      } else if (prefix === "D") {
        numberStr = numberStr.substring(2);
      } else {
        if (prefix.toLowerCase() !== "e") {
          throw new Error(`Invalid or unregistered prefix '0${prefix}' for string '${numberStr}'`);
        }
      }
    }
  }
  let eNotationIndex = -1;
  let eNotationType = null;
  const explicitSciIndex = numberStr.indexOf("_^");
  if (explicitSciIndex !== -1) {
    eNotationIndex = explicitSciIndex;
    eNotationType = "_^";
  } else {
    if (baseSystem.base === 10) {
      const upperStr = numberStr.toUpperCase();
      const eIndex = upperStr.indexOf("E");
      if (eIndex !== -1) {
        eNotationIndex = eIndex;
        eNotationType = "E";
      }
    }
  }
  let baseNumber = numberStr;
  let exponentStr = null;
  if (eNotationIndex !== -1) {
    baseNumber = numberStr.substring(0, eNotationIndex);
    const exponentStart = eNotationIndex + (eNotationType === "_^" ? 2 : 1);
    exponentStr = numberStr.substring(exponentStart);
    if (!baseSystem.isValidString(exponentStr.replace("-", ""))) {
      throw new Error(`Invalid exponent "${exponentStr}" for base ${baseSystem.base}`);
    }
  }
  if (baseSystem.base <= 36 && baseSystem.base > 10) {
    const usesLowercase = baseSystem.characters.some((char) => char >= "a" && char <= "z");
    const usesUppercase = baseSystem.characters.some((char) => char >= "A" && char <= "Z");
    if (usesLowercase && !usesUppercase) {
      baseNumber = baseNumber.toLowerCase();
      if (exponentStr) {
        exponentStr = exponentStr.toLowerCase();
      }
    } else if (usesUppercase && !usesLowercase) {
      baseNumber = baseNumber.toUpperCase();
      if (exponentStr) {
        exponentStr = exponentStr.toUpperCase();
      }
    }
  }
  if (eNotationIndex !== -1) {
    const baseValue = parseBaseNotation(baseNumber, baseSystem, options);
    let exponentDecimal;
    if (exponentStr.startsWith("-")) {
      const positiveExponent = baseSystem.toDecimal(exponentStr.substring(1));
      exponentDecimal = -positiveExponent;
    } else {
      exponentDecimal = baseSystem.toDecimal(exponentStr);
    }
    let powerOfBase;
    const baseBigInt = BigInt(baseSystem.base);
    if (exponentDecimal >= 0n) {
      powerOfBase = new Rational(baseBigInt ** exponentDecimal);
    } else {
      powerOfBase = new Rational(1n, baseBigInt ** -exponentDecimal);
    }
    let baseRational;
    if (baseValue instanceof Integer) {
      baseRational = baseValue.toRational();
    } else if (baseValue instanceof Rational) {
      baseRational = baseValue;
    } else {
      throw new Error("E notation can only be applied to simple numbers, not intervals");
    }
    let result = baseRational.multiply(powerOfBase);
    if (isNegative2) {
      result = result.negate();
    }
    return options.typeAware && result.denominator === 1n ? new Integer(result.numerator) : result;
  }
  if (baseNumber.includes(":")) {
    const parts = baseNumber.split(":");
    if (parts.length !== 2) {
      throw new Error('Base notation intervals must have exactly two endpoints separated by ":"');
    }
    const leftStr = isNegative2 ? "-" + parts[0].trim() : parts[0].trim();
    const leftValue = parseBaseNotation(leftStr, baseSystem, options);
    const rightValue = parseBaseNotation(parts[1].trim(), baseSystem, options);
    let leftRational, rightRational;
    if (leftValue instanceof Integer) {
      leftRational = leftValue.toRational();
    } else if (leftValue instanceof Rational) {
      leftRational = leftValue;
    } else if (leftValue instanceof RationalInterval && leftValue.low.equals(leftValue.high)) {
      leftRational = leftValue.low;
    } else {
      throw new Error("Interval endpoints must be single values, not intervals");
    }
    if (rightValue instanceof Integer) {
      rightRational = rightValue.toRational();
    } else if (rightValue instanceof Rational) {
      rightRational = rightValue;
    } else if (rightValue instanceof RationalInterval && rightValue.low.equals(rightValue.high)) {
      rightRational = rightValue.low;
    } else {
      throw new Error("Interval endpoints must be single values, not intervals");
    }
    const interval = new RationalInterval(leftRational, rightRational);
    interval._explicitInterval = true;
    return interval;
  }
  if (baseNumber.includes("..")) {
    const parts = baseNumber.split("..");
    if (parts.length !== 2) {
      throw new Error('Mixed number notation must have exactly one ".." separator');
    }
    const wholePart = parts[0].trim();
    const fractionPart = parts[1].trim();
    if (!fractionPart.includes("/")) {
      throw new Error('Mixed number fractional part must contain "/"');
    }
    const wholeDecimal = baseSystem.toDecimal(wholePart);
    let wholeRational = new Rational(wholeDecimal);
    if (isNegative2) {
      wholeRational = wholeRational.negate();
    }
    const fractionResult = parseBaseNotation(fractionPart, baseSystem, options);
    let fractionRational;
    if (fractionResult instanceof Integer) {
      fractionRational = fractionResult.toRational();
    } else if (fractionResult instanceof Rational) {
      fractionRational = fractionResult;
    } else {
      throw new Error("Mixed number fractional part must be a simple fraction");
    }
    if (wholeRational.numerator < 0n) {
      const result = wholeRational.subtract(fractionRational.abs());
      return options.typeAware && result.denominator === 1n ? new Integer(result.numerator) : result;
    } else {
      const result = wholeRational.add(fractionRational);
      return options.typeAware && result.denominator === 1n ? new Integer(result.numerator) : result;
    }
  }
  if (baseNumber.includes("/")) {
    const parts = baseNumber.split("/");
    if (parts.length !== 2) {
      throw new Error('Fraction notation must have exactly one "/" separator');
    }
    const numeratorStr = parts[0].trim();
    const denominatorStr = parts[1].trim();
    const numeratorResult = parseBaseNotation(numeratorStr, baseSystem, options);
    const denominatorResult = parseBaseNotation(denominatorStr, baseSystem, options);
    const numRat = numeratorResult instanceof Integer ? numeratorResult.toRational() : numeratorResult;
    const denRat = denominatorResult instanceof Integer ? denominatorResult.toRational() : denominatorResult;
    if (denRat.numerator === 0n) {
      throw new Error("Denominator cannot be zero");
    }
    let result = numRat.divide(denRat);
    if (isNegative2) {
      result = result.negate();
    }
    result._explicitFraction = true;
    return result;
  }
  if (baseNumber.includes(".")) {
    const parts = baseNumber.split(".");
    if (parts.length !== 2) {
      throw new Error('Decimal notation must have exactly one "." separator');
    }
    const integerPart = parts[0] || "0";
    const fractionalPart = parts[1] || "";
    const fullStr = integerPart + fractionalPart;
    if (!baseSystem.isValidString(fullStr)) {
      throw new Error(`String "${baseNumber}" contains characters not valid for ${baseSystem.name}`);
    }
    const integerDecimal = baseSystem.toDecimal(integerPart);
    let fractionalDecimal = 0n;
    const baseBigInt = BigInt(baseSystem.base);
    for (let i = 0;i < fractionalPart.length; i++) {
      const digitChar = fractionalPart[i];
      const digitValue = BigInt(baseSystem.charMap.get(digitChar));
      fractionalDecimal = fractionalDecimal * baseBigInt + digitValue;
    }
    const denominator = baseBigInt ** BigInt(fractionalPart.length);
    const totalNumerator = integerDecimal * denominator + fractionalDecimal;
    let result = new Rational(totalNumerator, denominator);
    if (isNegative2) {
      result = result.negate();
    }
    return options.typeAware && result.denominator === 1n ? new Integer(result.numerator) : result;
  }
  if (!baseSystem.isValidString(baseNumber)) {
    throw new Error(`String "${baseNumber}" contains characters not valid for ${baseSystem.name}`);
  }
  let decimalValue = baseSystem.toDecimal(baseNumber);
  if (isNegative2) {
    decimalValue = -decimalValue;
  }
  if (options.typeAware) {
    return new Integer(decimalValue);
  } else {
    return new Rational(decimalValue);
  }
}

class Parser {
  static parse(expression, options = {}) {
    if (!expression || expression.trim() === "") {
      throw new Error("Expression cannot be empty");
    }
    options = { typeAware: true, ...options };
    expression = expression.replace(/ E/g, "TE");
    expression = expression.replace(/\/ /g, "/S");
    let cleanExpr = "";
    let inString = false;
    let i = 0;
    while (i < expression.length) {
      const c = expression[i];
      if (c === '"') {
        if (inString) {
          let backslashCount = 0;
          let j = i - 1;
          while (j >= 0 && expression[j] === "\\") {
            backslashCount++;
            j--;
          }
          if (backslashCount % 2 === 0) {
            inString = false;
          }
        } else {
          inString = true;
        }
        cleanExpr += c;
      } else {
        if (inString) {
          cleanExpr += c;
        } else if (!/\s/.test(c)) {
          cleanExpr += c;
        }
      }
      i++;
    }
    expression = cleanExpr;
    const result = Parser.#parseOr(expression, options);
    if (result.remainingExpr.length > 0) {
      throw new Error(`Unexpected token at end: ${result.remainingExpr}`);
    }
    return result.value;
  }
  static #parseOr(expr, options = {}) {
    let result = Parser.#parseAnd(expr, options);
    let currentExpr = result.remainingExpr;
    while (currentExpr.startsWith("||")) {
      currentExpr = currentExpr.substring(2);
      const rightResult = Parser.#parseAnd(currentExpr, options);
      currentExpr = rightResult.remainingExpr;
      const leftTruthy = Parser.#isTruthy(result.value);
      const rightTruthy = Parser.#isTruthy(rightResult.value);
      result.value = new Integer(leftTruthy || rightTruthy ? 1n : 0n);
    }
    return {
      value: result.value,
      remainingExpr: currentExpr
    };
  }
  static #parseAnd(expr, options = {}) {
    let result = Parser.#parseComparison(expr, options);
    let currentExpr = result.remainingExpr;
    while (currentExpr.startsWith("&&")) {
      currentExpr = currentExpr.substring(2);
      const rightResult = Parser.#parseComparison(currentExpr, options);
      currentExpr = rightResult.remainingExpr;
      const leftTruthy = Parser.#isTruthy(result.value);
      const rightTruthy = Parser.#isTruthy(rightResult.value);
      result.value = new Integer(leftTruthy && rightTruthy ? 1n : 0n);
    }
    return {
      value: result.value,
      remainingExpr: currentExpr
    };
  }
  static #isTruthy(val) {
    if (val instanceof Integer) {
      return val.value !== 0n;
    } else if (val instanceof Rational) {
      return val.numerator !== 0n;
    } else if (typeof val === "number") {
      return val !== 0;
    } else if (typeof val === "bigint") {
      return val !== 0n;
    }
    return Boolean(val);
  }
  static #parseComparison(expr, options = {}) {
    let result = Parser.#parseAddSub(expr, options);
    let currentExpr = result.remainingExpr;
    const comparisonOps = ["<=", ">=", "==", "!=", "<", ">"];
    while (currentExpr.length > 0) {
      let matchedOp = null;
      for (const op of comparisonOps) {
        if (currentExpr.startsWith(op)) {
          matchedOp = op;
          break;
        }
      }
      if (!matchedOp)
        break;
      currentExpr = currentExpr.substring(matchedOp.length);
      const rightResult = Parser.#parseAddSub(currentExpr, options);
      currentExpr = rightResult.remainingExpr;
      const left = result.value;
      const right = rightResult.value;
      let compResult;
      if (matchedOp === "==") {
        if (left.equals && right.equals) {
          compResult = left.equals(right) ? 1n : 0n;
        } else {
          compResult = left === right ? 1n : 0n;
        }
      } else if (matchedOp === "!=") {
        if (left.equals && right.equals) {
          compResult = !left.equals(right) ? 1n : 0n;
        } else {
          compResult = left !== right ? 1n : 0n;
        }
      } else if (matchedOp === "<" || matchedOp === "<=" || matchedOp === ">" || matchedOp === ">=") {
        let diff;
        if (left.subtract && typeof left.subtract === "function") {
          diff = left.subtract(right);
        } else {
          const leftVal = Number(left);
          const rightVal = Number(right);
          if (matchedOp === "<")
            compResult = leftVal < rightVal ? 1n : 0n;
          else if (matchedOp === "<=")
            compResult = leftVal <= rightVal ? 1n : 0n;
          else if (matchedOp === ">")
            compResult = leftVal > rightVal ? 1n : 0n;
          else if (matchedOp === ">=")
            compResult = leftVal >= rightVal ? 1n : 0n;
          result.value = new Integer(compResult);
          continue;
        }
        const sign = diff.sign ? diff.sign() : diff.numerator > 0n ? 1 : diff.numerator < 0n ? -1 : 0;
        if (matchedOp === "<")
          compResult = sign < 0 ? 1n : 0n;
        else if (matchedOp === "<=")
          compResult = sign <= 0 ? 1n : 0n;
        else if (matchedOp === ">")
          compResult = sign > 0 ? 1n : 0n;
        else if (matchedOp === ">=")
          compResult = sign >= 0 ? 1n : 0n;
      }
      result.value = new Integer(compResult);
    }
    return {
      value: result.value,
      remainingExpr: currentExpr
    };
  }
  static #parseAddSub(expr, options = {}) {
    let result = Parser.#parseTerm(expr, options);
    let currentExpr = result.remainingExpr;
    while (currentExpr.length > 0 && (currentExpr[0] === "+" || currentExpr[0] === "-")) {
      const operator = currentExpr[0];
      currentExpr = currentExpr.substring(1);
      const termResult = Parser.#parseTerm(currentExpr, options);
      currentExpr = termResult.remainingExpr;
      if (operator === "+") {
        result.value = result.value.add(termResult.value);
      } else {
        result.value = result.value.subtract(termResult.value);
      }
    }
    return {
      value: Parser.#promoteType(result.value, options),
      remainingExpr: currentExpr
    };
  }
  static #parseTerm(expr, options = {}) {
    let result = Parser.#parseFactor(expr, options);
    let currentExpr = result.remainingExpr;
    while (currentExpr.length > 0 && (currentExpr[0] === "*" || currentExpr[0] === "/" || currentExpr[0] === "E" || currentExpr.startsWith("TE"))) {
      let operator, skipLength;
      if (currentExpr.startsWith("TE")) {
        operator = "E";
        skipLength = 2;
      } else {
        operator = currentExpr[0];
        skipLength = 1;
      }
      currentExpr = currentExpr.substring(skipLength);
      if (operator === "/" && currentExpr.length > 0 && currentExpr[0] === "S") {
        currentExpr = currentExpr.substring(1);
      }
      const factorResult = Parser.#parseFactor(currentExpr, options);
      currentExpr = factorResult.remainingExpr;
      if (operator === "*") {
        result.value = result.value.multiply(factorResult.value);
      } else if (operator === "/") {
        result.value = result.value.divide(factorResult.value);
      } else if (operator === "E") {
        let exponentValue;
        if (factorResult.value instanceof Integer) {
          exponentValue = factorResult.value.value;
        } else if (factorResult.value instanceof Rational) {
          if (factorResult.value.denominator !== 1n) {
            throw new Error("E notation exponent must be an integer");
          }
          exponentValue = factorResult.value.numerator;
        } else if (factorResult.value.low && factorResult.value.high) {
          if (!factorResult.value.low.equals(factorResult.value.high)) {
            throw new Error("E notation exponent must be an integer");
          }
          const exponent = factorResult.value.low;
          if (exponent.denominator !== 1n) {
            throw new Error("E notation exponent must be an integer");
          }
          exponentValue = exponent.numerator;
        } else {
          throw new Error("Invalid E notation exponent type");
        }
        if (result.value.E && typeof result.value.E === "function") {
          result.value = result.value.E(exponentValue);
        } else {
          const powerOf10 = exponentValue >= 0n ? new Rational(10n ** exponentValue) : new Rational(1n, 10n ** -exponentValue);
          const powerInterval = RationalInterval.point(powerOf10);
          result.value = result.value.multiply(powerInterval);
        }
      }
    }
    return {
      value: Parser.#promoteType(result.value, options),
      remainingExpr: currentExpr
    };
  }
  static #parseStringLiteral(expr) {
    let i = 1;
    let result = "";
    while (i < expr.length) {
      const char = expr[i];
      if (char === '"') {
        return {
          value: result,
          remainingExpr: expr.substring(i + 1)
        };
      } else if (char === "\\") {
        i++;
        if (i >= expr.length)
          throw new Error("Unterminated string literal (trailing backslash)");
        const nextChar = expr[i];
        if (nextChar === '"')
          result += '"';
        else if (nextChar === "\\")
          result += "\\";
        else if (nextChar === "u") {
          if (i + 4 >= expr.length)
            throw new Error("Invalid unicode escape sequence");
          const hex = expr.substring(i + 1, i + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex))
            throw new Error("Invalid unicode escape sequence");
          result += String.fromCharCode(parseInt(hex, 16));
          i += 4;
        } else {
          result += nextChar;
        }
      } else {
        result += char;
      }
      i++;
    }
    throw new Error("Unterminated string literal");
  }
  static #parseListLiteral(expr, options) {
    let currentExpr = expr.substring(1).trim();
    const values = [];
    if (currentExpr.startsWith("]")) {
      return {
        value: { type: "sequence", values: [] },
        remainingExpr: currentExpr.substring(1)
      };
    }
    while (true) {
      const elemResult = Parser.#parseAddSub(currentExpr, options);
      values.push(elemResult.value);
      currentExpr = elemResult.remainingExpr;
      if (currentExpr.length === 0)
        throw new Error("Unterminated list literal");
      if (currentExpr[0] === ",") {
        currentExpr = currentExpr.substring(1);
      } else if (currentExpr[0] === "]") {
        currentExpr = currentExpr.substring(1);
        break;
      } else {
        throw new Error(`Unexpected token in list: ${currentExpr[0]}`);
      }
    }
    return {
      value: { type: "sequence", values },
      remainingExpr: currentExpr
    };
  }
  static #parseFactor(expr, options = {}) {
    if (expr.length === 0) {
      throw new Error("Unexpected end of expression");
    }
    if (expr[0] === "(") {
      const subExprResult = Parser.#parseAddSub(expr.substring(1), options);
      if (subExprResult.remainingExpr.length === 0 || subExprResult.remainingExpr[0] !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      const result = {
        value: subExprResult.value,
        remainingExpr: subExprResult.remainingExpr.substring(1)
      };
      if (result.remainingExpr.length > 0 && (result.remainingExpr[0] === "E" || result.remainingExpr.startsWith("TE") || result.remainingExpr.startsWith("_^"))) {
        const eResult = Parser.#parseENotation(result.value, result.remainingExpr, options);
        let factorialResult3 = eResult;
        if (factorialResult3.remainingExpr.length > 1 && factorialResult3.remainingExpr.substring(0, 2) === "!!") {
          if (factorialResult3.value instanceof Integer) {
            factorialResult3 = {
              value: factorialResult3.value.doubleFactorial(),
              remainingExpr: factorialResult3.remainingExpr.substring(2)
            };
          } else if (factorialResult3.value instanceof Rational && factorialResult3.value.denominator === 1n) {
            const intValue = new Integer(factorialResult3.value.numerator);
            factorialResult3 = {
              value: intValue.doubleFactorial().toRational(),
              remainingExpr: factorialResult3.remainingExpr.substring(2)
            };
          } else if (factorialResult3.value.low && factorialResult3.value.high && factorialResult3.value.low.equals(factorialResult3.value.high) && factorialResult3.value.low.denominator === 1n) {
            const intValue = new Integer(factorialResult3.value.low.numerator);
            const factorialValue = intValue.doubleFactorial();
            const IntervalClass = factorialResult3.value.constructor;
            factorialResult3 = {
              value: new IntervalClass(factorialValue.toRational(), factorialValue.toRational()),
              remainingExpr: factorialResult3.remainingExpr.substring(2)
            };
          } else {
            throw new Error("Double factorial is not defined for negative integers");
          }
        } else if (factorialResult3.remainingExpr.length > 0 && factorialResult3.remainingExpr[0] === "!" && factorialResult3.remainingExpr[1] !== "=") {
          if (factorialResult3.value instanceof Integer) {
            factorialResult3 = {
              value: factorialResult3.value.factorial(),
              remainingExpr: factorialResult3.remainingExpr.substring(1)
            };
          } else if (factorialResult3.value instanceof Rational && factorialResult3.value.denominator === 1n) {
            const intValue = new Integer(factorialResult3.value.numerator);
            factorialResult3 = {
              value: intValue.factorial().toRational(),
              remainingExpr: factorialResult3.remainingExpr.substring(1)
            };
          } else if (factorialResult3.value.low && factorialResult3.value.high && factorialResult3.value.low.equals(factorialResult3.value.high) && factorialResult3.value.low.denominator === 1n) {
            const intValue = new Integer(factorialResult3.value.low.numerator);
            const factorialValue = intValue.factorial();
            const IntervalClass = factorialResult3.value.constructor;
            factorialResult3 = {
              value: new IntervalClass(factorialValue.toRational(), factorialValue.toRational()),
              remainingExpr: factorialResult3.remainingExpr.substring(1)
            };
          } else {
            throw new Error("Factorial is not defined for negative integers");
          }
        }
        if (factorialResult3.remainingExpr.length > 0) {
          if (factorialResult3.remainingExpr[0] === "^") {
            const powerExpr = factorialResult3.remainingExpr.substring(1);
            let powerResult;
            let isIntegerExponent = false;
            try {
              powerResult = Parser.#parseExponent(powerExpr);
              isIntegerExponent = true;
            } catch (e) {
              powerResult = Parser.#parseExponentExpression(powerExpr, options);
              isIntegerExponent = false;
            }
            const zero = new Rational(0);
            const isZeroBase = factorialResult3.value.low && factorialResult3.value.high ? factorialResult3.value.low.equals(zero) && factorialResult3.value.high.equals(zero) : factorialResult3.value instanceof Integer && factorialResult3.value.value === 0n || factorialResult3.value instanceof Rational && factorialResult3.value.numerator === 0n;
            const isZeroExponent = isIntegerExponent ? powerResult.value === 0n : powerResult.value instanceof Rational && powerResult.value.numerator === 0n || powerResult.value instanceof Integer && powerResult.value.value === 0n;
            if (isZeroBase && isZeroExponent) {
              throw new Error("Zero cannot be raised to the power of zero");
            }
            let result2;
            if (isIntegerExponent) {
              result2 = factorialResult3.value.pow(powerResult.value);
            } else {
              const precision = options.precision || DEFAULT_PRECISION;
              result2 = rationalIntervalPower(factorialResult3.value, powerResult.value, precision);
            }
            return {
              value: result2,
              remainingExpr: powerResult.remainingExpr
            };
          } else if (factorialResult3.remainingExpr.length > 1 && factorialResult3.remainingExpr[0] === "*" && factorialResult3.remainingExpr[1] === "*") {
            const powerExpr = factorialResult3.remainingExpr.substring(2);
            let powerResult;
            let isIntegerExponent = false;
            try {
              powerResult = Parser.#parseExponent(powerExpr);
              isIntegerExponent = true;
            } catch (e) {
              powerResult = Parser.#parseExponentExpression(powerExpr, options);
              isIntegerExponent = false;
            }
            const isZeroExponent = isIntegerExponent && powerResult.value === 0n || !isIntegerExponent && powerResult.value instanceof Integer && powerResult.value.value === 0n || !isIntegerExponent && powerResult.value instanceof Rational && powerResult.value.numerator === 0n;
            if (isZeroExponent) {
              throw new Error("Multiplicative exponentiation requires at least one factor");
            }
            let result2;
            if (!isIntegerExponent && powerResult.value instanceof Rational && Number(powerResult.value.denominator) <= 10 && Number(powerResult.value.denominator) > 1) {
              const precision = options.precision || DEFAULT_PRECISION;
              const rootDegree = Number(powerResult.value.denominator);
              const rootInterval = newtonRoot(factorialResult3.value, rootDegree, precision);
              if (!powerResult.value.numerator === 1n) {
                const numeratorPower = Number(powerResult.value.numerator);
                result2 = rootInterval;
                for (let i = 1;i < Math.abs(numeratorPower); i++) {
                  result2 = result2.multiply(rootInterval);
                }
                if (numeratorPower < 0) {
                  result2 = new RationalInterval(new Rational(1).divide(result2.upper), new Rational(1).divide(result2.lower));
                }
              } else {
                result2 = rootInterval;
              }
            } else if (isIntegerExponent) {
              let base = factorialResult3.value;
              if (!(base instanceof RationalInterval)) {
                base = RationalInterval.point(base instanceof Integer ? base.toRational() : base);
              }
              result2 = base.mpow(powerResult.value);
            } else {
              const precision = options.precision || DEFAULT_PRECISION;
              result2 = rationalIntervalPower(factorialResult3.value, powerResult.value, precision);
            }
            if (result2._skipPromotion === undefined) {
              result2._skipPromotion = true;
            }
            return {
              value: result2,
              remainingExpr: powerResult.remainingExpr
            };
          }
        }
        return factorialResult3;
      }
      let factorialResult2 = result;
      if (factorialResult2.remainingExpr.length > 1 && factorialResult2.remainingExpr.substring(0, 2) === "!!") {
        if (factorialResult2.value instanceof Integer) {
          factorialResult2 = {
            value: factorialResult2.value.doubleFactorial(),
            remainingExpr: factorialResult2.remainingExpr.substring(2)
          };
        } else if (factorialResult2.value instanceof Rational && factorialResult2.value.denominator === 1n) {
          const intValue = new Integer(factorialResult2.value.numerator);
          factorialResult2 = {
            value: intValue.doubleFactorial().toRational(),
            remainingExpr: factorialResult2.remainingExpr.substring(2)
          };
        } else if (factorialResult2.value.low && factorialResult2.value.high && factorialResult2.value.low.equals(factorialResult2.value.high) && factorialResult2.value.low.denominator === 1n) {
          const intValue = new Integer(factorialResult2.value.low.numerator);
          const factorialValue = intValue.doubleFactorial();
          const IntervalClass = factorialResult2.value.constructor;
          factorialResult2 = {
            value: new IntervalClass(factorialValue.toRational(), factorialValue.toRational()),
            remainingExpr: factorialResult2.remainingExpr.substring(2)
          };
        } else {
          throw new Error("Double factorial is not defined for negative integers");
        }
      } else if (factorialResult2.remainingExpr.length > 0 && factorialResult2.remainingExpr[0] === "!" && factorialResult2.remainingExpr[1] !== "=") {
        if (factorialResult2.value instanceof Integer) {
          factorialResult2 = {
            value: factorialResult2.value.factorial(),
            remainingExpr: factorialResult2.remainingExpr.substring(1)
          };
        } else if (factorialResult2.value instanceof Rational && factorialResult2.value.denominator === 1n) {
          const intValue = new Integer(factorialResult2.value.numerator);
          factorialResult2 = {
            value: intValue.factorial().toRational(),
            remainingExpr: factorialResult2.remainingExpr.substring(1)
          };
        } else if (factorialResult2.value.low && factorialResult2.value.high && factorialResult2.value.low.equals(factorialResult2.value.high) && factorialResult2.value.low.denominator === 1n) {
          const intValue = new Integer(factorialResult2.value.low.numerator);
          const factorialValue = intValue.factorial();
          const IntervalClass = factorialResult2.value.constructor;
          factorialResult2 = {
            value: new IntervalClass(factorialValue.toRational(), factorialValue.toRational()),
            remainingExpr: factorialResult2.remainingExpr.substring(1)
          };
        } else {
          throw new Error("Factorial is not defined for negative integers");
        }
      }
      if (factorialResult2.remainingExpr.length > 0) {
        if (factorialResult2.remainingExpr[0] === "^") {
          const powerExpr = factorialResult2.remainingExpr.substring(1);
          let powerResult;
          let isIntegerExponent = false;
          try {
            powerResult = Parser.#parseExponent(powerExpr);
            isIntegerExponent = true;
          } catch (e) {
            powerResult = Parser.#parseExponentExpression(powerExpr, options);
            isIntegerExponent = false;
          }
          const zero = new Rational(0);
          let isZero2 = false;
          if (factorialResult2.value instanceof RationalInterval) {
            isZero2 = factorialResult2.value.low.equals(zero) && factorialResult2.value.high.equals(zero);
          } else if (factorialResult2.value instanceof Rational) {
            isZero2 = factorialResult2.value.equals(zero);
          } else if (factorialResult2.value instanceof Integer) {
            isZero2 = factorialResult2.value.value === 0n;
          }
          const isZeroExponent = isIntegerExponent ? powerResult.value === 0n : powerResult.value instanceof Rational && powerResult.value.numerator === 0n || powerResult.value instanceof Integer && powerResult.value.value === 0n;
          if (isZero2 && isZeroExponent) {
            throw new Error("Zero cannot be raised to the power of zero");
          }
          let result2;
          if (isIntegerExponent) {
            result2 = factorialResult2.value.pow(powerResult.value);
          } else {
            const precision = options.precision || DEFAULT_PRECISION;
            result2 = rationalIntervalPower(factorialResult2.value, powerResult.value, precision);
          }
          return {
            value: result2,
            remainingExpr: powerResult.remainingExpr
          };
        } else if (factorialResult2.remainingExpr.length > 1 && factorialResult2.remainingExpr[0] === "*" && factorialResult2.remainingExpr[1] === "*") {
          const powerExpr = factorialResult2.remainingExpr.substring(2);
          let powerResult;
          let isIntegerExponent = false;
          try {
            powerResult = Parser.#parseExponent(powerExpr);
            isIntegerExponent = true;
          } catch (e) {
            powerResult = Parser.#parseExponentExpression(powerExpr, options);
            isIntegerExponent = false;
          }
          const isZeroExponent = isIntegerExponent && powerResult.value === 0n || !isIntegerExponent && powerResult.value instanceof Integer && powerResult.value.value === 0n || !isIntegerExponent && powerResult.value instanceof Rational && powerResult.value.numerator === 0n;
          if (isZeroExponent) {
            throw new Error("Multiplicative exponentiation requires at least one factor");
          }
          let result2;
          if (!isIntegerExponent && powerResult.value instanceof Rational && Number(powerResult.value.denominator) <= 10 && Number(powerResult.value.denominator) > 1) {
            const precision = options.precision || DEFAULT_PRECISION;
            const rootDegree = Number(powerResult.value.denominator);
            const rootInterval = newtonRoot(factorialResult2.value, rootDegree, precision);
            if (!powerResult.value.numerator === 1n) {
              const numeratorPower = Number(powerResult.value.numerator);
              result2 = rootInterval;
              for (let i = 1;i < Math.abs(numeratorPower); i++) {
                result2 = result2.multiply(rootInterval);
              }
              if (numeratorPower < 0) {
                result2 = new RationalInterval(new Rational(1).divide(result2.upper), new Rational(1).divide(result2.lower));
              }
            } else {
              result2 = rootInterval;
            }
          } else if (isIntegerExponent) {
            let base = factorialResult2.value;
            if (!(base instanceof RationalInterval)) {
              base = RationalInterval.point(base instanceof Integer ? base.toRational() : base);
            }
            result2 = base.mpow(powerResult.value);
          } else {
            const precision = options.precision || DEFAULT_PRECISION;
            result2 = rationalIntervalPower(factorialResult2.value, powerResult.value, precision);
          }
          if (result2._skipPromotion === undefined) {
            result2._skipPromotion = true;
          }
          return {
            value: result2,
            remainingExpr: powerResult.remainingExpr
          };
        }
      }
      return factorialResult2;
    }
    if (expr[0] === '"') {
      const stringResult = Parser.#parseStringLiteral(expr);
      return stringResult;
    }
    if (expr[0] === "[") {
      const listResult = Parser.#parseListLiteral(expr, options);
      return listResult;
    }
    if (expr.includes("[") && expr.includes("]")) {
      const baseMatch = expr.match(/^([-\w./:^]+(?::[-\w./:^]+)?)\[(\d+)\]/);
      const isCustomBase = /^-*0z\[\d+\]/i.test(expr);
      if (baseMatch && !isCustomBase) {
        throw new Error("Bracket base notation (Value[Base]) is no longer supported. Use prefix notation (0xValue, 0bValue) or the BASE command.");
      }
      const uncertaintyMatch = !isCustomBase ? expr.match(/^(-?[@\w./:^]+)\[([^\]]+)\]((?:[Ee][+-]?[\w]+|\_?\^-?[\w]+)?)/) : null;
      if (uncertaintyMatch) {
        const fullMatch = uncertaintyMatch[0];
        try {
          const result = parseDecimalUncertainty(fullMatch, options);
          return {
            value: result,
            remainingExpr: expr.substring(fullMatch.length)
          };
        } catch (error) {
          throw error;
        }
      }
    }
    const isCustomBasePrefix = /^-*0z\[\d+\]/i.test(expr);
    const isUncertainty = expr.includes("[") && !isCustomBasePrefix;
    if (expr[0] === "-" && !isUncertainty && !expr.includes(":")) {
      const factorResult = Parser.#parseFactor(expr.substring(1), options);
      let negatedValue;
      if (options.typeAware && factorResult.value instanceof Integer) {
        negatedValue = factorResult.value.negate();
      } else if (options.typeAware && factorResult.value instanceof Rational) {
        negatedValue = factorResult.value.negate();
        if (factorResult.value._explicitFraction) {
          negatedValue._explicitFraction = true;
        }
      } else {
        const negOne = new Rational(-1);
        const negInterval = RationalInterval.point(negOne);
        negatedValue = negInterval.multiply(factorResult.value);
      }
      return {
        value: negatedValue,
        remainingExpr: factorResult.remainingExpr
      };
    }
    const numberResult = Parser.#parseInterval(expr, options);
    if (numberResult.remainingExpr.length > 0 && (numberResult.remainingExpr[0] === "E" || numberResult.remainingExpr.startsWith("TE") || numberResult.remainingExpr.startsWith("_^"))) {
      const eResult = Parser.#parseENotation(numberResult.value, numberResult.remainingExpr, options);
      let factorialResult2 = eResult;
      if (factorialResult2.remainingExpr.length > 1 && factorialResult2.remainingExpr.substring(0, 2) === "!!") {
        if (factorialResult2.value instanceof Integer) {
          factorialResult2 = {
            value: factorialResult2.value.doubleFactorial(),
            remainingExpr: factorialResult2.remainingExpr.substring(2)
          };
        } else if (factorialResult2.value instanceof Rational && factorialResult2.value.denominator === 1n) {
          const intValue = new Integer(factorialResult2.value.numerator);
          factorialResult2 = {
            value: intValue.doubleFactorial().toRational(),
            remainingExpr: factorialResult2.remainingExpr.substring(2)
          };
        } else if (factorialResult2.value.low && factorialResult2.value.high && factorialResult2.value.low.equals(factorialResult2.value.high) && factorialResult2.value.low.denominator === 1n) {
          const intValue = new Integer(factorialResult2.value.low.numerator);
          const factorialValue = intValue.doubleFactorial();
          const IntervalClass = factorialResult2.value.constructor;
          factorialResult2 = {
            value: new IntervalClass(factorialValue.toRational(), factorialValue.toRational()),
            remainingExpr: factorialResult2.remainingExpr.substring(2)
          };
        } else {
          throw new Error("Double factorial is not defined for negative integers");
        }
      } else if (factorialResult2.remainingExpr.length > 0 && factorialResult2.remainingExpr[0] === "!" && factorialResult2.remainingExpr[1] !== "=") {
        if (factorialResult2.value instanceof Integer) {
          factorialResult2 = {
            value: factorialResult2.value.factorial(),
            remainingExpr: factorialResult2.remainingExpr.substring(1)
          };
        } else if (factorialResult2.value instanceof Rational && factorialResult2.value.denominator === 1n) {
          const intValue = new Integer(factorialResult2.value.numerator);
          factorialResult2 = {
            value: intValue.factorial().toRational(),
            remainingExpr: factorialResult2.remainingExpr.substring(1)
          };
        } else if (factorialResult2.value.low && factorialResult2.value.high && factorialResult2.value.low.equals(factorialResult2.value.high) && factorialResult2.value.low.denominator === 1n) {
          const intValue = new Integer(factorialResult2.value.low.numerator);
          const factorialValue = intValue.factorial();
          const IntervalClass = factorialResult2.value.constructor;
          factorialResult2 = {
            value: new IntervalClass(factorialValue.toRational(), factorialValue.toRational()),
            remainingExpr: factorialResult2.remainingExpr.substring(1)
          };
        } else {
          throw new Error("Factorial is not defined for negative integers");
        }
      }
      if (factorialResult2.remainingExpr.length > 0) {
        if (factorialResult2.remainingExpr[0] === "^") {
          const powerExpr = factorialResult2.remainingExpr.substring(1);
          let powerResult;
          let isIntegerExponent = false;
          try {
            powerResult = Parser.#parseExponent(powerExpr);
            isIntegerExponent = true;
          } catch (e) {
            powerResult = Parser.#parseExponentExpression(powerExpr, options);
            isIntegerExponent = false;
          }
          const isZeroBase = factorialResult2.value instanceof Integer && factorialResult2.value.value === 0n || factorialResult2.value instanceof Rational && factorialResult2.value.numerator === 0n || factorialResult2.value.low && factorialResult2.value.high && factorialResult2.value.low.equals(new Rational(0)) && factorialResult2.value.high.equals(new Rational(0));
          const isZeroExponent = isIntegerExponent ? powerResult.value === 0n : powerResult.value instanceof Rational && powerResult.value.numerator === 0n || powerResult.value instanceof Integer && powerResult.value.value === 0n;
          if (isZeroBase && isZeroExponent) {
            throw new Error("Zero cannot be raised to the power of zero");
          }
          let result;
          if (isIntegerExponent) {
            result = factorialResult2.value.pow(powerResult.value);
          } else {
            const precision = options.precision || DEFAULT_PRECISION;
            result = rationalIntervalPower(factorialResult2.value, powerResult.value, precision);
          }
          return {
            value: result,
            remainingExpr: powerResult.remainingExpr
          };
        } else if (factorialResult2.remainingExpr.length > 1 && factorialResult2.remainingExpr[0] === "*" && factorialResult2.remainingExpr[1] === "*") {
          const powerExpr = factorialResult2.remainingExpr.substring(2);
          const powerResult = Parser.#parseExponent(powerExpr);
          const isZeroExponent = powerResult.value === 0n;
          if (isZeroExponent) {
            throw new Error("Multiplicative exponentiation requires at least one factor");
          }
          let base = factorialResult2.value;
          if (!(base instanceof RationalInterval)) {
            base = RationalInterval.point(base instanceof Integer ? base.toRational() : base);
          }
          const result = base.mpow(powerResult.value);
          result._skipPromotion = true;
          return {
            value: result,
            remainingExpr: powerResult.remainingExpr
          };
        }
      }
      return factorialResult2;
    }
    let factorialResult = numberResult;
    if (factorialResult.remainingExpr.length > 1 && factorialResult.remainingExpr.substring(0, 2) === "!!") {
      if (factorialResult.value instanceof Integer) {
        factorialResult = {
          value: factorialResult.value.doubleFactorial(),
          remainingExpr: factorialResult.remainingExpr.substring(2)
        };
      } else if (factorialResult.value instanceof Rational && factorialResult.value.denominator === 1n) {
        const intValue = new Integer(factorialResult.value.numerator);
        factorialResult = {
          value: intValue.doubleFactorial().toRational(),
          remainingExpr: factorialResult.remainingExpr.substring(2)
        };
      } else if (factorialResult.value.low && factorialResult.value.high && factorialResult.value.low.equals(factorialResult.value.high) && factorialResult.value.low.denominator === 1n) {
        const intValue = new Integer(factorialResult.value.low.numerator);
        const factorialValue = intValue.doubleFactorial();
        const IntervalClass = factorialResult.value.constructor;
        factorialResult = {
          value: new IntervalClass(factorialValue.toRational(), factorialValue.toRational()),
          remainingExpr: factorialResult.remainingExpr.substring(2)
        };
      } else {
        throw new Error("Double factorial is not defined for negative integers");
      }
    } else if (factorialResult.remainingExpr.length > 0 && factorialResult.remainingExpr[0] === "!" && factorialResult.remainingExpr[1] !== "=") {
      if (factorialResult.value instanceof Integer) {
        factorialResult = {
          value: factorialResult.value.factorial(),
          remainingExpr: factorialResult.remainingExpr.substring(1)
        };
      } else if (factorialResult.value instanceof Rational && factorialResult.value.denominator === 1n) {
        const intValue = new Integer(factorialResult.value.numerator);
        factorialResult = {
          value: intValue.factorial().toRational(),
          remainingExpr: factorialResult.remainingExpr.substring(1)
        };
      } else if (factorialResult.value.low && factorialResult.value.high && factorialResult.value.low.equals(factorialResult.value.high) && factorialResult.value.low.denominator === 1n) {
        const intValue = new Integer(factorialResult.value.low.numerator);
        const factorialValue = intValue.factorial();
        const IntervalClass = factorialResult.value.constructor;
        factorialResult = {
          value: new IntervalClass(factorialValue.toRational(), factorialValue.toRational()),
          remainingExpr: factorialResult.remainingExpr.substring(1)
        };
      } else {
        throw new Error("Factorial is not defined for negative integers");
      }
    }
    if (factorialResult.remainingExpr.length > 0) {
      if (factorialResult.remainingExpr[0] === "^") {
        const powerExpr = factorialResult.remainingExpr.substring(1);
        let powerResult;
        let isIntegerExponent = false;
        if (powerExpr.startsWith("(")) {
          powerResult = Parser.#parseAddSub(powerExpr.substring(1), options);
          if (powerResult.remainingExpr.length === 0 || powerResult.remainingExpr[0] !== ")") {
            throw new Error("Missing closing parenthesis in exponent");
          }
          powerResult.remainingExpr = powerResult.remainingExpr.substring(1);
          isIntegerExponent = false;
        } else {
          try {
            powerResult = Parser.#parseExponent(powerExpr);
            isIntegerExponent = true;
          } catch (e) {
            powerResult = Parser.#parseExponentExpression(powerExpr, options);
            isIntegerExponent = false;
          }
        }
        const isZeroBase = factorialResult.value instanceof Integer && factorialResult.value.value === 0n || factorialResult.value instanceof Rational && factorialResult.value.numerator === 0n || factorialResult.value.low && factorialResult.value.high && factorialResult.value.low.equals(new Rational(0)) && factorialResult.value.high.equals(new Rational(0));
        const isZeroExponent = isIntegerExponent ? powerResult.value === 0n : powerResult.value instanceof Rational && powerResult.value.numerator === 0n || powerResult.value instanceof Integer && powerResult.value.value === 0n;
        if (isZeroBase && isZeroExponent) {
          throw new Error("Zero cannot be raised to the power of zero");
        }
        let result;
        if (isIntegerExponent) {
          result = factorialResult.value.pow(powerResult.value);
        } else {
          const precision = options.precision || DEFAULT_PRECISION;
          result = rationalIntervalPower(factorialResult.value, powerResult.value, precision);
          result._skipPromotion = true;
        }
        return {
          value: result,
          remainingExpr: powerResult.remainingExpr
        };
      } else if (factorialResult.remainingExpr.length > 1 && factorialResult.remainingExpr[0] === "*" && factorialResult.remainingExpr[1] === "*") {
        const powerExpr = factorialResult.remainingExpr.substring(2);
        let powerResult;
        if (powerExpr.startsWith("(")) {
          powerResult = Parser.#parseAddSub(powerExpr.substring(1), options);
          if (powerResult.remainingExpr.length === 0 || powerResult.remainingExpr[0] !== ")") {
            throw new Error("Missing closing parenthesis in exponent");
          }
          powerResult.remainingExpr = powerResult.remainingExpr.substring(1);
        } else {
          try {
            powerResult = Parser.#parseExponent(powerExpr);
          } catch (e) {
            powerResult = Parser.#parseAddSub(powerExpr, options);
          }
        }
        let base = factorialResult.value;
        const isIntegerExponent = powerResult.value instanceof Integer || powerResult.value instanceof Rational && powerResult.value.denominator === 1n;
        const isZeroExponent = powerResult.value instanceof Integer && powerResult.value.value === 0n || powerResult.value instanceof Rational && powerResult.value.numerator === 0n;
        if (isZeroExponent) {
          throw new Error("Multiplicative exponentiation requires at least one factor");
        }
        let result;
        if (isIntegerExponent) {
          if (!(base instanceof RationalInterval)) {
            base = RationalInterval.point(base instanceof Integer ? base.toRational() : base);
          }
          const exponentBigInt = powerResult.value instanceof Integer ? powerResult.value.value : powerResult.value.numerator;
          result = base.mpow(exponentBigInt);
        } else {
          const precision = options.precision || DEFAULT_PRECISION;
          result = rationalIntervalPower(base, powerResult.value, precision);
        }
        result._skipPromotion = true;
        return {
          value: result,
          remainingExpr: powerResult.remainingExpr
        };
      }
    }
    return factorialResult;
  }
  static #parseExponent(expr) {
    let i = 0;
    let isNegative2 = false;
    if (expr.length > 0 && expr[0] === "-") {
      isNegative2 = true;
      i++;
    }
    let exponentStr = "";
    while (i < expr.length && /\d/.test(expr[i])) {
      exponentStr += expr[i];
      i++;
    }
    if (exponentStr.length === 0) {
      throw new Error("Invalid exponent");
    }
    const exponent = isNegative2 ? -BigInt(exponentStr) : BigInt(exponentStr);
    if (exponent === 0n) {
      throw new Error("Multiplicative exponentiation requires at least one factor");
    }
    return {
      value: exponent,
      remainingExpr: expr.substring(i)
    };
  }
  static #parseExponentExpression(expr, options) {
    return Parser.#parseFactor(expr, options);
  }
  static #promoteType(value, options = {}) {
    if (!options.typeAware) {
      return value;
    }
    if (value && value._skipPromotion) {
      return value;
    }
    if (value instanceof RationalInterval && value.low.equals(value.high)) {
      if (value._explicitInterval) {
        return value;
      }
      if (value.low.denominator === 1n) {
        return new Integer(value.low.numerator);
      } else {
        return value.low;
      }
    }
    if (value instanceof Rational && value.denominator === 1n) {
      if (value._explicitFraction) {
        return value;
      }
      return new Integer(value.numerator);
    }
    return value;
  }
  static #parseENotation(value, expr, options = {}) {
    if (options.inputBase && options.inputBase !== BaseSystem.DECIMAL) {
      return Parser.#parseBaseAwareENotation(value, expr, options);
    }
    let spaceBeforeE = false;
    let startIndex = 1;
    if (expr.startsWith("TE")) {
      spaceBeforeE = true;
      startIndex = 2;
    } else if (expr[0] === "E") {
      spaceBeforeE = false;
      startIndex = 1;
    } else if (expr.startsWith("_^")) {
      spaceBeforeE = false;
      startIndex = 2;
    } else {
      throw new Error("Expected E notation");
    }
    const exponentResult = Parser.#parseExponent(expr.substring(startIndex));
    const exponent = exponentResult.value;
    let result;
    if (value.E && typeof value.E === "function") {
      result = value.E(exponent);
    } else {
      let powerOf10;
      if (exponent >= 0n) {
        powerOf10 = new Rational(10n ** exponent);
      } else {
        powerOf10 = new Rational(1n, 10n ** -exponent);
      }
      result = value.multiply(powerOf10);
    }
    return {
      value: Parser.#promoteType(result, options),
      remainingExpr: exponentResult.remainingExpr
    };
  }
  static #parseBaseAwareENotation(value, expr, options = {}) {
    const baseSystem = options.inputBase;
    if (!baseSystem) {
      throw new Error("Base-aware E notation requires inputBase option");
    }
    let notationType;
    let startIndex;
    if (expr.startsWith("_^")) {
      notationType = "_^";
      startIndex = 2;
    } else if (baseSystem.base === 10 && (expr.startsWith("E") || expr.startsWith("e"))) {
      notationType = "E";
      startIndex = 1;
    } else {
      if (baseSystem.base === 10) {
        throw new Error("Expected E or _^ notation");
      } else {
        throw new Error("Scientific notation in non-decimal bases requires _^ separator (e.g. 5_^2)");
      }
    }
    let endIndex = startIndex;
    if (endIndex < expr.length && expr[endIndex] === "-") {
      endIndex++;
    }
    while (endIndex < expr.length) {
      const char = expr[endIndex];
      if (baseSystem.charMap.has(char)) {
        endIndex++;
      } else {
        break;
      }
    }
    if (endIndex === startIndex || endIndex === startIndex + 1 && expr[startIndex] === "-") {
      throw new Error(`Missing exponent after ${notationType} notation`);
    }
    const exponentStr = expr.substring(startIndex, endIndex);
    const testExponentStr = exponentStr.startsWith("-") ? exponentStr.substring(1) : exponentStr;
    if (!baseSystem.isValidString(testExponentStr)) {
      throw new Error(`Invalid exponent "${exponentStr}" for base ${baseSystem.base}`);
    }
    let exponentDecimal;
    try {
      exponentDecimal = baseSystem.toDecimal(exponentStr);
    } catch (error) {
      throw new Error(`Failed to parse exponent "${exponentStr}": ${error.message}`);
    }
    let powerOfBase;
    const baseBigInt = BigInt(baseSystem.base);
    if (exponentDecimal >= 0n) {
      powerOfBase = new Rational(baseBigInt ** exponentDecimal);
    } else {
      powerOfBase = new Rational(1n, baseBigInt ** -exponentDecimal);
    }
    let valueRational;
    if (value instanceof Integer) {
      valueRational = value.toRational();
    } else if (value instanceof Rational) {
      valueRational = value;
    } else {
      throw new Error(`${notationType} notation can only be applied to simple numbers, not intervals`);
    }
    const result = valueRational.multiply(powerOfBase);
    return {
      value: Parser.#promoteType(result, options),
      remainingExpr: expr.substring(endIndex)
    };
  }
  static #parseInterval(expr, options = {}) {
    if (expr.includes("[") && expr.includes("]") && /^-?[@\w./:^]+\[/.test(expr)) {
      try {
        const result = parseDecimalUncertainty(expr, options);
        return {
          value: result,
          remainingExpr: ""
        };
      } catch {}
    }
    if (expr.includes(".~")) {
      if (expr.includes(":")) {
        const colonIndex = expr.indexOf(":");
        const leftPart = expr.substring(0, colonIndex);
        const rightPart = expr.substring(colonIndex + 1);
        if (leftPart.includes(".~") || rightPart.includes(".~")) {
          try {
            let leftResult;
            if (leftPart.includes(".~")) {
              leftResult = Parser.#parseContinuedFraction(leftPart, options);
            } else {
              leftResult = Parser.#parseInterval(leftPart, options);
            }
            let rightResult;
            if (rightPart.includes(".~")) {
              rightResult = Parser.#parseContinuedFraction(rightPart, options);
            } else {
              rightResult = Parser.#parseInterval(rightPart, options);
            }
            let leftRational, rightRational;
            if (leftResult.value instanceof Integer) {
              leftRational = leftResult.value.toRational();
            } else if (leftResult.value instanceof Rational) {
              leftRational = leftResult.value;
            } else {
              throw new Error("Left side must evaluate to a rational");
            }
            if (rightResult.value instanceof Integer) {
              rightRational = rightResult.value.toRational();
            } else if (rightResult.value instanceof Rational) {
              rightRational = rightResult.value;
            } else if (rightResult.value instanceof RationalInterval && rightResult.value.isPoint()) {
              rightRational = rightResult.value.low;
            } else {
              throw new Error("Right side must evaluate to a rational");
            }
            const interval2 = new RationalInterval(leftRational, rightRational);
            return {
              value: interval2,
              remainingExpr: rightResult.remainingExpr
            };
          } catch (error) {}
        }
      }
      try {
        const cfResult = Parser.#parseContinuedFraction(expr, options);
        return cfResult;
      } catch (error) {}
    }
    if (expr.includes(".") && !expr.includes("#") && !expr.includes(":") && !expr.includes("[") && (!options.inputBase || options.inputBase === BaseSystem.DECIMAL)) {
      let endIndex = 0;
      let hasDecimalPoint = false;
      if (expr[endIndex] === "-") {
        endIndex++;
      }
      const baseSystem = options.inputBase || BaseSystem.DECIMAL;
      while (endIndex < expr.length) {
        const char = expr[endIndex];
        if (baseSystem.charMap.has(char)) {
          endIndex++;
        } else if (char === "." && !hasDecimalPoint && endIndex + 1 < expr.length && expr[endIndex + 1] !== ".") {
          hasDecimalPoint = true;
          endIndex++;
        } else {
          break;
        }
      }
      if (hasDecimalPoint && endIndex > (expr[0] === "-" ? 2 : 1)) {
        const decimalStr = expr.substring(0, endIndex);
        try {
          if (options.inputBase && options.inputBase !== BaseSystem.DECIMAL) {
            const result = parseBaseNotation(decimalStr, options.inputBase, options);
            return {
              value: result,
              remainingExpr: expr.substring(endIndex)
            };
          } else if (options.typeAware) {
            const result = new Rational(decimalStr);
            return {
              value: result,
              remainingExpr: expr.substring(endIndex)
            };
          } else {
            const isNegative2 = decimalStr.startsWith("-");
            const absDecimalStr = isNegative2 ? decimalStr.substring(1) : decimalStr;
            const result = parseNonRepeatingDecimal(absDecimalStr, isNegative2);
            return {
              value: result,
              remainingExpr: expr.substring(endIndex)
            };
          }
        } catch (error) {}
      }
    }
    if (expr.includes("#") && expr.includes(":") && /^-?[\d.]/.test(expr)) {
      const colonIndex = expr.indexOf(":");
      if (colonIndex > 0) {
        const beforeColon = expr.substring(0, colonIndex);
        const afterColonStart = expr.substring(colonIndex + 1);
        if (/^-?[\d.#]+$/.test(beforeColon) && /^-?[\d.#]/.test(afterColonStart) && (beforeColon.includes("#") || afterColonStart.includes("#"))) {
          try {
            const possibleInterval = parseRepeatingDecimal(expr);
            if (possibleInterval instanceof RationalInterval) {
              let endIndex = expr.length;
              for (let i = 1;i < expr.length; i++) {
                const testExpr = expr.substring(0, i);
                try {
                  const testResult = parseRepeatingDecimal(testExpr);
                  if (testResult instanceof RationalInterval) {
                    if (i === expr.length || !/[\d#.\-]/.test(expr[i])) {
                      endIndex = i;
                      const finalResult = parseRepeatingDecimal(expr.substring(0, endIndex));
                      if (finalResult instanceof RationalInterval) {
                        return {
                          value: finalResult,
                          remainingExpr: expr.substring(endIndex)
                        };
                      }
                    }
                  }
                } catch {}
              }
              try {
                const result = parseRepeatingDecimal(expr);
                if (result instanceof RationalInterval) {
                  return {
                    value: result,
                    remainingExpr: ""
                  };
                }
              } catch {}
            }
          } catch {}
        }
      }
    }
    const debugMatch = expr.trim().match(/^(-?)0[a-zA-Z]/);
    if (options.inputBase && options.inputBase !== BaseSystem.DECIMAL && !expr.includes("[") && !expr.includes("#") && !debugMatch) {
      try {
        let endIndex = 0;
        let hasDecimalPoint = false;
        let hasMixedNumber = false;
        let hasFraction = false;
        let hasColon = false;
        if (expr[endIndex] === "-") {
          endIndex++;
        }
        while (endIndex < expr.length) {
          const char = expr[endIndex];
          if (options.inputBase.charMap.has(char)) {
            endIndex++;
          } else if (/[0-9]/.test(char)) {
            endIndex++;
          } else if (char === "." && endIndex + 1 < expr.length && expr[endIndex + 1] === ".") {
            if (hasMixedNumber || hasDecimalPoint || hasFraction || hasColon)
              break;
            hasMixedNumber = true;
            endIndex += 2;
          } else if (char === "." && !hasDecimalPoint && !hasMixedNumber) {
            hasDecimalPoint = true;
            endIndex++;
          } else if (char === "/" && !hasFraction) {
            hasFraction = true;
            endIndex++;
          } else if (char === ":" && !hasColon && !hasMixedNumber) {
            hasColon = true;
            hasDecimalPoint = false;
            hasFraction = false;
            endIndex++;
          } else {
            break;
          }
        }
        if (endIndex > (expr[0] === "-" ? 1 : 0)) {
          const numberStr = expr.substring(0, endIndex);
          const testStr = numberStr.startsWith("-") ? numberStr.substring(1) : numberStr;
          const parts = testStr.split(/[\.\/\:]/);
          const isValidInBase = parts.every((part, index) => {
            if (part === "") {
              return testStr.includes(".") && (index === 0 || index === parts.length - 1);
            }
            return part.split("").every((char) => options.inputBase.charMap.has(char));
          });
          if (isValidInBase) {
            const result = parseBaseNotation(numberStr, options.inputBase, options);
            return {
              value: result,
              remainingExpr: expr.substring(endIndex)
            };
          } else if (options.inputBase && options.inputBase !== BaseSystem.DECIMAL) {
            throw new Error(`Invalid number format for ${options.inputBase.name}`);
          }
        } else if (options.inputBase && options.inputBase !== BaseSystem.DECIMAL) {
          const firstChar = expr.startsWith("-") ? expr[1] : expr[0];
          if (/[0-9]/.test(firstChar)) {
            throw new Error(`Invalid number format for ${options.inputBase.name}`);
          }
        }
      } catch (error) {}
    }
    const firstResult = Parser.#parseRational(expr, options);
    let firstValue = firstResult.value;
    let remainingAfterFirst = firstResult.remainingExpr;
    if (remainingAfterFirst.length > 0 && remainingAfterFirst[0] === "E") {
      let eEndIndex = 1;
      if (eEndIndex < remainingAfterFirst.length && remainingAfterFirst[eEndIndex] === "-") {
        eEndIndex++;
      }
      while (eEndIndex < remainingAfterFirst.length && /\d/.test(remainingAfterFirst[eEndIndex])) {
        eEndIndex++;
      }
      if (eEndIndex < remainingAfterFirst.length && remainingAfterFirst[eEndIndex] === ":") {
        const eNotationPart = remainingAfterFirst.substring(0, eEndIndex);
        const firstInterval = RationalInterval.point(firstResult.value);
        const eResult = Parser.#parseENotation(firstInterval, eNotationPart, options);
        if (eResult.value instanceof RationalInterval) {
          firstValue = eResult.value.low;
        } else if (eResult.value instanceof Rational) {
          firstValue = eResult.value;
        } else if (eResult.value instanceof Integer) {
          firstValue = eResult.value.toRational();
        } else {
          firstValue = eResult.value;
        }
        remainingAfterFirst = remainingAfterFirst.substring(eEndIndex);
      }
    }
    if (remainingAfterFirst.length === 0 || remainingAfterFirst[0] !== ":") {
      if (options.typeAware) {
        if (firstValue instanceof Rational && firstValue.denominator === 1n) {
          if (firstValue._explicitFraction) {
            return {
              value: firstValue,
              remainingExpr: remainingAfterFirst
            };
          }
          return {
            value: new Integer(firstValue.numerator),
            remainingExpr: remainingAfterFirst
          };
        }
        return {
          value: firstValue,
          remainingExpr: remainingAfterFirst
        };
      } else {
        const pointValue = RationalInterval.point(firstValue);
        return {
          value: pointValue,
          remainingExpr: remainingAfterFirst
        };
      }
    }
    const secondRationalExpr = remainingAfterFirst.substring(1);
    const secondResult = Parser.#parseRational(secondRationalExpr, options);
    let secondValue = secondResult.value;
    let remainingExpr = secondResult.remainingExpr;
    if (remainingExpr.length > 0 && (remainingExpr[0] === "E" || remainingExpr.startsWith("_^"))) {
      const secondInterval = RationalInterval.point(secondResult.value);
      const eResult = Parser.#parseENotation(secondInterval, remainingExpr, options);
      if (eResult.value instanceof RationalInterval) {
        secondValue = eResult.value.low;
      } else if (eResult.value instanceof Rational) {
        secondValue = eResult.value;
      } else if (eResult.value instanceof Integer) {
        secondValue = eResult.value.toRational();
      } else {
        secondValue = eResult.value;
      }
      remainingExpr = eResult.remainingExpr;
    }
    const interval = new RationalInterval(firstValue, secondValue);
    interval._explicitInterval = true;
    return {
      value: interval,
      remainingExpr
    };
  }
  static #parseRational(expr, options = {}) {
    expr = expr.trim();
    const prefixMatch = expr.trim().match(/^(-?)(?:0z\[(\d+)\]|0([a-zA-Z]))/i);
    let isExplicitPrefix = false;
    if (prefixMatch) {
      const isNegative3 = prefixMatch[1] === "-";
      let baseSystem;
      let matchedPrefixLength;
      if (prefixMatch[2]) {
        try {
          baseSystem = BaseSystem.fromBase(parseInt(prefixMatch[2], 10));
          matchedPrefixLength = prefixMatch[0].length;
        } catch (e) {
          throw new Error(`Invalid custom base '0z[${prefixMatch[2]}]': ${e.message}`);
        }
      } else if (prefixMatch[3]) {
        const prefixChar = prefixMatch[3];
        baseSystem = BaseSystem.getSystemForPrefix(prefixChar);
        matchedPrefixLength = prefixMatch[0].length;
        if (!baseSystem && prefixChar.toLowerCase() !== "e" && prefixChar !== "D") {
          throw new Error(`Invalid or unregistered prefix '0${prefixChar}'`);
        }
      }
      if (baseSystem || prefixMatch[3] && prefixMatch[3] === "D") {
        options = { ...options, inputBase: baseSystem || options.inputBase };
        isExplicitPrefix = true;
        expr = (isNegative3 ? "-" : "") + expr.substring(matchedPrefixLength);
      }
    }
    if (expr.length === 0) {
      throw new Error("Unexpected end of expression");
    }
    if (options.inputBase && options.inputBase !== BaseSystem.DECIMAL && !/^[\w./:^-]+\[\d+\]/.test(expr) && !/^[\w./:^-]+#/.test(expr)) {
      let endIndex = 0;
      let hasDecimalPoint = false;
      let hasMixedNumber = false;
      let hasFraction = false;
      let hasExponent = false;
      let validationBase = options.inputBase;
      if (expr[endIndex] === "-") {
        endIndex++;
      }
      while (endIndex < expr.length) {
        const char = expr[endIndex];
        let isValidChar = validationBase.charMap.has(char);
        if (!isValidChar) {
          const baseUsesLowercase = validationBase.characters.some((ch) => ch >= "a" && ch <= "z");
          const baseUsesUppercase = validationBase.characters.some((ch) => ch >= "A" && ch <= "Z");
          if (baseUsesLowercase && !baseUsesUppercase && char >= "A" && char <= "Z") {
            isValidChar = validationBase.charMap.has(char.toLowerCase());
          } else if (baseUsesUppercase && !baseUsesLowercase && char >= "a" && char <= "z") {
            isValidChar = validationBase.charMap.has(char.toUpperCase());
          }
        }
        if (isValidChar) {
          endIndex++;
        } else if (char === "." && endIndex + 1 < expr.length && expr[endIndex + 1] === ".") {
          if (hasMixedNumber || hasDecimalPoint || hasFraction)
            break;
          hasMixedNumber = true;
          endIndex += 2;
        } else if (char === "." && !hasDecimalPoint && !hasMixedNumber) {
          hasDecimalPoint = true;
          endIndex++;
        } else if (char === "/" && !hasFraction) {
          if (endIndex + 1 < expr.length) {
            const nextChar = expr[endIndex + 1];
            if (!validationBase.charMap.has(nextChar)) {
              break;
            }
          }
          hasFraction = true;
          endIndex++;
          if (endIndex < expr.length) {
            const potentialPrefix = expr.substring(endIndex);
            const customSubMatch = potentialPrefix.match(/^0z\[(\d+)\]/i);
            const subPrefixMatch = potentialPrefix.match(/^0([a-zA-Z])/);
            if (customSubMatch) {
              try {
                validationBase = BaseSystem.fromBase(parseInt(customSubMatch[1], 10));
                endIndex += customSubMatch[0].length;
              } catch (e) {}
            } else if (subPrefixMatch) {
              const prefixChar = subPrefixMatch[1];
              const subBase = BaseSystem.getSystemForPrefix(prefixChar);
              if (subBase || prefixChar === "D") {
                if (subBase)
                  validationBase = subBase;
                endIndex += 2;
              }
            }
          }
        } else if (validationBase.characters.includes(char.toUpperCase()) && (char === "E" || char === "e")) {
          endIndex++;
        } else if (char === "E" && !options.disableENotation || char === "_" && endIndex + 1 < expr.length && expr[endIndex + 1] === "^") {
          hasExponent = true;
          endIndex += char === "_" ? 2 : 1;
          if (endIndex < expr.length && (expr[endIndex] === "+" || expr[endIndex] === "-")) {
            endIndex++;
          }
        } else if (/[0-9]/.test(char)) {
          endIndex++;
        } else {
          break;
        }
      }
      if (isExplicitPrefix && endIndex <= (expr[0] === "-" ? 1 : 0)) {
        throw new Error(`Invalid number format for ${options.inputBase.name}`);
      }
      if (endIndex > (expr[0] === "-" ? 1 : 0)) {
        const numberStr = expr.substring(0, endIndex);
        const testStr = numberStr.startsWith("-") ? numberStr.substring(1) : numberStr;
        const parts = testStr.split(/[\.\/]/);
        let isValidInBase = true;
        if (!isExplicitPrefix) {
          isValidInBase = parts.every((part, index) => {
            if (part === "") {
              return testStr.includes(".") && (index === 0 || index === parts.length - 1 || testStr.includes(".."));
            }
            const baseUsesLowercase = options.inputBase.characters.some((char) => char >= "a" && char <= "z");
            const baseUsesUppercase = options.inputBase.characters.some((char) => char >= "A" && char <= "Z");
            return part.split("").every((char) => {
              if (options.inputBase.charMap.has(char)) {
                return true;
              }
              if (baseUsesLowercase && !baseUsesUppercase && char >= "A" && char <= "Z") {
                return options.inputBase.charMap.has(char.toLowerCase());
              }
              if (baseUsesUppercase && !baseUsesLowercase && char >= "a" && char <= "z") {
                return options.inputBase.charMap.has(char.toUpperCase());
              }
              return false;
            });
          });
        }
        if (isValidInBase) {
          try {
            const result = parseBaseNotation(numberStr, options.inputBase, options);
            return {
              value: result,
              remainingExpr: expr.substring(endIndex)
            };
          } catch (error) {
            if (isExplicitPrefix) {
              throw error;
            }
          }
        } else if (options.inputBase && options.inputBase !== BaseSystem.DECIMAL) {
          throw new Error(`Invalid number format for ${options.inputBase.name}`);
        }
      } else if (options.inputBase && options.inputBase !== BaseSystem.DECIMAL) {
        const firstChar = expr.startsWith("-") ? expr[1] : expr[0];
        if (/[0-9]/.test(firstChar)) {
          throw new Error(`Invalid number format for ${options.inputBase.name}`);
        }
      }
    }
    let hashIndex = expr.indexOf("#");
    if (hashIndex !== -1) {
      const beforeHash = expr.substring(0, hashIndex);
      if (/^-?(\d+\.?\d*|\.\d+)$/.test(beforeHash)) {
        let endIndex = hashIndex + 1;
        while (endIndex < expr.length && /\d/.test(expr[endIndex])) {
          endIndex++;
        }
        const repeatingDecimalStr = expr.substring(0, endIndex);
        try {
          const result = parseRepeatingDecimal(repeatingDecimalStr);
          if (result instanceof RationalInterval) {
            const midpoint = result.low.add(result.high).divide(new Rational(2));
            return {
              value: midpoint,
              remainingExpr: expr.substring(endIndex)
            };
          } else {
            return {
              value: result,
              remainingExpr: expr.substring(endIndex)
            };
          }
        } catch (error) {
          throw new Error(`Invalid repeating decimal: ${error.message}`);
        }
      }
    }
    let decimalIndex = expr.indexOf(".");
    if (decimalIndex !== -1 && decimalIndex + 1 < expr.length && expr[decimalIndex + 1] !== ".") {
      let endIndex = 0;
      let hasDecimalPoint = false;
      if (expr[endIndex] === "-") {
        endIndex++;
      }
      while (endIndex < expr.length) {
        if (/\d/.test(expr[endIndex])) {
          endIndex++;
        } else if (expr[endIndex] === "." && !hasDecimalPoint && endIndex + 1 < expr.length && expr[endIndex + 1] !== ".") {
          hasDecimalPoint = true;
          endIndex++;
        } else {
          break;
        }
      }
      if (hasDecimalPoint && endIndex > (expr[0] === "-" ? 2 : 1)) {
        const decimalStr = expr.substring(0, endIndex);
        try {
          const result = new Rational(decimalStr);
          return {
            value: result,
            remainingExpr: expr.substring(endIndex)
          };
        } catch (error) {}
      }
    }
    let i = 0;
    let numeratorStr = "";
    let denominatorStr = "";
    let isNegative2 = false;
    let wholePart = 0n;
    let hasMixedForm = false;
    if (expr[i] === "-") {
      isNegative2 = true;
      i++;
    }
    while (i < expr.length && /\d/.test(expr[i])) {
      numeratorStr += expr[i];
      i++;
    }
    if (numeratorStr.length === 0) {
      throw new Error("Invalid rational number format");
    }
    if (i + 1 < expr.length && expr[i] === "." && expr[i + 1] === ".") {
      hasMixedForm = true;
      wholePart = isNegative2 ? -BigInt(numeratorStr) : BigInt(numeratorStr);
      isNegative2 = false;
      i += 2;
      numeratorStr = "";
      while (i < expr.length && /\d/.test(expr[i])) {
        numeratorStr += expr[i];
        i++;
      }
      if (numeratorStr.length === 0) {
        throw new Error('Invalid mixed number format: missing numerator after ".."');
      }
    }
    let explicitFraction = false;
    if (i < expr.length && expr[i] === "/") {
      explicitFraction = true;
      i++;
      if (i < expr.length && expr[i] === "S") {
        if (hasMixedForm) {
          throw new Error("Invalid mixed number format: missing denominator");
        }
        const numerator2 = isNegative2 ? -BigInt(numeratorStr) : BigInt(numeratorStr);
        return {
          value: new Rational(numerator2, 1n),
          remainingExpr: expr.substring(i - 1)
        };
      }
      if (i < expr.length && expr[i] === "(") {
        if (hasMixedForm) {
          throw new Error("Invalid mixed number format: missing denominator");
        }
        const numerator2 = isNegative2 ? -BigInt(numeratorStr) : BigInt(numeratorStr);
        return {
          value: new Rational(numerator2, 1n),
          remainingExpr: expr.substring(i - 1)
        };
      }
      while (i < expr.length && /\d/.test(expr[i])) {
        denominatorStr += expr[i];
        i++;
      }
      if (denominatorStr.length === 0) {
        throw new Error("Invalid rational number format");
      }
      if (i < expr.length && expr[i] === "E") {
        throw new Error("E notation not allowed directly after fraction without parentheses");
      }
    } else {
      if (hasMixedForm) {
        throw new Error("Invalid mixed number format: missing denominator");
      }
      denominatorStr = "1";
    }
    if (hasMixedForm && i < expr.length && expr[i] === "E") {
      throw new Error("E notation not allowed directly after mixed number without parentheses");
    }
    let numerator, denominator;
    if (hasMixedForm) {
      numerator = BigInt(numeratorStr);
      denominator = BigInt(denominatorStr);
      const sign = wholePart < 0n ? -1n : 1n;
      numerator = sign * ((wholePart.valueOf() < 0n ? -wholePart : wholePart) * denominator + numerator);
    } else {
      numerator = isNegative2 ? -BigInt(numeratorStr) : BigInt(numeratorStr);
      denominator = BigInt(denominatorStr);
    }
    if (denominator === 0n) {
      throw new Error("Denominator cannot be zero");
    }
    const rational = new Rational(numerator, denominator);
    if (explicitFraction && denominator === 1n) {
      rational._explicitFraction = true;
    }
    return {
      value: rational,
      remainingExpr: expr.substring(i)
    };
  }
  static #parseContinuedFraction(expr, options = {}) {
    const cfMatch = expr.match(/^(-?\d+)\.~((?:\d+~?)*\d*)(.*)$/);
    if (!cfMatch) {
      throw new Error("Invalid continued fraction format");
    }
    const [fullMatch, integerPart, cfTermsStr, remaining] = cfMatch;
    if (cfTermsStr === "") {
      throw new Error("Continued fraction must have at least one term after .~");
    }
    if (cfTermsStr.endsWith("~")) {
      throw new Error("Continued fraction cannot end with ~");
    }
    if (cfTermsStr.includes("~~")) {
      throw new Error("Invalid continued fraction format: double tilde");
    }
    const cfArray = Parser.parseContinuedFraction(fullMatch.substring(0, fullMatch.length - remaining.length));
    if (typeof Rational.fromContinuedFraction === "function") {
      const rational = Rational.fromContinuedFraction(cfArray);
      return {
        value: rational,
        remainingExpr: remaining
      };
    } else {
      throw new Error("Continued fraction support not yet implemented in Rational class");
    }
  }
  static parseContinuedFraction(cfString) {
    const cfMatch = cfString.match(/^(-?\d+)\.~(.*)$/);
    if (!cfMatch) {
      throw new Error("Invalid continued fraction format");
    }
    const [, integerPart, cfTermsStr] = cfMatch;
    const intPart = BigInt(integerPart);
    if (cfTermsStr === "0") {
      return [intPart];
    }
    if (cfTermsStr === "") {
      throw new Error("Continued fraction must have at least one term after .~");
    }
    if (cfTermsStr.endsWith("~")) {
      throw new Error("Continued fraction cannot end with ~");
    }
    if (cfTermsStr.includes("~~")) {
      throw new Error("Invalid continued fraction format: double tilde");
    }
    const terms = cfTermsStr.split("~");
    const cfTerms = [];
    for (const term of terms) {
      if (!/^\d+$/.test(term)) {
        throw new Error(`Invalid continued fraction term: ${term}`);
      }
      const termValue = BigInt(term);
      if (termValue <= 0n) {
        throw new Error(`Continued fraction terms must be positive integers: ${term}`);
      }
      cfTerms.push(termValue);
    }
    return [intPart, ...cfTerms];
  }
}
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

// src/stern-brocot-web.js
class SternBrocotTreeVisualizer {
  constructor() {
    this.rix = createSternBrocotRixBridge();
    this.currentFraction = new Fraction(0, 1);
    this.displayMode = "fraction";
    this.cfNotationMode = "ratmath";
    this.expressionDisplayMode = "mixed";
    this.svg = document.getElementById("treeSvg");
    this.svgWidth = 800;
    this.svgHeight = 600;
    this.scrollOffset = { x: 0, y: 0 };
    this.treeContainer = null;
    this.initializeElements();
    this.setupEventListeners();
    this.setupTooltips();
    this.loadFromURL();
    this.updateDisplay();
    this.renderTree();
  }
  initializeElements() {
    this.elements = {
      displayModeBtns: document.querySelectorAll(".display-mode-btn"),
      precisionInput: document.getElementById("precisionInput"),
      currentFraction: document.getElementById("currentFraction"),
      currentDepth: document.getElementById("currentDepth"),
      currentPath: document.getElementById("currentPath"),
      currentBoundaries: document.getElementById("currentBoundaries"),
      decimalValue: document.getElementById("decimalValue"),
      parentBtn: document.getElementById("parentBtn"),
      leftChildBtn: document.getElementById("leftChildBtn"),
      rightChildBtn: document.getElementById("rightChildBtn"),
      resetBtn: document.getElementById("resetBtn"),
      jumpInput: document.getElementById("jumpInput"),
      jumpBtn: document.getElementById("jumpBtn"),
      breadcrumbPath: document.getElementById("breadcrumbPath"),
      mediantCalculation: document.getElementById("mediantCalculation"),
      continuedFraction: document.getElementById("continuedFraction"),
      convergentsModal: document.getElementById("convergentsModal"),
      fareyModal: document.getElementById("fareyModal"),
      allConvergents: document.getElementById("allConvergents"),
      fareySequenceContent: document.getElementById("fareySequenceContent"),
      closeConvergents: document.getElementById("closeConvergents"),
      closeFarey: document.getElementById("closeFarey"),
      helpBtn: document.getElementById("helpBtn"),
      helpModal: document.getElementById("helpModal"),
      helpContent: document.getElementById("helpContent"),
      closeHelp: document.getElementById("closeHelp"),
      fractionTooltip: document.getElementById("fractionTooltip"),
      expressionInput: document.getElementById("expressionInput"),
      expressionResult: document.getElementById("expressionResult"),
      notationToggle: document.getElementById("notationToggle"),
      sqrt2Btn: document.getElementById("sqrt2Btn"),
      eBtn: document.getElementById("eBtn"),
      piBtn: document.getElementById("piBtn"),
      phiBtn: document.getElementById("phiBtn"),
      leftBoundaryBox: document.getElementById("leftBoundaryBox"),
      currentNodeBox: document.getElementById("currentNodeBox"),
      rightBoundaryBox: document.getElementById("rightBoundaryBox"),
      leftBoundaryDisplay: document.getElementById("leftBoundaryDisplay"),
      currentNodeDisplay: document.getElementById("currentNodeDisplay"),
      rightBoundaryDisplay: document.getElementById("rightBoundaryDisplay")
    };
  }
  setupEventListeners() {
    this.elements.parentBtn.addEventListener("click", () => this.navigateToParent());
    this.elements.leftChildBtn.addEventListener("click", () => this.navigateToLeftChild());
    this.elements.rightChildBtn.addEventListener("click", () => this.navigateToRightChild());
    this.elements.resetBtn.addEventListener("click", () => this.reset());
    this.elements.jumpBtn.addEventListener("click", () => this.jumpToFraction());
    this.elements.jumpInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter")
        this.jumpToFraction();
    });
    this.elements.helpBtn.addEventListener("click", () => this.showHelpModal());
    this.elements.notationToggle.addEventListener("click", () => this.toggleNotation());
    this.elements.sqrt2Btn.addEventListener("click", () => this.jumpToConstant("sqrt2"));
    this.elements.eBtn.addEventListener("click", () => this.jumpToConstant("e"));
    this.elements.piBtn.addEventListener("click", () => this.jumpToConstant("pi"));
    this.elements.phiBtn.addEventListener("click", () => this.jumpToConstant("phi"));
    this.elements.leftBoundaryBox.addEventListener("click", () => this.handleBoundaryClick("left"));
    this.elements.currentNodeBox.addEventListener("click", () => this.handleBoundaryClick("current"));
    this.elements.rightBoundaryBox.addEventListener("click", () => this.handleBoundaryClick("right"));
    this.elements.expressionInput.addEventListener("input", () => this.updateExpressionResult());
    this.elements.expressionInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter")
        this.updateExpressionResult();
    });
    this.elements.displayModeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setExpressionDisplayMode(e.target.dataset.mode);
      });
    });
    this.elements.precisionInput.addEventListener("change", () => {
      this.updateExpressionResult();
    });
    this.elements.precisionInput.addEventListener("input", () => {
      this.updateExpressionResult();
    });
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));
    this.svg.addEventListener("click", (e) => this.handleSvgClick(e));
    this.svg.addEventListener("wheel", (e) => this.handleScroll(e), {
      passive: false
    });
    this.svg.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
      passive: false
    });
    this.svg.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: false
    });
    this.svg.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: false
    });
    this.elements.closeConvergents.addEventListener("click", () => this.closeModal("convergents"));
    this.elements.closeFarey.addEventListener("click", () => this.closeModal("farey"));
    this.elements.closeHelp.addEventListener("click", () => this.closeModal("help"));
    window.addEventListener("click", (e) => {
      if (e.target === this.elements.convergentsModal)
        this.closeModal("convergents");
      if (e.target === this.elements.fareyModal)
        this.closeModal("farey");
      if (e.target === this.elements.helpModal)
        this.closeModal("help");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal("convergents");
        this.closeModal("farey");
        this.closeModal("help");
      }
    });
    window.addEventListener("popstate", (e) => {
      this.loadFromURL(false);
    });
  }
  setupTooltips() {
    this.svg.addEventListener("mouseenter", this.handleTooltipShow.bind(this), true);
    this.svg.addEventListener("mouseleave", this.handleTooltipHide.bind(this), true);
    this.svg.addEventListener("mousemove", this.handleTooltipMove.bind(this), true);
    this.longPressTimer = null;
    this.touchStartPos = null;
    this.tooltipTouchTarget = null;
  }
  handleTooltipShow(e) {
    const node = e.target.closest(".tree-node");
    if (node && node.dataset.fraction) {
      const fraction = node.dataset.fraction;
      this.elements.fractionTooltip.textContent = fraction;
      this.elements.fractionTooltip.style.display = "block";
      this.updateTooltipPosition(e);
    }
  }
  handleTooltipHide(e) {
    if (!e.relatedTarget || !e.relatedTarget.closest(".tree-node")) {
      this.elements.fractionTooltip.style.display = "none";
    }
  }
  handleTooltipMove(e) {
    if (this.elements.fractionTooltip.style.display === "block") {
      this.updateTooltipPosition(e);
    }
  }
  updateTooltipPosition(e) {
    const tooltip = this.elements.fractionTooltip;
    const x = e.clientX + 10;
    const y = e.clientY - 30;
    const rect = tooltip.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 10;
    const maxY = window.innerHeight - rect.height - 10;
    tooltip.style.left = Math.min(x, maxX) + "px";
    tooltip.style.top = Math.max(y, 10) + "px";
  }
  formatFraction(fraction, mode = null, use2D = true) {
    const displayMode = mode || this.displayMode;
    if (fraction.isInfinite) {
      if (use2D) {
        return `<div class="fraction-2d">
            <div class="numerator">${fraction.numerator > 0 ? "1" : "-1"}</div>
            <div class="fraction-bar"></div>
            <div class="denominator">0</div>
        </div>`;
      } else {
        return fraction.numerator > 0 ? "1/0" : "-1/0";
      }
    }
    if (!use2D && displayMode === "fraction") {
      let ret = fraction.toString();
      if (ret.length < 17) {
        return ret;
      } else {
        use2D = true;
      }
    }
    if (use2D && displayMode === "fraction") {
      return this.format2DFraction(fraction);
    }
    switch (displayMode) {
      case "decimal":
        try {
          const rational = fraction.toRational();
          return rational.toDecimal();
        } catch {
          return (Number(fraction.numerator) / Number(fraction.denominator)).toFixed(6);
        }
      case "mixed":
        try {
          const rational = fraction.toRational();
          return rational.toMixedString();
        } catch {
          return fraction.toString();
        }
      case "cf":
        try {
          const rational = fraction.toRational();
          const cf = rational.toContinuedFraction();
          if (cf.length === 1)
            return cf[0].toString();
          return cf[0] + ".~" + cf.slice(1).join("~");
        } catch {
          return fraction.toString();
        }
      default:
        return fraction.toString();
    }
  }
  format2DFraction(fraction) {
    if (fraction.isInfinite) {
      return fraction.numerator > 0 ? "+∞" : "-∞";
    }
    return `<div class="fraction-2d">
            <div class="numerator">${fraction.numerator}</div>
            <div class="fraction-bar"></div>
            <div class="denominator">${fraction.denominator}</div>
        </div>`;
  }
  createSVG2DFraction(fraction, x, y, fontSize) {
    if (fraction.isInfinite) {
      const elements2 = [];
      const lineHeight2 = fontSize < 16 ? fontSize * 0.6 : fontSize * 0.5;
      const numerator2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      numerator2.setAttribute("x", x);
      numerator2.setAttribute("y", y - lineHeight2);
      numerator2.setAttribute("font-size", fontSize);
      numerator2.setAttribute("text-anchor", "middle");
      numerator2.setAttribute("dominant-baseline", "central");
      numerator2.setAttribute("fill", "black");
      numerator2.setAttribute("font-weight", "bold");
      numerator2.textContent = fraction.numerator > 0 ? "1" : "-1";
      elements2.push(numerator2);
      const maxWidth2 = fontSize * 0.8;
      const bar2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      bar2.setAttribute("x1", x - maxWidth2 / 2);
      bar2.setAttribute("y1", y);
      bar2.setAttribute("x2", x + maxWidth2 / 2);
      bar2.setAttribute("y2", y);
      bar2.setAttribute("stroke", "black");
      bar2.setAttribute("stroke-width", "2");
      elements2.push(bar2);
      const denominator2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      denominator2.setAttribute("x", x);
      denominator2.setAttribute("y", y + lineHeight2);
      denominator2.setAttribute("font-size", fontSize);
      denominator2.setAttribute("text-anchor", "middle");
      denominator2.setAttribute("dominant-baseline", "central");
      denominator2.setAttribute("fill", "black");
      denominator2.setAttribute("font-weight", "bold");
      denominator2.textContent = "0";
      elements2.push(denominator2);
      return elements2;
    }
    const elements = [];
    const lineHeight = fontSize < 16 ? fontSize * 0.6 : fontSize * 0.5;
    const numerator = document.createElementNS("http://www.w3.org/2000/svg", "text");
    numerator.setAttribute("x", x);
    numerator.setAttribute("y", y - lineHeight);
    numerator.setAttribute("font-size", fontSize);
    numerator.setAttribute("text-anchor", "middle");
    numerator.setAttribute("dominant-baseline", "central");
    numerator.setAttribute("fill", "black");
    numerator.setAttribute("font-weight", "bold");
    numerator.textContent = fraction.numerator.toString();
    elements.push(numerator);
    const maxWidth = Math.max(fraction.numerator.toString().length, fraction.denominator.toString().length) * fontSize * 0.7;
    const bar = document.createElementNS("http://www.w3.org/2000/svg", "line");
    bar.setAttribute("x1", x - maxWidth / 2);
    bar.setAttribute("y1", y);
    bar.setAttribute("x2", x + maxWidth / 2);
    bar.setAttribute("y2", y);
    bar.setAttribute("stroke", "black");
    bar.setAttribute("stroke-width", "2");
    elements.push(bar);
    const denominator = document.createElementNS("http://www.w3.org/2000/svg", "text");
    denominator.setAttribute("x", x);
    denominator.setAttribute("y", y + lineHeight);
    denominator.setAttribute("font-size", fontSize);
    denominator.setAttribute("text-anchor", "middle");
    denominator.setAttribute("dominant-baseline", "central");
    denominator.setAttribute("fill", "black");
    denominator.setAttribute("font-weight", "bold");
    denominator.textContent = fraction.denominator.toString();
    elements.push(denominator);
    return elements;
  }
  updateDisplay() {
    this.currentRixNode = this.rix.describeNode(this.currentFraction);
    this.elements.currentFraction.innerHTML = this.formatFraction(this.currentFraction, "fraction", true);
    const depth = this.currentRixNode.depth;
    this.elements.currentDepth.textContent = depth === Infinity ? "∞" : depth.toString();
    this.updateBoundaryDisplay();
    try {
      const rational = this.currentFraction.toRational();
      const decimalInfo = rational.toRepeatingDecimalWithPeriod(true);
      const decimalDisplay = decimalInfo.period > 0 ? `${decimalInfo.decimal} (p:${decimalInfo.period})` : decimalInfo.decimal;
      this.elements.decimalValue.textContent = decimalDisplay;
    } catch (e) {
      this.elements.decimalValue.textContent = (Number(this.currentFraction.numerator) / Number(this.currentFraction.denominator)).toFixed(6);
    }
    const path = this.currentRixNode.path;
    if (path.length === 0) {
      this.elements.currentPath.textContent = "Root";
    } else {
      const pathString = path.join("");
      this.elements.currentPath.innerHTML = this.wrapPath(pathString);
    }
    const [leftParent, rightParent] = this.currentRixNode.boundaries;
    const leftBoundary = this.formatFraction(leftParent, "fraction", true);
    const rightBoundary = this.formatFraction(rightParent, "fraction", true);
    const currentBoundary = this.formatFraction(this.currentFraction, "fraction", true);
    this.elements.currentBoundaries.innerHTML = `
            <div class="boundaries-line">
                <span class="left-boundary">${leftBoundary}</span>
                <span class="right-boundary">${rightBoundary}</span>
            </div>
            <div class="current-boundary">${currentBoundary}</div>
        `;
    const hasParent = this.currentRixNode.parent !== null;
    this.elements.parentBtn.disabled = !hasParent;
    this.updateBreadcrumbs();
    this.updateMediantCalculation();
    this.updateContinuedFraction();
    this.updateExpressionResult();
  }
  updateBreadcrumbs() {
    const ancestors = this.currentRixNode?.ancestors ?? this.rix.describeNode(this.currentFraction).ancestors;
    const path = this.currentRixNode?.path ?? this.rix.describeNode(this.currentFraction).path;
    let breadcrumbHtml = "";
    const rootFraction = new Fraction(0, 1);
    const rootDisplay = this.formatFraction(rootFraction, "fraction", false);
    breadcrumbHtml += `<span class="breadcrumb clickable-breadcrumb" onclick="sternBrocotApp.navigateToFraction('0', '1')" title="Click to navigate to root">${rootDisplay} (Root)</span>`;
    for (let i = 0;i < path.length; i++) {
      const partialPath = path.slice(0, i + 1);
      const fraction = Fraction.fromSternBrocotPath(partialPath);
      const direction = path[i];
      const directionClass = direction === "L" ? "left-direction" : "right-direction";
      const fractionDisplay = this.formatFraction(fraction, "fraction", false);
      const isLast = i === path.length - 1;
      const breadcrumbClass = isLast ? "breadcrumb current" : "breadcrumb clickable-breadcrumb";
      const clickHandler = isLast ? "" : `onclick="sternBrocotApp.navigateToFraction('${fraction.numerator}', '${fraction.denominator}')"`;
      const title = isLast ? "" : `title="Click to navigate to ${fraction.toString()}"`;
      breadcrumbHtml += ` → <span class="${breadcrumbClass} ${directionClass}" ${clickHandler} ${title}>${fractionDisplay} (${direction})</span>`;
    }
    this.elements.breadcrumbPath.innerHTML = breadcrumbHtml;
  }
  updateMediantCalculation() {
    const model = this.currentRixNode ?? this.rix.describeNode(this.currentFraction);
    const [left, right] = model.boundaries;
    const mediant = model.mediant;
    const leftStr = this.formatFraction(left, "fraction", true);
    const rightStr = this.formatFraction(right, "fraction", true);
    const mediantStr = this.formatFraction(mediant, "fraction", true);
    const currentStr = this.formatFraction(this.currentFraction, "fraction", true);
    const leftNum = left.isInfinite ? left.numerator > 0 ? "1" : "-1" : left.numerator.toString();
    const leftDen = left.isInfinite ? "0" : left.denominator.toString();
    const rightNum = right.isInfinite ? right.numerator > 0 ? "1" : "-1" : right.numerator.toString();
    const rightDen = right.isInfinite ? "0" : right.denominator.toString();
    const numeratorSum = left.numerator + right.numerator;
    const denominatorSum = left.denominator + right.denominator;
    this.elements.mediantCalculation.innerHTML = `
            <strong>Mediant calculation:</strong><br>
            ${leftStr} ⊕ ${rightStr} =
            <div class="fraction-2d" style="display: inline-block; margin: 0 0.5rem;">
                <div class="numerator">${leftNum}+${rightNum}</div>
                <div class="fraction-bar"></div>
                <div class="denominator">${leftDen}+${rightDen}</div>
            </div>
            =
            <div class="fraction-2d" style="display: inline-block; margin: 0 0.5rem;">
                <div class="numerator">${numeratorSum}</div>
                <div class="fraction-bar"></div>
                <div class="denominator">${denominatorSum}</div>
            </div>
        `;
  }
  updateContinuedFraction() {
    try {
      const model = this.currentRixNode ?? this.rix.describeNode(this.currentFraction);
      const rational = model.rational;
      const cf = model.continuedFraction.map((coefficient) => coefficient.value ?? coefficient.numerator);
      let cfDisplay, notationLabel;
      if (this.cfNotationMode === "standard") {
        cfDisplay = `[${cf[0]}`;
        if (cf.length > 1) {
          cfDisplay += `; ${cf.slice(1).join(", ")}`;
        }
        cfDisplay += "]";
        notationLabel = "Standard notation";
      } else {
        cfDisplay = cf[0].toString();
        if (cf.length > 1) {
          cfDisplay += ".~" + cf.slice(1).join("~");
        } else {
          cfDisplay += ".~0";
        }
        cfDisplay = this.wrapContinuedFraction(cfDisplay);
        notationLabel = "RatMath notation";
      }
      const allConvergents = model.convergents;
      const displayConvergents = allConvergents.slice(0, 6);
      const remainingCount = allConvergents.length - displayConvergents.length;
      let convergentsDisplay = displayConvergents.map((c) => this.formatFraction(Fraction.fromRational(c), "fraction", true)).join(", ");
      if (remainingCount > 0) {
        convergentsDisplay += ` <span class="more-link" onclick="sternBrocotApp.showConvergentsModal()">...(+${remainingCount})</span>`;
      }
      this.elements.continuedFraction.innerHTML = `
                <strong>${notationLabel}:</strong> ${cfDisplay}<br>
                <strong><span class="more-link" onclick="sternBrocotApp.showConvergentsModal()" style="text-decoration: none; color: inherit; cursor: pointer;" title="Click to view all convergents">Convergents:</span></strong> <span class="more-link" onclick="sternBrocotApp.showConvergentsModal()" style="cursor: pointer;">${convergentsDisplay}</span>
            `;
    } catch (error) {
      this.elements.continuedFraction.textContent = "Error calculating continued fraction";
    }
  }
  navigateToParent() {
    const parent = this.rix.describeNode(this.currentFraction).parent;
    if (parent) {
      this.animateToNewFraction(parent);
    }
  }
  navigateToLeftChild() {
    const [left] = this.rix.describeNode(this.currentFraction).children;
    this.animateToNewFraction(left);
  }
  navigateToRightChild() {
    const [, right] = this.rix.describeNode(this.currentFraction).children;
    this.animateToNewFraction(right);
  }
  reset() {
    this.animateToNewFraction(new Fraction(0, 1));
  }
  toggleNotation() {
    this.cfNotationMode = this.cfNotationMode === "ratmath" ? "standard" : "ratmath";
    this.elements.notationToggle.textContent = this.cfNotationMode === "ratmath" ? "Show Standard" : "Show RatMath";
    this.updateContinuedFraction();
  }
  getConstantDefinitions() {
    return {
      sqrt2: {
        name: "√2",
        cfCoeffs: [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        maxDenominator: 1000
      },
      e: {
        name: "e",
        cfCoeffs: [2, 1, 2, 1, 1, 4, 1, 1, 6, 1, 1, 8, 1, 1, 10, 1, 1, 12],
        maxDenominator: 1500
      },
      pi: {
        name: "π",
        cfCoeffs: [3, 7, 15, 1, 292, 1, 1, 1, 2, 1, 3, 1, 14, 2, 1, 1, 2, 2],
        maxDenominator: 2000
      },
      phi: {
        name: "φ (golden ratio)",
        cfCoeffs: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        maxDenominator: 1200
      }
    };
  }
  jumpToConstant(constantName) {
    const constants = this.getConstantDefinitions();
    const constant = constants[constantName];
    if (!constant) {
      console.error(`Unknown constant: ${constantName}`);
      return;
    }
    try {
      let convergents = [];
      let p_minus2 = 1n, p_minus1 = BigInt(constant.cfCoeffs[0]);
      let q_minus2 = 0n, q_minus1 = 1n;
      convergents.push(new Fraction(p_minus1, q_minus1));
      for (let i = 1;i < constant.cfCoeffs.length; i++) {
        const a = BigInt(constant.cfCoeffs[i]);
        const p = a * p_minus1 + p_minus2;
        const q = a * q_minus1 + q_minus2;
        const convergent = new Fraction(p, q);
        convergents.push(convergent);
        if (Number(q) > constant.maxDenominator) {
          const targetFraction2 = convergents[convergents.length - 2] || convergents[convergents.length - 1];
          this.animateToNewFraction(targetFraction2);
          return;
        }
        p_minus2 = p_minus1;
        p_minus1 = p;
        q_minus2 = q_minus1;
        q_minus1 = q;
      }
      const targetFraction = convergents[convergents.length - 1];
      this.animateToNewFraction(targetFraction);
    } catch (error) {
      console.error(`Error jumping to ${constant.name}:`, error);
      alert(`Error calculating approximation for ${constant.name}: ${error.message}`);
    }
  }
  animateToNewFraction(newFraction) {
    const oldCenter = { x: this.svgWidth / 2, y: this.svgHeight / 2 };
    this.currentFraction = newFraction;
    this.updateURL();
    this.scrollOffset = { x: 0, y: 0 };
    this.updateDisplay();
    this.renderTree();
    if (this.treeContainer) {
      this.treeContainer.style.opacity = "0.7";
      setTimeout(() => {
        if (this.treeContainer) {
          this.treeContainer.style.opacity = "1";
        }
      }, 100);
    }
  }
  jumpToFraction() {
    const input = this.elements.jumpInput.value.trim();
    if (!input)
      return;
    try {
      if (input.includes("/0")) {
        this.elements.jumpInput.value = "";
        this.reset();
        return;
      }
      const result = Parser.parse(input);
      let fraction;
      if (result.toRational) {
        fraction = Fraction.fromRational(result.toRational());
      } else if (result.numerator !== undefined && result.denominator !== undefined) {
        fraction = new Fraction(result.numerator, result.denominator);
      } else {
        throw new Error("Invalid input");
      }
      fraction = fraction.reduce();
      this.elements.jumpInput.value = "";
      this.animateToNewFraction(fraction);
    } catch (error) {
      alert(`Invalid input: ${error.message}`);
    }
  }
  handleKeyPress(e) {
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.contentEditable === "true");
    switch (e.key) {
      case "ArrowUp":
        if (!isInputFocused) {
          e.preventDefault();
          this.navigateToParent();
        }
        break;
      case "ArrowLeft":
        if (!isInputFocused) {
          e.preventDefault();
          this.navigateToLeftChild();
        }
        break;
      case "ArrowRight":
        if (!isInputFocused) {
          e.preventDefault();
          this.navigateToRightChild();
        }
        break;
      case "Home":
        if (!isInputFocused) {
          e.preventDefault();
          this.reset();
        }
        break;
      case "Escape":
        this.elements.jumpInput.blur();
        this.elements.expressionInput.blur();
        break;
    }
  }
  handleSvgClick(e) {
    const target = e.target.closest(".tree-node");
    if (target && target.dataset.fraction) {
      const [num, den] = target.dataset.fraction.split("/").map(BigInt);
      const newFraction = new Fraction(num, den);
      this.animateToNewFraction(newFraction);
    }
  }
  handleScroll(e) {
    e.preventDefault();
    const scrollSpeed = 20;
    const oldOffset = { ...this.scrollOffset };
    if (e.shiftKey) {
      this.scrollOffset.x -= e.deltaY * scrollSpeed * 0.1;
    } else {
      this.scrollOffset.y -= e.deltaY * scrollSpeed * 0.1;
    }
    this.applyScrollBounds();
    this.updateTreeTransform();
  }
  applyScrollBounds() {
    if (!this.treeContainer)
      return;
    const bounds = this.calculateTreeBounds();
    if (!bounds)
      return;
    const svgRect = this.svg.getBoundingClientRect();
    const svgWidth = svgRect.width;
    const svgHeight = svgRect.height;
    const maxScrollLeft = Math.min(0, svgWidth - bounds.right - 50);
    const maxScrollRight = Math.max(0, -bounds.left + 50);
    const maxScrollUp = Math.min(0, svgHeight - bounds.bottom - 50);
    const maxScrollDown = Math.max(0, -bounds.top + 50);
    this.scrollOffset.x = Math.max(maxScrollLeft, Math.min(maxScrollRight, this.scrollOffset.x));
    this.scrollOffset.y = Math.max(maxScrollUp, Math.min(maxScrollDown, this.scrollOffset.y));
  }
  calculateTreeBounds() {
    if (!this.treeContainer)
      return null;
    const nodes = this.treeContainer.querySelectorAll(".tree-node");
    if (nodes.length === 0)
      return null;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    nodes.forEach((node) => {
      const rect = node.querySelector("rect");
      if (rect) {
        const x = parseFloat(rect.getAttribute("x"));
        const y = parseFloat(rect.getAttribute("y"));
        const width = parseFloat(rect.getAttribute("width"));
        const height = parseFloat(rect.getAttribute("height"));
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + width);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + height);
      }
    });
    return {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.lastTouchPosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      const node = e.target.closest(".tree-node");
      if (node && node.dataset.fraction) {
        this.tooltipTouchTarget = node;
        this.touchStartPos = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
        this.longPressTimer = setTimeout(() => {
          const fraction = node.dataset.fraction;
          this.elements.fractionTooltip.textContent = fraction;
          this.elements.fractionTooltip.style.display = "block";
          this.elements.fractionTooltip.style.left = this.touchStartPos.x + 10 + "px";
          this.elements.fractionTooltip.style.top = this.touchStartPos.y - 30 + "px";
        }, 500);
      }
    }
  }
  handleTouchMove(e) {
    e.preventDefault();
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (e.touches.length === 1 && this.lastTouchPosition) {
      const deltaX = e.touches[0].clientX - this.lastTouchPosition.x;
      const deltaY = e.touches[0].clientY - this.lastTouchPosition.y;
      this.scrollOffset.x += deltaX * 0.5;
      this.scrollOffset.y += deltaY * 0.5;
      this.applyScrollBounds();
      this.lastTouchPosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      this.updateTreeTransform();
    }
  }
  handleTouchEnd(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.elements.fractionTooltip.style.display === "block") {
      setTimeout(() => {
        this.elements.fractionTooltip.style.display = "none";
      }, 2000);
    }
  }
  updateTreeTransform() {
    if (this.treeContainer) {
      this.treeContainer.setAttribute("transform", `translate(${this.scrollOffset.x}, ${this.scrollOffset.y})`);
    }
  }
  renderTree() {
    this.svg.innerHTML = "";
    this.treeContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.treeContainer.setAttribute("class", "tree-container");
    this.svg.appendChild(this.treeContainer);
    const treeData = this.getTreeStructure();
    this.renderEdges(treeData);
    this.renderNodes(treeData);
    this.updateTreeTransform();
  }
  getTreeStructure() {
    const maxDescendantDepth = 2;
    const nodes = new Map;
    const center = { x: this.svgWidth / 2, y: this.svgHeight / 2 };
    nodes.set(this.currentFraction.toString(), {
      fraction: this.currentFraction,
      x: center.x,
      y: center.y,
      type: "current",
      size: 45
    });
    const currentParent = this.currentFraction.sternBrocotParent();
    if (currentParent) {
      try {
        const currentSiblings = currentParent.sternBrocotChildren();
        const siblingSpacing = 140;
        let currentSibling = null;
        if (currentSiblings.left.equals(this.currentFraction)) {
          currentSibling = currentSiblings.right;
        } else if (currentSiblings.right.equals(this.currentFraction)) {
          currentSibling = currentSiblings.left;
        }
        if (currentSibling) {
          const siblingKey = currentSibling.toString();
          if (!nodes.has(siblingKey)) {
            const isLeftSibling = currentSiblings.right.equals(this.currentFraction);
            nodes.set(siblingKey, {
              fraction: currentSibling,
              x: center.x + (isLeftSibling ? -siblingSpacing : siblingSpacing),
              y: center.y,
              type: "current-sibling",
              size: 35
            });
          }
        }
      } catch (e) {}
    }
    let current = this.currentFraction;
    let y = center.y;
    const verticalSpacing = 90;
    let ancestorLevel = 0;
    while (true) {
      const parent = current.sternBrocotParent();
      if (!parent)
        break;
      ancestorLevel++;
      y -= verticalSpacing;
      const parentSize = ancestorLevel === 1 ? 40 : Math.max(30, 40 - ancestorLevel * 2);
      let parentX = center.x;
      try {
        const currentRational = this.currentFraction.toRational();
        const parentRational = parent.toRational();
        const comparison = parentRational.compareTo(currentRational);
        if (ancestorLevel <= 3) {
          const shift = Math.min(50, 20 * ancestorLevel);
          if (comparison < 0) {
            parentX = center.x - shift;
          } else if (comparison > 0) {
            parentX = center.x + shift;
          }
        } else {
          const standardShift = 80;
          if (comparison < 0) {
            parentX = center.x - standardShift;
          } else if (comparison > 0) {
            parentX = center.x + standardShift;
          }
        }
      } catch (e) {}
      nodes.set(parent.toString(), {
        fraction: parent,
        x: parentX,
        y,
        type: ancestorLevel === 1 ? "parent" : "ancestor",
        size: parentSize
      });
      const grandparent = parent.sternBrocotParent();
      if (grandparent) {
        try {
          const parentSiblings = grandparent.sternBrocotChildren();
          const siblingSpacing = 150;
          if (!parentSiblings.left.equals(parent)) {
            const siblingKey = parentSiblings.left.toString();
            if (!nodes.has(siblingKey)) {
              nodes.set(siblingKey, {
                fraction: parentSiblings.left,
                x: parentX - siblingSpacing,
                y,
                type: "sibling",
                size: Math.max(25, parentSize - 5)
              });
            }
          }
          if (!parentSiblings.right.equals(parent)) {
            const siblingKey = parentSiblings.right.toString();
            if (!nodes.has(siblingKey)) {
              nodes.set(siblingKey, {
                fraction: parentSiblings.right,
                x: parentX + siblingSpacing,
                y,
                type: "sibling",
                size: Math.max(25, parentSize - 5)
              });
            }
          }
        } catch (e) {}
      }
      current = parent;
    }
    current = this.currentFraction;
    y = center.y;
    const childOffset = 120;
    for (let depth = 1;depth <= maxDescendantDepth; depth++) {
      y += verticalSpacing;
      const levelNodes = this.getNodesAtDepth(current, depth);
      const nodeSize = depth === 1 ? 40 : Math.max(25, 40 - depth * 5);
      levelNodes.forEach((node, index) => {
        const key = node.toString();
        if (!nodes.has(key)) {
          const nodeParent = node.sternBrocotParent();
          let nodeX = center.x;
          if (depth === 1) {
            const children = this.currentFraction.sternBrocotChildren();
            if (node.equals(children.left)) {
              nodeX = center.x - childOffset;
            } else if (node.equals(children.right)) {
              nodeX = center.x + childOffset;
            }
          } else if (depth === 2) {
            const currentChildren = this.currentFraction.sternBrocotChildren();
            const leftChild = currentChildren.left;
            const rightChild = currentChildren.right;
            const leftGrandchildren = leftChild.sternBrocotChildren();
            const rightGrandchildren = rightChild.sternBrocotChildren();
            const grandchildSpacing = 75;
            if (node.equals(leftGrandchildren.left)) {
              nodeX = center.x - grandchildSpacing * 3;
            } else if (node.equals(leftGrandchildren.right)) {
              nodeX = center.x - grandchildSpacing;
            } else if (node.equals(rightGrandchildren.left)) {
              nodeX = center.x + grandchildSpacing;
            } else if (node.equals(rightGrandchildren.right)) {
              nodeX = center.x + grandchildSpacing * 3;
            }
          } else if (nodeParent && nodes.has(nodeParent.toString())) {
            const parentNode = nodes.get(nodeParent.toString());
            const parentChildren = nodeParent.sternBrocotChildren();
            if (node.equals(parentChildren.left)) {
              nodeX = parentNode.x - childOffset;
            } else if (node.equals(parentChildren.right)) {
              nodeX = parentNode.x + childOffset;
            }
          }
          let nodeType = depth === 1 ? "child" : "descendant";
          if (depth === 1) {
            const children = this.currentFraction.sternBrocotChildren();
            if (node.equals(children.left)) {
              nodeType = "left-child";
            } else if (node.equals(children.right)) {
              nodeType = "right-child";
            }
          }
          nodes.set(key, {
            fraction: node,
            x: nodeX,
            y,
            type: nodeType,
            size: nodeSize
          });
        }
      });
      if (depth === 1) {
        levelNodes.forEach((node, index) => {
          try {
            const nodeParent = node.sternBrocotParent();
            if (nodeParent && !nodeParent.equals(this.currentFraction)) {
              const siblings = nodeParent.sternBrocotChildren();
              const nodeData = nodes.get(node.toString());
              const nodeX = nodeData ? nodeData.x : center.x;
              const siblingOffset = 120;
              [siblings.left, siblings.right].forEach((sibling, sibIndex) => {
                const sibKey = sibling.toString();
                if (!nodes.has(sibKey) && !levelNodes.some((n) => n.equals(sibling))) {
                  nodes.set(sibKey, {
                    fraction: sibling,
                    x: nodeX + (sibIndex === 0 ? -siblingOffset : siblingOffset),
                    y,
                    type: "sibling",
                    size: nodeSize - 5
                  });
                }
              });
            }
          } catch (e) {}
        });
      }
    }
    return Array.from(nodes.values());
  }
  getNodesAtDepth(root, targetDepth) {
    if (targetDepth === 0)
      return [root];
    return this.rix.visibleTree(root, targetDepth).nodes.filter(({ role, level }) => role === "descendant" && level === targetDepth).map(({ fraction }) => fraction);
  }
  renderNodes(treeData) {
    const center = { x: this.svgWidth / 2, y: this.svgHeight / 2 };
    const svgRect = this.svg.getBoundingClientRect();
    const actualWidth = svgRect.width;
    const actualHeight = svgRect.height;
    const referenceWidth = 800;
    const responsiveScale = referenceWidth / actualWidth;
    treeData.forEach((nodeData) => {
      const { fraction, x, y, type, size } = nodeData;
      const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeGroup.classList.add("tree-node", type);
      nodeGroup.dataset.fraction = fraction.toString();
      const baseFontSize = 15;
      const fontSize = baseFontSize * responsiveScale;
      const lineHeight = fontSize < 16 ? fontSize * 0.6 : fontSize * 0.5;
      const numStr = fraction.numerator.toString();
      const denStr = fraction.denominator.toString();
      const maxWidth = Math.max(numStr.length, denStr.length) * fontSize * 0.7;
      const textHeight = lineHeight * 2;
      const basePadding = 24;
      const baseMinWidth = 50;
      const baseHeightPadding = 18;
      const rectWidth = Math.max(maxWidth + basePadding * responsiveScale, baseMinWidth * responsiveScale);
      const rectHeight = textHeight + baseHeightPadding * responsiveScale;
      let rectX = x - rectWidth / 2;
      let rectY = y - rectHeight / 2;
      if (x < center.x) {
        rectX = x - rectWidth;
      } else if (x > center.x) {
        rectX = x;
      }
      if (y < center.y) {
        rectY = y - rectHeight;
      } else if (y > center.y) {
        rectY = y;
      }
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", rectX);
      rect.setAttribute("y", rectY);
      rect.setAttribute("width", rectWidth);
      rect.setAttribute("height", rectHeight);
      rect.setAttribute("rx", 8);
      rect.setAttribute("ry", 8);
      const textCenterX = rectX + rectWidth / 2;
      const textCenterY = rectY + rectHeight / 2;
      const fractionElements = this.createSVG2DFraction(fraction, textCenterX, textCenterY, fontSize);
      nodeGroup.appendChild(rect);
      fractionElements.forEach((element) => {
        element.setAttribute("text-overflow", "ellipsis");
        nodeGroup.appendChild(element);
      });
      this.treeContainer.appendChild(nodeGroup);
    });
  }
  renderEdges(treeData) {
    const center = { x: this.svgWidth / 2, y: this.svgHeight / 2 };
    const nodeMap = new Map;
    const svgRect = this.svg.getBoundingClientRect();
    const actualWidth = svgRect.width;
    const actualHeight = svgRect.height;
    const referenceWidth = 800;
    const responsiveScale = referenceWidth / actualWidth;
    treeData.forEach((node) => {
      const { fraction, x, y, size } = node;
      const baseFontSize = Math.max(14, Math.min(20, size / 2.2));
      const fontSize = baseFontSize * responsiveScale;
      const lineHeight = fontSize < 16 ? fontSize * 0.6 : fontSize * 0.5;
      const numStr = fraction.numerator.toString();
      const denStr = fraction.denominator.toString();
      const maxWidth = Math.max(numStr.length, denStr.length) * fontSize * 0.7;
      const textHeight = lineHeight * 2;
      const basePadding = 24;
      const baseMinWidth = 50;
      const baseHeightPadding = 18;
      const rectWidth = Math.max(maxWidth + basePadding * responsiveScale, baseMinWidth * responsiveScale);
      const rectHeight = textHeight + baseHeightPadding * responsiveScale;
      let rectX = x - rectWidth / 2;
      let rectY = y - rectHeight / 2;
      if (x < center.x) {
        rectX = x - rectWidth;
      } else if (x > center.x) {
        rectX = x;
      }
      if (y < center.y) {
        rectY = y - rectHeight;
      } else if (y > center.y) {
        rectY = y;
      }
      node.rectX = rectX;
      node.rectY = rectY;
      node.rectWidth = rectWidth;
      node.rectHeight = rectHeight;
      nodeMap.set(fraction.toString(), node);
    });
    treeData.forEach((nodeData) => {
      const { fraction } = nodeData;
      const parent = fraction.sternBrocotParent();
      if (parent && nodeMap.has(parent.toString())) {
        const parentNode = nodeMap.get(parent.toString());
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.classList.add("tree-edge");
        if (nodeData.type === "current" || parentNode.type === "current") {
          line.classList.add("current");
        }
        const parentBottomCenterX = parentNode.rectX + parentNode.rectWidth / 2;
        const parentBottomCenterY = parentNode.rectY + parentNode.rectHeight;
        const childTopCenterX = nodeData.rectX + nodeData.rectWidth / 2;
        const childTopCenterY = nodeData.rectY;
        line.setAttribute("x1", parentBottomCenterX);
        line.setAttribute("y1", parentBottomCenterY);
        line.setAttribute("x2", childTopCenterX);
        line.setAttribute("y2", childTopCenterY);
        this.treeContainer.appendChild(line);
      }
    });
  }
  showConvergentsModal() {
    try {
      const rational = this.currentFraction.toRational();
      const allConvergents = rational.convergents();
      const currentFractionStr = this.formatFraction(this.currentFraction, "fraction");
      const targetValue = Number(this.currentFraction.numerator) / Number(this.currentFraction.denominator);
      let modalContent = `
                <table class="convergents-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Convergent</th>
                            <th>Decimal</th>
                            <th>Distance</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
      allConvergents.forEach((convergent, index) => {
        const convergentFraction = Fraction.fromRational(convergent);
        const convergentStr = this.formatFraction(convergentFraction, "fraction");
        const isCurrent = convergentStr === currentFractionStr;
        const convergentRational = convergentFraction.toRational();
        const decimalInfo = convergentRational.toRepeatingDecimalWithPeriod(true);
        const decimalDisplay = decimalInfo.period > 0 ? `${decimalInfo.decimal} (p:${decimalInfo.period})` : decimalInfo.decimal;
        const targetRational = this.currentFraction.toRational();
        const exactDistance = targetRational.subtract(convergentRational).abs();
        let distanceScientific;
        try {
          distanceScientific = exactDistance.toScientificNotation(3);
        } catch (e) {
          const distanceDecimal = Number(exactDistance.numerator) / Number(exactDistance.denominator);
          distanceScientific = distanceDecimal.toExponential(3);
        }
        modalContent += `
                    <tr class="${isCurrent ? "current-row" : ""}">
                        <td>${index + 1}</td>
                        <td class="fraction-cell">${convergentStr}</td>
                        <td class="decimal-cell">${decimalDisplay}</td>
                        <td class="distance-cell">
                            <div style="font-size: 0.8rem;">
                                <div>${distanceScientific}</div>
                                <div style="color: #6C757D;">${exactDistance.toString()}</div>
                            </div>
                        </td>
                        <td class="action-cell">
                            <button class="nav-convergent" onclick="sternBrocotApp.navigateToConvergent('${convergentFraction.numerator}', '${convergentFraction.denominator}')">
                                Go
                            </button>
                        </td>
                    </tr>
                `;
      });
      modalContent += `
                    </tbody>
                </table>
            `;
      this.elements.allConvergents.innerHTML = modalContent;
      this.elements.convergentsModal.style.display = "block";
    } catch (error) {
      console.error("Error showing convergents modal:", error);
    }
  }
  showFareyModal() {
    try {
      const reducedFraction = this.currentFraction.reduce();
      const fareyLevel = Math.min(Number(reducedFraction.denominator), 10);
      const fareySequence = this.generateFareySequence(fareyLevel);
      const currentFractionStr = this.formatFraction(this.currentFraction, "fraction");
      let modalContent = `<h3>Farey Sequence F<sub>${fareyLevel}</sub></h3>`;
      modalContent += '<div class="farey-grid">';
      fareySequence.forEach((fraction) => {
        const fractionStr = this.formatFraction(fraction, "fraction");
        const isCurrent = fractionStr === currentFractionStr;
        modalContent += `<span class="farey-item ${isCurrent ? "current" : ""}">
                    ${fractionStr}
                </span>`;
      });
      modalContent += "</div>";
      if (fareyLevel === 10 && Number(reducedFraction.denominator) > 10) {
        modalContent += `<p><em>Note: Showing F<sub>10</sub> only. The fraction ${currentFractionStr} first appears in F<sub>${reducedFraction.denominator}</sub>.</em></p>`;
      }
      this.elements.fareySequenceContent.innerHTML = modalContent;
      this.elements.fareyModal.style.display = "block";
    } catch (error) {
      console.error("Error showing Farey modal:", error);
    }
  }
  generateFareySequence(n) {
    const fractions = [];
    for (let b = 1;b <= n; b++) {
      for (let a = 0;a <= b; a++) {
        try {
          const fraction = new Fraction(BigInt(a), BigInt(b));
          const reduced = fraction.reduce();
          const fractionStr = reduced.toString();
          if (!fractions.some((f) => f.toString() === fractionStr)) {
            fractions.push(reduced);
          }
        } catch (e) {}
      }
    }
    fractions.sort((a, b) => {
      const aVal = Number(a.numerator) / Number(a.denominator);
      const bVal = Number(b.numerator) / Number(b.denominator);
      return aVal - bVal;
    });
    return fractions;
  }
  wrapPath(pathString) {
    if (pathString.length <= 20)
      return pathString;
    let wrapped = "";
    for (let i = 0;i < pathString.length; i += 20) {
      if (i > 0)
        wrapped += "<br>";
      wrapped += pathString.slice(i, i + 20);
    }
    return wrapped;
  }
  wrapContinuedFraction(cfString) {
    if (!cfString.includes("~"))
      return cfString;
    const parts = cfString.split("~");
    let wrapped = parts[0];
    for (let i = 1;i < parts.length; i++) {
      const nextPart = "~" + parts[i];
      const currentLine = wrapped.split("<br>").pop();
      if (currentLine.length + nextPart.length > 25) {
        wrapped += "<br>" + nextPart;
      } else {
        wrapped += nextPart;
      }
    }
    return wrapped;
  }
  loadFromURL(pushToHistory = true) {
    const hash = window.location.hash.slice(1);
    if (hash && hash.includes("_")) {
      try {
        const [numerator, denominator] = hash.split("_").map((s) => BigInt(s));
        if (numerator > 0 && denominator > 0) {
          const fraction = new Fraction(numerator, denominator);
          this.currentFraction = fraction;
          this.updateDisplay();
          this.renderTree();
          return;
        }
      } catch (e) {
        console.warn("Invalid URL hash:", hash);
      }
    }
    if (pushToHistory && !hash) {
      this.updateURL();
    }
  }
  updateURL() {
    const hash = `#${this.currentFraction.numerator}_${this.currentFraction.denominator}`;
    if (window.location.hash !== hash) {
      history.pushState(null, "", hash);
    }
  }
  navigateToConvergent(numeratorStr, denominatorStr) {
    try {
      const numerator = BigInt(numeratorStr);
      const denominator = BigInt(denominatorStr);
      const fraction = new Fraction(numerator, denominator);
      this.animateToNewFraction(fraction);
      this.closeModal("convergents");
    } catch (error) {
      console.error("Error navigating to convergent:", error);
    }
  }
  navigateToFraction(numeratorStr, denominatorStr) {
    try {
      const numerator = BigInt(numeratorStr);
      const denominator = BigInt(denominatorStr);
      const fraction = new Fraction(numerator, denominator);
      this.animateToNewFraction(fraction);
    } catch (error) {
      console.error("Error navigating to fraction:", error);
    }
  }
  setExpressionDisplayMode(mode) {
    this.expressionDisplayMode = mode;
    this.elements.displayModeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
    this.updateExpressionResult();
  }
  formatRationalByMode(rational, mode) {
    try {
      switch (mode) {
        case "mixed":
          return rational.toMixedString();
        case "fraction":
          return rational.toString();
        case "decimal":
          const decimalInfo = rational.toRepeatingDecimalWithPeriod(true);
          return decimalInfo.decimal;
        case "scientific":
          return rational.toScientificNotation(Math.min(100, Math.max(1, Number.parseInt(this.elements.precisionInput.value, 10) || 6)));
        case "cf":
          const cf = rational.toContinuedFraction();
          if (cf.length === 1)
            return cf[0].toString();
          return cf[0] + ".~" + cf.slice(1).join("~");
        default:
          return rational.toString();
      }
    } catch (error) {
      return rational.toString();
    }
  }
  updateExpressionResult() {
    const expression = this.elements.expressionInput.value.trim();
    if (!expression) {
      this.elements.expressionResult.textContent = "Enter an expression above";
      return;
    }
    try {
      const result = this.rix.evaluateExpression(expression, this.currentFraction);
      let resultText;
      if (result.low && result.high) {
        const lowerText = this.formatRationalByMode(result.low, this.expressionDisplayMode);
        const upperText = this.formatRationalByMode(result.high, this.expressionDisplayMode);
        resultText = `[${lowerText}, ${upperText}]`;
      } else {
        let rational;
        if (result.toRational) {
          rational = result.toRational();
        } else {
          rational = result;
        }
        resultText = this.formatRationalByMode(rational, this.expressionDisplayMode);
      }
      this.elements.expressionResult.textContent = resultText;
    } catch (error) {
      this.elements.expressionResult.textContent = `Error: ${error.message}`;
    }
  }
  updateBoundaryDisplay() {
    const [left, right] = (this.currentRixNode ?? this.rix.describeNode(this.currentFraction)).boundaries;
    this.elements.leftBoundaryDisplay.innerHTML = this.formatFraction(left, "fraction", true);
    this.elements.currentNodeDisplay.innerHTML = this.formatFraction(this.currentFraction, "fraction", true);
    this.elements.rightBoundaryDisplay.innerHTML = this.formatFraction(right, "fraction", true);
  }
  handleBoundaryClick(boundary) {
    if (boundary === "left" || boundary === "right") {
      const parents = this.currentFraction.fareyParents();
      const targetFraction = boundary === "left" ? parents.left : parents.right;
      if (targetFraction.isInfinite) {
        this.reset();
      } else {
        this.animateToNewFraction(targetFraction);
      }
    } else if (boundary === "current") {
      this.scrollOffset = { x: 0, y: 0 };
      this.updateTreeTransform();
    }
  }
  showHelpModal() {
    this.elements.helpContent.innerHTML = `
      <h3>What is the Stern-Brocot Tree?</h3>
      <p>The Stern-Brocot tree is a beautiful mathematical structure that organizes all rational numbers (fractions) in a binary tree format. Every rational number appears exactly once in the tree, and it's built using a simple but elegant process called the <strong>mediant operation</strong>.</p>

      <h3>How is the Tree Constructed?</h3>
      <p>The tree starts with boundaries -1/0 and 1/0 (representing negative and positive infinity), and the root is their mediant: (-1+1)/(0+0) = 0/1. Each subsequent fraction is the mediant of its boundaries in the tree.</p>

      <p><strong>Mediant Formula:</strong> For fractions a/b and c/d, their mediant is (a+c)/(b+d)</p>

      <h3>Path Interpretation - Sign and Whole Number</h3>
      <p>The path from the root 0/1 to any fraction has a special meaning:</p>
      <ul>
        <li><strong>First direction (L or R):</strong> Determines the sign of the number
          <ul>
            <li>L (Left) - Negative numbers</li>
            <li>R (Right) - Positive numbers</li>
          </ul>
        </li>
        <li><strong>Count before direction change:</strong> The number of consecutive L's or R's before the first direction change gives the whole number part
          <ul>
            <li>Example: RRR... means at least 3 for the whole number part</li>
            <li>Example: LL... means at least -2 for the whole number part</li>
          </ul>
        </li>
      </ul>

      <h3>Examples and Observations</h3>

      <h4>Example 1: Finding 1/1</h4>
      <p>Path from root 0/1: RR</p>
      <ul>
        <li><strong>Step 1:</strong> Start at 0/1 (boundaries: -1/0 and 1/0)</li>
        <li><strong>Step 2:</strong> Go right to 1/1 = mediant(0/1, 1/0)</li>
      </ul>
      <p><strong>Observation:</strong> The path "RR" tells us: R (positive) and RR (whole number part is 1)</p>

      <h4>Example 2: Finding -1/1</h4>
      <p>Path from root 0/1: LL</p>
      <ul>
        <li><strong>Step 1:</strong> Start at 0/1 (boundaries: -1/0 and 1/0)</li>
        <li><strong>Step 2:</strong> Go left to -1/1 = mediant(-1/0, 0/1)</li>
      </ul>
      <p><strong>Observation:</strong> The path "LL" tells us: L (negative) and LL (absolute whole number part is 1)</p>

      <h4>Example 3: Finding 3/5</h4>
      <p>Path from root 0/1: RRLLLR</p>
      <ul>
        <li>First R: positive number</li>
        <li>RR: whole number part is at least 0</li>
        <li>The full path navigates to 3/5 through mediants</li>
      </ul>

      <h4>Example 4: Golden Ratio φ ≈ 1.618</h4>
      <p>The golden ratio φ = (1+√5)/2 has the continued fraction [1; 1, 1, 1, 1, ...]. Starting from 0/1, its path begins with RR (giving 1/1), then continues with alternating L and R.</p>
      <p><strong>Try it:</strong> Click the φ button to explore the golden ratio approximations.</p>

      <h3>Connection to Continued Fractions</h3>
      <p>The Stern-Brocot tree and continued fractions are intimately connected:</p>
      <ul>
        <li><strong>Tree Path ↔ Continued Fraction:</strong> The left/right moves in the tree directly correspond to the coefficients in the continued fraction expansion</li>
        <li><strong>Convergents:</strong> Following the path partway gives you the convergents (best rational approximations) of the target fraction</li>
        <li><strong>Best Approximations:</strong> Every convergent in the tree represents the best possible rational approximation with denominators up to that point</li>
      </ul>

      <h3>Expression Calculator</h3>
      <p>The expression calculator allows you to evaluate mathematical expressions using the current node value as 'x'. This is particularly useful for finding roots and exploring mathematical relationships.</p>

      <h4>Example: Finding √2</h4>
      <p>To approximate √2 using the Stern-Brocot tree:</p>
      <ol>
        <li><strong>Enter expression:</strong> Type "x^2" in the expression calculator</li>
        <li><strong>Navigate the tree:</strong> Compare the result to 2</li>
        <li><strong>Binary search:</strong>
          <ul>
            <li>If the result is > 2, go left (fraction too large)</li>
            <li>If result is < 2, go right (fraction too small)</li>
            <li>Stop when the result is close enough to 2 for your liking.</li>
          </ul>
        </li>
        <li><strong>Example path:</strong> Starting from 1/1, you might navigate R→R→L→L→R→... getting closer to √2 ≈ 1.414</li>
        <li><strong>Convergents:</strong> Each step gives you the best rational approximation with that denominator</li>
      </ol>
      <p><strong>Try it:</strong> Start at 1/1, enter "x^2", and follow the guidance to discover the continued fraction [1; 2, 2, 2, 2, ...] for √2!</p>

      <h3>Navigation Tips</h3>
      <ul>
        <li><strong>Arrow Keys:</strong> ↑ parent, ← left child, → right child</li>
        <li><strong>Click:</strong> Click any node to navigate there directly</li>
        <li><strong>Mobile:</strong> Long-press a node to see its value clearly</li>
        <li><strong>Hover:</strong> Hover over nodes to see their exact values</li>
        <li><strong>Jump:</strong> Enter any fraction in the jump box to navigate directly</li>
        <li><strong>Mathematical Constants:</strong> Click √2, e, π, or φ buttons to jump to their rational approximations</li>
        <li><strong>Breadcrumbs:</strong> Click any fraction in the path to jump back to it</li>
        <li><strong>Expression Calculator:</strong> Use mathematical expressions with 'x' to explore roots and relationships</li>
      </ul>

      <h3>Mathematical Properties</h3>
      <ul>
        <li><strong>Completeness:</strong> Every positive rational number appears exactly once</li>
        <li><strong>Ordering:</strong> Left children are smaller, right children are larger</li>
        <li><strong>Reduced Form:</strong> All fractions automatically appear in lowest terms</li>
        <li><strong>Farey Connection:</strong> Each level relates to Farey sequences of increasing denominators</li>
        <li><strong>Binary Search:</strong> Finding any fraction is like a binary search through all rationals</li>
      </ul>

      <p><em>This visualization demonstrates one of the most elegant structures in mathematics, connecting number theory, geometry, and continued fractions in a beautifully unified way.</em></p>
    `;
    this.elements.helpModal.style.display = "block";
  }
  closeModal(type) {
    if (type === "convergents") {
      this.elements.convergentsModal.style.display = "none";
    } else if (type === "farey") {
      this.elements.fareyModal.style.display = "none";
    } else if (type === "help") {
      this.elements.helpModal.style.display = "none";
    }
  }
}
var sternBrocotApp;
document.addEventListener("DOMContentLoaded", () => {
  sternBrocotApp = new SternBrocotTreeVisualizer;
});

//# debugId=8283309EB89D292964756E2164756E21
//# sourceMappingURL=stern-brocot-web.js.map
