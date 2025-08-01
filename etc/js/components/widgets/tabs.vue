<template>
  <div class="tabs">
    <div class="tabs-overview-container">
      <div class="tabs-overview">
        <template v-for="item in items">
          <button :class="tabCss(item)" v-on:click="tabSelect(item)">
            <span class="noselect tab-title" :title="item">{{ item }}</span>
          </button>
        </template>
      </div>
    </div>
    <ul :class="class">
      <template v-for="item in items" :key="item">
        <li :class="tabContentCss(item)">
          <slot :name="slotLabel(item)"></slot>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
export default {
  name: "tabs",
}
</script>

<script setup>
import { defineProps, defineModel, onMounted, defineEmits } from 'vue';

const props = defineProps({
  items: {type: Array, required: true},
  class: {type: String, required: false},
});

const emit = defineEmits(['changed']);

const active = defineModel("active_tab");

onMounted(() => {
  if (active.value === undefined) {
    active.value = props.items[0];
  }
});

function tabSelect(item) {
  active.value = item;
  emit('changed', {tab: item});
}

function tabCss(item) {
  if (item == active.value) {
    return "tab-button active";
  } else {
    return "tab-button";
  }
}

function tabContentCss(item) {
  if (item == active.value) {
    return "tabs-tab selected";
  } else {
    return "tabs-tab";
  }
}

function slotLabel(item) {
  return item.replaceAll(" ", "-");
}

</script>

<style scoped>
.tabs {
  height: 100%;
}

.tabs > ul {
  padding-inline-start: 0px;
  margin: 0;
  padding: 0;
  height: calc(100% - 50px - 1rem);
}

.tabs-tab {
  display: none;
}

.tabs-tab.selected {
  display: block;
  height: 100%;
}

.tabs-tab p.startli:first-child {
  display: none;
}

.tabs-tab .doxygen-awesome-fragment-wrapper:first-of-type .fragment {
  margin-top: 0;
}

.tabs-overview-container {
  overflow-x: auto;
  overflow-y: visible;
}

.tabs-overview {
  border-bottom: 1px solid var(--tab-separator-color);
  display: flex;
  flex-direction: row;
}

.tabs-overview button.tab-button {
  color: var(--page-foreground-color);
  margin: 0;
  border: none;
  background: transparent;
  padding: calc(1rem / 2.5) 0;
  display: inline-block;
  font-size: 0.9rem;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
}

.tabs-overview button.tab-button .tab-title::before {
  display: block;
  content: attr(title);
  color: var(--primary-text);
  height: 0;
  overflow: hidden;
  visibility: hidden;
}

.tabs-overview button.tab-button .tab-title {
  float: left;
  white-space: nowrap;
  color: var(--secondary-text);
  padding: calc(1rem / 2) 1rem;
  border-radius: var(--border-radius-medium);
  text-transform: uppercase;
  transition: background-color var(--animation-duration) ease-in-out, color var(--animation-duration) ease-in-out;
}

.tabs-overview button.tab-button:not(:last-child) .tab-title {
  box-shadow: 8px 0 0 -7px var(--tab-separator-color);
}

.tabs-overview button.tab-button.active .tab-title {
  color: var(--primary-text);
}

.tabs-overview button.tab-button::after {
  content: '';
  display: block;
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  height: 0;
  width: 0%;
  margin: 0 auto;
  border-radius: var(--border-radius-small) var(--border-radius-small) 0 0;
  background-color: var(--primary-color);
  transition: width var(--animation-duration) ease-in-out, height var(--animation-duration) ease-in-out;
}

.tabs-overview button.tab-button.active::after {
  width: 100%;
  box-sizing: border-box;
  height: 3px;
}
</style>
