<template>
  <template v-if="isObject(type, value)">
    <div class="prop-grid">
      <entity-inspector-kv v-for="(value, key) in value"
        :keyname="key"
        :value="value"
        :type="type[key]">
      </entity-inspector-kv>
    </div>
  </template>
  <template v-else>
    <entity-inspector-field
      :value="value"
      :type="type">
    </entity-inspector-field>
  </template>
</template>

<script>
export default { name: "entity-inspector-value" }
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  value: {required: true},
  type: {type: Object, required: true}
});

function isObject(type, value) {
  if (type) {
    if (Array.isArray(type)) {
      return false;
    } else {
      return (typeof type) === "object";
    }
  }
  return (typeof value) === "object";
}
</script>

<style scoped>
div.prop-grid {
  display: grid;
  grid-template-columns: 0.5fr 1fr 20px;
}
</style>
