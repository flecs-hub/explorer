<template>
  <div class="stat">
    <div>
      <span class="stat-name">{{ nameFmt }}</span>
    </div>
    <div>
      <stat-chart 
        :values="values"
        :width="440"
        :widthScale="true" 
        :widthMargin="10 + 5 + 2"
        :disabled="!valid"
        :isTime="name.indexOf('time') != -1">
      </stat-chart>
    </div>
    <div class="stat-brief" v-if="values.brief">
      <span>{{ values.brief }}</span>
    </div>
  </div>
</template>

<script>
export default { name: "world-stat" };
</script>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  name: {type: String, required: true},
  values: {type: Object, required: true},
  valid: {type: Boolean, required: true}
});

const nameFmt = computed(() => {
  let str = props.name.replaceAll("_", " ");
  str = str.charAt(0).toUpperCase() + str.slice(1);
  return str;
});

const statValue = computed(() => {
  let avg = 0;
  for (let i = 0; i < 60; i++) {
    avg += props.values.avg[i];
  }
  return (avg / 60).toFixed(2);
});
</script>

<style>
div.stat {
  display: flex;
  align-items: center;
  flex-direction: column;
  background-color: var(--panel-bg-secondary);
  margin: 10px;
  margin-right: 0px;
  margin-bottom: 0px;
  padding-top: 10px;
  padding-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;
}

span.stat-name {
  color: var(--primary-text);
  font-size: 0.9rem;
}

span.stat-value {
  color: var(--secondary-text);
}

div.stat-brief {
  color: var(--secondary-text);
  font-size: 0.8rem;
}
</style>