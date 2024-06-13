<template>
  <div id="page-stats" class="page-content">
    <dropdown :items="periodItems" v-model:active_item="periodItem"></dropdown>&nbsp;
    <div class="world-stats">
      <world-stats :conn="conn" :period="period"></world-stats>
    </div>
  </div>
</template>

<script>
export default { name: "page-stats" };
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const periodItems = ref(['1 second', '1 minute', '1 hour', '1 day', '1 week']);
const periodItem = ref(periodItems.value[1]);
const period = computed(() => {
  if (periodItem.value == "1 second") {
    return "1s";
  } else if (periodItem.value == "1 minute") {
    return "1m";
  } else if (periodItem.value == "1 hour") {
    return "1h";
  } else if (periodItem.value == "1 day") {
    return "1d";
  } else if (periodItem.value == "1 week") {
    return "1w";
  }
});

</script>

<style scoped>
#page-stats {
  height: calc(100% - 1rem);
  overflow: auto;
  border-radius: var(--border-radius-medium);
  background-color: var(--bg-pane);
  padding: 8px;
}

div.world-stats {
  margin-top: 8px;
  height: calc(100% - 44px);
  overflow: auto;
}
</style>
