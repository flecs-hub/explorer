<template>
  <edit-tabs :items='["Overview", "Canvas"]'>
    <template v-slot:Overview>
      <entities-overview
        :conn="conn">
      </entities-overview>
    </template>
    <template v-slot:Canvas>
      <!-- <div id="canvasPlaceholder" :class="canvasCss" :style="`grid-column: ${canvasColumn}`"></div> -->
    </template>
  </edit-tabs>
</template>

<script>
export default { name: "pane-content" };
</script>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  conn: { type: Object, required: true }
});

</script>
