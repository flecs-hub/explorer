<template>
  <div id="pane-info">
    <div class="info-natvis">
      <pre>{{ natvisXml }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: "internals-natvis",
}
</script>

<script setup>
import { defineProps, ref, computed, onMounted } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true },
});

const componentQueryResult = ref({results: []});

onMounted(() => {
  props.conn.query("Component, (Identifier, Symbol), !flecs.meta.primitive, !flecs.meta.opaque", {}, (reply) => {
    componentQueryResult.value = reply;
  });
});

const natvisXml = computed(() => {
  let xml = "";

  for (const r of componentQueryResult.value.results) {
    const size = r.fields.values[0].size;
    if (size === 0) {
      continue;
    }

    let symbol = r.fields.values[1].value;
    let native_symbol = symbol.replaceAll(".", "::");

    xml += `<If Condition='!strcmp(Symbol, "${symbol}")'><Item Name="{IdStr,s8b}">(${native_symbol}*)Ptr</Item><Exec>Found = true</Exec></If>\n`;
  }

  return xml;
});

</script>

<style scoped>
#pane-info {
  padding-top: 0.0px;
}

#pane-info p {
  margin: 0px;
  margin-top: 1.0rem;
  padding-left: 0.5rem;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 1rem;
}

div.info-natvis {
  display: grid;
  overflow: hidden;
}

</style>
