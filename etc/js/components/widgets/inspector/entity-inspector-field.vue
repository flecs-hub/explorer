<template>
  <template v-if="shrink_to_content">
    <div :class="css">{{ formattedValue }}</div>
  </template>
  <template v-else>
    <input 
      :class="css" 
      type="text" 
      ref="editBox"
      @click.stop
      @focus="editField"
      @blur="onCancel"
      @keydown.enter="onSubmit"
      @keydown.esc="onCancel"
      @mousedown.stop="onMouseDown">
  </template>
</template>

<script>
export default { name: "entity-inspector-field" }
</script>

<script setup>
import { computed, defineProps, defineEmits, defineExpose, nextTick, onMounted, ref, watch, getCurrentInstance } from 'vue';

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
const editBox = ref(null);
const instance = ref(null);
const draggingEnabled = ref(false);

let draggingInstance = null;
let dragging = null;
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

const formattedValue = computed(() => {
  if (props.type[0] === "float" && typeof props.value == "number") {
    return props.value.toFixed(2);
  } else {
    return props.value;
  }
});

onMounted(() => {
  if (editBox.value) {
    editBox.value.value = formattedValue.value;
  }

  if (!draggingRegistered) {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    draggingRegistered = true;
  }

  instance.value = getCurrentInstance();
});

watch(() => props.value, () => {
  if (editBox.value) {
    if (editMode.value == "pendingChange") {
      editMode.value = "default";
    }
    if (editMode.value !== "edit") {
      editBox.value.value = formattedValue.value;
    }
  }
});

function editField() {
  if (!props.readonly) {
    editMode.value = "edit";
    nextTick(() => {
      editBox.value.value = props.value;
    });
  } else {
    editBox.value.blur();
  }
}

function onSubmit() {
  if (editBox.value.value != props.value) {
    emit("setValue", {value: editBox.value.value});
    editMode.value = "pendingChange";
  } else {
    editMode.value = "default";
  }
  editBox.value.blur();
}

function onCancel() {
  editMode.value = "default";
  if (editBox.value) {
    editBox.value.value = formattedValue.value;
    editBox.value.blur();
  }
}

function onDragStart() {
  draggingEnabled.value = true;
  document.documentElement.classList.add('cursor-ew');
}

function onDragStop() {
  draggingEnabled.value = false;
  document.documentElement.classList.remove('cursor-ew');
  onSubmit();
}

function onMouseDown(e) {
  if (props.type[0] === "float" || props.type[0] == "int") {
    dragging = editBox;
    draggingInstance = instance.value;
    dragX = e.clientX;
    draggingType = props.type[0];
    draggingValue = props.value;
    dragIncrement = Math.abs(props.value / 50);
    if (!dragIncrement) {
      dragIncrement = 1;
    }
  }
}

function onMouseUp() {
  if (draggingInstance) {
    draggingInstance.exposed.onDragStop();
    dragging = null;
    draggingInstance = null;
  }
}

function onMouseMove(e) {
  if (dragging && dragging.value) {
    const newX = e.clientX;
    draggingValue += (newX - dragX) * dragIncrement
    if (draggingType === "float") {
      dragging.value.value = draggingValue;
    } else {
      dragging.value.value = Math.round(draggingValue);
    }
    
    dragX = newX;
    draggingInstance.exposed.onDragStart();
  }
}

defineExpose({onSubmit, onDragStart, onDragStop});

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
