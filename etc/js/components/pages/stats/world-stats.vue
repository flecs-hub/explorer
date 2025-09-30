<template>
  <div class="top-margin"></div>
  <dropdown :items="periodItems" v-model:active_item="periodItem"></dropdown>&nbsp;
  <div class="world-stats">
    <div class="stats-groups">
      <div v-for="(group, k, i) in groups" :key="i">
        <detail-toggle>
          <template v-slot:summary>
            <span class="stats-group-name">{{ name_fmt(k) }}</span>
          </template>
          <template v-slot:detail>
            <div class="stats-group-stats">
              <template v-for="(v, k) in group" :key="k">
                <world-stat :name="k" :values="v" :valid="true"></world-stat>
              </template>
            </div>
          </template>
        </detail-toggle>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: "world-stats" };
</script>

<script setup>
import { defineProps, ref, onMounted, onUnmounted, computed, watch } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const statsQuery = ref();
const statsQueryResult = ref([]);

const periodItems = ref(['1 second', '1 minute', '1 hour', '1 day', '1 week']);
const periodItem = ref(periodItems.value[1]);
const period = computed(() => {
  if (periodItem.value == "1 second") {
    return "1s";
  } else if (periodItem.value == "1 minute") {
    return "1m";
  } else if (periodItem.value == "1 hour") {
    return "1h";
  } else if (periodItem.value == "1 day") {
    return "1d";
  } else if (periodItem.value == "1 week") {
    return "1w";
  }
});


watch(() => [period.value], () => {
  if (statsQuery.value) {
    statsQuery.value.abort();
  }
  statsQuery.value = props.conn.request("stats/world", {
    try: true,
    managed: true,
    persist: true,
    period: period.value
  },
  (reply) => {
    statsQueryResult.value = reply;
  });
});

onMounted(() => {
  statsQuery.value = props.conn.request("stats/world", {
    try: true,
    managed: true,
    persist: true,
    period: period.value
  },
  (reply) => {
    statsQueryResult.value = reply;
  });
});

onUnmounted(() => {
  if (statsQuery.value) {
    statsQuery.value.abort();
  }
})

const groups = computed(() => {
  let grouped = {};

  for (const k in statsQueryResult.value) {
    const elems = k.split(".");
    let group;
    let stat;

    if (elems.length === 2) {
      group = elems[0];
      stat = elems[1];
    } else {
      group = "";
      stat = k;
    }

    if (!grouped[group]) {
      grouped[group] = {};
    }

    grouped[group][stat] = statsQueryResult.value[k];
  }

  return grouped;
});

function name_fmt (name) {
  let str = name.replaceAll("_", " ");
  str = str.charAt(0).toUpperCase() + str.slice(1);
  return str;
};

const group_css = (index) => `stats-group stats-group-color-${index % 2}`;

</script>

<style scoped>

div.top-margin {
  margin-top: 4px;
}

span.stats-group-name {
  font-weight: bold;
  padding-left: 4px;
}

div.stats-group-stats {
  display: flex;
  flex-flow: row wrap;
}

div.stats-group {
  display: flex;
  background-color: var(--panel-bg);
  border-color: var(--panel-header-bg);
  border-style: solid;
  border-width: 1px;
  border-color: var(--border);
  border-left-width: 8px;
  border-radius: var(--border-radius-medium);
  padding-top: 8px;
  padding-left: 4px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  color: var(--primary-text);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

div.stats-group-color-0 {
  border-left-color: var(--dark-green);
}

div.stats-group-color-1 {
  border-left-color: var(--darker-green);
}

div.world-stats {
  margin-top: 8px;
  height: calc(100% - 44px);
  overflow: auto;
}

</style>
