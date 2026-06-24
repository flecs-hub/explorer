<template>
  <div id="entity-tree" tabindex="0" @keydown="onKeydown">
    <entity-subtree
      :conn="conn"
      :selectedItem="selectedItem"
      @select="selectItem"
      :nameFilter="nameFilter"
      :queryFilter="queryFilter"
      :showButtons="showButtons">
    </entity-subtree>
    <div class="entity-tree-new noselect" @click="showAddEntity = true" v-if="showButtons">
      <icon src="add" :size="14" :opacity="0.7"></icon>
      <span>New entity</span>
    </div>
    <entity-tree-add-child-modal
      v-if="showAddEntity"
      :parent="''"
      @submit="onAddEntitySubmit"
      @cancel="showAddEntity = false">
    </entity-tree-add-child-modal>
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
  queryFilter: {type: String, required: false},
  showButtons: {type: Boolean, required: false, default: true}
});

const selectedItem = ref();
const showAddEntity = ref(false);
const itemRegistry = new WeakMap();

provide('itemRegistry', itemRegistry);

const emit = defineEmits(["select"]);

function selectItem(evt) {
  selectedItem.value = evt;
  emit("select", evt);
}

function onAddEntitySubmit(evt) {
  showAddEntity.value = false;
  const childName = evt.name.replaceAll(".", "\\.");
  const parent = evt.parent;
  const path = parent ? parent + "." + childName : childName;
  props.conn.create(path);
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
  display: flex;
  flex-direction: column;
  padding-top: 4px;
  padding-left: 8px;
  padding-right: 8px;
  outline: none;
}

div.entity-tree-new {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 18px;
  margin-top: 4px;
  color: var(--secondary-text);
  cursor: pointer;
  border-radius: var(--border-radius-medium);
}

div.entity-tree-new:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--primary-text);
}

</style>
