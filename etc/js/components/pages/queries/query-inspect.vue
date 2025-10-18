<template>
  <div id="query-inspect">
    <template v-if="is_set">
      <template v-if="query.use_name">
        <div class="query-inspect-header">
          <div class="query-inspect-icon">
            <icon :src="query_icon" :opacity="0.5" v-if="query_icon"></icon>
          </div>
          <div class="query-inspect-content">
            <entity-path :path="query_parent"></entity-path>
            <span class="query-inspect-name">{{ query_name }}</span>
          </div>
        </div>
      </template>
      <p>expression</p>
      <query-expr :result="result"></query-expr>
      <p>query plan</p>
      <query-plan :result="result"></query-plan>
      <p>query profile</p>
      <query-profile :result="result"></query-profile>
    </template>
  </div>
</template>

<script>
export default { name: "query-inspect" }
</script>

<script setup>
import { defineProps, computed, ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  query: {type: Object, required: true},
  result: {type: Object, required: false},
  conn: {type: Object, required: false}
});

const localResult = ref({reply: []});
const localQuery = ref(null);

const result = computed(() => {
  if (props.result) {
    return props.result;
  }

  return localResult.value;
});

const is_set = computed(() => {
  if (props.query.use_name) {
    if (props.query.name) {
      return true;
    }
    return false;
  } else {
    return true;
  }
});

const query_parent = computed(() => {
  if (is_set.value) {
    if (props.query.use_name) {
      let elems = props.query.name.split(".");
      elems.pop();
      return elems.join(".");
    }
  }

  return "";
});

const query_name = computed(() => {
  if (is_set.value) {
    if (props.query.use_name) {
      let elems = props.query.name.split(".");
      let elem = elems.pop();
      return elem;
    }
  }

  return "";
});

const query_icon = computed(() => {
  return explorer.queryIcon(props.query.kind)
});

const doRequest = () => {
  if (localQuery.value) {
    localQuery.value.abort();
  }

  localQuery.value = props.conn.queryName(props.query, {
    try: true,
    rows: true, 
    full_paths: true,
    query_info: true, 
    field_info: true, 
    query_plan: true, 
    query_profile: true,
    managed: true,
    persist: true
  }, (reply) => {
    localResult.value = reply;
  }, (err) => {
    // localResult.value = err;
  });
};

watch(() => props.query, () => {
  doRequest();
});

onMounted(() => {
  if (!props.result) {
    if (!props.conn) {
      console.error("No flecs connection provided for query-inspect");
      return;
    }

    doRequest();
  }
});

onUnmounted(() => {
  if (localQuery.value) {
    localQuery.value.abort();
  }
});

</script>

<style scoped>
#query-inspect {
  height: calc(100% - 0.5rem);
  overflow-y: auto;
  padding-top: 0.5rem;
}

#query-inspect p {
  margin: 0px;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 1rem;
}

div.query-inspect-header {
  display: grid;
  grid-template-columns: 28px 1fr;
  grid-template-rows: 2;
  margin-bottom: 2rem;
}

div.query-inspect-content {
  display: grid;
  grid-column: 2;
  font-size: 1rem;
}

div.query-inspect-icon {
  display: grid;
  grid-column: 1;
}

span.query-inspect-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--primary-text);
}

</style>
