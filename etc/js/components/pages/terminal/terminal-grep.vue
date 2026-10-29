<template>
  <div class="term-grep">
    <div class="term-dim" v-if="!matches.length">no matches</div>
    <table class="term-table" v-else>
      <tr v-for="(m, i) in visible" :key="i">
        <template v-if="scriptMatches">
          <td>
            <terminal-entity :path="m.script" :scope="scope"></terminal-entity><span
              class="term-dim">:</span><span class="term-number">{{ m.line }}</span>
          </td>
        </template>
        <template v-else>
          <td><terminal-entity :path="m.entity" :scope="scope"></terminal-entity></td>
          <td>
            <terminal-id v-if="hasId(m)" :id="m.id" :scope="scope" :short="true"></terminal-id>
            <span class="term-dim" v-else>name</span>
          </td>
        </template>
        <td class="term-grep-text"><span
          v-for="(s, j) in segments(m.text)" :key="j"
          :class="s.match ? 'term-match' : ''">{{ s.text }}</span></td>
      </tr>
    </table>
    <div v-if="matches.length > limit">
      <span class="term-more" @click.stop="limit = matches.length">&hellip; show {{ matches.length - limit }} more</span>
    </div>
    <div class="term-count" v-if="matches.length > 1">{{ matches.length }} matches</div>
  </div>
</template>

<script>
export default { name: "terminal-grep" };
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  matches: { type: Array, required: true },
  scope: { type: String, required: false },
  needle: { type: String, required: false },
  scriptMatches: { type: Boolean, required: false, default: false },
  caseInsensitive: { type: Boolean, required: false, default: false }
});

const T = flecsTerminal;
const limit = ref(200);

const visible = computed(() => props.matches.slice(0, limit.value));

function hasId(m) {
  return T.formatId(m.id) !== undefined;
}

function segments(text) {
  return T.matchSegments(text, props.needle, props.caseInsensitive);
}
</script>

<style>
#page-terminal td.term-grep-text {
  white-space: pre;
  color: var(--term-muted);
}
</style>
