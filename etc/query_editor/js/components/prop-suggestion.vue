<template>
  <div class="prop-suggestion">
    <entity-parent v-if="prop.parent" :path="prop.parent"></entity-parent>
    <span class="prop-name">{{ prop.name }}</span>
    <span class="prop-brief" v-if="description">{{ description }}</span>
    <template v-if="show_usage && (isComponent || isRelationship) && !isModule">
      <span class="usage-header">Usage</span>
      <span class="usage-example" v-if="isComponent"> - <span class="usage-highlight">{{ prop.name }}</span></span>
      <span class="usage-example" v-if="isComponent"> - <span class="usage-highlight">{{ prop.name }}</span>($this)</span>
      <span class="usage-example" v-if="isRelationship"> - (<span class="usage-highlight">{{ prop.name }}</span>, *)</span>
      <span class="usage-example" v-if="isRelationship"> - <span class="usage-highlight">{{ prop.name }}</span>($this, *)</span>
    </template>
  </div>
</template>

<script>
export default {
  name: "prop-suggestion",
}
</script>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  prop: {type: Object, required: true },
  show_usage: {type: Boolean, required: false }
});

const docKey = "(Description,Brief)";

// Query format is:
//  $this ~= expr, (Description, Brief), ?$this(_), ?$this(_, _), ?Module or
//  (ChildOf, scope), $this ~= expr, ...

const isScopedQuery = computed(() => {
  return props.prop.is_set.length == 6;
})

const isComponent = computed(() => {
  return isScopedQuery.value ? props.prop.is_set[3] : props.prop.is_set[2];
});

const isRelationship = computed(() => {
  return isScopedQuery.value ? props.prop.is_set[4] : props.prop.is_set[3];
});

const isModule = computed(() => {
  return isScopedQuery.value ? props.prop.is_set[5] : props.prop.is_set[4];
});

const description = computed(() => {
  let prop = props.prop;
  if (prop.components && prop.components[docKey]) {
    return prop.components[docKey].value;
  } else {
    return undefined;
  }
});

</script>

<style scoped>
div.prop-suggestion {
  display: flex;
  flex-direction: column;
  position: relative;
  grid-column: 1;
  grid-row: 2;
  color: var(--highlight-text);
  background-color: var(--highlight-bg);
  border-radius: 0.5em;
  margin: 0.25em;
  padding: 0.75em;
}
span.prop-name {
  font-size: 1.1em;
  font-weight: 500;
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}

span.usage-header {
  font-size: 1.1em;
  font-weight: 500;
  margin-top: 1.0em;
  margin-bottom: 0.25em;
}

span.usage-example {
  font-weight: 500;
  margin-top: 0.25em;
  margin-bottom: 0.25em;
  font-weight: normal;
}

span.usage-highlight {
  font-weight: 600;
};
</style>
