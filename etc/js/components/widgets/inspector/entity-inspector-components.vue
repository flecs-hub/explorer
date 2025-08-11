<template>
  <div class="entity-inspector-components">
    <entity-inspector-module
      :conn="conn"
      :entity="path"
      :type_info="entityQueryResult.type_info"
      :item="m" v-for="m in entityModules"
      :key="m.name"
      @selectEntity="onSelectEntity">
    </entity-inspector-module>
  </div>

  <div class="entity-inspector-actions">
    <template v-if="isScript">
      <button class="entity-inspector-button" @click="onOpenScript">
        Open Script
      </button>
    </template>
    <entity-inspector-add-component
      @submit="addComponent">
    </entity-inspector-add-component>
  </div>
</template>

<script>
export default { name: "entity-inspector-components" }
</script>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  path: {type: String, required: true},
  entityQueryResult: {type: Object, required: true},
  isScript: {type: Boolean, required: true},
  entityModules: {type: Array, required: true}
});

const emit = defineEmits(["scriptOpen", "selectEntity"]);

function addComponent(component) {
  props.conn.add(props.path, component);
}

function onOpenScript() {
  emit("scriptOpen", props);
}

function onSelectEntity(evt) {
  emit("selectEntity", evt)
}

</script>

<style scoped>

</style>
