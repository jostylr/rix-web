import {
  Context,
  createDefaultRegistry,
  createDefaultSystemContext,
  encodeOutputJSON,
  formatOutputText,
  formatValue,
  numeralValue,
  parseAndEvaluate,
  renderOutputHtml
} from "./chunk-kx4t6gwn.js";
import"./chunk-9v01vpwy.js";

// src/numeral-playground-model.js
var field = (value, key) => value.entries.get(key.toLowerCase());
var NUMERAL_EXAMPLES = Object.freeze({
  ordinary: { kind: "ordinary", radix: 10, tokens: [..."0123456789"], source: "123.25" },
  multiToken: { kind: "multiToken", radix: 3, tokens: ["zero", "one", "two"], source: "onetwo.zeroone" },
  balanced: { kind: "balanced", radix: 3, tokens: ["T", "0", "1"], source: "1T.1T" },
  negative: { kind: "negative", radix: -2, tokens: ["0", "1"], source: "110.1" }
});
function inspectNumeral(spec, source, maxDigits = 128) {
  const state = { context: new Context, registry: createDefaultRegistry(), systemContext: createDefaultSystemContext() };
  state.context.setFresh("definition", numeralValue(spec));
  state.context.setFresh("spelling", { type: "string", value: source });
  state.context.setFresh("budget", numeralValue(maxDigits));
  const [value, expansion, view] = parseAndEvaluate('.Plugin.Load("radix");system=.radix.System("numberSystem",definition);.radix.Define(system);value=.radix.Parse(system,spelling);[value,.radix.Format(system,value,{= maxDigits=budget }),.radix.View(system,spelling,{= maxDigits=budget })]', state).values;
  const literal = field(expansion, "literal")?.value ?? null;
  const roundtrip = literal ? String(parseAndEvaluate(literal, state)) === String(value) : null;
  return {
    value: String(value),
    literal,
    status: field(expansion, "status").value,
    roundtrip,
    carries: (field(field(expansion, "integer"), "carries")?.values || []).map((row) => Object.fromEntries(["before", "digit", "radix", "after"].map((key) => [key, String(field(row, key))]))),
    html: renderOutputHtml(view, formatValue),
    text: formatOutputText(view, formatValue),
    json: encodeOutputJSON(view)
  };
}

// src/numeral-playground.js
var element = (id) => document.getElementById(id);
var current = null;
function render() {
  try {
    const model = inspectNumeral({ kind: element("family").value, radix: Number(element("radix").value), tokens: element("tokens").value.split(`
`) }, element("source").value, Number(element("budget").value));
    element("result").innerHTML = model.html;
    element("status").textContent = model.roundtrip === true ? `Exact value ${model.value}. Canonical literal ${model.literal} parses back to the same value.` : `Exact value ${model.value}. Digit budget exhausted; this prefix is incomplete.`;
    element("status").dataset.error = "false";
    current = model;
  } catch (error) {
    element("status").textContent = error.message + " The last valid result remains below.";
    element("status").dataset.error = "true";
  }
}
element("family").addEventListener("change", () => {
  const preset = NUMERAL_EXAMPLES[element("family").value];
  element("radix").value = preset.radix;
  element("tokens").value = preset.tokens.join(`
`);
  element("source").value = preset.source;
});
element("numeral-form").addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});
function save(name, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
element("save-json").addEventListener("click", () => {
  if (current)
    save("numeral-exact.json", current.json, "application/json");
});
element("save-text").addEventListener("click", () => {
  if (current)
    save("numeral.txt", current.text, "text/plain");
});
element("save-html").addEventListener("click", () => {
  if (current)
    save("numeral.html", '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Exact numeral snapshot</title><body>' + current.html + "</body></html>", "text/html");
});
render();

//# debugId=5D42B00713F0EBB764756E2164756E21
//# sourceMappingURL=numeral-playground.js.map
