<template>
  <div :class="css">
    {{ value }}
  </div>
</template>

<script>
export default { name: "entity-inspector-field" }
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  value: {required: true},
  type: {type: Object, required: true}
});

const css = computed(() => {
  let classes = ["value"];
  classes.push(`value-${props.type[0]}`);
  return classes;
});

</script>

<style scoped>

div.value {
  padding: 4px;
  padding-left: 8px;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  color: var(--secondary-text);
}

div.value-bool {
  color: #4981B5;
}

div.value-int {
  color: var(--light-green);
}

div.value-float {
  color: var(--light-green);
}

div.value-text {
  color: #B5894B;
}

div.value-enum, div.value-bitmask {
  color: #7D67B5;
}

</style>
