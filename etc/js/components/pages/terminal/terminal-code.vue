<template>
  <div class="term-code">
    <div class="term-dim" v-if="!rows.length">(empty)</div>
    <template v-for="(r, i) in visible" :key="i">
      <div class="term-code-gap noselect" v-if="r.gap">&#x22EF;</div>
      <div class="term-code-line">
        <span class="term-code-gutter noselect" v-if="numbers" :style="gutterStyle">{{ r.line }}</span><span
          class="term-code-text"><span v-for="(t, j) in r.tokens" :key="j"
          :class="t.cls ? 'term-hl-' + t.cls : ''">{{ t.text }}</span>{{ r.tokens.length ? '' : ' ' }}</span>
      </div>
    </template>
    <div v-if="rows.length > limit">
      <span class="term-more" @click.stop="limit = rows.length">&hellip; show {{ rows.length - limit }} more lines</span>
    </div>
  </div>
</template>

<script>
export default { name: "terminal-code" };
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  lines: { type: Array, required: false },
  text: { type: String, required: false },
  numbers: { type: Boolean, required: false, default: false }
});

const T = flecsTerminal;
const limit = ref(500);

const rows = computed(() => {
  let lines = props.lines;
  if (!lines) {
    const text = (props.text || "").replace(/\n$/, "");
    lines = text.length ? text.split("\n").map((t, i) => ({ line: i + 1, text: t })) : [];
  }
  let prev;
  return lines.map((l) => {
    const row = {
      line: l.line,
      tokens: T.highlightScript(l.text || ""),
      gap: prev !== undefined && l.line > prev + 1
    };
    prev = l.line;
    return row;
  });
});

const visible = computed(() => rows.value.slice(0, limit.value));

const gutterStyle = computed(() => {
  let width = 1;
  for (const r of rows.value) {
    width = Math.max(width, String(r.line).length);
  }
  return `min-width: ${width}ch;`;
});
</script>

<style>
#terminal-pane div.term-code-line {
  white-space: pre;
}

#terminal-pane span.term-code-gutter {
  display: inline-block;
  text-align: right;
  color: var(--term-dim);
  padding-right: 1.5ch;
  margin-right: 1.5ch;
  border-right: 1px solid var(--border);
}

#terminal-pane div.term-code-gap {
  color: var(--term-dim);
  padding-left: 1ch;
}
</style>
