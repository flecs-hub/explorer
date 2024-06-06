<template>
  <div class="key noselect" @click="toggle">
    <template v-if="typeof value === 'object'">
      <expand-button
        :expand="expand">
      </expand-button>
    </template>
    {{  keyname }}
  </div>
  <div class="value noselect" @click="toggle">
    <template v-if="typeof value === 'object'">
      <entity-inspector-preview
        :value="value"
        :type="type"
        :expand="expand"
        :readonly="readonly"
        @setValue="(evt) => setValue(evt, keyname)">
      </entity-inspector-preview>
      <template v-if="expand">
        <entity-inspector-value
          :value="value"
          :type="type"
          :readonly="readonly"
          @setValue="(evt) => setValue(evt, keyname)">
        </entity-inspector-value>
      </template>
    </template>
    <template v-else>
      <entity-inspector-field
        :value="value"
        :type="type"
        :readonly="readonly"
        @setValue="(evt) => setValue(evt, keyname)">
      </entity-inspector-field>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-kv" }
</script>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  keyname: {type: String, required: true},
  value: {required: true},
  type: {type: Object, required: true},
  readonly: {type: Boolean, required: true},
});

const emit = defineEmits(["setValue"]);
const expand = ref(false);

function toggle() {
  expand.value = !expand.value;
}

function setValue(evt, key) {
  if (evt.hasOwnProperty("key")) {
    emit('setValue', { key: `${key}.${evt.key}`, value: evt.value });
  } else {
    emit('setValue', { key: key, value: evt.value });
  }
}

</script>

<style scoped>

div.key {
  grid-column: 1;
  text-align: right;
  padding: 4px;
  padding-bottom: 0px;
  padding-right: 8px;
  color: var(--secondary-text);
  cursor: pointer;
  min-height: 28px;
}

div.value {
  grid-column: 2;
  cursor: pointer;
}

</style>
