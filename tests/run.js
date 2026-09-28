import assert from "node:assert";
import { nextAt, padOf, totalOf } from "../layout.js";
import { step, close } from "../layoutrun.js";
import { render } from "../app.js";

const base = {
  budget: 1,
  state: { fields: [], dropped: [], asks: [], ledger: [], applied: [] },
  events: [{ id: 1, kind: "add", name: "k1", width: 1 }],
  bad_name_code: "E_BAD_NAME", bad_width_code: "E_BAD_WIDTH",
  dup_code: "E_DUP_NAME", no_field_code: "E_NO_FIELD",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("nextAt returns a number", () => {
  assert.strictEqual(typeof nextAt([["k1", 1, 0]], 4), "number");
});

check("padOf returns a number", () => {
  assert.strictEqual(typeof padOf([["k1", 1, 0]], "k1"), "number");
});

check("totalOf returns a number", () => {
  assert.strictEqual(typeof totalOf([["k1", 8, 0]]), "number");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count_events, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
