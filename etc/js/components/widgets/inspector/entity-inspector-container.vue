<template>
  <div class="entity-inspector-container">
    <template v-if="!path">
      <div class="entity-inspector-no-result">
        <p>No entity selected.</p>
      </div>
    </template>
    <template v-else>
      <div class="entity-inspector-header">
        <entity-path :path="entityParent"></entity-path>
        <div>
          <template v-if="entityLabel">
            <span class="entity-inspector-name">{{ entityLabel }}
              <span class="entity-inspector-id" v-if="showEntityId">{{ entityId }}</span>
            </span>
            <span class="entity-inspector-actual-name">&nbsp;{{ entityName }}</span>
          </template>
          <template v-else>
            <span class="entity-inspector-name">{{ entityName }}
              <span class="entity-inspector-id" v-if="showEntityId">{{ entityId }}</span>
            </span>
          </template>
          <template v-if="entityBrief">
            <div class="entity-inspector-brief">
              <span>{{ entityBrief }}</span>
            </div>
          </template>
        </div>
        <div class="entity-inspector-buttons">
          <icon
            src="loading"
            :opacity="0.5"
            :rotating="true"
            v-if="loading">
          </icon>
          
          <icon-button
            :src="disabledIcon"
            @click.stop="emit('disable')">
          </icon-button>

          <icon-button
            src="trash" 
            @click.stop="emit('delete')">
          </icon-button>

          <icon-button
            src="chrome-close" 
            @click.stop="emit('close')">
          </icon-button>
        </div>

        <div class="entity-inspector-header-header">
          <slot name="header" v-if="entityQueryResult"></slot>
        </div>
      </div>
      <div class="entity-inspector-header-content" :style="padding">
        <slot name="content" v-if="entityQueryResult"></slot>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-container" }
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  path: {type: String, required: false},
  entityQueryResult: {type: Object, required: false},
  disabled: {type: Boolean, required: true},
  loading: {type: Boolean, required: true},
  padding: {type: String, required: false, default: "padding-left: 8px; padding-right: 8px;"}
});

const emit = defineEmits(["disable", "delete", "close"]);

const entityId = computed(() => {
  if (props.entityQueryResult) {
    return '#' + props.entityQueryResult.id;
  }
  return undefined;
});

const disabledIcon = computed(() => {
  return props.disabled ? "circle-large" : "circle-slash";
});

const entityLabel = computed(() => {
  if (props.entityQueryResult && props.entityQueryResult.components) {
    let docName = props.entityQueryResult.components[ 
      "(flecs.doc.Description,flecs.core.Name)"];
    if (docName) {
      return docName.value;
    }
  }

  return undefined;
});

const entityBrief = computed(() => {
  if (props.entityQueryResult && props.entityQueryResult.components) {
    let docBrief = props.entityQueryResult.components[
      "(flecs.doc.Description,flecs.doc.Brief)"];
    if (docBrief) {
      return docBrief.value;
    }
  }
  return undefined;
});

const entityName = computed(() => {
  if (props.entityQueryResult && props.entityQueryResult.name !== undefined) {
    return props.entityQueryResult.name;
  } else {
    return explorer.shortenEntity(props.path)
  }
});

const entityParent = computed(() => {
  if (props.entityQueryResult) {
    return props.entityQueryResult.parent;
  } else {
    return explorer.entityParent(props.path);
  }
});

const showEntityId = computed(() => {
  if (props.entityQueryResult) {
    return entityId.value !== props.entityQueryResult.name;
  } else {
    return false;
  }
});

</script>

<style scoped>
div.entity-inspector-container {
  display: grid;
  grid-template-rows: auto 1fr;
  height: calc(100% - 8px);
  padding-top: 8px;
}

div.entity-inspector-header {
  position: relative;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  padding-left: 8px;
  padding-right: 8px;
}

div.entity-inspector-header-header {
  margin-top: 4px;
}

div.entity-inspector-header-content {
  grid-row: 2;
  height: 100%;
  overflow-y: auto;
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

div.entity-inspector-buttons {
  position: absolute;
  right: 4px;
  top: 4px;
  display: flex;
  flex-direction: row;
}

div.entity-inspector-buttons * {
  margin-left: 4px;
}

div.entity-inspector-no-result {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
  padding-left: 8px;
  padding-right: 8px;
  color: var(--secondary-text);
}

</style>
