<template>
  <div class="term-doc">
    <div class="term-doc-title">
      <span class="term-doc-swatch" v-if="doc.color" :style="'background-color: ' + doc.color"></span>
      <span class="term-doc-name">{{ doc.name || shortName(doc.entity) }}</span>
      <terminal-entity v-if="doc.name && doc.name !== doc.entity"
        :path="doc.entity" :scope="scope" :full="true"></terminal-entity>
    </div>
    <div class="term-doc-brief" v-if="doc.brief">{{ doc.brief }}</div>
    <div class="term-doc-detail" v-if="doc.detail">{{ doc.detail }}</div>
    <div class="term-doc-link" v-if="doc.link">
      <span class="term-dim">link </span>
      <a :href="doc.link" target="_blank" rel="noopener">{{ doc.link }}</a>
    </div>
    <div class="term-dim" v-if="!doc.brief && !doc.detail && !doc.link">no documentation</div>
  </div>
</template>

<script>
export default { name: "terminal-doc" };
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  doc: { type: Object, required: true },
  scope: { type: String, required: false }
});

function shortName(path) {
  return flecsTerminal.shortName(path);
}
</script>

<style>
#terminal-pane div.term-doc-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

#terminal-pane span.term-doc-name {
  font-weight: bold;
}

#terminal-pane span.term-doc-swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

#terminal-pane div.term-doc-brief {
  margin: 0 0 0 2ch;
  color: var(--primary-text);
}

#terminal-pane div.term-doc-detail {
  margin: 0 0 0 2ch;
  color: var(--term-muted);
  white-space: pre-wrap;
}

#terminal-pane div.term-doc-link {
  margin: 0 0 0 2ch;
}

#terminal-pane div.term-doc-link a {
  color: var(--term-scope);
}
</style>
