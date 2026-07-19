/**
id: approx-math-js
description: JavaScript IEEE-754 Float conversion and optional approximate math.
kind: host
mount: float
exports: [Float, Interval, Round, Floor, Ceiling, Abs, Sqrt, Sin, Cos, Tan, Log, Exp]
groups: [ApproximateMath, Float]
permissions: []
defaultEnabled: false
**/

import { installBrowserApproxMathPlugin } from "../../rix/src/plugins/approx-math-browser.js";

export function install(api) {
  return installBrowserApproxMathPlugin(api);
}
