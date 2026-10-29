<template>
  <div class="term-inspect">
    <div class="term-inspect-header">
      <terminal-entity :path="info.entity" :scope="scope" :full="true"></terminal-entity>
      <span class="term-dim">  #{{ info.id }}</span>
    </div>
    <div class="term-inspect-body">
      <terminal-component v-for="(c, i) in components" :key="'c' + i"
        :id="c.id" :value="c.value" :scope="scope">
      </terminal-component>
      <terminal-component v-for="(id, i) in ids" :key="'i' + i"
        :id="id" :hasValue="false" :scope="scope">
      </terminal-component>
      <div class="term-dim" v-if="!components.length && !ids.length">no components</div>
    </div>
  </div>
</template>

<script>
export default { name: "terminal-inspect" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  info: { type: Object, required: true },
  scope: { type: String, required: false }
});

const T = flecsTerminal;

const components = computed(() => (props.info.components || []).map((c) => ({
  id: c.id,
  value: T.unwrapValue(c.value).value
})));

const ids = computed(() => props.info.ids || []);
</script>

<style>
#page-terminal div.term-inspect-header span.term-entity {
  font-weight: bold;
}

#page-terminal div.term-inspect-body {
  margin-left: 2ch;
}
</style>
