<template>
  <div class="entity-inspector-script-ast">
    <terminal-color-pre :text="scriptAst"></terminal-color-pre>
  </div>
</template>

<script>
export default { name: "entity-inspector-script-ast" }
</script>

<script setup>
import { defineProps, onMounted, ref, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  path: {type: String, required: true},
});

const scriptReply = ref();
const scriptAst = computed(() => {
  if (scriptReply.value) {
    return scriptReply.value.ast;
  } else {
    return "";
  }
})

onMounted(() => {
  props.conn.get(props.path, {
    try: true,
    managed: true,
    component: "flecs.script.Script"
  }, (reply) => {
    scriptReply.value = reply;
  });
});

</script>

<style scoped>

div.entity-inspector-script-ast {
  overflow-x: auto;
}

</style>
