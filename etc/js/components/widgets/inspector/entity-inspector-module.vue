<template>
  <div>
    <detail-toggle v-if="matchCount > 0">
      <template v-slot:summary>
        {{ moduleHeaderName(item.name) }}
      </template>
      <template v-slot:detail>
        <!-- Components -->
        <template v-for="elem in filtered.components" :key="elem.fullName">
          <entity-inspector-component
            :conn="conn"
            :entity="entity"
            :name="elem.name"
            :fullName="elem.fullName"
            icon_src="symbol-field"
            :value="elem.value"
            :type="type_info[elem.fullName]"
            :base="elem.base"
            v-model:loading="loading"
            @selectEntity="onSelectEntity"
            @removeComponent="emit('removeComponent', elem.fullName)">
          </entity-inspector-component>
        </template>

        <!-- Pairs -->
        <template v-for="elem in filtered.pairs" :key="elem.fullName">
          <entity-inspector-component 
            :conn="conn"
            :entity="entity"
            :name="elem.name"
            :fullName="elem.fullName"
            icon_src="symbol-interface"
            :targets="elem.value"
            :base="elem.base"
            v-model:loading="loading"
            @selectEntity="onSelectEntity"
            @removeComponent="emit('removeComponent', elem.fullName)">
          </entity-inspector-component>
        </template>

        <!-- Tags -->
        <template v-for="elem in filtered.tags" :key="elem.fullName">
          <entity-inspector-component
            :conn="conn"
            :entity="entity"
            :name="elem.name"
            :fullName="elem.fullName"
            :base="elem.base"
            icon_src="tag"
            v-model:loading="loading"
            @selectEntity="onSelectEntity"
            @removeComponent="emit('removeComponent', elem.fullName)">
          </entity-inspector-component>
        </template>
      </template>
    </detail-toggle>
  </div>
</template>

<script>
export default { name: "entity-inspector-module" }
</script>

<script setup>
import { defineEmits, defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  entity: {type: String, required: true},
  item: {type: Object, required: true},
  type_info: {type: Object, required: true},
  filter: {type: String, required: false}
});

const emit = defineEmits(["selectEntity", "removeComponent"]);

const loading = defineModel("loading");

function moduleHeaderName(name) {
  if (!name || !name.length) {
    return "root";
  }
  return name.split(".").join(" > ");
}

function onSelectEntity(evt) {
  emit("selectEntity", evt);
}

function maxDist(len) {
  if (len <= 2) return 0;
  if (len <= 4) return 1;
  if (len <= 8) return 2;
  return Math.floor(len * 0.3);
}

// Efficient thresholded Levenshtein (Ukkonen's banded algorithm)
function levWithin(a, b, limit) {
  const n = a.length, m = b.length;
  if (Math.abs(n - m) > limit) return limit + 1;
  const prev = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  const curr = new Array(m + 1);

  for (let i = 1; i <= n; i++) {
    const lo = Math.max(1, i - limit);
    const hi = Math.min(m, i + limit);
    curr[0] = i;
    let rowBest = Infinity;

    for (let j = lo; j <= hi; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = prev[j] + 1;
      const ins = curr[j - 1] + 1;
      const sub = prev[j - 1] + cost;
      const v = Math.min(del, ins, sub);
      curr[j] = v;
      if (v < rowBest) rowBest = v;
    }

    if (rowBest > limit) return limit + 1;
    for (let j = 0; j <= m; j++) prev[j] = curr[j] ?? Infinity;
  }

  return prev[m] ?? limit + 1;
}

// Core fuzzy matching
function fuzzy(text, query) {
  if (!query) return true;
  if (text.includes(query)) return true;

  const limit = maxDist(query.length);
  const qLen = query.length;
  const minLen = Math.max(1, qLen - limit);
  const maxLen = qLen + limit;

  // Token heuristic
  for (const t of text.split(/[^a-z0-9]+/)) {
    if (!t) continue;
    if (t.includes(query) || levWithin(t, query, limit) <= limit) return true;
  }

  // Sliding windows
  for (let len = minLen; len <= Math.min(maxLen, text.length); len++) {
    for (let i = 0; i + len <= text.length; i++) {
      if (levWithin(text.slice(i, i + len), query, limit) <= limit) return true;
    }
  }

  return false;
}

const normalizedFilter = computed(() => (props.filter || "").trim().toLowerCase());

const filtered = computed(() => {
  const f = normalizedFilter.value;
  const norm = s => (s ?? "").toLowerCase();
  const keep = e => !f || norm(e.fullName).includes(f) || fuzzy(norm(e.fullName), f);

  const toArr = x => Array.isArray(x) ? x : Object.values(x || {});
  return {
    components: toArr(props.item.value.components).filter(keep),
    pairs:      toArr(props.item.value.pairs).filter(keep),
    tags:       toArr(props.item.value.tags).filter(keep),
  };
});

const matchCount = computed(() =>
  filtered.value.components.length +
  filtered.value.pairs.length +
  filtered.value.tags.length
);

</script>

<style scoped>

</style>
