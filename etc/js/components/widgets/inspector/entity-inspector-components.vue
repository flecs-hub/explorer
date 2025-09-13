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
      @selectEntity="onSelectEntity">
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

const emit = defineEmits(["scriptOpen", "selectEntity"]);

const loading = defineModel("loading");

function onOpenScript() {
  emit("scriptOpen", props);
}

function onSelectEntity(evt) {
  emit("selectEntity", evt)
}

</script>

<style scoped>

</style>
