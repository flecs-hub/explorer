<template>
  <div class="term-query">
    <div class="term-dim" v-if="!rows.length">no results</div>
    <table class="term-table" v-else>
      <thead>
        <tr>
          <th v-if="hasEntity">entity</th>
          <th v-for="c in columns" :key="c.key">
            <terminal-id :id="c.id" :scope="scope" :short="true"></terminal-id>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in visible" :key="i">
          <td v-if="hasEntity">
            <terminal-entity :path="row.entity" :scope="scope"></terminal-entity>
          </td>
          <td v-for="c in columns" :key="c.key">
            <terminal-value v-if="cells[i].get(c.key) !== undefined" :value="cells[i].get(c.key)"></terminal-value>
            <span class="term-dim" v-else>&ndash;</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="rows.length > limit">
      <span class="term-more" @click.stop="limit = rows.length">&hellip; show {{ rows.length - limit }} more</span>
    </div>
    <div class="term-count" v-if="rows.length">{{ rows.length }} {{ rows.length === 1 ? 'result' : 'results' }}</div>
  </div>
</template>

<script>
export default { name: "terminal-query" };
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  rows: { type: Array, required: true },
  scope: { type: String, required: false }
});

const T = flecsTerminal;
const limit = ref(200);

const visible = computed(() => props.rows.slice(0, limit.value));

const hasEntity = computed(() => props.rows.some((r) => !T.isRoot(r.entity)));

const columns = computed(() => {
  const result = [];
  const seen = new Set();
  for (const row of props.rows) {
    for (const f of row.fields || []) {
      const key = T.formatId(f.id);
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ key: key, id: f.id });
      }
    }
  }
  return result;
});

const cells = computed(() => props.rows.map((row) => {
  const map = new Map();
  for (const f of row.fields || []) {
    map.set(T.formatId(f.id), T.unwrapValue(f.value).value);
  }
  return map;
}));
</script>
