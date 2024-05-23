<template>
  <div class="entity-inspector">
    <template v-if="entityQueryResult">
      <entity-path :path="entityQueryResult.parent"></entity-path>
      <span class="entity-inspector-name">{{ entityQueryResult.name }}</span>
      <span class="entity-inspector-horizontal-line"></span>
      <div class="entity-inspector-modules">
        <entity-inspector-module 
          :type_info="entityQueryResult.type_info"
          :item="m" v-for="m in entityModules">
        </entity-inspector-module>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector" }
</script>

<script setup>
import { watch, onUnmounted, ref, defineProps, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  path: {type: String, required: false}
});

const entityQuery = ref();
const entityQueryResult = ref();
const entityModules = ref([]);

function splitPair(id) {
  let moduleName, _;
  const pairElems = id.split(",");

  let first = pairElems[0];
  first = first.slice(1, first.length);
  [moduleName, first] = splitIdentifier(first);

  let second = pairElems[1];
  second = second.slice(0, second.length - 1);
  [_, second] = splitIdentifier(second);

  return [moduleName, `(${first}, ${second})`]
}

function splitIdentifier(id) {
  if (id[0] == '(') {
    return splitPair(id);
  }

  const elems = id.split(".");
  let lastElem = elems.pop();
  return [elems.join("."), lastElem];
}

function getModule(moduleMap, name) {
  let module = moduleMap[name];
  if (!module) {
    module = moduleMap[name] = {
      tags: [],
      pairs: [],
      components: []
    };
  }
  return module;
}

watch(() => props.path, () => {
  if (entityQuery.value) {
    entityQuery.value.abort();
    entityQueryResult.value = undefined;
  }

  if (props.path) {
    entityQuery.value = 
      props.conn.entity(props.path, 
        {try: true, poll_interval: 1000, values: true, full_paths: true, type_info: true}, 
        (reply) => {
          entityQueryResult.value = reply;

          const moduleMap = {};
          if (reply.tags) {
            for (let tag of reply.tags) {
              let [moduleName, name] = splitIdentifier(tag);
              let module = getModule(moduleMap, moduleName);
              module.tags.push({name: name, fullName: tag});
            }
          }

          if (reply.pairs) {
            for (let first in reply.pairs) {
              let [moduleName, name] = splitIdentifier(first);
              let module = getModule(moduleMap, moduleName);
              module.pairs.push({name: name, fullName: first, value: reply.pairs[first]});
            }
          }

          if (reply.components) {
            for (let id in reply.components) {
              let [moduleName, name] = splitIdentifier(id);
              let module = getModule(moduleMap, moduleName);
              module.components.push({name: name, fullName: id, value: reply.components[id]});
            }
          }

          entityModules.value.length = 0;
          for (let key in moduleMap) {
            entityModules.value.push({name: key, value: moduleMap[key]});
          }

          entityModules.value.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        });
  }
});

onUnmounted(() => {
  if (entityQuery.value) {
    entityQuery.value.abort();
  }
});

</script>

<style scoped>
div.entity-inspector {
  display: grid;
  padding: 8px;
}

span.entity-inspector-name {
  font-size: 1.1em;
  font-weight: 300;
  color: var(--primary-text);
  margin-top: 0.25em;
}

span.entity-inspector-horizontal-line {
  width: 100%;
  height: 1px;
  margin-top: 6px;
  margin-bottom: 6px;
  background-color: white;
  opacity: 0.2;
}

div.entity-inspector-modules {
  padding-top: 4px;
}

</style>
