<template>
  <div class="menu-button" v-on:click="onClick">
    <icon :src="img" :size="22" :opacity="iconOpacity"></icon>
  </div>
</template>

<script>
export default { name: "menu-button" };
</script>

<script setup>
import { defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  name: {type: String, required: true},
  img: {type: String, required: true},
  href: {type: String, required: false}
});

const page = defineModel("page");

const isActive = computed(() => {
  return props.name == page.value;
});

const iconOpacity = computed(() => {
  if (isActive.value) {
    return 1.0;
  } else {
    return 0.5;
  }
});

const onClick = () => {
  if (props.href) {
    window.open(props.href, '_blank');
  } else {
    page.value = props.name;
  }
}

</script>

<style scoped>
div.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
  border-radius: var(--border-radius-medium);
  /* background-color: var(--bg-content); */
  min-height: 32px;
  cursor: pointer;
}

div.menu-button:hover {
  background-color: var(--tab-separator-color);
}

</style>
