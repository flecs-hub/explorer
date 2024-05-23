<template>
  <div class="key">
    {{  keyname }}
  </div>
  <div class="value">
    <entity-inspector-field
      :value="value"
      :type="type">
    </entity-inspector-field>
  </div>
  <div class="edit">
    <icon src="edit" :opacity="0.7"></icon>
  </div>
</template>

<script>
export default { name: "entity-inspector-kv" }
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  keyname: {type: String, required: true},
  value: {required: true},
  type: {type: Object, required: true}
});

</script>

<style scoped>
div.key {
  grid-column: 1;
  color: var(--secondary-text);
  text-align: right;
  padding: 4px;
  padding-right: 8px;
}

div.value {
  grid-column: 2;
  margin-bottom: 2px;
}

div.edit {
  grid-column: 3;
  padding-left: 4px;
}
</style>
