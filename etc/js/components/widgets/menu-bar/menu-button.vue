<template>
  <div :class="buttonCss" v-on:click="onClick">
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

const buttonCss = computed(() => {
  if (isActive.value) {
    return "menu-button menu-button-active";
  } else {
    return "menu-button";
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-medium);
  min-height: 32px;
  cursor: pointer;
  transition: background-color var(--animation-duration);
}

div.menu-button:hover {
  background-color: var(--hover-bg);
}

div.menu-button-active {
  background-color: var(--accent-muted);
}

</style>
