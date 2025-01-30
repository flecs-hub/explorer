<template>
  <div class="dropdown" ref="dropdown">
    <div class="dropdown-container" @click="onClick">
      <div class="dropdown-text noselect">
        <template v-if="activeItem">
          {{ activeItem }}
        </template>
      </div>
      <div class="dropdown-button">
        <icon src="chevron-down" :opacity="0.7"></icon>
      </div>
    </div>

    <template v-if="showList">
      <div class="dropdown-list">
        <ul>
          <li class="dropdown-item noselect" v-for="item in items" @click="onSelect(item)">
            {{ item }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "dropdown" };
</script>

<script setup>
import { defineProps, defineModel, onMounted, onBeforeUnmount, ref } from 'vue';

const props = defineProps({
  items: {type: Array, required: true},
});

const activeItem = defineModel("active_item");

const showList = ref(false);

const dropdown = ref(null);

onMounted(() => {
  if (!activeItem.value) {
    activeItem.value = props.items[0];
  }

  window.addEventListener('click', onWindowClick)
});

onBeforeUnmount(() => {
  window.removeEventListener('click', onWindowClick)
});

function onClick() {
  showList.value = true;
}

function onWindowClick(event) {
  // Close if the dropdown doesn't contain the clicked element
  if (!dropdown.value.contains(event.target)) {
    showList.value = false;
  }
}

function onSelect(item) {
  activeItem.value = item;
  showList.value = false;
}

</script>

<style>

div.dropdown {
  display: inline-block;
  position: relative;
  border-radius: var(--border-radius-medium);
  color: var(--secondary-text);
  background-color: var(--bg-button);
  transition: background-color 0.05s ease-in;
  cursor: pointer;
  font-size: 0.9rem;
}

div.dropdown:hover {
  background-color: var(--bg-button-hover);
}

div.dropdown-container {
  display: grid;
  grid-template-columns: auto 32px;
  overflow: auto;
}

div.dropdown-text {
  grid-column: 1;
  padding: 8px;
  padding-right: 0px;
}

div.dropdown-button {
  grid-column: 2;
  padding: 8px;
}

div.dropdown-list {
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 99;
  border-style: solid;
  border-width: 1px;
  border-radius: var(--border-radius-medium);
  border-color: var(--border);
  color: var(--primary-text);
  background-color: var(--bg-content);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

ul {
  list-style-type: none;
  margin: 0px;
  padding: 4px;
}

li.dropdown-item {
  padding: 4px;
  padding-right: 32px;
  border-radius: var(--border-radius-medium);
  white-space: nowrap;
  color: var(--primary-text);
}

li.dropdown-item:hover {
  background-color: var(--dark-green);
}

</style>
