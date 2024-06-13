<template>
  <div class="detail-toggle">
    <div class="detail-toggle-button">
      <expand-button 
        :expand="showDetail"
        :rotation="180">
      </expand-button>
    </div>
    <div class="noselect detail-toggle-header" @click.stop="toggle">
      <slot name="summary"></slot>
    </div>
    <div class="detail-toggle-detail" v-if="showDetail">
      <slot name="detail"></slot>
    </div>
  </div>
</template>

<script>
export default { name: "detail-toggle" };
</script>

<script setup>
import { ref } from 'vue';

const showDetail = ref(true);

function toggle() {
  showDetail.value = !showDetail.value;
}

function iconRotation() {
  if (showDetail.value) {
    return 0;
  } else {
    return 90;
  }
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
  /* padding-bottom: 4px; */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

div.detail-toggle-header {
  margin: 4px;
  padding: 4px;
  background-color: var(--bg-button-alt);
  border-radius: var(--border-radius-small);
  color: var(--secondary-text);
  font-size: 0.9rem;
  cursor: pointer;
}

div.detail-toggle-button {
  position: absolute;
  top: 4px;
  right: 8px;
}

div.detail-toggle-detail {
  margin-bottom: 8px;
}

</style>
