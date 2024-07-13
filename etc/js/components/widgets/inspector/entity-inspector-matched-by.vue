<template>
  <div class="entity-inspector-matched-by">
    <div class="entity-inspector-match" v-for="match in entityQueryResult.matches">
      <div><entity-parent :path="match"></entity-parent></div>
      <div><entity-name :path="match"></entity-name></div>
    </div>
    <template v-if="!entityQueryResult.matches || !entityQueryResult.matches.length">
      Not matched by queries
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-matched-by" }
</script>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  path: {type: String, required: true},
  entityQueryResult: {type: Object, required: true},
});

</script>

<style scoped>

div.entity-inspector-matched-by {
  padding: 8px;
}

div.entity-inspector-match {
  padding-left: 4px;
  padding-bottom: 8px;
}

</style>
