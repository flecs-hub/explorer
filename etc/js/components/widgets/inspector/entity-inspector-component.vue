<template>
  <div :class="componentCss">
    <div class="component-header noselect" @click="toggle">
      <template v-if="value || (targets && !singleTarget)">
        <div class="chevron-icon">
          <expand-button
            :size="16" 
            :expand="expand">
          </expand-button>
        </div>
      </template>

      <div class="component-icon">
        <icon :src="icon_src" :size="16" :opacity="0.5"></icon>
      </div>

      <div :class="componentNameCss">
        <template v-if="nameIsPair">
          {{ name[0] }}&nbsp;<icon src="arrow-right" 
            :opacity="0.5" 
            :size="16">
          </icon>&nbsp;{{ name[1] }}
        </template>
        <template v-else>
          <template v-if="singleTarget">
            {{ name }}&nbsp;<icon src="arrow-right" 
              :opacity="0.5" 
              :size="16">
            </icon>&nbsp;<span>{{ shortenEntity(targets) }}</span>
          </template>
          <template v-else>
            {{ name }}
          </template>
        </template>
      </div>

      <div class="component-preview">
        <entity-inspector-preview
          :value="value"
          :type="type"
          :targets="targets"
          :expand="expand"
          :readonly="isReadonly"
          @setValue="setValue">
        </entity-inspector-preview>

        <template v-if="base">
          <template v-if="!value">
            <span class="component-base-name">{{ shortenEntity( base ) }}</span>
          </template>
          <template v-else-if="expand">
            <span class="component-base-name">{{ shortenEntity( base ) }}</span>
          </template>
        </template>
      </div>

      <div class="component-delete-icon" v-if="!base && (!targets || singleTarget)">
        <icon-button
          src="trash" 
          @click.stop="removeComponent">
        </icon-button>
      </div>
    </div>

    <template v-if="expand && value">
      <div class="component-value">
        <entity-inspector-value
          :value="value"
          :type="type"
          :readonly="isReadonly"
          @setValue="setValue">
        </entity-inspector-value>
      </div>
    </template>

    <template v-if="expand && (targets && !singleTarget)">
      <div class="component-value">
        <div class="component-targets">
          <template v-for="target in targets">
            <div class="component-target-icon">
              <icon src="arrow-right" 
                :opacity="0.5" 
                :size="16">
              </icon>
            </div>
            <div :class="targetCss">
              {{ shortenEntity(target) }}
            </div>
            <template v-if="!base">
              <div class="component-target-remove">
                <icon-button 
                  src="trash" 
                  @click.stop="removeTarget(target)">
                </icon-button>
              </div>
            </template>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-component" }
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  entity: {type: String, required: true},
  name: {required: true},
  fullName: {type: String, required: true},
  icon_src: {type: String, required: true},
  value: {type: Object, required: false},
  type: {required: false},
  targets: {required: false},
  base: {type: String, required: false}
});

const remoteState = ref("alive");
const expand = ref(false);

const componentCss = computed(() => {
  let classes = ["component"];
  if (expand.value) {
    classes.push("component-expand");
  }
  return classes;
});

const componentNameCss = computed(() => {
  let classes = ["component-name"];
  if (props.base) {
    classes.push("component-name-inherited");
  }
  if (remoteState.value == "pendingDelete") {
    classes.push("component-name-pending-delete");
  }
  return classes;
});

const isReadonly = computed(() => {
  return props.base !== undefined;
});

const fullName = computed(() => {
  if (singleTarget.value) {
    return `(${props.fullName}, ${props.targets})`;
  } else {
    return props.fullName;
  }
});

const targetCss = computed(() => {
  let classes = ["component-target-name"];
  if (props.base) {
    classes.push("component-name-inherited");
  }
  return classes;
});

function toggle() {
  if (props.value || props.targets && !singleTarget.value) {
    expand.value = !expand.value;
  }
}

const singleTarget = computed(() => {
  console.log(props.name + ":");
  console.log(props.targets);
  return props.targets && !Array.isArray(props.targets);
});

const nameIsPair = computed(() => {
  return Array.isArray(props.name);
});

function shortenEntity(entity) {
  return explorer.shortenEntity(entity);
}

function removeComponent() {
  props.conn.remove(props.entity, fullName.value);
  remoteState.value = "pendingDelete";
}

function removeTarget(target) {
  if (!singleTarget.value && props.targets.length == 2) {
    expand.value = false;
  }
  props.conn.remove(props.entity, `(${props.fullName}, ${target})`);
}

function setValue(evt) {
  let payload = {};
  if (evt.key) {
    payload[evt.key] = evt.value;
  } else {
    payload = evt.value;
  }
  props.conn.set(props.entity, props.fullName, payload);
}

</script>

<style scoped>

div.component {
  margin-bottom: 0px;
  transition: margin-bottom 0.1s ease-out;
}

div.component-expand {
  margin-bottom: 8px;
}

div.component-header {
  display: grid;
  grid-template-columns: 16px 16px auto 1fr 16px;
  gap: 4px;
  min-height: 28px;
  padding: 4px;
  padding-left: 0px;
  padding-right: 0px;
  cursor: pointer;
  border-radius: var(--border-radius-medium);
  background-color: rgba(0,0,0,0);
  color: var(--primary-text);
  transition: background-color 0.1s ease-out;
}

div.component-header:hover {
  background-color: var(--bg-content-hover);
}

div.component-preview {
  grid-column: 4;
  text-align: right;
  padding-left: 4px;
}

div.component-delete-icon {
  text-align: right;
  grid-column: 5;
  padding-top: 4px;
}

div.chevron-icon {
  grid-column: 1;
  padding-top: 4px;
}

div.component-icon {
  grid-column: 2;
  padding-top: 4px;
}

div.component-name {
  grid-column: 3;
  padding-left: 2px;
  padding-top: 4px;
}

div.component-name-inherited {
  color: var(--prefab-color);
}

div.component-name-pending-delete {
  color: var(--yellow);
}

div.component-value {
  padding-left: 20px;
  padding-right: 16px;
  overflow-x: auto;
}

div.component-base {
  padding-right: 16px;
  text-align: right;
  color: var(--secondary-text);
}

span.component-base-name {
  color: var(--secondary-text);
  opacity: 0.7;
}

div.component-targets {
  display: grid;
  gap: 4px;
  grid-template-columns: 16px 1fr 16px;
  color: var(--primary-text);
  margin-bottom: 8px;
}

div.component-target-icon {
  grid-column: 1;
  margin-top: 8px;
}

div.component-target-name {
  grid-column: 2;
  margin-top: 8px;
}

div.component-target-remove {
  grid-column: 3;
  cursor: pointer;
}

</style>
