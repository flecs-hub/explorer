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
      @keydown.esc="onCancel">
  </template>
</template>

<script>
export default { name: "entity-inspector-field" }
</script>

<script setup>
import { computed, defineProps, defineEmits, nextTick, onMounted, ref, watch } from 'vue';

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
  editBox.value.value = formattedValue.value;
  editBox.value.blur();
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
