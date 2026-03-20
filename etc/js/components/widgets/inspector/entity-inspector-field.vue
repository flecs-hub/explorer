<template>
  <template v-if="shrink_to_content">
    <div :class="css">{{ displayValue }}</div>
  </template>
  <template v-else>
    <div :class="css">
      <template v-if="isBoolType">
        <label class="bool-checkbox" @click.stop>
          <input
            type="checkbox"
            :checked="localValue"
            :disabled="props.readonly"
            @change="onBoolToggle">
        </label>
      </template>
      <template v-else-if="isEnumType">
        <dropdown
          class="enum-field-dropdown"
          :items="enumItems"
          :auto_select_first="false"
          v-model:active_item="localValue"
          @update:active_item="onEnumSelect"
          @click.stop>
        </dropdown>
      </template>
      <template v-else>
        <input 
          type="text" 
          ref="editEl"
          @click.stop
          @focus="onFocus"
          @blur="onBlur"
          @mousedown.stop="onMouseDown"
          @keydown.enter="onSubmit"
          @keydown.esc="onCancel">
      </template>
    </div>
  </template>
</template>

<script>
export default { name: "entity-inspector-field" }
</script>

<script setup>
import { computed, defineProps, defineEmits, defineExpose, onMounted, ref, watch, getCurrentInstance } from 'vue';

const props = defineProps({
  value: {required: true},
  type: {type: Object, required: true},
  readonly: {type: Boolean, required: true},
  class: {type: String, required: false, default: "value"},
  compact: {type: Boolean, required: false, default: false},
  shrink_to_content: {type: Boolean, required: false, default: false}
});

const emit = defineEmits(["setValue"]);
const editMode = ref("default");
const editEl = ref(null);
const localValue = ref();
const instance = ref(null);

let dragging = {
  eventHandlersRegistered: false,
  instance: null,
  x: 0,
  type: null,
  value: 0,
  delta: 0,
  dragged: false,
  startTime: 0
}

const css = computed(() => {
  let classes = ["input-wrapper", props.class];
  classes.push(`value-${props.type[0]}`);
  if (isEnumType.value) {
    classes.push("value-dropdown");
  }
  
  if (props.readonly) {
    classes.push(`${props.class}-readonly`);
  }
  if (props.compact) {
    classes.push(`${props.class}-compact`);
  }

  return classes;
});

const isNumberType = computed(() => {
  return props.type[0] === "float" || props.type[0] === "int";
});

const isBoolType = computed(() => {
  return props.type[0] === "bool";
});

const isEnumType = computed(() => {
  return Array.isArray(props.type) && props.type[0] === "enum";
});

const enumItems = computed(() => {
  if (!isEnumType.value) {
    return [];
  }
  return props.type.slice(1).filter((item) => typeof item === "string");
});

const unit = computed(() => {
  if (Array.isArray(props.type) && props.type.length > 1 &&
      typeof props.type[1] === "object") {
    return props.type[1];
  }
});

const unitSymbol = computed(() => {
  if (unit.value) {
    return unit.value.symbol;
  }
});

function roundNumber(value) {
  let numDecimals = 3;
  let num = Math.abs(localValue.value);
  let size = num ? Math.floor(Math.log10(num) + 1) : 0;
  if (size < 0) {
    numDecimals = -size + 3;
  }

  let result = localValue.value.toFixed(numDecimals);
  result = result.replace(/\.?0+$/, "");
  return result;
}

const roundedValue = computed(() => {
  if (localValue.value !== undefined) {
    if (props.type[0] === "float" && typeof props.value == "number") {
      return roundNumber(localValue.value);
    } else {
      return localValue.value;
    }
  }
});

const displayValue = computed(() => {
  if (localValue.value !== undefined) {
    let result = roundedValue.value;

    if (unit.value && unit.value.unit == "flecs.units.Duration.Seconds") {
      result = explorer.fmtDuration(result);
    } else if (unitSymbol.value) {
      result += " " + unitSymbol.value;
    }

    return result
  }
});

watch(() => props.value, () => {
  if (editMode.value !== "edit") {
    localValue.value = props.value;
  }
});

watch(() => [displayValue.value, editMode.value], () => {
  if (editEl.value && editMode.value !== "edit") {
    editEl.value.value = displayValue.value;
  }
});

onMounted(() => {
  localValue.value = props.value;

  if (!dragging.eventHandlersRegistered) {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    dragging.eventHandlersRegistered = true;
  }

  instance.value = getCurrentInstance();
});

function onFocus() {
  editMode.value = "edit";
  editEl.value.value = roundedValue.value;
}

function onBlur() {
  editMode.value = "default";
  dragging.instance = null;
}

function onSubmit() {
  editMode.value = "default";
  if (typeof props.value == "number") {
    localValue.value = Number(editEl.value.value);
  } else {
    localValue.value = editEl.value.value;
  }
  editEl.value.blur();
  emit("setValue", {value: localValue.value});
}

function onBoolToggle(event) {
  const value = event.target.checked;
  localValue.value = value;
  emit("setValue", {value: value});
}

function onEnumSelect(value) {
  if (isEnumType.value) {
    localValue.value = value;
    emit("setValue", {value: value});
  }
}

function onCancel() {
  editMode.value = "default";
  dragging.instance = null;
  localValue.value = props.value;
  editEl.value.blur();
}

function onMouseDown(event) {
  if (isNumberType.value) {
    dragging.instance = instance.value;
    dragging.x = event.clientX;
    dragging.type = props.type[0];
    dragging.value = localValue.value;
    dragging.delta = Math.abs(dragging.value / 30);
    dragging.dragged = false;
    dragging.startTime = Date.now();
    if (!dragging.delta) {
      dragging.delta = 1 / 30;
    }
  }
}

function onMouseMove(event) {
  if (dragging.instance) {
    dragging.instance.exposed.onDragMove(event);
    dragging.dragged = true;
  }
}

function onMouseUp() {
  if (dragging.instance) {
    if (dragging.dragged && Date.now() - dragging.startTime > 100) {
      dragging.instance.exposed.onSubmit();
    }
    dragging.instance = null;
  }
}

function onDragMove(event) {
  const newX = event.clientX;

  dragging.value += (newX - dragging.x) * dragging.delta;
  if (dragging.type === "float") {
    editEl.value.value = Math.round(dragging.value * 1000) / 1000;
  } else {
    editEl.value.value = Math.round(dragging.value);
  }

  dragging.x = newX;
}

defineExpose({ onDragMove, onSubmit });

</script>

<style scoped>

div.value {
  min-height: 1rem;

  text-align: left;
  overflow: auto;

  display: block;
  width: 100%;
  box-sizing: border-box;
}

div.value input {
  border-radius: var(--border-radius-medium);
  background-color: var(--bg-input);
  padding: 4px;
  padding-left: 8px;
  width: calc(100% - 12px);
  height: 100%;
  color: var(--secondary-text);
  cursor: text;
}

div.value :deep(div.enum-field-dropdown) {
  width: 100%;
  display: block;
  box-sizing: border-box;
  background-color: var(--bg-input);
  position: relative;
  z-index: 10;
}

div.value :deep(div.enum-field-dropdown:hover) {
  background-color: var(--bg-button-hover);
}

div.value-dropdown {
  overflow: visible;
}

div.value :deep(div.enum-field-dropdown div.dropdown-container) {
  grid-template-columns: 1fr 32px;
}

div.value :deep(div.enum-field-dropdown div.dropdown-text) {
  padding: 4px;
  padding-left: 8px;
}

div.value :deep(div.enum-field-dropdown div.dropdown-button) {
  padding: 4px;
  text-align: right;
}

div.value :deep(div.enum-field-dropdown div.dropdown-list) {
  top: calc(100% + 2px);
  left: 0;
  z-index: 999;
}

div.value-readonly input {
  /* background-color: var(--bg-input); */
  cursor: default;
  opacity: 0.8;
}

div.value-readonly :deep(div.enum-field-dropdown) {
  cursor: default;
  opacity: 0.8;
}

div.value-compact input {
  white-space: nowrap;
}

div.value-compact :deep(div.enum-field-dropdown div.dropdown-text) {
  white-space: nowrap;
}

div.value-bool {
  color: #4981B5;
  display: flex;
  align-items: center;
}

div.value-bool::after {
  display: none;
}

div.value-bool label.bool-checkbox {
  display: flex;
  align-items: center;
  padding: 4px;
  padding-left: 8px;
}

div.value-bool label.bool-checkbox input[type="checkbox"] {
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bg-input);
  width: 16px;
  height: 16px;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  position: relative;
}

div.value-bool label.bool-checkbox input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 9px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid #4981B5;
  border-width: 0 5px 5px 0;
  transform: rotate(45deg);
}

div.value-bool-readonly label.bool-checkbox input[type="checkbox"] {
  cursor: default;
  opacity: 0.8;
}

div.value-int, div.value-int input {
  color: var(--light-green);
}

div.value-float, div.value-float input {
  color: var(--light-green);
}

div.value-text, div.value-text input {
  color: var(--orange);
}

div.value-entity, div.value-entity input {
  color: var(--primary-text);
}

div.value-enum, div.value-enum input, div.value-bitmask, div.value-bitmask input {
  color: var(--light-green);
}

div.value-enum :deep(span.dropdown-text-active) {
  color: var(--light-green);
}

div.value-enum :deep(li.dropdown-item) {
  color: var(--primary-text);
}

</style>

<style>

html.cursor-ew { cursor: ew-resize !important; }

html.cursor-ew * {
  cursor: inherit !important;
}

</style>
