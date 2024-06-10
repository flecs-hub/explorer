<template>
  <div :class="css" @click.stop="editField">
    {{ formattedValue }}
  </div>
  <input 
    :class="inputCss" 
    type="text" 
    ref="editBox" 
    v-if="!readonly"
    @click.stop
    @keydown.enter="onSubmit"
    @keydown.esc="onCancel">
</template>

<script>
export default { name: "entity-inspector-field" }
</script>

<script setup>
import { defineProps, ref, computed, nextTick, defineEmits, watch } from 'vue';

const props = defineProps({
  value: {required: true},
  type: {type: Object, required: true},
  readonly: {type: Boolean, required: true},
  class: {type: String, required: false, default: "value"}
});

const emit = defineEmits(["setValue"]);
const editMode = ref("default");
const editBox = ref(null);

const css = computed(() => {
  let classes = [props.class];
  classes.push(`value-${props.type[0]}`);
  if (props.readonly) {
    classes.push(`${props.class}-readonly`);
  }
  if (editMode.value !== "default") {
    classes.push(`${props.class}-hidden`);
  }
  return classes;
});

const inputCss = computed(() => {
  let classes = [props.class];
  classes.push(`value-${props.type[0]}`);
  if (editMode.value === "default") {
    classes.push(`${props.class}-hidden`);
  } else if (editMode.value == "pendingChange") {
    classes.push(`${props.class}-pending`);
  }
  return classes;
});

const formattedValue = computed(() => {
  if (typeof props.value === "number") {
    return props.value.toFixed(2);
  } else {
    return props.value;
  }
});

watch(() => props.value, () => {
  if (editMode.value == "pendingChange") {
    editMode.value = "default";
  }
});

function editField() {
  if (!props.readonly) {
    editMode.value = "edit";
    nextTick(() => {
      editBox.value.value = props.value;
      editBox.value.focus();
    });
  }
}

function onSubmit() {
  if (editBox.value.value != props.value) {
    emit("setValue", {value: editBox.value.value});
    editMode.value = "pendingChange";
  } else {
    editMode.value = "default";
  }
}

function onCancel() {
  editMode.value = "default";
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
}

input.value {
  display: block;
  box-sizing: border-box;
  border-color: var(--green);
  width: 100%;
}

div.value-hidden, input.value-hidden {
  display: none;
}

input.value-pending {
  border-color: var(--yellow);
}

div.value-readonly, input.value-readonly {
  background-color: var(--bg-content);
  cursor: default;
  opacity: 0.9;
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
  color: #B5894B;
}

div.value-entity {
  color: var(--primary-text);
}

div.value-enum, input.value-enum, div.value-bitmask, input.value-bitmask {
  color: #7D67B5;
}

</style>
