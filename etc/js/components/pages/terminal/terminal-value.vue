<template>
  <span class="term-value"><render/></span>
</template>

<script>
export default { name: "terminal-value" };
</script>

<script setup>
import { defineProps, h } from 'vue';

const props = defineProps({
  value: { required: false, default: null },
  pretty: { type: Boolean, required: false, default: false },
  width: { type: Number, required: false, default: 72 }
});

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

function inlineWidth(v, budget) {
  if (v === null || v === undefined) {
    return 4;
  }
  if (typeof v === "string") {
    return v.length + 2;
  }
  if (typeof v !== "object") {
    return String(v).length;
  }
  let total = 2;
  if (Array.isArray(v)) {
    for (const item of v) {
      total += inlineWidth(item, budget - total) + 2;
      if (total > budget) {
        return total;
      }
    }
  } else {
    for (const key in v) {
      total += key.length + 2 + inlineWidth(v[key], budget - total) + 2;
      if (total > budget) {
        return total;
      }
    }
  }
  return total;
}

function scalar(v) {
  if (v === null || v === undefined) {
    return h("span", { class: "term-null" }, "null");
  }
  if (typeof v === "boolean") {
    return h("span", { class: "term-keyword" }, String(v));
  }
  if (typeof v === "number") {
    return h("span", { class: "term-number" }, String(v));
  }
  if (typeof v === "string") {
    return h("span", { class: "term-string" }, JSON.stringify(v));
  }
  return h("span", String(v));
}

function punct(text) {
  return h("span", { class: "term-punct" }, text);
}

function fmt(v, indent, out, pretty) {
  if (v === null || typeof v !== "object") {
    out.push(scalar(v));
    return;
  }

  const isArray = Array.isArray(v);
  const keys = isArray ? null : Object.keys(v);
  const count = isArray ? v.length : keys.length;
  const open = isArray ? "[" : "{";
  const close = isArray ? "]" : "}";
  if (!count) {
    out.push(punct(open + close));
    return;
  }

  const multiline = pretty && inlineWidth(v, props.width - indent) > props.width - indent;
  const pad = "  ".repeat(indent / 2 + 1);
  const padClose = "  ".repeat(indent / 2);

  out.push(punct(open));
  for (let i = 0; i < count; i ++) {
    if (multiline) {
      out.push("\n" + pad);
    } else if (i) {
      out.push(punct(", "));
    }
    if (!isArray) {
      const key = keys[i];
      out.push(h("span", { class: "term-key" }, IDENT.test(key) ? key : JSON.stringify(key)));
      out.push(punct(": "));
      fmt(v[key], indent + 2, out, pretty);
    } else {
      fmt(v[i], indent + 2, out, pretty);
    }
    if (multiline && i < count - 1) {
      out.push(punct(","));
    }
  }
  if (multiline) {
    out.push("\n" + padClose);
  }
  out.push(punct(close));
}

const render = () => {
  const out = [];
  fmt(props.value, 0, out, props.pretty);
  return out;
};
</script>

<style>
#terminal-pane span.term-value {
  white-space: pre;
}
</style>
