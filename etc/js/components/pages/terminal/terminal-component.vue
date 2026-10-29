<template>
  <div class="term-component-row">
    <terminal-id :id="id" :scope="scope" :short="true"></terminal-id><template
      v-if="hasValue"><span class="term-punct">: </span><terminal-value
      :value="value" :pretty="true"></terminal-value></template>
  </div>
</template>

<script>
export default { name: "terminal-component" };
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  id: { required: false },
  value: { required: false },
  hasValue: { type: Boolean, required: false, default: true },
  scope: { type: String, required: false }
});
</script>

<style>
#terminal-pane div.term-component-row {
  white-space: pre;
}
</style>
