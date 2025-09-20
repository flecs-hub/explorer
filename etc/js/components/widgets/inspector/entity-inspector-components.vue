<template>
  <div class="entity-inspector-components">
    <entity-inspector-module
      :conn="conn"
      :entity="path"
      :type_info="entityQueryResult.type_info"
      :item="m" v-for="m in entityModules"
      :key="m.name"
      :filter="filter"
      v-model:loading="loading"
      @selectEntity="emit('selectEntity')"
      @removeComponent="emit('removeComponent', $event)">
    </entity-inspector-module>
  </div>
</template>

<script>
export default { name: "entity-inspector-components" }
</script>

<script setup>
import { defineProps, defineEmits, defineModel } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  path: {type: String, required: true},
  entityQueryResult: {type: Object, required: true},
  isScript: {type: Boolean, required: true},
  entityModules: {type: Array, required: true},
  filter: {type: String, required: false}
});

const emit = defineEmits(["selectEntity", "removeComponent"]);

const loading = defineModel("loading");

</script>

<style scoped>

</style>
