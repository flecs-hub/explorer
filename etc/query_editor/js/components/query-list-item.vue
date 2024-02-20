<template>
  <div :class="css" v-on:click="onClick">
    <entity-parent :path="prop.parent"></entity-parent>
    <prop_name/>
    <span class="prop-brief" v-if="description">{{ description }}</span>
    <template v-if="show_usage && (isComponent || isRelationship) && !isModule">
      <span class="usage-example" v-if="isComponent"> - <span class="usage-highlight">{{ prop.name }}</span></span>
      <span class="usage-example" v-if="isComponent"> - <span class="usage-highlight">{{ prop.name }}</span>($this)</span>
      <span class="usage-example" v-if="isRelationship"> - (<span class="usage-highlight">{{ prop.name }}</span>, *)</span>
      <span class="usage-example" v-if="isRelationship"> - <span class="usage-highlight">{{ prop.name }}</span>($this, *)</span>
    </template>
  </div>
</template>

<script>
export default {
  name: "query-list-item",
}
</script>

<script setup>
import { computed, defineProps, h } from 'vue';

const emit = defineEmits(['select']);

const props = defineProps({
  prop: {type: Object, required: true },
  expr: {type: String, required: false, default: "" },
  index: {type: Number, required: false, default: 0},
  selected: {type: Number, required: false, default: -1},
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

const prop_name = () => {
  const name = props.prop.name;
  const expr_elems = props.expr.split(".");
  const expr = expr_elems[expr_elems.length - 1];
  const indexOf = name.indexOf(expr);
  if (indexOf == -1) {
    return name;
  }

  const first_part = name.slice(0, indexOf);
  const selected_part = name.slice(indexOf, indexOf + expr.length);
  const last_part = name.slice(indexOf + expr.length, name.length);

  let elems = [];
  elems.push(h('span', {}, first_part));
  elems.push(h('span', {class: 'prop-name-selected'}, selected_part));
  elems.push(h('span', {}, last_part));

  return h('span', {class: 'prop-name'}, elems);
};

const css = computed(() => {
  let classes = ['query-list-item', 'noselect']
  if (props.index == props.selected) {
    classes.push('query-list-item-selected');
  } else if ((props.index + 1) % 2 == 0) {
    classes.push('query-list-item-alt');
  }
  return classes;
});

const onClick = () => {
  emit('select', {});
};

</script>

<style scoped>
div.query-list-item {
  display: flex;
  flex-direction: column;
  position: relative;
  margin-bottom: 0em;
  padding: 0.5em;
  cursor: pointer;
  border-style: solid;
  border-width: 0px;
  border-bottom-width: 0px;
  background-color: var(--bg-content);
  border-left-width: 0px;
  border-color: var(--green);
  color: var(--primary-text);
  transition: background-color var(--animation-duration), border-left-width var(--animation-duration);
}

div.query-list-item:hover {
  background-color: var(--bg-content-hover);
}

div.query-list-item-alt {
  background-color: var(--bg-content-alt);
}

div.query-list-item-selected, div.query-list-item-selected:hover {
  border-left-width: 0.25rem;
  background-color: var(--bg-content-select);
}

span.usage-header {
  font-size: 1.1em;
  font-weight: 500;
  margin-top: 1.0em;
  margin-bottom: 0.25em;
  color: var(--highlight-text);
}

span.usage-example {
  font-weight: 500;
  margin-top: 0.25em;
  margin-bottom: 0.25em;
  font-weight: normal;
}

span.usage-highlight {
  color: var(--highlight-text);
};
</style>

<style>
span.prop-name {
  font-size: 1.1em;
  font-weight: 300;
  color: var(--primary-text);
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}

span.prop-name-selected {
  font-weight: 600;
  color: var(--bright-blue);
}

span.prop-brief {
  color: var(--secondary-text);
  margin-bottom: 0.5em;
}
</style>

