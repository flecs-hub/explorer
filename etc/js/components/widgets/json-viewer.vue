<template>
  <div class="json-viewer">
    <div class="json-viewer-actions" v-if="!error && hasContent">
      <span class="json-viewer-feedback" v-if="copyFeedback">{{ copyFeedback }}</span>
      <button
        class="json-viewer-action"
        :class="{ 'json-viewer-action-active': format }"
        title="Pretty-print JSON"
        @click="onToggleFormat">
        <icon src="list-tree" :size="16"></icon>
      </button>
      <button
        class="json-viewer-action"
        :class="{ 'json-viewer-action-active': highlight }"
        title="Syntax highlight JSON"
        @click="onToggleHighlight">
        <icon src="symbol-color" :size="16"></icon>
      </button>
      <button
        class="json-viewer-action"
        title="Copy to clipboard"
        @click="onCopy">
        <icon src="copy" :size="16"></icon>
      </button>
    </div>
    <pre v-if="error" class="json-viewer-body json-viewer-error">{{ rawText }}</pre>
    <pre v-else-if="parsedValue !== UNPARSEABLE" class="json-viewer-body"><json-node
        :value="parsedValue"
        :format="format"
        :highlight="highlight"
        :indent="0"
        :comma="false"></json-node></pre>
    <pre v-else class="json-viewer-body">{{ rawText }}</pre>
  </div>
</template>

<script>
export default { name: "json-viewer" };
</script>

<script setup>
import { defineProps, defineModel, computed, ref } from 'vue';

const UNPARSEABLE = Symbol("unparseable");

const props = defineProps({
  data: { required: false, default: "" },
  error: { type: Boolean, required: false, default: false },
});

const format = defineModel("format", { type: Boolean, default: true });
const highlight = defineModel("highlight", { type: Boolean, default: true });

const copyFeedback = ref("");
let copyFeedbackTimer;

const parsedValue = computed(() => {
  const d = props.data;
  if (d === undefined || d === null || d === "") return UNPARSEABLE;
  if (typeof d === "string") {
    try {
      return JSON.parse(d);
    } catch (e) {
      return UNPARSEABLE;
    }
  }
  if (typeof d === "object") return d;
  return UNPARSEABLE;
});

const rawText = computed(() => {
  const d = props.data;
  if (d === undefined || d === null) return "";
  if (typeof d === "string") return d;
  try {
    return JSON.stringify(d, null, 2);
  } catch (e) {
    return String(d);
  }
});

const hasContent = computed(() => {
  if (parsedValue.value !== UNPARSEABLE) return true;
  return !!rawText.value;
});

function onToggleFormat() {
  format.value = !format.value;
}

function onToggleHighlight() {
  highlight.value = !highlight.value;
}

function flashCopyFeedback(msg) {
  copyFeedback.value = msg;
  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => {
    copyFeedback.value = "";
  }, 1500);
}

function copyText() {
  if (parsedValue.value !== UNPARSEABLE) {
    try {
      return format.value
        ? JSON.stringify(parsedValue.value, null, 2)
        : JSON.stringify(parsedValue.value);
    } catch (e) {
      return rawText.value;
    }
  }
  return rawText.value;
}

function onCopy() {
  const text = copyText();
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => flashCopyFeedback("Copied"))
      .catch(() => flashCopyFeedback("Copy failed"));
    return;
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    flashCopyFeedback("Copied");
  } catch (e) {
    flashCopyFeedback("Copy failed");
  }
}
</script>

<style scoped>
div.json-viewer {
  position: relative;
  height: 100%;
  overflow: hidden;
}

div.json-viewer-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

button.json-viewer-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background-color: var(--bg-button);
  color: var(--secondary-text);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--animation-duration), background-color var(--animation-duration);
}

button.json-viewer-action:hover {
  opacity: 1;
  background-color: var(--bg-button-hover);
}

button.json-viewer-action-active {
  opacity: 1;
  color: var(--primary-text);
}

span.json-viewer-feedback {
  color: var(--bright-green);
  font-size: 0.8rem;
  margin-right: 0.25rem;
}

pre.json-viewer-body {
  margin: 0;
  padding: 1rem;
  height: 100%;
  overflow: auto;
  background-color: var(--bg-content);
  color: var(--primary-text);
  font-size: 0.85rem;
  box-sizing: border-box;
}

pre.json-viewer-error {
  color: var(--bright-red);
}

pre.json-viewer-body :deep(.json-viewer-key) {
  color: #98c379;
}

pre.json-viewer-body :deep(.json-viewer-string) {
  color: #61afef;
}

pre.json-viewer-body :deep(.json-viewer-number) {
  color: #d19a66;
}

pre.json-viewer-body :deep(.json-viewer-keyword) {
  color: #e06c75;
}

pre.json-viewer-body :deep(.json-viewer-punct) {
  color: #c678dd;
}
</style>
