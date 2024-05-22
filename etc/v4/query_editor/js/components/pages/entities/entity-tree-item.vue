<template>
  <div>
    <div :class="itemClass" :style="itemIndent" @click="selectItem">
      <template v-if="item.isParent">
        <div class="entity-tree-item-chevron" @click.stop="toggleItem">
          <icon class="noselect" src="chevron-right" :size="16" v-if="!expand"></icon>
          <icon class="noselect" src="chevron-down" :size="16" v-if="expand"></icon>
        </div>
      </template>
      <div class="entity-tree-item-icon">
        <entity-tree-icon :item="item"></entity-tree-icon>
      </div>
      <div class="entity-tree-item-name noselect">
        <span>
          {{ item.name }}<template v-if="item.baseEntity"><span class="entity-tree-item-base">&nbsp;:&nbsp;{{ item.baseEntity }}</span></template>
        </span>
      </div>
    </div>
    <template v-if="expand">
      <entity-subtree
        :conn="conn" 
        :path="item.path"
        :depth="depth + 1"
        :selectedItem="selectedItem"
        :key="'entity-subtree-' + item.path"
        @select="selectChild">
      </entity-subtree>
    </template>
  </div>
</template>

<script>
export default { name: "entity-tree-item" }
</script>

<script setup>
import { defineProps, computed, ref, defineEmits } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  item: {type: Object, required: true},
  selectedItem: {type: Object, required: false},
  depth: {type: Number, required: false, default: 0}
});

const emit = defineEmits(["select"]);

const expand = ref(false);

function toggleItem() {
  expand.value = !expand.value;
}

function selectItem() {
  if (isSelected.value) {
    emit("select", undefined);
  } else {
    emit("select", props.item);
  }
}

function selectChild(evt) {
  emit("select", evt);
}

const itemClass = computed(() => {
  let result = ["entity-tree-item"];

  if (isSelected.value) {
    result.push("entity-tree-item-selected");
  }

  return result;
});

const itemIndent = computed(() => {
  return `padding-left: ${props.depth * 12}px;`;
});

const isSelected = computed(() => {
  return props.item == props.selectedItem;
});

</script>

<style scoped>
div.entity-tree-item {
  position: relative;
  display: grid;
  grid-template-columns: 18px 14px 1rem;
  max-height: 28px;
  padding-top: 4px;
  cursor: pointer;
  border-radius: var(--border-radius-medium);
  border-color: rgba(0, 0, 0, 0);
  border-width: 1px;
  border-style: solid;
}

div.entity-tree-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

div.entity-tree-item-selected {
  background-color: var(--dark-blue);
  border-color: var(--less-dark-blue);
}

div.entity-tree-item-selected:hover {
  background-color: var(--dark-blue);
  border-color: var(--less-dark-blue);
}

div.entity-tree-item-chevron {
  grid-column: 1;
  cursor: pointer;
  opacity: 0.7;
}

div.entity-tree-item-icon {
  grid-column: 2;
}

div.entity-tree-item-chevron:hover {
  opacity: 1.0;
}

div.entity-tree-item-name {
  grid-column: 3;
  color: var(--primary-text);
}

span.entity-tree-item-base {
  color: var(--secondary-text);
}

</style>
