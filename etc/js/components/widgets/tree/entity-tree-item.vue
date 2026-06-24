<template>
  <div>
    <div ref="itemEl" :class="itemClass" :style="itemIndent" @click="selectItem">
      <template v-if="item.isParent">
        <div class="entity-tree-item-chevron" @click.stop="toggleItem">
          <icon class="noselect" src="chevron-right" :size="16" :rotate="chevronRotation"></icon>
        </div>
      </template>
      <div class="entity-tree-item-icon">
        <entity-tree-icon :item="item"></entity-tree-icon>
      </div>
      <div class="entity-tree-item-name noselect">
        <span>
          {{ itemName }}<template v-if="item.baseEntity"><span class="entity-tree-item-base">&nbsp;:&nbsp;{{ shortenEntity(item.baseEntity) }}</span></template>
        </span>
      </div>
      <div class="entity-tree-item-actions" v-if="showButtons">
        <icon-button src="add" :size="16" @click.stop="onAddChild"></icon-button>
        <icon-button src="trash" :size="16" @click.stop="onDelete"></icon-button>
      </div>
    </div>
    <entity-tree-add-child-modal
      v-if="showAddChild"
      :parent="item.path"
      @submit="onAddChildSubmit"
      @cancel="showAddChild = false">
    </entity-tree-add-child-modal>
    <template v-if="expand">
      <entity-subtree
        ref="childSubtree"
        :conn="conn"
        :path="item.queryRef"
        :depth="depth + 1"
        :selectedItem="selectedItem"
        :showButtons="showButtons"
        @select="selectChild"
        :key="item.path">
      </entity-subtree>
    </template>
  </div>
</template>

<script>
export default { name: "entity-tree-item" }
</script>

<script setup>
import { defineProps, computed, ref, defineEmits, watch, inject, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  item: {type: Object, required: true},
  selectedItem: {type: Object, required: false},
  depth: {type: Number, required: false, default: 0},
  showButtons: {type: Boolean, required: false, default: true}
});

const emit = defineEmits(["select", "remove"]);

const expand = ref(false);
const showAddChild = ref(false);
const itemEl = ref(null);
const childSubtree = ref(null);
const itemRegistry = inject('itemRegistry');

onMounted(() => {
  if (itemEl.value && itemRegistry) {
    itemRegistry.set(itemEl.value, { item: props.item, toggleExpand: toggleItem });
  }
});

onUnmounted(() => {
  if (itemEl.value && itemRegistry) {
    itemRegistry.delete(itemEl.value);
  }
});

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

function onAddChild() {
  showAddChild.value = true;
}

function onAddChildSubmit(evt) {
  showAddChild.value = false;
  const childName = evt.name.replaceAll(".", "\\.");
  const parent = evt.parent;
  const path = parent ? parent + "." + childName : childName;
  props.conn.create(path);
  if (parent === props.item.path) {
    expand.value = true;
    nextTick(() => {
      if (childSubtree.value) {
        childSubtree.value.addEntity(path, evt.name);
      }
    });
  }
}

function onDelete() {
  props.conn.delete(props.item.path);
  if (isSelected.value) {
    emit("select", undefined);
  }
  emit("remove", props.item);
}

const itemClass = computed(() => {
  let result = ["entity-tree-item", "noselect"];

  if (isSelected.value) {
    result.push("entity-tree-item-selected");
  }

  if (props.item.isDisabled) {
    result.push("entity-tree-item-disabled");
  }

  return result;
});

const itemIndent = computed(() => {
  return `padding-left: ${props.depth * 12}px;`;
});

const itemName = computed(() => {
  if (props.item.label) {
    return props.item.label;
  } else {
    return props.item.name;
  }
});

const isSelected = computed(() => {
  return props.item == props.selectedItem;
});

const chevronRotation = computed(() => {
  if (expand.value) {
    return 90
  } else {
    return 0;
  }
});

function shortenEntity(entity) {
  return explorer.shortenEntity(entity);
}

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

div.entity-tree-item-disabled .entity-tree-item-name {
  color: var(--secondary-text);
  font-style: italic;
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
  white-space: nowrap;
}

span.entity-tree-item-base {
  color: var(--secondary-text);
}

div.entity-tree-item-actions {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: none;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

div.entity-tree-item:hover div.entity-tree-item-actions {
  display: flex;
}

</style>
