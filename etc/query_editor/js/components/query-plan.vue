<template>
  <div id="query-plan">
    <render/>
  </div>
</template>

<script>
export default { name: "query-plan" };
</script>
  
<script setup>
import { h, defineProps } from 'vue';

const props = defineProps({
  result: {type: Object, required: true}
});

const render = () => {
  const plan = props.result.query_plan;
  if (!plan) {
    return h('pre', [], "Plan not available");
  }
  
  let elems = [ ];
  const lines = plan.split("\n");
  for (const line of lines) {
    const tokens = line.split("[[0;");
    for (const token of tokens) {
      const color = token.slice(0, 2);
      const text = token.slice(3, token.length);
      elems.push(h('span', 
        {class: 'plan-color-' + color},
        [text]
      ));
    }
    elems.push(h('br'));
  }

  return h('pre', elems);
};
</script>
  
<style>
#query-plan pre {
  padding-left: 1rem;
  margin: 0px;
}

span.plan-color-49 {
  color: var(--primary-text);
}

span.plan-color-37 {
  color: var(--secondary-text);
}

span.plan-color-32 {
  color: var(--primary-color);
}

span.plan-color-34 {
  color: var(--secondary-color);
}

span.plan-color-33 {
  color: var(--tertiary-color);
}
</style>
