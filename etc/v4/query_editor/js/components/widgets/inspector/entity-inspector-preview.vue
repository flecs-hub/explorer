<template>
  <div>
    <template v-if="!expand">
      <template v-if="previewTypeKind === 'vector'">
        <div class="component-preview-vector">
          <div class="component-preview-vector-elem" v-for="(field, key) in value">
            <entity-inspector-field 
              :value="field"
              :type="type[key]"
              :readonly="readonly"
              @setValue="(evt) => setValue(evt, key)">
            </entity-inspector-field>
          </div>
        </div>
      </template>
      <template v-if="previewTypeKind === 'single'">
        <div class="component-preview-single">
          <entity-inspector-field 
            :value="firstProp(value)"
            :type="firstProp(type)"
            :readonly="readonly"
            @setValue="(evt) => setValue(evt, firstKey(type))">
          </entity-inspector-field>
        </div>
      </template>
    </template>
    <template v-if="previewTypeKind === 'rgbColor'">
      <div class="component-preview-color">
        <color-preview
          :value="`rgb(${propBy(value, 0)}, ${propBy(value, 1)}, ${propBy(value, 2)})`">
        </color-preview>
      </div>
    </template>
    <template v-if="previewTypeKind === 'hslColor'">
      <div class="component-preview-color">
        <color-preview
          :value="`hsl(${propBy(value, 0)}, ${propBy(value, 1)}, ${propBy(value, 2)})`">
        </color-preview>
      </div>
    </template>
    <template v-if="previewTypeKind === 'cssColor'">
      <div class="component-preview-color">
        <color-preview
          :value="firstProp(value)">
        </color-preview>
      </div>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-preview" }
</script>

<script setup>

import { defineProps, ref, computed, defineEmits } from 'vue';

const props = defineProps({
  value: {type: Object, required: false},
  type: {type: Object, required: false},
  targets: {required: false},
  expand: {type: Boolean, required: true},
  readonly: {type: Boolean, required: true}
});

const emit = defineEmits(["setValue"]);

const previewTypeKind = computed(() => {
  const type = props.type;
  if (typeof type != "object") {
    return undefined;
  }

  if (Array.isArray(type)) {
    return undefined;
  }

  let propCount = Object.keys(type).length;
  let self = type["@self"];
  if (self !== undefined) {
    propCount --;
  }

  if (self) {
    if (self[0].unit === "flecs.units.Color.Rgb") {
      return "rgbColor";
    } else if (self[0].unit === "flecs.units.Color.Hsl") {
      return "hslColor";
    } else if (self[0].unit === "flecs.units.Color.Css") {
      return "cssColor";
    }
  }

  if (propCount === 1) {
    let memberType = propBy(type, 0)[0];
    if (memberType === "float" || memberType === "int") {
      return "vector"
    } else {
      return "single";
    }
  } else if (propCount <= 3) {
    let isVector = true;

    for (let i = 0; i < propCount; i ++) {
      let memberType = propBy(type, i)[0];
      if (memberType !== "float" && memberType !== "int") {
        isVector = false;
        break;
      }
    }

    if (isVector) {
      return "vector";
    }
  }

  return undefined;
});

function firstKey(obj) {
  return Object.keys(obj)[0];
}

function firstProp(obj) {
  return propBy(obj, 0);
}

function propBy(obj, n) {
  const key = Object.keys(obj)[n];
  return obj[key];
}

function setValue(evt, key) {
  if (evt.hasOwnProperty("key")) {
    emit('setValue', { key: `${evt.key}.${key}`, value: evt.value });
  } else {
    emit('setValue', { key: key, value: evt.value });
  }
}

</script>

<style scoped>

div.component-preview-vector {
  display: flex;
  flex-direction: row;
  justify-content: right;
}

div.component-preview-vector-elem {
  width: 85px;
  margin-left: 4px;
}

div.component-preview-single {
  min-width: 150px;
}

div.component-preview-color {
  display: flex;
  flex-direction: row;
  justify-content: right;
}

div.component-preview-color div {
  width: 85px;
}

</style>
