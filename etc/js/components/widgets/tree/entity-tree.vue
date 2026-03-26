<template>
  <div id="entity-tree" tabindex="0" @keydown="onKeydown">
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
import { defineProps, defineEmits, defineExpose, ref, provide } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  nameFilter: {type: String, required: false},
  queryFilter: {type: String, required: false}
});

const selectedItem = ref();
const itemRegistry = new WeakMap();

provide('itemRegistry', itemRegistry);

const emit = defineEmits(["select"]);

function selectItem(evt) {
  selectedItem.value = evt;
  emit("select", evt);
}

function onKeydown(evt) {
  if (evt.key !== 'ArrowUp' && evt.key !== 'ArrowDown' && evt.key !== 'Enter') {
    return;
  }

  evt.preventDefault();

  const container = evt.currentTarget;
  const allItems = container.querySelectorAll('.entity-tree-item');
  if (!allItems.length) return;

  const selectedEl = container.querySelector('.entity-tree-item-selected');

  if (evt.key === 'Enter') {
    if (selectedEl) {
      const entry = itemRegistry.get(selectedEl);
      if (entry && entry.item.isParent) {
        entry.toggleExpand();
      }
    }
    return;
  }

  let index = -1;

  if (selectedEl) {
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i] === selectedEl) {
        index = i;
        break;
      }
    }
  }

  let newIndex;
  if (index === -1) {
    newIndex = evt.key === 'ArrowDown' ? 0 : allItems.length - 1;
  } else if (evt.key === 'ArrowDown') {
    newIndex = Math.min(index + 1, allItems.length - 1);
  } else {
    newIndex = Math.max(index - 1, 0);
  }

  if (newIndex === index) return;

  const newEl = allItems[newIndex];
  const entry = itemRegistry.get(newEl);
  if (entry) {
    selectItem(entry.item);
    newEl.scrollIntoView({ block: 'nearest' });
  }
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
  outline: none;
}

</style>
