import { describe, expect, test } from "bun:test";
import { Fraction, Rational } from "@ratmath/core";
import { createSternBrocotRixBridge } from "../src/rix-stern-brocot-bridge.js";

describe("rix-web Stern-Brocot bridge", () => {
  test("bounded linked inspection retains exact convergent errors and reports path exhaustion", () => {
    const bridge = createSternBrocotRixBridge();
    const model = bridge.describeBounded(new Rational(355, 113));
    expect(model.parents.map(String)).toEqual(["333/106", "22/7"]);
    expect(String(model.mediant)).toBe("355/113");
    expect(model.convergents.map(({ value }) => String(value))).toEqual(["3", "22/7", "355/113"]);
    expect(String(model.convergents[1].error)).toBe("-1/791");
    expect(bridge.describeBounded(new Rational(0)).path).toEqual([]);
    const bounded = bridge.describeBounded(new Rational(1000000), { maxPath: 8 });
    expect(bounded.pathDiagnostic).toContain("exceeds 8 steps");
    expect(String(bounded.convergents[0].value)).toBe("1000000");
  });
  test("returns the pure RiX node model to native page code", () => {
    const bridge = createSternBrocotRixBridge();
    const node = bridge.describeNode(new Fraction(3n, 5n));
    expect(node.depth).toBe(4);
    expect(node.path).toEqual(["R", "L", "R", "L"]);
    expect(node.boundaries.map(String)).toEqual(["1/2", "2/3"]);
    expect(node.children.map(String)).toEqual(["4/7", "5/8"]);
    expect(node.convergents.map(String)).toEqual(["0", "1", "1/2", "3/5"]);
    const tree = bridge.visibleTree(node.current, 2);
    expect(tree.nodes.filter(({ role, level }) =>
      role === "descendant" && level === 2).map(({ fraction }) => String(fraction)))
      .toEqual(["5/9", "7/12", "8/13", "7/11"]);
    expect(tree.edges).toHaveLength(tree.nodes.length - 1);
  });

  test("binds x exactly and does not retain expression-local assignments", () => {
    const bridge = createSternBrocotRixBridge();
    const fraction = new Fraction(3n, 5n);
    const result = bridge.evaluateExpression("x^2 - 1/2", fraction);
    expect(result).toEqual(new Rational(-7n, 50n));
    expect(() =>
      bridge.evaluateExpression("x := 2; x", fraction),
    ).toThrow("cannot write");
    bridge.evaluateExpression("temporary := 9; temporary", fraction);
    expect(bridge.context.has("temporary")).toBe(false);
  });
});

 test("linked exact inspection enforces path, term and numeric work bounds", () => {
    const bridge = createSternBrocotRixBridge();
    expect(() => bridge.describeBounded(new Rational(1), { maxPath: 257 })).toThrow("256 path");
    expect(() => bridge.describeBounded(new Rational(1), { maxConvergents: 65 })).toThrow("64 convergents");
    expect(() => bridge.describeBounded(new Rational(2n ** 17000n))).toThrow("16384-bit");
    const partial = bridge.describeBounded(new Rational(355, 113), { maxConvergents: 2 });
    expect(partial.truncated).toBe(true);
    expect(partial.convergents).toHaveLength(2);
});
