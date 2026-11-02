<template>
  <button class="add-component-button" @click.stop="onClick">
    <div class="entity-inspector-button noselect">
      <icon src="symbol-field"></icon>&nbsp;&nbsp;Add Component
    </div>
  </button>
  <entity-inspector-add-component-modal
    v-if="showModal"
    :conn="conn"
    :error="error"
    @submit="onSubmit"
    @cancel="onCancel">
  </entity-inspector-add-component-modal>
</template>

<script>
export default { name: "entity-inspector-add-component" }
</script>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const emit = defineEmits(["submit"]);
const showModal = ref(false);
const error = ref();

function onClick() {
  error.value = undefined;
  showModal.value = true;
}

function onSubmit(component) {
  error.value = undefined;
  emit("submit", component, (msg) => {
    if (msg) {
      error.value = msg;
    } else {
      showModal.value = false;
    }
  });
}

function onCancel() {
  showModal.value = false;
}

</script>

<style scoped>

button.add-component-button {
  width: 100%;
  text-transform: none;
}

</style>
