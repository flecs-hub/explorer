<template>
  <div v-if="showChevron" class="chevron noselect" @click.stop="toggle">
    <template v-if="typeof value === 'object' && value !== null">
      <expand-button
        :expand="expand">
      </expand-button>
    </template>
  </div>
  <div class="key noselect" :class="{'no-chevron': !showChevron, 'complex': isComplex}" @click.stop="toggle">
    {{  keyname }}
  </div>
  <div class="value noselect" :class="{'no-chevron': !showChevron}" @click.stop="toggle">
    <template v-if="typeof value === 'object'">
      <entity-inspector-preview
        :value="value"
        :type="type"
        :expand="expand"
        :readonly="readonly"
        @setValue="(evt) => setValue(evt, keyname)"
        @selectEntity="(evt) => emit('selectEntity', evt)">
      </entity-inspector-preview>
    </template>
    <template v-else>
      <entity-inspector-field
        :value="value"
        :type="type"
        :readonly="readonly"
        @setValue="(evt) => setValue(evt, keyname)"
        @selectEntity="(evt) => emit('selectEntity', evt)">
      </entity-inspector-field>
    </template>
  </div>
  <template v-if="typeof value === 'object' && expand">
    <div class="nested-value">
      <entity-inspector-value
        :path="path"
        :value="value"
        :type="type"
        :readonly="readonly"
        @setValue="(evt) => setValue(evt, keyname)"
        @selectEntity="(evt) => emit('selectEntity', evt)">
      </entity-inspector-value>
    </div>
  </template>
</template>

<script>
export default { name: "entity-inspector-kv" }
</script>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted } from 'vue';

const props = defineProps({
  path: {type: String, required: true},
  keyname: {type: String, required: true},
  value: {required: true},
  type: {type: Object, required: true},
  readonly: {type: Boolean, required: true},
  showChevron: {type: Boolean, required: false, default: true},
});

const emit = defineEmits(["setValue", "selectEntity"]);
const expand = ref(false);
const isComplex = computed(() => typeof props.value === 'object' && props.value !== null);

function toggle() {
  expand.value = !expand.value;
  localStorage.setItem(`${props.path}.expand`, String(expand.value));
}

function setValue(evt, key) {
  if (evt.hasOwnProperty("key")) {
    if (evt.key.startsWith('[')) {
      emit('setValue', { key: `${key}${evt.key}`, value: evt.value });
    } else {
      emit('setValue', { key: `${key}.${evt.key}`, value: evt.value });
    }
  } else {
    emit('setValue', { key: key, value: evt.value });
  }
}

onMounted(() => {
  expand.value = localStorage.getItem(`${props.path}.expand`) === "true";
});

</script>

<style scoped>

div.chevron {
  grid-column: 1;
  width: 16px;
  padding-top: 4px;
  cursor: pointer;
}

div.key {
  grid-column: 2;
  text-align: right;
  padding: 4px;
  padding-bottom: 0px;
  padding-right: 8px;
  color: var(--secondary-text);
  cursor: pointer;
  min-height: 28px;
}

div.key.no-chevron {
  grid-column: 1;
}

div.key.complex {
  text-align: left;
  padding-left: 6px;
}

div.value {
  grid-column: 3;
  cursor: pointer;
}

div.value.no-chevron {
  grid-column: 2;
}

div.nested-value {
  grid-column: 1 / -1;
  padding-left: 5px;
  margin-left: 7px; /* Align with chevron */
  border-left: 1px solid var(--steel-650);
}

</style>
