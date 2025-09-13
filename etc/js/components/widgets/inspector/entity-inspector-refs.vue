<template>
  <div class="entity-inspector-refs">
    <div v-for="(refs, key) in entityQueryResult.refs">
      <detail-toggle padding="0px">
        <template v-slot:summary>{{ key }}</template>
        <template v-slot:detail>
          <entity-list :entities="refs"
            @click="emit('selectEntity', $event)">
          </entity-list>
        </template>
      </detail-toggle>
    </div>
    <template v-if="!entityQueryResult.refs || !Object.keys(entityQueryResult.refs).length">
      <span style="color: var(--secondary-text);">No relationships that point to entity.</span>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-refs" }
</script>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  entityQueryResult: {type: Object, required: true},
});

const emit = defineEmits(["selectEntity"]);

</script>

<style scoped>

div.entity-inspector-ref {
  padding-left: 4px;
  padding-bottom: 8px;
}

</style>
