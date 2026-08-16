import { Integer, Rational, RationalInterval } from "@ratmath/core";

function rationalParts(value) {
    if (value instanceof Integer) return [value.value, 1n];
    if (value instanceof Rational) return [value.numerator, value.denominator];
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
    if (places >= 0) return roundFraction(numerator * powerOfTen(places), denominator);
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
    // RiX decimal brackets measure offsets in units of the final fractional
    // digit. Integer bases instead use units of one.
    return String(places >= 0 ? units : units * powerOfTen(-places));
}

function decimalExponent(numerator, denominator) {
    let exponent = String(numerator).length - String(denominator).length;
    const belowCandidate = exponent >= 0
        ? numerator < denominator * powerOfTen(exponent)
        : numerator * powerOfTen(-exponent) < denominator;
    if (belowCandidate) exponent -= 1;
    return exponent;
}

function requiredErrorUnits(centerUnits, places, lowNumerator, lowDenominator, highNumerator, highDenominator) {
    const centerNumerator = places >= 0 ? centerUnits : centerUnits * powerOfTen(-places);
    const centerDenominator = places >= 0 ? powerOfTen(places) : 1n;
    const lowDistanceNumerator = centerNumerator * lowDenominator - lowNumerator * centerDenominator;
    const highDistanceNumerator = highNumerator * centerDenominator - centerNumerator * highDenominator;
    const [distanceNumerator, distanceDenominator] = compareFractions(
        lowDistanceNumerator,
        centerDenominator * lowDenominator,
        highDistanceNumerator,
        centerDenominator * highDenominator,
    ) >= 0
        ? [lowDistanceNumerator, centerDenominator * lowDenominator]
        : [highDistanceNumerator, centerDenominator * highDenominator];
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
    if (remaining !== 1n) return null;
    const places = Math.max(twos, fives);
    const units = numerator * (2n ** BigInt(places - twos)) * (5n ** BigInt(places - fives));
    return { units, places };
}

/**
 * Present a certified rational interval using RiX's midpoint[+-offset]
 * notation. The offset has at most two digits for normal refined displays,
 * and the represented interval is guaranteed to contain both exact endpoints.
 */
export function formatCertifiedIntervalDecimal(interval) {
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
        if (exact) return `${decimalText(exact.units, exact.places)}[+-0]`;
    }

    // Two extra center digits for a zero-width, non-terminating rational keep
    // its fallback useful while retaining an exact, outward-rounded error.
    let places = widthNumerator === 0n
        ? 6
        : 1 - decimalExponent(widthNumerator, 2n * widthDenominator);

    while (true) {
        const centerUnits = roundedDecimalUnits(midpointNumerator, midpointDenominator, places);
        const errorUnits = requiredErrorUnits(
            centerUnits,
            places,
            lowNumerator,
            lowDenominator,
            highNumerator,
            highDenominator,
        );
        if (errorUnits <= 99n) {
            return `${decimalText(centerUnits, places)}[+-${lastPlaceOffsetText(errorUnits, places)}]`;
        }
        places -= 1;
    }
}

export function certifiedEnclosureInterval(value) {
    if (value?.type !== "map" || !(value.entries instanceof Map)) return null;
    if (value.entries.get("schema")?.value !== "rix.numerics.enclosure@1") return null;
    if (value.entries.get("certified")?.value !== 1n) return null;
    const interval = value.entries.get("interval");
    return interval instanceof RationalInterval ? interval : null;
}

export function isAutomaticallyPresentableReal(value) {
    if (value?.type !== "map" || !(value.entries instanceof Map)) return false;
    return value.entries.get("schema")?.value === "rix.numerics.algorithm-real@1";
}
