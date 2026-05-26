<template>
  <button class="add-component-button" @click.stop="onClick">
    <div class="entity-inspector-button noselect">
      <icon src="symbol-field"></icon>&nbsp;&nbsp;Add Component
    </div>
  </button>
  <entity-inspector-add-component-modal
    v-if="showModal"
    :conn="conn"
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

function onClick() {
  showModal.value = true;
}

function onSubmit(component) {
  showModal.value = false;
  emit("submit", component);
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
