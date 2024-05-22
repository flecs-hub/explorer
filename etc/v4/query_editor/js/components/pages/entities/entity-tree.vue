<template>
  <div id="entity-tree" class="ace-github-dark">
    <keep-alive>
      <entity-subtree 
        :conn="conn"
        :selectedItem="selectedItem"
        @select="selectItem"
        :key="'entity-subtree-root'">
      </entity-subtree>
    </keep-alive>
  </div>
</template>

<script>
export default { name: "entity-tree" }
</script>

<script setup>
import { defineProps, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
});

const selectedItem = ref();

function selectItem(evt) {
  selectedItem.value = evt;
}

</script>

<style scoped>
#entity-tree {
  display: grid;
  grid-template-rows: 100%;
  padding-top: 12px;
  padding-left: 8px;
  padding-right: 8px;
  gap: 0.5rem;
  border-radius: var(--border-radius-medium);
}
</style>
