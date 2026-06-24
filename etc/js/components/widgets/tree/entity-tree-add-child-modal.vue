<template>
  <modal
    title="New entity"
    ok-label="Create"
    :ok-disabled="!canSubmit"
    @ok="onOk"
    @cancel="onCancel">
    <div class="add-child-fields">
      <div class="add-child-field">
        <label class="add-child-label noselect">Parent</label>
        <input
          type="text"
          class="add-child-input"
          v-model="parentValue"
          spellcheck="false"
          @keydown="onKeydown">
      </div>
      <div class="add-child-field">
        <label class="add-child-label noselect">Name</label>
        <input
          ref="inputEl"
          type="text"
          class="add-child-input"
          v-model="name"
          spellcheck="false"
          @keydown="onKeydown">
      </div>
    </div>
  </modal>
</template>

<script>
export default { name: "entity-tree-add-child-modal" }
</script>

<script setup>
import { ref, computed, onMounted, nextTick, defineProps, defineEmits } from 'vue';

const props = defineProps({
  parent: {type: String, required: true}
});

const emit = defineEmits(["submit", "cancel"]);

const name = ref("");
const parentValue = ref(props.parent);
const inputEl = ref(null);

const canSubmit = computed(() => {
  return name.value.trim().length > 0;
});

function onOk() {
  if (!canSubmit.value) {
    return;
  }
  emit("submit", { parent: parentValue.value.trim(), name: name.value.trim() });
}

function onCancel() {
  emit("cancel");
}

function onKeydown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    onOk();
  }
}

onMounted(() => {
  nextTick(() => {
    if (inputEl.value) {
      inputEl.value.focus();
    }
  });
});

</script>

<style scoped>

div.add-child-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0px 16px 12px 16px;
}

div.add-child-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label.add-child-label {
  font-size: 0.9em;
  color: var(--secondary-text);
}

input.add-child-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem;
  border-radius: var(--border-radius-medium);
}

</style>
