<template>
  <div class="color-preview" :style="`background-color: ${value};`"></div>
</template>

<script>
export default { name: "color-preview" };
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  value: {type: String, required: true}
});

</script>

<style scoped>
div.color-preview {
  width: 100%;
  min-height: 28px;
  border-radius: var(--border-radius-medium);
}
</style>
