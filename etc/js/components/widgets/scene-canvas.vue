<template>
  <canvas id="canvas" :style="canvasContainerStyle" v-on:click="onFocus" :class="css()">
  </canvas>
</template>

<script>
export default { name: "canvas-container" };
</script>

<script setup>
import { ref, defineProps, onMounted, nextTick, watch, onUnmounted } from 'vue';

const props = defineProps({
  app_params: {type: Object, required: true},
  app_state: {type: Object, required: true},
});

const canvasContainerStyle = ref();
const focus = ref(false);

function css() {
  let css = ["canvas-container"]; 
  if (focus.value) {
    css.push("canvas-focus");
  }
  return css;
}

function onFocus() {
  focus.value = !focus.value;
  flecs.captureKeyboardEvents(focus.value);
  if (focus.value) {
    document.activeElement.blur();
  }
}

function onOtherFocus() {
  if (focus.value) {
    onFocus();
  }
}

onMounted(() => {
  document.addEventListener("focus", onOtherFocus, true);
  window.addEventListener('resize', handleResize);
  var resizeEvent = new Event('resize');
  window.dispatchEvent(resizeEvent);
});

onUnmounted(() => {
  document.removeEventListener("focus", onOtherFocus, true);
});

watch(() => [props.app_state.has3DCanvas, props.app_params.page, 
             props.app_params.sidebar, props.app_params.entities.active_tab,
             props.app_params.script], () => 
{
  handleResize();

  setTimeout(() => {
    var resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
  }, 10);
});

const handleResize = () => {
  nextTick(() => {
    const el = document.getElementById("canvasPlaceholder");
    let r = undefined;
    if (el) {
      r = el.getBoundingClientRect();
    }

    if (r && r.width && r.height) {
      canvasContainerStyle.value = 
        `position: absolute; 
        width: ${r.width}px; 
        height: ${r.height}px; 
        top: ${r.top - 1}px; 
        left: ${r.left - 1}px;`;
    } else {
      canvasContainerStyle.value = "display: none;";
    }
  });
};

</script>

<style scoped>

canvas.canvas-container {
  border-style: solid;
  border-radius: var(--border-radius-medium);
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
  border-width: 1px;
  border-color: var(--border);
  cursor: pointer;
}

canvas.canvas-focus {
  border-color: var(--green);
}

</style>
