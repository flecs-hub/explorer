<template>
  <div>
    <div :class="itemClass" :style="itemIndent" @click="selectItem">
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
          {{ itemName }}<template v-if="item.baseEntity"><span class="entity-tree-item-base">&nbsp;:&nbsp;{{ item.baseEntity }}</span></template>
        </span>
      </div>
    </div>
    <template v-if="expand">
      <entity-subtree
        :conn="conn" 
        :path="item.path"
        :depth="depth + 1"
        :selectedItem="selectedItem"
        @select="selectChild">
      </entity-subtree>
    </template>
  </div>
</template>

<script>
export default { name: "entity-tree-item" }
</script>

<script setup>
import { defineProps, computed, ref, defineEmits, watch } from 'vue';

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

</style>
