// layoutrun.js：按处理预算处理事件，用尽压账，收尾补齐
import { nextAt, padOf } from "./layout.js";

const WIDTHS = [1, 2, 4, 8];
const KINDS = ["add", "drop", "ask"];

function emptyState() {
  return { fields: [], dropped: [], asks: [], ledger: [], applied: [] };
}

function cloneState(state) {
  const src = state || emptyState();
  return {
    fields: (src.fields || []).map(function (row) { return [row[0], row[1], row[2]]; }),
    dropped: (src.dropped || []).slice(),
    asks: (src.asks || []).map(function (row) { return [row[0], row[1], row[2]]; }),
    ledger: (src.ledger || []).map(function (entry) {
      return { id: entry.id, kind: entry.kind, name: entry.name, width: entry.width };
    }),
    applied: (src.applied || []).slice()
  };
}

function raise(spec, key, fallback, message) {
  const error = new Error(message);
  error.code = (spec && spec[key]) || fallback;
  throw error;
}

function checkStatic(event, spec) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    raise(spec, "event_error_code", "E_BAD_EVENT", "事件必须是对象");
  }
  if (KINDS.indexOf(event.kind) < 0) {
    raise(spec, "event_error_code", "E_BAD_EVENT", "事件 kind 不合法");
  }
  if (typeof event.name !== "string" || event.name.length === 0) {
    raise(spec, "bad_name_code", "E_BAD_NAME", "名字必须是非空串");
  }
  if (event.kind === "add") {
    if (event.width === undefined || event.width === null) {
      raise(spec, "event_error_code", "E_BAD_EVENT", "add 必须带宽度");
    }
    if (WIDTHS.indexOf(event.width) < 0) {
      raise(spec, "bad_width_code", "E_BAD_WIDTH", "宽度只能是 1、2、4、8");
    }
  }
}

function checkSemantic(event, state, spec) {
  const exists = state.fields.some(function (row) { return row[0] === event.name; });
  if (event.kind === "add") {
    if (exists) raise(spec, "dup_code", "E_DUP_NAME", "字段名已存在");
  } else if (!exists || state.dropped.indexOf(event.name) >= 0) {
    raise(spec, "no_field_code", "E_NO_FIELD", "字段不存在或已删除");
  }
}

function applyEvent(state, event) {
  if (event.kind === "add") {
    state.fields.push([event.name, event.width, nextAt(state.fields, event.width)]);
    return;
  }
  const row = state.fields.find(function (item) { return item[0] === event.name; });
  if (event.kind === "drop") {
    state.dropped.push(event.name);
  } else {
    state.asks.push([event.name, row[2], padOf(state.fields, event.name)]);
  }
}

function markApplied(state, event) {
  if (event.id !== undefined && event.id !== null && state.applied.indexOf(event.id) < 0) {
    state.applied.push(event.id);
  }
}

function serve(state, event, spec) {
  checkStatic(event, spec);
  checkSemantic(event, state, spec);
  applyEvent(state, event);
  markApplied(state, event);
}

function ledgerTuple(entry) {
  return entry.kind === "add" ? [entry.kind, entry.name, entry.width] : [entry.kind, entry.name];
}

export function step(spec) {
  const state = cloneState(spec.state);
  const events = (spec.events || []).slice();
  let remaining = Math.max(0, Number(spec.budget) || 0);
  let served = 0;
  let judged = 0;

  while (remaining > 0 && state.ledger.length) {
    serve(state, state.ledger.shift(), spec);
    remaining -= 1;
    served += 1;
  }

  events.forEach(function (event) {
    if (event && event.id !== undefined && event.id !== null && state.applied.indexOf(event.id) >= 0) {
      return;
    }
    checkStatic(event, spec);
    judged += 1;
    if (remaining > 0) {
      checkSemantic(event, state, spec);
      applyEvent(state, event);
      markApplied(state, event);
      remaining -= 1;
      served += 1;
    } else {
      state.ledger.push({ id: event.id, kind: event.kind, name: event.name, width: event.width });
    }
  });

  return {
    state: state,
    served: served,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map(ledgerTuple),
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = cloneState(spec.state);
  let catchup = 0;
  while (state.ledger.length) {
    const event = state.ledger.shift();
    checkSemantic(event, state, spec);
    applyEvent(state, event);
    markApplied(state, event);
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
