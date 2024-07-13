<template>
  <icon-button src="chevron-down" :class="class" :size="size" :rotate="rotate"></icon-button>
</template>

<script>
export default { name: "expand-button" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  expand: { type: Boolean, required: true },
  class: { type: String, required: false, default: "" },
  size: { type: Number, required: false },
  rotation: { type: Number, required: false, default: 90 }
});

const rotate = computed(() => {
  if (props.expand) {
    return 0;
  } else {
    return -props.rotation;
  }
});

</script>
