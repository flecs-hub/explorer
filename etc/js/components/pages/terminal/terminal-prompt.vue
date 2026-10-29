<template>
  <div :class="blockCss">
    <div class="terminal-prompt">
      <span class="terminal-ps1 noselect"><span class="terminal-ps1-scope">{{ scopeLabel }}</span><span class="terminal-ps1-sym">$&nbsp;</span></span>
      <div class="terminal-input">
        <pre class="terminal-input-mirror" aria-hidden="true"><span
          v-for="(t, i) in mirror" :key="i"
          :class="t.cls">{{ t.text }}</span>{{ "\n" }}</pre>
        <textarea
          ref="inputEl"
          rows="1"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          :value="text"
          @input="onInput"
          @keydown="onKeyDown"
          @focus="onFocus"
          @blur="onBlur">
        </textarea>
      </div>
    </div>
    <div class="terminal-completions" v-if="menu">
      <span v-for="(c, i) in visibleCandidates" :key="c.value"
        :class="candidateCss(c, i)"
        :title="c.desc || c.value"
        @mousedown.prevent="pick(i)">{{ c.label }}</span>
      <span class="term-dim" v-if="menu.candidates.length > visibleCandidates.length">
        &hellip; {{ menu.candidates.length - visibleCandidates.length }} more
      </span>
    </div>
  </div>
</template>

<script>
export default { name: "terminal-prompt" };
</script>

<script setup>
import { defineProps, defineModel, defineEmits, defineExpose, computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  scope: {type: String, required: false},
  commands: {type: Object, required: true},
  history: {type: Array, required: true},
  complete: {type: Function, required: true},
  busy: {type: Boolean, required: false, default: false}
});

const text = defineModel("text", { type: String, default: "" });
const emit = defineEmits(["submit", "interrupt", "clearScreen"]);

const MAX_VISIBLE = 80;
const T = flecsTerminal;

const inputEl = ref(null);
const caret = ref(0);
const focused = ref(false);
const selecting = ref(false);
const menu = ref(undefined);
const bell = ref(false);
let historyIndex = -1;
let historyFilter = "";
let historySaved = "";
let completeSeq = 0;

const blockCss = computed(() => {
  let result = "terminal-prompt-block";
  if (bell.value) {
    result += " terminal-prompt-bell";
  }
  if (props.busy) {
    result += " terminal-prompt-busy";
  }
  return result;
});

const scopeLabel = computed(() => T.isRoot(props.scope) ? "~" : props.scope);

const highlighted = computed(() => T.highlightCommand(text.value, props.commands));

const ghost = computed(() => {
  const value = text.value;
  if (!value.length || menu.value || caret.value !== value.length || value.indexOf("\n") !== -1) {
    return "";
  }
  for (let i = props.history.length - 1; i >= 0; i --) {
    const h = props.history[i];
    if (h.length > value.length && h.startsWith(value) && h.indexOf("\n") === -1) {
      return h.slice(value.length);
    }
  }
  return "";
});

const visibleCandidates = computed(() => menu.value ?
  menu.value.candidates.slice(0, MAX_VISIBLE) : []);

const mirror = computed(() => {
  const parts = highlighted.value.map((t) => ({
    text: t.text, cls: t.cls ? "term-in-" + t.cls : ""
  }));
  if (ghost.value) {
    parts.push({ text: ghost.value, cls: "term-in-ghost" });
  }
  if (selecting.value) {
    return parts;
  }

  const cursorCss = focused.value ? " terminal-cursor" : " terminal-cursor terminal-cursor-blur";
  const out = [];
  let offset = 0;
  let placed = false;
  for (const p of parts) {
    const i = caret.value - offset;
    if (!placed && i >= 0 && i < p.text.length) {
      if (i) {
        out.push({ text: p.text.slice(0, i), cls: p.cls });
      }
      if (p.text[i] === "\n") {
        out.push({ text: " ", cls: cursorCss });
        out.push({ text: p.text.slice(i), cls: p.cls });
      } else {
        out.push({ text: p.text[i], cls: p.cls + cursorCss });
        out.push({ text: p.text.slice(i + 1), cls: p.cls });
      }
      placed = true;
    } else {
      out.push(p);
    }
    offset += p.text.length;
  }
  if (!placed) {
    out.push({ text: " ", cls: cursorCss });
  }
  return out;
});

function candidateCss(c, i) {
  let result = "terminal-candidate terminal-candidate-" + c.kind;
  if (menu.value && menu.value.index === i) {
    result += " terminal-candidate-active";
  }
  return result;
}

function updateCaret() {
  const el = inputEl.value;
  if (el) {
    caret.value = el.selectionStart;
    selecting.value = el.selectionStart !== el.selectionEnd;
  }
}

function onSelectionChange() {
  if (document.activeElement === inputEl.value) {
    updateCaret();
  }
}

function onFocus() {
  focused.value = true;
  updateCaret();
}

function onBlur() {
  focused.value = false;
}

watch(text, () => nextTick(updateCaret));

onMounted(() => document.addEventListener("selectionchange", onSelectionChange));
onUnmounted(() => document.removeEventListener("selectionchange", onSelectionChange));

function setText(value, cursor) {
  text.value = value;
  nextTick(() => {
    const el = inputEl.value;
    if (el) {
      el.value = value;
      const pos = cursor === undefined ? value.length : cursor;
      el.setSelectionRange(pos, pos);
      caret.value = pos;
    }
  });
}

function replaceRange(start, end, value) {
  const current = text.value;
  setText(current.slice(0, start) + value + current.slice(end), start + value.length);
}

function ring() {
  bell.value = true;
  setTimeout(() => bell.value = false, 150);
}

function onInput(event) {
  text.value = event.target.value;
  menu.value = undefined;
  historyIndex = -1;
  updateCaret();
}

function lineStart(value, pos) {
  return value.lastIndexOf("\n", pos - 1) + 1;
}

function lineEnd(value, pos) {
  const i = value.indexOf("\n", pos);
  return i === -1 ? value.length : i;
}

function isIncomplete(value) {
  return T.tokenize(value).some((t) => !t.closed);
}

function historyMatches() {
  if (!historyFilter) {
    return props.history;
  }
  return props.history.filter((h) => h.startsWith(historyFilter));
}

function historyPrev() {
  if (historyIndex === -1) {
    historySaved = text.value;
    historyFilter = text.value;
    historyIndex = historyMatches().length;
  }
  const list = historyMatches();
  if (historyIndex > 0) {
    historyIndex --;
    setText(list[historyIndex]);
  } else {
    ring();
  }
}

function historyNext() {
  if (historyIndex === -1) {
    return;
  }
  const list = historyMatches();
  historyIndex ++;
  if (historyIndex >= list.length) {
    historyIndex = -1;
    setText(historySaved);
  } else {
    setText(list[historyIndex]);
  }
}

function cycle(dir) {
  const m = menu.value;
  const n = Math.min(m.candidates.length, MAX_VISIBLE);
  m.index = m.index === -1 ? (dir > 0 ? 0 : n - 1) : (m.index + dir + n) % n;
  const value = m.candidates[m.index].value;
  replaceRange(m.start, m.end, value);
  m.end = m.start + value.length;
}

function pick(i) {
  const m = menu.value;
  const c = m.candidates[i];
  replaceRange(m.start, m.end, c.value + (c.suffix || ""));
  menu.value = undefined;
  focus();
}

async function onTab(dir) {
  if (menu.value) {
    cycle(dir);
    return;
  }
  const value = text.value;
  const cursor = inputEl.value.selectionStart;
  const seq = ++ completeSeq;
  const res = await props.complete(value, cursor);
  if (seq !== completeSeq || text.value !== value) {
    return;
  }
  if (!res || !res.candidates.length) {
    ring();
    return;
  }

  const candidates = res.candidates;
  if (candidates.length === 1) {
    replaceRange(res.start, res.end, candidates[0].value + (candidates[0].suffix || ""));
    return;
  }

  const current = value.slice(res.start, res.end);
  const prefix = T.commonPrefix(candidates.map((c) => c.value));
  if (prefix.length > current.length && prefix.startsWith(current)) {
    replaceRange(res.start, res.end, prefix);
    return;
  }

  menu.value = {
    start: res.start,
    end: res.end,
    original: current,
    candidates: candidates,
    index: -1
  };
}

function submit() {
  const value = text.value;
  historyIndex = -1;
  menu.value = undefined;
  setText("");
  emit("submit", value);
}

function onKeyDown(event) {
  const el = inputEl.value;
  const value = text.value;
  const pos = el.selectionStart;
  const ctrl = event.ctrlKey && !event.metaKey && !event.altKey;

  if (event.key === "Tab") {
    event.preventDefault();
    onTab(event.shiftKey ? -1 : 1);
    return;
  }

  if (event.key === "Enter") {
    if (menu.value) {
      event.preventDefault();
      const m = menu.value;
      if (m.index !== -1) {
        pick(m.index);
      } else {
        menu.value = undefined;
      }
      return;
    }
    if (event.shiftKey || isIncomplete(value)) {
      return;
    }
    event.preventDefault();
    submit();
    return;
  }

  if (event.key === "Escape") {
    if (menu.value) {
      event.preventDefault();
      const m = menu.value;
      replaceRange(m.start, m.end, m.original);
      menu.value = undefined;
    }
    return;
  }

  if (event.key === "ArrowUp") {
    if (menu.value) {
      event.preventDefault();
      cycle(-1);
    } else if (value.lastIndexOf("\n", pos - 1) === -1) {
      event.preventDefault();
      historyPrev();
    }
    return;
  }

  if (event.key === "ArrowDown") {
    if (menu.value) {
      event.preventDefault();
      cycle(1);
    } else if (value.indexOf("\n", pos) === -1) {
      event.preventDefault();
      historyNext();
    }
    return;
  }

  if ((event.key === "ArrowRight" || event.key === "End") && ghost.value &&
    pos === value.length && el.selectionEnd === pos)
  {
    event.preventDefault();
    setText(value + ghost.value);
    return;
  }

  if (!ctrl) {
    return;
  }

  const key = event.key.toLowerCase();
  if (key === "c") {
    if (el.selectionStart !== el.selectionEnd) {
      return;
    }
    event.preventDefault();
    menu.value = undefined;
    historyIndex = -1;
    emit("interrupt", value);
    setText("");
  } else if (key === "l") {
    event.preventDefault();
    emit("clearScreen");
  } else if (key === "u") {
    event.preventDefault();
    const start = lineStart(value, pos);
    setText(value.slice(0, start) + value.slice(pos), start);
  } else if (key === "k") {
    event.preventDefault();
    setText(value.slice(0, pos) + value.slice(lineEnd(value, pos)), pos);
  } else if (key === "w") {
    event.preventDefault();
    let start = pos;
    while (start > 0 && T.isSpace(value[start - 1])) start --;
    while (start > 0 && !T.isSpace(value[start - 1])) start --;
    setText(value.slice(0, start) + value.slice(pos), start);
  } else if (key === "a") {
    event.preventDefault();
    const start = lineStart(value, pos);
    el.setSelectionRange(start, start);
    caret.value = start;
  } else if (key === "e") {
    event.preventDefault();
    const end = lineEnd(value, pos);
    el.setSelectionRange(end, end);
    caret.value = end;
  }
}

function focus() {
  const el = inputEl.value;
  if (el && document.activeElement !== el) {
    el.focus({ preventScroll: true });
    const end = el.value.length;
    el.setSelectionRange(end, end);
    caret.value = end;
  }
}

function insert(value) {
  const el = inputEl.value;
  if (!el) {
    return;
  }
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const current = text.value;
  const before = current.slice(0, start);
  const sep = before.length && !T.isSpace(before[before.length - 1]) ? " " : "";
  setText(before + sep + value + current.slice(end), start + sep.length + value.length);
  el.focus({ preventScroll: true });
}

defineExpose({ focus, insert });
</script>

<style>
#terminal-pane div.terminal-prompt-block {
  margin: 0;
}

#terminal-pane div.terminal-prompt {
  display: flex;
  align-items: flex-start;
}

#terminal-pane span.terminal-ps1 {
  white-space: pre;
  flex-shrink: 0;
}

#terminal-pane span.terminal-ps1-scope {
  color: var(--term-prompt);
  font-weight: bold;
}

#terminal-pane span.terminal-ps1-sym {
  color: var(--primary-text);
}

#terminal-pane div.terminal-prompt-bell span.terminal-cursor {
  background-color: var(--term-error);
}

#terminal-pane span.terminal-cursor {
  background-color: var(--primary-text);
  color: var(--term-bg);
}

#terminal-pane span.terminal-cursor-blur {
  background-color: transparent;
  color: inherit;
  outline: 1px solid var(--term-muted);
  outline-offset: -1px;
}

#terminal-pane div.terminal-input {
  position: relative;
  flex-grow: 1;
  min-width: 0;
}

#terminal-pane pre.terminal-input-mirror,
#terminal-pane div.terminal-input textarea {
  font: var(--term-font);
  margin: 0;
  padding: 0;
  border: none;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  tab-size: 4;
}

#terminal-pane pre.terminal-input-mirror {
  background: transparent;
  border-radius: 0;
  color: var(--primary-text);
  overflow: visible;
  min-height: 1.45em;
}

#terminal-pane div.terminal-input textarea {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  resize: none;
  overflow: hidden;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: transparent;
}

#terminal-pane div.terminal-input textarea::selection {
  background-color: rgba(86, 168, 248, 0.35);
}

#terminal-pane .term-in-cmd { color: var(--term-prompt); }
#terminal-pane .term-in-cmd-unknown { color: var(--term-error); }
#terminal-pane .term-in-string { color: var(--term-string); }
#terminal-pane .term-in-number { color: var(--term-number); }
#terminal-pane .term-in-variable { color: var(--yellow); }
#terminal-pane .term-in-group { color: var(--term-component); }
#terminal-pane .term-in-arg { color: var(--primary-text); }
#terminal-pane .term-in-ghost { color: var(--term-dim); opacity: 0.7; }

#terminal-pane div.terminal-completions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  padding: 4px 0 2px 0;
}

#terminal-pane span.terminal-candidate {
  cursor: pointer;
  padding: 0 3px;
  border-radius: 3px;
}

#terminal-pane span.terminal-candidate-command {
  color: var(--term-prompt);
}

#terminal-pane span.terminal-candidate-entity {
  color: var(--primary-text);
}

#terminal-pane span.terminal-candidate:hover {
  background-color: var(--hover-bg);
}

#terminal-pane span.terminal-candidate-active {
  background-color: var(--selected-bg);
  outline: 1px solid var(--selected-border);
}
</style>
