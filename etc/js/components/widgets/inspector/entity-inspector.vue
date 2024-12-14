<template>
  <div class="entity-inspector">
    <template v-if="entityQueryResult">
      <div class="entity-inspector-icon-expand">
        <expand-button 
          :expand="expand" 
          :rotation="180"
          @click="toggle">
        </expand-button>
      </div>
      <div class="entity-inspector-icon-close">
        <icon-button
          src="close"
          @click="onClose">
        </icon-button>
      </div>
      <entity-path :path="entityQueryResult.parent"></entity-path>
      <template v-if="entityLabel">
        <span class="entity-inspector-name">{{ entityLabel }}
          <span class="entity-inspector-id">{{ entityId }}</span>
        </span>
        <template v-if="expand">
          <span class="entity-inspector-actual-name">{{ entityQueryResult.name }}</span>
        </template>
      </template>
      <template v-else>
        <span class="entity-inspector-name">{{ entityQueryResult.name }}
          <span class="entity-inspector-id">{{ entityId }}</span>
        </span>
      </template>

      <template v-if="expand">
        <div class="entity-inspector-brief" v-if="entityBrief">
          <span>{{ entityBrief }}</span>
        </div>
        <div class="entity-inspector-buttons">
          <button @click="onDisable" v-if="!isDisabled" class="enable-button">
            Disable
          </button>
          <button @click="onEnable" v-if="isDisabled" class="enable-button">
            Enable
          </button>
          <button @click="onDelete">
            <icon src="trash"></icon>
          </button>
        </div>
      </template>

      <hr/>

      <dropdown 
        :items="inspectorModes"
        v-model:active_item="inspectorMode">
      </dropdown>

      <div class="entity-inspector-content">
        <template v-if="inspectorMode == 'Components'">
          <entity-inspector-components
            :conn="conn"
            :path="path"
            :entityQueryResult="entityQueryResult"
            :isScript="isScript"
            :entityModules="entityModules"
            @scriptOpen="onOpenScript">
          </entity-inspector-components>
        </template>
        <template v-else-if="inspectorMode == 'Matched by'">
          <entity-inspector-matched-by
            :conn="conn"
            :path="path"
            :entityQueryResult="entityQueryResult">
          </entity-inspector-matched-by>
        </template>
        <template v-else-if="inspectorMode == 'Referenced by'">
          <entity-inspector-refs
            :conn="conn"
            :path="path"
            :entityQueryResult="entityQueryResult">
          </entity-inspector-refs>
        </template>
        <template v-else-if="inspectorMode == 'Alerts'">
          <entity-inspector-alerts
            :conn="conn"
            :path="path"
            :entityQueryResult="entityQueryResult">
          </entity-inspector-alerts>
        </template>
        <template v-else-if="inspectorMode == 'Script AST'">
          <entity-inspector-script-ast
            :conn="conn"
            :path="path">
          </entity-inspector-script-ast>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector" }
</script>

<script setup>
import { watch, onMounted, onUnmounted, ref, defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  path: {type: String, required: false}
});

const emit = defineEmits(["abort", "scriptOpen"]);

const entityQuery = ref();
const entityQueryResult = ref();
const entityModules = ref([]);
const entityLabel = ref();
const entityBrief = ref();
const entityId = ref();
const expand = ref(false);
const isDisabled = ref(false);
const isScript = ref(false);
const inspectorMode = defineModel("inspector_mode");

const inspectorModes = computed(() => {
  let modes = ['Components', 'Matched by', 'Referenced by', 'Alerts'];
  if (isScript.value) {
    modes.push("Script AST");
  }
  return modes;
})

function splitPair(id) {
  let moduleName, _;
  const pairElems = id.split(",");

  let first = pairElems[0];
  first = first.slice(1, first.length);
  [moduleName, first] = splitIdentifier(first);

  let second = pairElems[1];
  second = second.slice(0, second.length - 1);
  [_, second] = splitIdentifier(second);

  return [moduleName, [first, second]]
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
      tags: {},
      pairs: {},
      components: {}
    };
  }
  return module;
}

function loadTypeFromReply(moduleMap, reply, base) {
  if (reply.tags) {
    for (let tag of reply.tags) {
      let [moduleName, name] = splitIdentifier(tag);
      let module = getModule(moduleMap, moduleName);
      module.tags[name] = {name: name, fullName: tag, base: base};
    }
  }

  if (reply.pairs) {
    for (let first in reply.pairs) {
      let [moduleName, name] = splitIdentifier(first);
      let module = getModule(moduleMap, moduleName);
      module.pairs[name] = {name: name, fullName: first, value: reply.pairs[first], base: base};
    }
  }

  if (reply.components) {
    for (let id in reply.components) {
      let [moduleName, name] = splitIdentifier(id);
      let module = getModule(moduleMap, moduleName);
      module.components[name] = {name: name, fullName: id, value: reply.components[id], base: base};
    }
  }
}

function updateQuery() {
  const lastQuery = entityQuery.value;
  entityQuery.value = undefined;

  if (lastQuery) {
    lastQuery.abort();
    entityQueryResult.value = undefined;
  }

  if (props.path) {
    entityQuery.value = 
      props.conn.entity(props.path,
        {
          try: true, 
          managed: true,
          values: inspectorMode.value == "Components",
          entity_id: true,
          full_paths: true, 
          type_info: true,
          private: true,
          inherited: true,
          matches: inspectorMode.value == "Matched by",
          refs: inspectorMode.value == "Referenced by" ? "*" : undefined,
          alerts: inspectorMode.value == "Alerts"
        }, 
        (reply) => {
          entityQueryResult.value = reply;

          const moduleMap = {};

          if (reply.inherited) {
            for (let base in reply.inherited) {
              const baseData = reply.inherited[base];
              loadTypeFromReply(moduleMap, baseData, base);

              if (baseData.type_info) {
                for (let typeName in baseData.type_info) {
                  if (!reply.type_info) {
                    reply.type_info = {};
                  }
                  if (!reply.type_info[typeName]) {
                    reply.type_info[typeName] = baseData.type_info[typeName];
                  }
                }
              }
            }
          }

          loadTypeFromReply(moduleMap, reply);

          entityId.value = '#' + reply.id;

          // Extract entity label
          entityLabel.value = undefined;
          if (reply.components) {
            let docName = reply.components[
              "(flecs.doc.Description,flecs.core.Name)"];
            if (docName) {
              entityLabel.value = docName.value;
            }
          }

          // Extract entity brief
          entityBrief.value = undefined;
          if (reply.components) {
            let docBrief = reply.components[
              "(flecs.doc.Description,flecs.doc.Brief)"];
            if (docBrief) {
              entityBrief.value = docBrief.value;
            }
          }

          // Extract whether entity is disabled
          isDisabled.value = false;
          if (reply.tags) {
            for (let tag of reply.tags) {
              if (tag === "flecs.core.Disabled") {
                isDisabled.value = true;
              }
            }
          }

          // Extract whether entity is a script
          isScript.value = (reply.components != undefined) && 
            reply.components.hasOwnProperty("flecs.script.Script");

          entityModules.value.length = 0;
          for (let key in moduleMap) {
            entityModules.value.push({name: key, value: moduleMap[key]});
          }

          entityModules.value.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        }, (err) => {}, (request) => {
          if (entityQuery.value == request) {
            emit("abort", props.path);
          }
        });
  }
}

function toggle() {
  expand.value = !expand.value;
}

function onClose() {
  emit("abort", props.path);
}

function onEnable() {
  props.conn.enable(props.path);
}

function onDisable() {
  props.conn.disable(props.path);
}

function onDelete() {
  if (entityQuery.value) {
    entityQuery.value.abort();
  }

  props.conn.delete(props.path);
}

watch(() => [props.path, inspectorMode.value], () => {
  updateQuery();
});

onMounted(() => {
  if (props.path) {
    updateQuery();
  }
});

onUnmounted(() => {
  if (entityQuery.value) {
    const q = entityQuery.value;
    entityQuery.value = undefined;
    q.abort();
  }
});

function onOpenScript() {
  emit("scriptOpen", props);
}

</script>

<style scoped>
div.entity-inspector {
  position: relative;
  display: grid;
  grid-template-rows: 1rem 2rem 1rem 2rem calc(100% - 6rem);
  padding: 8px;
  height: calc(100% - 1.0rem);
}

span.entity-inspector-id {
  font-size: 0.9rem;
  color: var(--secondary-text);
}

span.entity-inspector-name {
  font-size: 1.1em;
  font-weight: 300;
  color: var(--primary-text);
  margin-top: 0.25em;
}

span.entity-inspector-actual-name {
  font-size: 1.0em;
  font-weight: 300;
  color: var(--secondary-text);
  margin-top: 0.25em;
}

div.entity-inspector-brief {
  padding-top: 4px;
  color: var(--secondary-text);
}

div.entity-inspector-modules {
  padding-top: 4px;
}

div.entity-inspector-actions {
  display: flex;
  flex-direction: column;
  padding-left: 1rem;
  padding-right: 1.5rem;
}

div.entity-inspector-buttons {
  display: flex;
  flex-direction: row;
  margin-top: 8px;
  margin-bottom: 4px;
}

div.entity-inspector-buttons button {
  background-color: var(--bg-content-hover);
  margin-right: 8px;
  color: var(--primary-text);
  font-weight: normal;
}

button.enable-button {
  min-width: 100px;
}

</style>

<style>
div.entity-inspector-icon-expand {
  position: absolute;
  top: 8px;
  right: 32px;
}

div.entity-inspector-icon-close {
  position: absolute;
  top: 8px;
  right: 8px;
}

div.entity-inspector-button, button.entity-inspector-button, input.entity-inspector-button {
  padding: 6px;
  text-align: center;
  border-radius: var(--border-radius-medium);
  border-style: solid;
  border-width: 1px;
  border-color: rgba(0,0,0,0);
  background-color: var(--bg-button);
  color: var(--secondary-text);
  font-size: 1rem;
  margin-bottom: 10px;
  cursor: pointer;
}

button.entity-inspector-button {
  width: 100%;
}

div.entity-inspector-button:hover, button.entity-inspector-button:hover {
  background-color: var(--bg-button-hover);
}

div.entity-inspector-content {
  height: calc(100% - 1rem);
  overflow-y: auto;
  margin-top: 8px;
}

</style>
