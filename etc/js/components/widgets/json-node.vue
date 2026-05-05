<template>
  <template v-if="kind === 'string'"><span :class="cls('json-viewer-string')">{{ literal }}</span><template v-if="comma">,</template></template>
  <template v-else-if="kind === 'number'"><span :class="cls('json-viewer-number')">{{ literal }}</span><template v-if="comma">,</template></template>
  <template v-else-if="kind === 'boolean' || kind === 'null'"><span :class="cls('json-viewer-keyword')">{{ literal }}</span><template v-if="comma">,</template></template>
  <template v-else-if="kind === 'array'"><template v-if="value.length === 0"><span :class="cls('json-viewer-punct')">[]</span><template v-if="comma">,</template></template><template v-else><span :class="cls('json-viewer-punct')">[</span><template v-if="collapsed"><span class="json-viewer-ellipsis" @click="collapsed = false">…</span><span :class="cls('json-viewer-punct')">]</span><template v-if="comma">,</template></template><template v-else><template v-for="(item, i) in value" :key="i"><template v-if="format">{{ "\n" + memberIndentStr(item) }}</template><span v-if="isCollapsible(item)" class="json-viewer-toggle" @click="toggleChild(i)"><expand-button :expand="!isChildCollapsed(i)" :size="10"></expand-button></span><json-node :value="item" :indent="indent + 2" :format="format" :highlight="highlight" :comma="i < value.length - 1" :collapsed="isChildCollapsed(i)" @update:collapsed="setChildCollapsed(i, $event)"></json-node></template><template v-if="format">{{ "\n" + indentStr(indent) }}</template><span :class="cls('json-viewer-punct')">]</span><template v-if="comma">,</template></template></template></template>
  <template v-else-if="kind === 'object'"><template v-if="keys.length === 0"><span :class="cls('json-viewer-punct')">{}</span><template v-if="comma">,</template></template><template v-else><span :class="cls('json-viewer-punct')">{</span><template v-if="collapsed"><span class="json-viewer-ellipsis" @click="collapsed = false">…</span><span :class="cls('json-viewer-punct')">}</span><template v-if="comma">,</template></template><template v-else><template v-for="(k, i) in keys" :key="k"><template v-if="format">{{ "\n" + memberIndentStr(value[k]) }}</template><span v-if="isCollapsible(value[k])" class="json-viewer-toggle" @click="toggleChild(k)"><expand-button :expand="!isChildCollapsed(k)" :size="10"></expand-button></span><span :class="cls('json-viewer-key')">{{ keyLiteral(k) }}</span><span :class="cls('json-viewer-punct')">:</span>{{ format ? " " : "" }}<json-node :value="value[k]" :indent="indent + 2" :format="format" :highlight="highlight" :comma="i < keys.length - 1" :collapsed="isChildCollapsed(k)" @update:collapsed="setChildCollapsed(k, $event)"></json-node></template><template v-if="format">{{ "\n" + indentStr(indent) }}</template><span :class="cls('json-viewer-punct')">}</span><template v-if="comma">,</template></template></template></template>
</template>

<script>
export default { name: "json-node" };
</script>

<script setup>
import { defineProps, defineModel, computed, ref } from 'vue';

const props = defineProps({
  value: { required: false, default: null },
  indent: { type: Number, required: false, default: 0 },
  format: { type: Boolean, required: false, default: true },
  highlight: { type: Boolean, required: false, default: true },
  comma: { type: Boolean, required: false, default: false },
});

const collapsed = defineModel('collapsed', { type: Boolean, default: false });

const childCollapsed = ref({});

const kind = computed(() => {
  const v = props.value;
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  const t = typeof v;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'object') return 'object';
  return 'string';
});

const literal = computed(() => {
  const k = kind.value;
  const v = props.value;
  if (k === 'string') return JSON.stringify(v);
  if (k === 'null') return 'null';
  return String(v);
});

const keys = computed(() => {
  const v = props.value;
  if (!v || typeof v !== 'object') return [];
  return Object.keys(v);
});

function isCollapsible(v) {
  if (Array.isArray(v)) return v.length > 0;
  if (v && typeof v === 'object') return Object.keys(v).length > 0;
  return false;
}

function isChildCollapsed(k) {
  return !!childCollapsed.value[k];
}

function setChildCollapsed(k, v) {
  childCollapsed.value[k] = v;
}

function toggleChild(k) {
  childCollapsed.value[k] = !childCollapsed.value[k];
}

function cls(c) {
  return props.highlight ? c : '';
}

function indentStr(n) {
  return ' '.repeat(Math.max(n, 0));
}

function memberIndentStr(v) {
  const memberIndent = props.indent + 2;
  if (isCollapsible(v)) {
    return indentStr(memberIndent - 2);
  }
  return indentStr(memberIndent);
}

function keyLiteral(k) {
  return JSON.stringify(k);
}
</script>

<style scoped>
span.json-viewer-toggle {
  cursor: pointer;
  display: inline-block;
  width: 2ch;
  text-align: left;
  user-select: none;
  position: relative;
  top: -2px;
}

span.json-viewer-ellipsis {
  cursor: pointer;
  color: var(--secondary-text);
  padding: 0 0.25rem;
}

span.json-viewer-ellipsis:hover {
  color: var(--primary-text);
}
</style>
