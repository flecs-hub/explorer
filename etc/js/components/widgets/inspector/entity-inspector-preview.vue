<template>
  <div>
    <template v-if="!expand">
      <template v-if="previewTypeKind === 'scalar'">
        <entity-inspector-field 
          :value="value"
          :type="type"
          :readonly="readonly"
          :class="fieldClass"
          :compact="true"
          :shrink_to_content="compact"
          @setValue="(evt) => setValue(evt, key)">
        </entity-inspector-field>
      </template>
      <template v-else-if="previewTypeKind === 'vector'">
        <div :class="vectorClass()">
          <template v-for="(field, key, i) in value">
            <div class="component-preview-vector-comma" v-if="i && compact">,&nbsp;</div>
            <div :class="vectorElemClass()">
              <entity-inspector-field 
                :value="field"
                :type="type[key]"
                :readonly="readonly"
                :class="fieldClass"
                :compact="true"
                :shrink_to_content="compact"
                @setValue="(evt) => setValue(evt, key)">
              </entity-inspector-field>
            </div>
          </template>
        </div>
      </template>
      <template v-else-if="previewTypeKind === 'single'">
        <div class="component-preview-single">
          <entity-inspector-field 
            :value="firstProp(value)"
            :type="firstProp(type)"
            :readonly="readonly"
            :class="fieldClass"
            :compact="true"
            :shrink_to_content="compact"
            @setValue="(evt) => setValue(evt, firstKey(type))">
          </entity-inspector-field>
        </div>
      </template>
    </template>
    <template v-if="previewTypeKind === 'rgbColor'">
      <div :class="colorClass()">
        <color-preview
          :value="`rgb(${propBy(value, 0)}, ${propBy(value, 1)}, ${propBy(value, 2)})`">
        </color-preview>
      </div>
    </template>
    <template v-else-if="previewTypeKind === 'hslColor'">
      <div :class="colorClass()">
        <color-preview
          :value="`hsl(${propBy(value, 0)}, ${propBy(value, 1)}, ${propBy(value, 2)})`">
        </color-preview>
      </div>
    </template>
    <template v-else-if="previewTypeKind === 'cssColor'">
      <div :class="colorClass()">
        <color-preview
          :value="firstProp(value)">
        </color-preview>
      </div>
    </template>
    <template v-else-if="previewTypeKind === 'object'">
        <div :class="objectClass()">
          <entity-inspector-field 
            :value="objectToField(value)"
            :type="{}"
            :readonly="true"
            :class="fieldClass"
            :compact="true"
            :shrink_to_content="compact">
          </entity-inspector-field>
        </div>
    </template>
  </div>
</template>

<script>
export default { name: "entity-inspector-preview" }
</script>

<script setup>

import { defineProps, computed, defineEmits } from 'vue';

const props = defineProps({
  value: {required: false},
  type: {required: false},
  targets: {required: false},
  expand: {type: Boolean, required: true},
  readonly: {type: Boolean, required: true},
  compact: {type: Boolean, required: false, default: false},
  fieldClass: {type: String, required: false, default: "value"}
});

const emit = defineEmits(["setValue"]);

const propCount = computed(() => {
  let result = Object.keys(props.type).length;
  let self = props.type["@self"];
  if (self !== undefined) {
    result --;
  }
  return result;
});

const previewTypeKind = computed(() => {
  const type = props.type;
  if (typeof type != "object") {
    return undefined;
  }

  if (Array.isArray(type)) {
    return "scalar";
  }

  let self = type["@self"];

  if (self) {
    if (self[0].unit === "flecs.units.Color.Rgb") {
      return "rgbColor";
    } else if (self[0].unit === "flecs.units.Color.Hsl") {
      return "hslColor";
    } else if (self[0].unit === "flecs.units.Color.Css") {
      return "cssColor";
    }
  }

  if (propCount.value === 1) {
    let memberType = propBy(type, 0)[0];
    if (memberType === "float" || memberType === "int") {
      return "vector"
    } else {
      return "single";
    }
  } else if (propCount.value <= 3) {
    let isVector = true;

    for (let i = 0; i < propCount.value; i ++) {
      let memberType = propBy(type, i)[0];
      if (memberType !== "float" && memberType !== "int") {
        isVector = false;
        break;
      }
    }

    if (isVector) {
      return "vector";
    } else {
      return "object";
    }
  } else {
    return "object";
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

function vectorElemClass() {
  let classes = ["component-preview-vector-elem"];
  if (!props.compact) {
    if (propCount.value == 1) {
      classes.push("component-preview-vector-elem-width-one");
    } else if (propCount.value == 2) {
      classes.push("component-preview-vector-elem-width-two");
    } else {
      classes.push("component-preview-vector-elem-width");
    }
  }
  return classes;
}

function vectorClass() {
  let classes = ["component-preview-vector"];
  if (props.compact) {
    classes.push("component-preview-compact");
  }
  return classes;
}

function colorClass() {
  let classes = ["component-preview-color"];
  if (props.compact) {
    classes.push("component-preview-compact");
  }
  return classes;
}

function objectClass() {
  let classes = ["component-preview-object"];
  if (props.compact) {
    classes.push("component-preview-compact");
  }
  return classes;
}

function objectToField(value) {
  let result = [];
  for (var k in value) {
    const v = value[k];
    if (typeof v === "number") {
      result.push(v.toFixed(2));
    } else if (typeof v === "object") {
      result.push("{..}");
    } else {
      result.push(v);
    }
  }
  return result.join(", ");
}

</script>

<style scoped>

div.component-preview-vector {
  display: flex;
  flex-direction: row;
  justify-content: right;
}

div.component-preview-vector-elem {
  margin-left: 4px;
}

div.component-preview-vector-comma {
  color: var(--secondary-text);
}

div.component-preview-vector-elem-width {
  width: 85px;
}

div.component-preview-vector-elem-width-one {
  width: 263px;
}

div.component-preview-vector-elem-width-two {
  width: 130px;
}

div.component-preview-single {
  min-width: 150px;
}

div.component-preview-color {
  display: flex;
  flex-direction: row;
  justify-content: right;
}

div.component-preview-compact {
  justify-content: left;
}

div.component-preview-color div {
  width: 85px;
}

</style>
