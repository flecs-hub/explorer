<template>
  <div id="pane-inspector">
    <edit-tabs :items='items' v-model:active_item="appParams.inspector_tab" padding="0px;">
      <template v-slot:Inspect>
        <entity-inspector-container
          :path="path"
          :entityQueryResult="entityQueryResult" 
          :disabled="isDisabled"
          :loading="loading"
          @disable="onDisable"
          @delete="onDelete"
          @close="onClose">

          <template v-slot:header>
            <div class="component-filter" v-if="entityQueryResult">
              <search-box v-model="componentFilter"></search-box>
            </div>
          </template>

          <template v-slot:content>
            <entity-inspector-components
              :conn="conn"
              :path="path"
              :entityQueryResult="entityQueryResult"
              :isScript="isScript"
              :entityModules="entityModules"
              :filter="componentFilter"
              v-model:loading="loading"
              @selectEntity="onSelectEntity"
              @removeComponent="onRemoveComponent"
              v-if="entityQueryResult">
            </entity-inspector-components>

            <div class="pane-inspector-actions" v-if="entityQueryResult">
              <button @click="inspectQuery" v-if="isQuery"><icon src="search"></icon>&nbsp;&nbsp;Inspect Query</button>
              <entity-inspector-add-component @submit="onAddComponent">
              </entity-inspector-add-component>
              <button @click="onAddScript" v-if="!isScript"><icon src="symbol-namespace"></icon>&nbsp;&nbsp;Add Script</button>
            </div>
          </template>
        </entity-inspector-container>
      </template>
      <template v-slot:Script>
        <entity-inspector-container
          :path="path"
          :entityQueryResult="entityQueryResult" 
          :disabled="isDisabled"
          :loading="loading"
          padding="padding-left: 0px; padding-right: 0px;"
          @disable="onDisable"
          @delete="onDelete"
          @close="onClose">
          <template v-slot:content>
            <flecs-script
              :conn="conn"
              :script="path"
              v-if="entityQueryResult && isScript"
              @onChange="onCodeChange"
              @onUpdate="onScriptUpdate">
            </flecs-script>
          </template>
        </entity-inspector-container>
      </template>
      <template v-slot:Query v-if="isQuery">
        <entity-inspector-container
          :path="path"
          :entityQueryResult="entityQueryResult" 
          :disabled="isDisabled"
          :loading="loading"
          @disable="onDisable"
          @delete="onDelete"
          @close="onClose">
          <template v-slot:content>
            <query-inspect :query="path" :conn="conn"></query-inspect>
          </template>
        </entity-inspector-container>
      </template>
      <template v-slot:Matches>
        <entity-inspector-container
          :path="path"
          :entityQueryResult="entityQueryResult" 
          :disabled="isDisabled"
          :loading="loading"
          @disable="onDisable"
          @delete="onDelete"
          @close="onClose">

          <template v-slot:content>
            <entity-inspector-matched-by
              :entityQueryResult="entityQueryResult"
              @selectEntity="onSelectEntity"
              v-if="entityQueryResult">
            </entity-inspector-matched-by>
          </template>
        </entity-inspector-container>
      </template>
      <template v-slot:References>
        <entity-inspector-container
          :path="path"
          :entityQueryResult="entityQueryResult" 
          :disabled="isDisabled"
          :loading="loading"
          @disable="onDisable"
          @delete="onDelete"
          @close="onClose">

          <template v-slot:content>
            <entity-inspector-refs
              :conn="conn"
              :path="path"
              :entityQueryResult="entityQueryResult"
              @selectEntity="onSelectEntity"
              v-if="entityQueryResult">
            </entity-inspector-refs>
          </template>
        </entity-inspector-container>
      </template>
      <template v-slot:Alerts>
        <entity-inspector-container
          :path="path"
          :entityQueryResult="entityQueryResult" 
          :disabled="isDisabled"
          :loading="loading"
          @disable="onDisable"
          @delete="onDelete"
          @close="onClose">
          <template v-slot:content>
            <entity-inspector-alerts
              :conn="conn"
              :path="path"
              :entityQueryResult="entityQueryResult">
            </entity-inspector-alerts>
          </template>
        </entity-inspector-container>
      </template>
    </edit-tabs>
  </div>
</template>

<script>
export default { name: "entity-inspector" }
</script>

<script setup>
import { defineProps, defineEmits, defineModel, computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';

const emit = defineEmits(["abort", "scriptOpen", "queryOpen","selectEntity", "close", "onCodeChange"]);

const props = defineProps({
  conn: {type: Object, required: false},
  path: {type: String, required: false}
});

const appParams = defineModel("app_params");

const entityQuery = ref();
const entityQueryResult = ref();

const entityModules = ref([]);
const entityLabel = ref();
const entityBrief = ref();
const entityId = ref();
const isDisabled = ref(false);
const isScript = ref(false);
const isQuery = ref(false);
const componentFilter = ref();
const loading = ref(true);
const firstRequest = ref(true);
const scriptChanged = ref(false);

const inspectorMode = computed(() => {
  return appParams.value.inspector_tab;
});

const path = computed(() => {
  if (appParams.value) {
    return appParams.value.path;
  } else {
    return undefined;
  }
});

const items = computed(() => {
  let result = [];

  result.push({
    label: "Inspect",
    value: "Inspect",
    canClose: false
  });

  if (isScript.value || inspectorMode.value == "Script") {
    result.push({
      label: "Script",
      value: "Script",
      canClose: false,
      changed: scriptChanged.value
    });
  }

  if (isQuery.value) {
    result.push({
      label: "Query",
      value: "Query",
      canClose: false
    });
  }

  result.push({
    label: "Matches",
    value: "Matches",
    canClose: false
  });

  result.push({
    label: "References",
    value: "References",
    canClose: false
  });

  result.push({
    label: "Alerts",
    value: "Alerts",
    canClose: false
  });

  return result;
});

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

  loading.value = true;

  if (lastQuery) {
    lastQuery.abort();
    if (entityQueryResult.value && entityQueryResult.value.name) {
      entityQueryResult.value.name = undefined;
    }
  }

  if (props.path) {
    entityQuery.value = 
      props.conn.entity(props.path,
        {
          try: true, 
          managed: true,
          values: true,
          entity_id: true,
          full_paths: true, 
          type_info: true,
          private: true,
          inherited: true,
          matches: inspectorMode.value == "Matches",
          refs: inspectorMode.value == "References" ? "*" : undefined,
          alerts: inspectorMode.value == "More"
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

          // Extract whether entity is a query
          isQuery.value = (reply.tags != undefined) && 
            reply.tags.indexOf("flecs.core.Query") != -1;

          // If this is the first time we request the entity, check if the
          // inspector tab is set to something valid.
          if (firstRequest.value) {
            if (!isScript.value && appParams.value.inspector_tab == "Script") {
              appParams.value.inspector_tab = "Inspect";
            }

            if (!isQuery.value && appParams.value.inspector_tab == "Query") {
              appParams.value.inspector_tab = "Inspect";
            }
          }

          firstRequest.value = false;

          if (!isScript.value && inspectorMode.value == "Script") {
            // Waiting for script component to get added, so don't hide the
            // loading indicator.
          } else {
            loading.value = false;
          }

          entityModules.value.length = 0;
          for (let key in moduleMap) {
            entityModules.value.push({name: key, value: moduleMap[key]});
          }

          entityModules.value.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        }, 
        (err) => {
          loading.value = true;
          entityQueryResult.value = undefined;
        }, 
        (request) => {
          loading.value = true;
        });
  }
}

function inspectQuery() {
  emit("queryOpen");
}

function onScriptUpdate(evt) {
  scriptChanged.value = evt.changed;
}

function onCodeChange(code) {
  emit("onCodeChange", code);
}

function onAddComponent(component) {
  props.conn.add(props.path, component, (reply) => {
    entityQuery.value.now();
  });
  loading.value = true;
}

function onAddScript() {
  loading.value = true;
  appParams.value.inspector_tab = "Script";
  props.conn.add(props.path, "flecs.script.Script", (reply) => {
    entityQuery.value.now();
  });
}

function onRemoveComponent(component) {
  loading.value = true;
  props.conn.remove(props.path, component, (reply) => {
    entityQuery.value.now();
  });
}

function onSelectEntity(evt) {
  appParams.value.inspector_tab = "Inspect";
  emit("selectEntity", evt);
}

function onDisable() {
  if (isDisabled.value) {
    props.conn.enable(props.path, undefined, (reply) => {
      entityQuery.value.now();
    });
  } else {
    props.conn.disable(props.path, undefined, (reply) => {
      entityQuery.value.now();
    });
  }
  loading.value = true;
}

function onDelete() {
  props.conn.delete(props.path);
  loading.value = true;
  emit("selectEntity", undefined);
}

function onClose() {
  appParams.value.inspector_tab = "Inspect";
  isScript.value = false;
  isQuery.value = false;
  emit("close");
}

watch(() => [props.path, inspectorMode.value], () => {  
  updateQuery();
});

watch(() => [props.path], () => {
  firstRequest.value = true;
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

</script>

<style scoped>

#pane-inspector {
  height: 100%;
}

div.component-filter {
  padding-top: 4px;
}

div.pane-inspector-tab {
  padding-left: 4px;
  padding-right: 4px;
  padding-top: 4px;
  height: inherit;
}

div.pane-inspector-actions * {
  margin-bottom: 8px;
}

button {
  width: 100%;
}

</style>
