<template>
  <template v-if="shrink_to_content">
    <!-- <div :class="css">{{ displayValue }}</div> -->
  </template>
  <template v-else>
    <input 
      :class="css"
      type="text" 
      ref="editEl"
      @click.stop
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter="onSubmit"
      @keydown.esc="onCancel">
  </template>
</template>

<script>
export default { name: "entity-inspector-field" }
</script>

<script setup>
import { computed, defineProps, defineEmits, onMounted, ref, watch } from 'vue';

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

const css = computed(() => {
  let classes = [props.class];
  classes.push(`value-${props.type[0]}`);
  
  if (props.readonly) {
    classes.push(`${props.class}-readonly`);
  }
  if (props.compact) {
    classes.push(`${props.class}-compact`);
  }

  return classes;
});

const unit = computed(() => {
  if (props.type.length > 1) {
    const metadata = props.type[1];
    if (metadata.symbol !== undefined) {
      return metadata.symbol;
    }
  }
});

const roundedValue = computed(() => {
  if (localValue.value !== undefined) {
    if (props.type[0] === "float" && typeof props.value == "number") {
      return localValue.value.toFixed(2);
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
});

function onFocus() {
  editMode.value = "edit";
  editEl.value.value = roundedValue.value;
}

function onBlur() {
  editMode.value = "default";
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
  localValue.value = props.value;
  editEl.value.blur();
}

</script>

<style scoped>

div.value, input.value {
  min-height: 1rem;
  padding: 4px;
  padding-left: 8px;
  background-color: var(--bg-content-alt);
  border-radius: var(--border-radius-medium);
  border-style: solid;
  border-width: 1px;
  border-color: rgba(0,0,0,0);
  color: var(--secondary-text);
  cursor: text;
  text-align: left;
  overflow: auto;

  display: block;
  width: 100%;
  box-sizing: border-box;
}

input.value:focus {
  border-color: var(--green);
}

input.value-pending {
  border-color: var(--yellow);
}

input.value-readonly {
  background-color: var(--bg-content);
  cursor: default;
  opacity: 0.9;
}

input.value-compact {
  white-space: nowrap;
}

div.value-bool, input.value-bool {
  color: #4981B5;
}

div.value-int, input.value-int {
  color: var(--light-green);
}

div.value-float, input.value-float {
  color: var(--light-green);
}

div.value-text, input.value-text {
  color: var(--orange);
}

div.value-entity, div.value-entity {
  color: var(--primary-text);
}

div.value-enum, input.value-enum, div.value-bitmask, input.value-bitmask {
  color: #7D67B5;
}

</style>

<style>

html.cursor-ew { cursor: ew-resize !important; }

html.cursor-ew * {
  cursor: inherit !important;
}

</style>
const editMode = ref("default");
const editBox = ref(null);
const instance = ref(null);
const draggingEnabled = ref(false);
const curValue = ref();

let draggingInstance = null;
let dragX = 0;
let dragIncrement = 0;
let draggingRegistered = false;
let draggingValue = 0;
let draggingType = null;

const css = computed(() => {
  let classes = [props.class];
  classes.push(`value-${props.type[0]}`);
  
  if (editMode.value == "pendingChange") {
    classes.push(`${props.class}-pending`);
  }
  if (props.readonly) {
    classes.push(`${props.class}-readonly`);
  }
  if (props.compact) {
    classes.push(`${props.class}-compact`);
  }

  return classes;
});

const unit = computed(() => {
  if (props.type.length > 1) {
    const metadata = props.type[1];
    if (metadata.symbol !== undefined) {
      return metadata.symbol;
    }
  }
});

const displayValue = computed(() => {
  let result;
  if (curValue.value !== undefined) {
    if (props.type[0] === "float" && typeof props.value == "number") {
      result = curValue.value.toFixed(2);
    } else {
      result = curValue.value;
    }

    if (unit.value) {
      result += " " + unit.value;
    }

    return result
  } else {
    return undefined;
  }
});

onMounted(() => {
  if (editBox.value) {
    editBox.value.value = displayValue.value;
  }

  if (!draggingRegistered) {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    draggingRegistered = true;
  }

  instance.value = getCurrentInstance();

  curValue.value = props.value;
});

watch(() => props.value, () => {
  if (editMode.value !== "edit") {
    curValue.value = props.value;
  }
});

watch(() => displayValue.value, () => {
  if (editBox.value) {
    editBox.value.value = displayValue.value;
  }
});

function editField() {
  if (!props.readonly) {
    editMode.value = "edit";
    nextTick(() => {
      editBox.value.value = curValue.value;
    });
  } else {
    editBox.value.blur();
  }
}

function onSubmit() {
  let value;
  if (draggingEnabled.value) {
    value = Number(draggingValue);
  } else {
    value = Number(editBox.value.value);
  }

  curValue.value = value;
  if (props.value !== value) {
    emit("setValue", {value: value});
  }

  editMode.value = "default";
  editBox.value.blur();
}

function onCancel() {
  editMode.value = "default";
  if (editBox.value) {
    editBox.value.value = displayValue.value;
    editBox.value.blur();
  }
}

function onDrag(value) {
  draggingEnabled.value = true;
  editMode.value = "edit";
  curValue.value = value;
  document.documentElement.classList.add('cursor-ew');
}

function onDragStop() {
  if (draggingEnabled.value) {
    document.documentElement.classList.remove('cursor-ew');
    onSubmit();
    draggingEnabled.value = false;
  }
}

function onMouseDown(e) {
  if (props.type[0] === "float" || props.type[0] == "int") {
    draggingInstance = instance.value;
    dragX = e.clientX;
    draggingType = props.type[0];
    draggingValue = curValue.value;
    dragIncrement = Math.abs(draggingValue / 30);
    if (!dragIncrement) {
      dragIncrement = 1 / 30;
    }
  }
}

function onMouseUp() {
  if (draggingInstance) {
    draggingInstance.exposed.onDragStop();
    draggingInstance = null;
  }
}

function onMouseMove(e) {
  if (draggingInstance) {
    const newX = e.clientX;
    draggingValue += (newX - dragX) * dragIncrement
    if (draggingType === "float") {
      draggingInstance.exposed.onDrag(draggingValue);
    } else {
      draggingInstance.exposed.onDrag(Math.round(draggingValue));
    }

    dragX = newX;
  }
}

defineExpose({onDrag, onDragStop});

</script>

<style scoped>

div.value, input.value {
  min-height: 1rem;
  padding: 4px;
  padding-left: 8px;
  background-color: var(--bg-content-alt);
  border-radius: var(--border-radius-medium);
  border-style: solid;
  border-width: 1px;
  border-color: rgba(0,0,0,0);
  color: var(--secondary-text);
  cursor: text;
  text-align: left;
  overflow: auto;

  display: block;
  width: 100%;
  box-sizing: border-box;
}

input.value:focus {
  border-color: var(--green);
}

input.value-pending {
  border-color: var(--yellow);
}

input.value-readonly {
  background-color: var(--bg-content);
  cursor: default;
  opacity: 0.9;
}

input.value-compact {
  white-space: nowrap;
}

div.value-bool, input.value-bool {
  color: #4981B5;
}

div.value-int, input.value-int {
  color: var(--light-green);
}

div.value-float, input.value-float {
  color: var(--light-green);
}

div.value-text, input.value-text {
  color: var(--orange);
}

div.value-entity, div.value-entity {
  color: var(--primary-text);
}

div.value-enum, input.value-enum, div.value-bitmask, input.value-bitmask {
  color: #7D67B5;
}

</style>

<style>

html.cursor-ew { cursor: ew-resize !important; }

html.cursor-ew * {
  cursor: inherit !important;
}

</style>
const editMode = ref("default");
const editBox = ref(null);
const instance = ref(null);
const draggingEnabled = ref(false);
const curValue = ref();

let draggingInstance = null;
let dragX = 0;
let dragIncrement = 0;
let draggingRegistered = false;
let draggingValue = 0;
let draggingType = null;

const css = computed(() => {
  let classes = [props.class];
  classes.push(`value-${props.type[0]}`);
  
  if (editMode.value == "pendingChange") {
    classes.push(`${props.class}-pending`);
  }
  if (props.readonly) {
    classes.push(`${props.class}-readonly`);
  }
  if (props.compact) {
    classes.push(`${props.class}-compact`);
  }

  return classes;
});

const unit = computed(() => {
  if (props.type.length > 1) {
    const metadata = props.type[1];
    if (metadata.symbol !== undefined) {
      return metadata.symbol;
    }
  }
});

const displayValue = computed(() => {
  let result;
  if (curValue.value !== undefined) {
    if (props.type[0] === "float" && typeof props.value == "number") {
      result = curValue.value.toFixed(2);
    } else {
      result = curValue.value;
    }

    if (unit.value) {
      result += " " + unit.value;
    }

    return result
  } else {
    return undefined;
  }
});

onMounted(() => {
  if (editBox.value) {
    editBox.value.value = displayValue.value;
  }

  if (!draggingRegistered) {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    draggingRegistered = true;
  }

  instance.value = getCurrentInstance();

  curValue.value = props.value;
});

watch(() => props.value, () => {
  if (editMode.value !== "edit") {
    curValue.value = props.value;
  }
});

watch(() => displayValue.value, () => {
  if (editBox.value) {
    editBox.value.value = displayValue.value;
  }
});

function editField() {
  if (!props.readonly) {
    editMode.value = "edit";
    nextTick(() => {
      editBox.value.value = curValue.value;
    });
  } else {
    editBox.value.blur();
  }
}

function onSubmit() {
  let value;
  if (draggingEnabled.value) {
    value = Number(draggingValue);
  } else {
    value = Number(editBox.value.value);
  }

  curValue.value = value;
  if (props.value !== value) {
    emit("setValue", {value: value});
  }

  editMode.value = "default";
  editBox.value.blur();
}

function onCancel() {
  editMode.value = "default";
  if (editBox.value) {
    editBox.value.value = displayValue.value;
    editBox.value.blur();
  }
}

function onDrag(value) {
  draggingEnabled.value = true;
  editMode.value = "edit";
  curValue.value = value;
  document.documentElement.classList.add('cursor-ew');
}

function onDragStop() {
  if (draggingEnabled.value) {
    document.documentElement.classList.remove('cursor-ew');
    onSubmit();
    draggingEnabled.value = false;
  }
}

function onMouseDown(e) {
  if (props.type[0] === "float" || props.type[0] == "int") {
    draggingInstance = instance.value;
    dragX = e.clientX;
    draggingType = props.type[0];
    draggingValue = curValue.value;
    dragIncrement = Math.abs(draggingValue / 30);
    if (!dragIncrement) {
      dragIncrement = 1 / 30;
    }
  }
}

function onMouseUp() {
  if (draggingInstance) {
    draggingInstance.exposed.onDragStop();
    draggingInstance = null;
  }
}

function onMouseMove(e) {
  if (draggingInstance) {
    const newX = e.clientX;
    draggingValue += (newX - dragX) * dragIncrement
    if (draggingType === "float") {
      draggingInstance.exposed.onDrag(draggingValue);
    } else {
      draggingInstance.exposed.onDrag(Math.round(draggingValue));
    }

    dragX = newX;
  }
}

defineExpose({onDrag, onDragStop});

</script>

<style scoped>

div.value, input.value {
  min-height: 1rem;
  padding: 4px;
  padding-left: 8px;
  background-color: var(--bg-content-alt);
  border-radius: var(--border-radius-medium);
  border-style: solid;
  border-width: 1px;
  border-color: rgba(0,0,0,0);
  color: var(--secondary-text);
  cursor: text;
  text-align: left;
  overflow: auto;

  display: block;
  width: 100%;
  box-sizing: border-box;
}

input.value:focus {
  border-color: var(--green);
}

input.value-pending {
  border-color: var(--yellow);
}

input.value-readonly {
  background-color: var(--bg-content);
  cursor: default;
  opacity: 0.9;
}

input.value-compact {
  white-space: nowrap;
}

div.value-bool, input.value-bool {
  color: #4981B5;
}

div.value-int, input.value-int {
  color: var(--light-green);
}

div.value-float, input.value-float {
  color: var(--light-green);
}

div.value-text, input.value-text {
  color: var(--orange);
}

div.value-entity, div.value-entity {
  color: var(--primary-text);
}

div.value-enum, input.value-enum, div.value-bitmask, input.value-bitmask {
  color: #7D67B5;
}

</style>

<style>

html.cursor-ew { cursor: ew-resize !important; }

html.cursor-ew * {
  cursor: inherit !important;
}

</style>
