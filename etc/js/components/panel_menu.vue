<template>
  <div class="panel-selector">
    <slot></slot>
  </div>
</template>

<script>
  module.exports = {
    name: "panel-menu",
    methods: {
      refresh() {
        for (let child of this.$children) {
          child.refresh();
        }
      }
    }
  }
</script>

<style>

div.panel-selector {
  display: flex;
  flex-direction: column;
  align-items: center;

  background-color: var(--panel-header-bg);
  border-style: solid;
  border-color: black;
  border-width: 0px;
  border-left: 1px;
  height: 100%;
}

</style>
