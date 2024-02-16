<template>
  <div id="query-api">
    <p>rest</p>
    <pre>{{url}}</pre>

    <p>javascript</p>
    <pre><span class="api-function">flecs.query</span><span class="api-operator">(</span><span class="api-string">"{{ query_trimmed }}"</span><span class="api-operator">,
  {</span><span class="api-member">rows</span><span class="api-operator">: </span><span class="api-keyword">true</span><span class="api-operator">},</span>
  <span class="api-operator">(</span><span class="api-variable">reply</span><span class="api-operator">) => {
    <span class="api-comment">// Success</span>
  }, </span>
  <span class="api-operator">(</span><span class="api-variable">reply</span><span class="api-operator">) => {
    <span class="api-comment">// Failed</span>
  });</span></pre>

    <p>schema</p>
    <query-schema :result="result"></query-schema>
  </div>
</template>

<script>
export default { name: "query-api" }
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  query: {type: String, required: true},
  result: {type: Object, required: true}
});

const url = computed(() => {
  return flecs.query(props.query, {rows: true}).url;
});

const query_trimmed = computed(() => {
  return flecs.query_trim(props.query);
});

</script>

<style scoped>
#query-api {
  margin: 0px;
  padding: 1rem;
}

#query-api p {
  margin: 0px;
  padding-left: 0.5px;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
}

#query-api pre {
  background-color: var(--bg-textbox);
  border-radius: var(--border-radius-medium);
  padding: 1rem;
  margin-bottom: 2rem;
  overflow-x: auto;
}

pre.query-api-js {

}

span.api-function {
  color: var(--blue);
}

span.api-operator {
  color: var(--secondary-text);
}

span.api-string {
  color: var(--yellow);
}

span.api-member {
  color: var(--primary-text);
}

span.api-variable {
  color: var(--green);
}

span.api-keyword {
  color: var(--blue);
}

span.api-comment {
  color: var(--secondary-text);
}

</style>
