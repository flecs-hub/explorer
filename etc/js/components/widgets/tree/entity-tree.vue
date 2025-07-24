<template>
  <div id="entity-tree">
    <entity-subtree 
      :conn="conn"
      :selectedItem="selectedItem"
      @select="selectItem"
      :nameFilter="nameFilter"
      :queryFilter="queryFilter">
    </entity-subtree>
  </div>
</template>

<script>
export default { name: "entity-tree" }
</script>

<script setup>
import { defineProps, defineEmits, defineExpose, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  nameFilter: {type: String, required: false},
  queryFilter: {type: String, required: false}
});

const selectedItem = ref();

const emit = defineEmits(["select"]);

function selectItem(evt) {
  selectedItem.value = evt;
  emit("select", evt);
}

const unselect = () => {
  selectedItem.value = undefined;
}

defineExpose({
  unselect,
});

</script>

<style scoped>

#entity-tree {
  display: grid;
  grid-template-rows: 1rem;
  padding-top: 4px;
  padding-left: 8px;
  padding-right: 8px;
  gap: 0.5rem;
}

</style>
