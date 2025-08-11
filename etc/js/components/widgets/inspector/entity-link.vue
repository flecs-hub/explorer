<template>
  <span class="entity-link" @click.stop="onClick">{{ shortenEntity(path) }}</span>
</template>

<script>
export default { name: "entity-link" }
</script>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    path: {type: String, required: true}
});

const emit = defineEmits(["click"]);

function shortenEntity(entity) {
  return explorer.shortenEntity(entity);
}

function onClick() {
  emit("click", props.path);
}

</script>

<style scoped>

span.entity-link:hover {
  color: var(--green);
  cursor: pointer;
}

</style>
