<template>
  <div :class="editTabsCss()">
    <template v-if="items.length">
      <div class="edit-tabs-container pane">
        <div class="edit-tabs-tabs">
          <div class="edit-tabs-tabs-line"></div>
          <div 
              :class="editButtonCss(item)" 
              @click="editButtonSelect(item)"
              v-for="item in items">
            {{ item }}
            <div class="edit-tabs-close-button">
              <edit-tabs-close-button
                :changed="false"
                v-if="activeItem && item == activeItem"
                @onClose="onClose(item)">
              </edit-tabs-close-button>
            </div>
          </div>
        </div>

        <div class="edit-tabs-content">
          <ul>
            <template v-for="item in items" :key="item">
              <li :class="editContentCss(item)">
                <slot :name="item"></slot>
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
import { defineProps, onMounted, ref, watch } from 'vue';

const props = defineProps({
  items: {type: Array, required: true}
});

const activeItem = ref();

onMounted(() => {
  const items = props.items;
  if (items.length) {
    activeItem.value = items[0];
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
    if (item == activeItem.value) {
      classes.push("edit-tabs-button-active");
    }
  }

  return classes;
}

function editButtonSelect(item) {
  activeItem.value = item;
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

div.edit-tabs-error {
  grid-template-rows: auto 5.6rem;
}

div.edit-tabs-empty {
  background-color: var(--bg-pane);
  height: calc(100% - 2px);
}

div.edit-tabs-container {
  grid-row: 1;
  display: grid;
  grid-template-rows: 42.5px 1fr;
  border-radius: var(--border-radius-medium);
  overflow: auto;
}

div.edit-tabs-content {
  padding: 4px;
  grid-row: 2;
  height: calc(100% - 42.5px);
  overflow-y: auto;
}

div.script-console {
  grid-row: 2;
}

div.edit-tabs-tabs {
  position: relative;
  border-radius: var(--border-radius-medium);
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  overflow: auto;
  background-color: var(--bg-color);
  grid-row: 1;
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
  padding: 10px;
  padding-left: 16px;
  padding-right: 28px;
  cursor: pointer;
  border-style: solid;
  border-width: 0px;
  border-left-width: 1px;
  border-right-width: 0px;
  border-top-width: 2px;
  border-bottom-width: 1px;
  border-color: var(--border);
  border-top-color: rgba(0, 0, 0, 0);
  transition: background-color var(--animation-duration) ease-in-out;
  color: var(--secondary-text);
}

div.edit-tabs-button:nth-child(2) {
  border-left-width: 0px;
}

div.edit-tabs-button-active:last-child {
  border-right-width: 1px;
}

div.edit-tabs-button-active {
  background-color: var(--bg-pane);
  border-bottom-color: rgba(0, 0, 0, 0);
  border-top-color: var(--dark-green);
  color: var(--primary-text);
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
