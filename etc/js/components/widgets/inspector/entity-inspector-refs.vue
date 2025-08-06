<template>
  <div class="entity-inspector-refs">
    <div v-for="(refs, key) in entityQueryResult.refs">
      <detail-toggle>
        <template v-slot:summary>{{ key }}</template>
        <template v-slot:detail>
          <div class="entity-inspector-ref" v-for="ref in refs">
            <div><entity-parent :path="ref"></entity-parent></div>
            <div><entity-name :path="ref"></entity-name></div>
          </div>
        </template>
      </detail-toggle>
    </div>
    <template v-if="!entityQueryResult.refs || !Object.keys(entityQueryResult.refs).length">
      No references to entity
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-refs" }
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  path: {type: String, required: true},
  entityQueryResult: {type: Object, required: true},
});

</script>

<style scoped>

div.entity-inspector-ref {
  padding-left: 4px;
  padding-bottom: 8px;
}

</style>
