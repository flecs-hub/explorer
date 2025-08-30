<template>
  <icon-button 
    :src="iconImage"
    @mouseover="onEnter" @mouseleave="onLeave"
    @click.stop="onClose">
  </icon-button>
</template>

<script>
export default { name: "edit-tabs-close-button" }
</script>

<script setup>

import { defineProps, defineEmits, computed, ref } from 'vue';

const props = defineProps({
  changed: {type: Boolean, required: false, default: false}
});

const emit = defineEmits(["onClose"]);
const hover = ref(false);

const iconImage = computed(() => {
  if (hover.value) {
    return "close";
  }
  if (props.changed) {
    return "circle-filled";
  }
  return "close";
});

function onEnter() {
  hover.value = true;
}

function onLeave() {
  hover.value = false;
}

function onClose() {
  emit("onClose");
}

</script>

<style scoped>
</style>
