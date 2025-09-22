<template>
  <div class="refresh-control">
    <button class="refresh-toggle" @click="toggle">{{ buttonText }}</button>
    <button :class="refreshButtonCss()">
      <icon 
        :src="buttonIcon" 
        :opacity="buttonIconOpacity" 
        @click="request"></icon>
    </button>
  </div>
</template>

<script>
export default { name: "refresh-control" };
</script>

<script setup>
import { defineProps, defineModel, computed } from 'vue';


</script>

<style scoped>

div.refresh-control {
  display: grid;
  grid-template-columns: 125px 40px;
  grid-template-rows: var(--header-height);
  gap: var(--gap);
  height: 100%;
}

button.refresh-toggle {
  grid-column: 1;
  grid-row: 1;
}

button.refresh-button {
  grid-column: 2;
  grid-row: 1;
}

button.refresh-button-disabled {
  cursor: default;
}

</style>
