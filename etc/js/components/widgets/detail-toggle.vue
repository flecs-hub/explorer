<template>
  <div :class="detailCss" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <div class="detail-toggle-button">
      <expand-button 
        :expand="showDetail"
        :rotation="180">
      </expand-button>
    </div>
    <div :class="summaryCss" @click.stop="toggle">
      <slot name="summary"></slot>
    </div>
    <div class="detail-toggle-detail" v-if="showDetail" :style="{ padding: padding }">
      <slot name="detail"></slot>
    </div>
  </div>
</template>

<script>
export default { name: "detail-toggle" };
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  padding: { type: String, required: false, default: "4px" },
});

const showDetail = ref(true);
const hover = ref(false);

function toggle() {
  showDetail.value = !showDetail.value;
}

const detailCss = computed(() => {
  let result = ["detail-toggle"];
  if (hover.value) {
    result.push("detail-toggle-hover");
  }
  return result;
});

const summaryCss = computed(() => {
  let result = ["noselect", "detail-toggle-header"];

  if (!showDetail.value) {
    result.push("detail-toggle-header-collapsed");
  }

  return result;
});

function onMouseEnter() {
  hover.value = true;
}

function onMouseLeave() {
  hover.value = false;
}

</script>

<style>

div.detail-toggle {
  position: relative;
  border-style: solid;
  border-width: 1px;
  border-color: var(--border);
  border-radius: var(--border-radius-medium);
  margin-bottom: 8px;
}

div.detail-toggle-header {
  padding: 4px;
  background-color: var(--bg-button-alt);
  border-radius: var(--border-radius-small);
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  color: var(--tertiary-text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color var(--animation-duration), color var(--animation-duration);
}

div.detail-toggle-header-collapsed {
  border-radius: var(--border-radius-small);
}

div.detail-toggle-hover {
  border-color: var(--bg-button-hover);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
}

div.detail-toggle-hover div.detail-toggle-header {
  background-color: var(--bg-button-hover);
  color: var(--secondary-text);
}

div.detail-toggle-button {
  position: absolute;
  top: 4px;
  right: 8px;
}

</style>
