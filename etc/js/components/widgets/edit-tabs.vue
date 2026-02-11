<template>
  <div :class="editTabsCss()">
    <template v-if="items.length">
      <div class="edit-tabs-container pane">
        <div class="edit-tabs-tabs">
          <div class="edit-tabs-tabs-line"></div>
          <div :class="editButtonCss(item)" @click="editButtonSelect(item.value)" v-for="item in items">
            <div :class="editButtonContentCss(item)">
              <template v-if="item.icon">
                <icon :src="item.icon" :opacity="0.5"></icon>&nbsp;&nbsp;
              </template>
              {{ item.label }}
              <div class="edit-tabs-close-button"
                v-if="activeItem && item.value == activeItem && (item.canClose || item.changed)">
                <edit-tabs-close-button
                  :changed="item.changed"
                  :canClose="item.canClose"
                  @onClose="editButtonClose(item)">
                </edit-tabs-close-button>
              </div>
            </div>
          </div>
        </div>

        <div class="edit-tabs-content" :style="`padding: ${padding}; padding-bottom: 0px;`">
          <ul style="height: inherit; padding: 0px;">
            <template v-for="item in items" :key="item.value">
              <li :class="editContentCss(item.value)">
                <slot :name="item.value"></slot>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "edit-tabs" }
</script>

<script setup>
import { defineProps, defineModel, defineEmits, onMounted } from 'vue';

const props = defineProps({
  items: {type: Array, required: true},
  changed: {type: Boolean, required: false, default: false},
  padding: {type: String, required: false, default: "4px;"}
});

const emit = defineEmits(["onClose"]);
const activeItem = defineModel("active_item");

onMounted(() => {
  const items = props.items;
  if (items.length) {
    if (activeItem.value === undefined) {
      activeItem.value = items[0].value;
    }
  }
});

function editTabsCss() {
  let classes = ["edit-tabs"];
  if (!props.items.length) {
    classes.push("pane");
    classes.push("pane-scripts-empty");
  }
  return classes;
}

function editButtonCss(item) {
  let classes = ["noselect", "edit-tabs-button"];

  if (activeItem.value) {
    if (item.value == activeItem.value) {
      classes.push("edit-tabs-button-active");
    }
  }

  return classes;
}

function editButtonContentCss(item) {
  let classes = ["noselect", "edit-tabs-button-content"];

  if (item.canClose || item.changed) {
    classes.push("edit-tabs-button-content-can-close");
  }

  return classes;
}

function editButtonSelect(item) {
  activeItem.value = item;
}

function editButtonClose(item) {
  let prevItem = undefined;

  for (let i of props.items) {
    if (i.value == item.value) {
      break;
    }
    prevItem = i;
  }

  if (prevItem) {
    activeItem.value = prevItem.value;
  }

  emit("onClose", item);
}

function editContentCss(item) {
  if (item == activeItem.value) {
    return "edit-tabs-tab selected";
  } else {
    return "edit-tabs-tab";
  }
}

</script>

<style scoped>

div.edit-tabs {
  display: grid;
  overflow: auto;
  grid-template-rows: auto;
  gap: var(--gap);
  background-color: var(--bg-content);
  height: 100%;
}

div.edit-tabs-container {
  grid-row: 1;
  display: grid;
  grid-template-rows: 38.5px 1fr;
  border-radius: var(--border-radius-medium);
  overflow: auto;
  height: calc(100% - 2px);
}

div.edit-tabs-content {
  grid-row: 2;
  height: calc(100% - 4px);
  overflow-y: auto;
}

div.edit-tabs-tabs {
  position: relative;
  border-radius: var(--border-radius-medium);
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  overflow: auto;
  background-color: var(--bg-color);
  grid-row: 1;
  display: flex;
  flex-wrap: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

div.edit-tabs-tabs::-webkit-scrollbar {
  display: none;
}

div.edit-tabs-tabs-line {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: calc(100% - 1px);
  border-style: solid;
  border-width: 0px;
  border-top-width: 0px;
  border-bottom-width: 1px;
  border-color: var(--border);
}

div.edit-tabs-button {
  display: inline-block;
  position: relative;
  grid-column: 1;
  cursor: pointer;
  border-style: solid;
  border-width: 0px;
  border-left-width: 1px;
  border-right-width: 0px;
  border-top-width: 0px;
  border-bottom-width: 1px;
  border-color: var(--border);
  border-top-color: rgba(0, 0, 0, 0);
  transition: background-color var(--animation-duration) ease-in-out;
  color: var(--secondary-text);
  white-space: nowrap;
  overflow: hidden;
}

div.edit-tabs-button-content-can-close {
  padding-right: 30px !important;
}

div.edit-tabs-button:nth-child(2) {
  border-left-width: 0px;
}

div.edit-tabs-button:last-child {
  border-right-width: 1px;
}

div.edit-tabs-button-content {
  padding: 8px;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 0.9rem;
  border-style: solid;
  border-width: 0px;
  border-top-width: 2px;
  border-color: rgba(0, 0, 0, 0);
}

div.edit-tabs-button-active {
  background-color: var(--bg-pane);
  border-bottom-color: rgba(0, 0, 0, 0);
  border-top-left-radius: var(--border-radius-small);
  border-top-right-radius: var(--border-radius-small);
  border-right-width: 1px;
  color: var(--primary-text);
}

div.edit-tabs-button-active + div.edit-tabs-button {
  border-left-width: 0px;
}

div.edit-tabs-button-active .edit-tabs-button-content {
  border-top-color: var(--green);
}

div.edit-tabs-button:hover {
  background-color: var(--bg-pane);
}

div.edit-tabs-close-button {
  position: absolute;
  top: 10px;
  right: 8px;
}

.edit-tabs-tab {
  display: none;
}

.edit-tabs-tab.selected {
  display: block;
  height: 100%;
}

</style>
