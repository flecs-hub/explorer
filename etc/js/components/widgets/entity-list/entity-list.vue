<template>
  <div class="entity-list">
    <entity-list-item 
      :path="path" 
      :index="index"
      @click="emit('click', path)"
      v-for="(path, index) in entities" :key="path">
    </entity-list-item>
  </div>
</template>

<script>
export default {
  name: "entity-list",
}
</script>

<script setup>
import { defineProps } from 'vue';

const emit = defineEmits(['click']);

const props = defineProps({
  entities: {type: Array, required: true }
});

</script>

<style scoped>

div.entity-list {
  border-radius: var(--border-radius-medium);
  overflow: auto;
}

</style>
