<template>
  <div id="entity-tree" class="ace-github-dark">
    <keep-alive>
      <entity-subtree 
        :conn="conn"
        :selectedItem="selectedItem"
        @select="selectItem"
        :key="'entity-subtree-root'"
        :nameFilter="nameFilter">
      </entity-subtree>
    </keep-alive>
  </div>
</template>

<script>
export default { name: "entity-tree" }
</script>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  nameFilter: {type: String, required: false}
});

const selectedItem = ref();

const emit = defineEmits(["select"]);

function selectItem(evt) {
  selectedItem.value = evt;
  emit("select", evt);
}

</script>

<style scoped>
#entity-tree {
  display: grid;
  grid-template-rows: 1rem;
  padding-top: 4px;
  padding-left: 8px;
  padding-right: 8px;
  gap: 0.5rem;
  border-radius: var(--border-radius-medium);
}
</style>
