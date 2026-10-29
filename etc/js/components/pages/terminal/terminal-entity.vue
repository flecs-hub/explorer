<template>
  <span :class="css" :title="title" @click.stop="onClick">{{ display }}</span>
</template>

<script>
export default { name: "terminal-entity" };
</script>

<script setup>
import { defineProps, computed, inject } from 'vue';

const props = defineProps({
  path: { type: String, required: true },
  scope: { type: String, required: false },
  label: { type: String, required: false },
  full: { type: Boolean, required: false, default: false },
  kind: { type: String, required: false, default: "entity" }
});

const T = flecsTerminal;
const terminal = inject("terminal");

const isNull = computed(() => T.isRoot(props.path));

const display = computed(() => {
  if (props.label !== undefined) {
    return props.label;
  }
  if (isNull.value) {
    return "(none)";
  }
  return props.full ? props.path : T.relativePath(props.path, props.scope);
});

const css = computed(() => {
  if (isNull.value) {
    return "term-entity term-dim";
  }
  return "term-entity term-entity-" + props.kind;
});

const title = computed(() => {
  if (isNull.value) {
    return "";
  }
  const mod = navigator.platform && navigator.platform.indexOf("Mac") !== -1 ? "⌘" : "Ctrl";
  return `${props.path}\nClick: inspect · ${mod}+click: open in entity browser · Alt+click: insert in prompt`;
});

function onClick(event) {
  if (isNull.value || window.getSelection().toString().length) {
    return;
  }
  const rel = T.relativePath(props.path, props.scope);
  if (event.metaKey || event.ctrlKey) {
    terminal.openEntity(props.path);
  } else if (event.altKey) {
    terminal.insert(rel);
  } else {
    terminal.run("inspect " + rel);
  }
}
</script>

<style>
#page-terminal span.term-entity {
  cursor: pointer;
  border-radius: 2px;
}

#page-terminal span.term-entity-entity {
  color: var(--term-entity);
}

#page-terminal span.term-entity-component {
  color: var(--term-dim);
}

#page-terminal span.term-entity:hover {
  color: var(--green);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
