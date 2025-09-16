<template>
  <template v-if="shrink_to_content">
    <div :class="css">{{ displayValue }}</div>
  </template>
  <template v-else>
    <div :class="css">
      <input 
        type="text" 
        ref="editEl"
        @click.stop
        @focus="onFocus"
        @blur="onBlur"
        @mousedown.stop="onMouseDown"
        @keydown.enter="onSubmit"
        @keydown.esc="onCancel">
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

const unit = computed(() => {
  if (props.type.length > 1) {
    const metadata = props.type[1];
    if (metadata.symbol !== undefined) {
      return metadata.symbol;
    }
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

    if (unit.value) {
      result += " " + unit.value;
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
  background-color: var(--bg-content-alt);
  padding: 4px;
  padding-left: 8px;
  width: calc(100% - 12px);
  height: 100%;
  color: var(--secondary-text);
  cursor: text;
}

div.value-readonly input {
  background-color: var(--bg-content);
  cursor: default;
  opacity: 0.9;
}

div.value-compact input {
  white-space: nowrap;
}

div.value-bool, div.value-bool input {
  color: #4981B5;
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
  color: #7D67B5;
}

</style>

<style>

html.cursor-ew { cursor: ew-resize !important; }

html.cursor-ew * {
  cursor: inherit !important;
}

</style>