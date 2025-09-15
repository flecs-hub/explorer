<template>
  <div :class="detailCss" 
    @mouseenter="onMouseEnter" 
    @mouseleave="onMouseLeave">
    <div class="detail-toggle-button">
      <expand-button 
        :expand="showDetail"
        :rotation="180">
      </expand-button>
    </div>
    <div :class="summaryCss" @click.stop="toggle"  @mousedown.stop="onMouseDown" @mouseup.stop="onMouseUp">
      <slot name="summary"></slot>
    </div>
    <div class="detail-toggle-detail" :style="detailStyle">
      <slot name="detail" v-if="showDetail"></slot>
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
const pressed = ref(false);

function toggle() {
  showDetail.value = !showDetail.value;
}

const detailCss = computed(() => {
  let result = ["detail-toggle"];
  if (hover.value) {
    result.push("detail-toggle-hover");
  }
  if (pressed.value) {
    result.push("detail-toggle-pressed");
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

const detailStyle = computed(() => {
  if (showDetail.value) {
    return { padding: props.padding };
  }
  return { padding: "0px" };
});

function onMouseEnter() {
  hover.value = true;
}

function onMouseLeave() {
  hover.value = false;
  pressed.value = false;
}

function onMouseDown() {
  pressed.value = true;
}

function onMouseUp() {
  pressed.value = false;
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

div.detail-toggle-pressed {
  border-color: var(--bg-button-alt);
}

div.detail-toggle-pressed div.detail-toggle-header {
  background-color: var(--bg-button-alt);
  color: var(--secondary-text);
}

div.detail-toggle-button {
  position: absolute;
  top: 4px;
  right: 8px;
}

div.detail-toggle-detail {
  margin-bottom: 0px;
  transition: padding-top var(--animation-duration), padding-bottom var(--animation-duration);
}

</style>
