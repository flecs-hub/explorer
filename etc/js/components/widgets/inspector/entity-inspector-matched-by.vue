<template>
  <div class="entity-inspector-matched-by">
    <template v-if="entityQueryResult.matches && entityQueryResult.matches.length">
      <entity-list :entities="entityQueryResult.matches"
        @click="emit('selectEntity', $event)">
      </entity-list>
    </template>
    <template v-else>
      <span style="color: var(--secondary-text);">Not matched by queries</span>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-matched-by" }
</script>

<script setup>
import { defineProps, defineEmits } from 'vue';

const emit = defineEmits(["selectEntity"]);

const props = defineProps({
  entityQueryResult: {type: Object, required: true},
});

</script>

<style scoped>

div.entity-inspector-match {
  padding-bottom: 8px;
}

</style>
