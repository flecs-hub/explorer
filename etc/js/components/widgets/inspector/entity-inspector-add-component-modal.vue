<template>
  <modal
    width="460px"
    height="480px"
    :ok-label="pendingRelationship ? 'Next' : 'Add'"
    :ok-disabled="!canSubmit"
    @ok="onOk"
    @cancel="onCancel">
    <template #header>
      <div class="add-header">
        <span class="add-header-title">Add</span>
        <div class="add-mode" role="tablist">
          <button
            v-for="m in modes"
            :key="m.id"
            role="tab"
            :aria-selected="mode === m.id"
            :class="['add-mode-option', {'add-mode-active': mode === m.id}]"
            @click="setMode(m.id)">{{ m.label }}</button>
        </div>
      </div>
    </template>

    <div class="add-inputs" v-if="mode === 'component'">
      <div class="add-input add-input-active">
        <icon src="search" :opacity="0.5"></icon>
        <input
          ref="filterInput"
          type="text"
          v-model="filter"
          placeholder="Search components"
          spellcheck="false">
      </div>
    </div>
    <div class="add-inputs add-pair" v-else>
      <div class="add-pair-field">
        <label class="add-label noselect" @click="focusPairField('first')">Relationship</label>
        <div :class="['add-input', {'add-input-active': pairField === 'first'}]">
          <input
            ref="firstInput"
            type="text"
            v-model="first"
            placeholder="Search relationships"
            spellcheck="false"
            @focus="pairField = 'first'">
        </div>
      </div>
      <span class="add-pair-separator noselect">,</span>
      <div class="add-pair-field">
        <label class="add-label noselect" @click="focusPairField('second')">Target</label>
        <div :class="['add-input', {'add-input-active': pairField === 'second'}]">
          <input
            ref="secondInput"
            type="text"
            v-model="second"
            placeholder="Search targets"
            spellcheck="false"
            @focus="pairField = 'second'">
        </div>
      </div>
    </div>

    <div class="add-list-caption noselect">{{ listCaption }}</div>
    <div class="add-list">
      <prop-browser
        ref="browser"
        :conn="conn"
        :expr="browserExpr"
        :first="browserFirst"
        :x="0"
        :y="0"
        docked
        builtin_last
        @select="onPropSelect"
        @highlight="onHighlight">
      </prop-browser>
      <div class="add-list-empty noselect" v-if="showEmpty">
        No matches. Press Enter to use "{{ browserExpr.trim() }}".
      </div>
    </div>
    <div class="add-error" v-if="error && !errorHidden">{{ error }}</div>

    <template #footer>
      <code class="add-preview" v-if="mode === 'component' && pendingRelationship">({{ pendingRelationship }}, <span class="add-preview-placeholder">target</span>)</code>
      <code class="add-preview" v-else-if="mode === 'component'">
        <span v-if="componentValue">{{ componentValue }}</span>
        <span class="add-preview-placeholder" v-else>Nothing selected</span>
      </code>
      <code class="add-preview" v-else>(<span v-if="pairFirst">{{ pairFirst }}</span><span class="add-preview-placeholder" v-else>relationship</span>, <span v-if="pairSecond">{{ pairSecond }}</span><span class="add-preview-placeholder" v-else>target</span>)</code>
    </template>
  </modal>
</template>

<script>
export default { name: "entity-inspector-add-component-modal" }
</script>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineProps, defineEmits } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  error: {type: String, required: false}
});

const emit = defineEmits(["submit", "cancel"]);

const modes = [
  {id: "component", label: "Component"},
  {id: "pair", label: "Pair"}
];

const mode = ref("component");
const filter = ref("");
const first = ref("");
const second = ref("");
const pairField = ref("first");
const highlighted = ref();
const filterInput = ref(null);
const firstInput = ref(null);
const secondInput = ref(null);
const browser = ref(null);
const relationships = ref({});
const errorHidden = ref(false);

const pairFirst = computed(() => (first.value || "").trim());
const pairSecond = computed(() => (second.value || "").trim());

const browserExpr = computed(() => {
  if (mode.value === "pair") {
    return (pairField.value === "first" ? first.value : second.value) || "";
  }
  return filter.value || "";
});

const browserFirst = computed(() => {
  if (mode.value === "pair" && pairField.value === "second") {
    return pairFirst.value;
  }
  return "";
});

const listCaption = computed(() => {
  if (mode.value === "component") {
    return (filter.value || "").trim().length ? "Entities" : "Components";
  }
  return pairField.value === "first" ? "Relationships" : "Targets";
});

const showEmpty = computed(() => {
  return !highlighted.value && browserExpr.value.trim().length > 0;
});

const componentValue = computed(() => {
  const expr = (filter.value || "").trim();
  if (expr[0] === "(") {
    return expr;
  }
  if (highlighted.value) {
    return propPath(highlighted.value);
  }
  return expr;
});

const canSubmit = computed(() => {
  if (mode.value === "pair") {
    return pairFirst.value.length > 0 && pairSecond.value.length > 0;
  }
  return componentValue.value.length > 0;
});

const pendingRelationship = computed(() => {
  if (mode.value !== "component" || !highlighted.value) {
    return undefined;
  }
  if ((filter.value || "").trim()[0] === "(") {
    return undefined;
  }
  const path = propPath(highlighted.value);
  return relationships.value[path] ? path : undefined;
});

function checkRelationship(path) {
  if (path in relationships.value || !props.conn.query) {
    return;
  }
  props.conn.query(`?flecs.core.Relationship(${path})`, {try: true, rows: true, limit: 1}, (reply) => {
    const result = reply && reply.results ? reply.results[0] : undefined;
    const isSet = result && result.fields ? result.fields.is_set : undefined;
    relationships.value = {...relationships.value, [path]: !!result && (!isSet || !!isSet[0])};
  });
}

watch(() => props.error, () => {
  errorHidden.value = false;
});

watch([filter, first, second, mode], () => {
  errorHidden.value = true;
});

function startPair(relationship) {
  first.value = relationship;
  second.value = "";
  mode.value = "pair";
  focusPairField("second");
}

function propPath(prop) {
  return prop.parent ? prop.parent + "." + prop.name : prop.name;
}

function focusEl(el) {
  nextTick(() => {
    if (el.value) {
      el.value.focus();
    }
  });
}

function focusPairField(field) {
  pairField.value = field;
  focusEl(field === "first" ? firstInput : secondInput);
}

function setMode(value) {
  mode.value = value;
  if (value === "pair") {
    focusPairField(!pairFirst.value.length || pairSecond.value.length ? "first" : "second");
  } else {
    focusEl(filterInput);
  }
}

function onHighlight(value) {
  highlighted.value = value;
  if (value) {
    checkRelationship(propPath(value));
  }
}

function setPairValue(value) {
  if (pairField.value === "first") {
    first.value = value;
  } else {
    second.value = value;
  }
}

function advancePair(submit) {
  if (!pairFirst.value.length) {
    focusPairField("first");
  } else if (!pairSecond.value.length) {
    focusPairField("second");
  } else if (submit) {
    emit("submit", `(${pairFirst.value}, ${pairSecond.value})`);
  } else {
    focusPairField("second");
  }
}

function onPropSelect(evt) {
  if (mode.value === "component") {
    if (evt.kind !== "click") {
      const path = propPath(evt.value);
      if (relationships.value[path]) {
        startPair(path);
      } else {
        emit("submit", path);
      }
    }
    return;
  }
  if (evt.kind !== "click" || evt.detail > 1) {
    return;
  }
  setPairValue(propPath(evt.value));
  advancePair(false);
}

function submitComponent() {
  if (pendingRelationship.value) {
    startPair(pendingRelationship.value);
  } else if (componentValue.value.length) {
    emit("submit", componentValue.value);
  }
}

function enterPair() {
  if (browserExpr.value.trim().length && highlighted.value) {
    setPairValue(propPath(highlighted.value));
  }
  advancePair(true);
}

function onOk() {
  if (!canSubmit.value) {
    return;
  }
  if (mode.value === "pair") {
    emit("submit", `(${pairFirst.value}, ${pairSecond.value})`);
  } else {
    submitComponent();
  }
}

function onCancel() {
  emit("cancel");
}

function onKeydown(e) {
  if (e.key === "Enter") {
    if (e.target && e.target.tagName === "BUTTON") {
      return;
    }
    e.preventDefault();
    if (mode.value === "pair") {
      enterPair();
    } else {
      submitComponent();
    }
    return;
  }
  if (!browser.value) {
    return;
  }
  if (e.key === "ArrowDown") {
    if (browser.value.moveDown()) {
      e.preventDefault();
    }
  } else if (e.key === "ArrowUp") {
    if (browser.value.moveUp()) {
      e.preventDefault();
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  focusEl(filterInput);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});

</script>

<style scoped>

div.add-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

span.add-header-title {
  color: var(--primary-text);
}

div.add-mode {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background-color: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-medium);
}

button.add-mode-option {
  min-width: 0;
  padding: 4px 14px;
  font-size: 0.85rem;
  font-weight: 400;
  text-transform: none;
  color: var(--secondary-text);
  background-color: transparent;
  border-radius: var(--border-radius-small);
  transition: background-color var(--animation-duration), color var(--animation-duration);
}

button.add-mode-option:hover {
  color: var(--primary-text);
  background-color: var(--hover-bg) !important;
}

button.add-mode-option.add-mode-active,
button.add-mode-option.add-mode-active:hover {
  color: var(--primary-text);
  background-color: var(--bg-button) !important;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
}

div.add-inputs {
  padding: 4px 16px 12px 16px;
}

div.add-pair {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

div.add-pair-field {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label.add-label {
  font-size: 0.8em;
  color: var(--secondary-text);
  cursor: text;
}

span.add-pair-separator {
  color: var(--tertiary-text);
  padding-bottom: 8px;
}

div.add-input {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0px 10px;
  box-sizing: border-box;
  background-color: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-medium);
  transition: border-color var(--animation-duration), box-shadow var(--animation-duration);
}

div.add-input input {
  flex: 1;
  min-width: 0;
  background-color: transparent !important;
}

div.add-input input::placeholder {
  color: var(--tertiary-text);
}

div.add-pair div.add-input-active,
div.add-input:focus-within {
  border-color: var(--selected-border);
  box-shadow: 0px 0px 0px 3px var(--accent-muted);
}

div.add-list-caption {
  padding: 8px 16px 6px 16px;
  font-size: 0.75em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tertiary-text);
  border-top: 1px solid var(--bg-content-alt);
}

div.add-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

div.add-list-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--tertiary-text);
  overflow-wrap: anywhere;
}

div.add-error {
  padding: 8px 16px;
  color: var(--bright-red);
  border-top: 1px solid var(--bg-content-alt);
  overflow-wrap: anywhere;
}

code.add-preview {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.85em;
  color: var(--primary-text);
}

span.add-preview-placeholder {
  color: var(--tertiary-text);
  font-style: italic;
}

</style>
