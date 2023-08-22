<template>
  <span class="toggle-button">
    <svg width="35px" height="20px" v-on:click="toggle">
      <circle :cx="button_x" cy="10" r="8"/>
    </svg>
  </span>
</template>

<script>
  module.exports = {
    name: "toggle-button",
    prop: { value: Boolean },
    methods: {
      toggle: function() {
        this.toggle_value = !this.toggle_value;
        this.$emit('input', this.toggle_value);
      }
    },
    computed: {
      button_x: function() {
        return this.toggle_value ? 25 : 10;
      }
    },
    data: function() {
      return {
        toggle_value: this.value
      }
    }
  }
</script>

<style>
  span.toggle-button svg {
    background-color: var(--steel-800);
    border-style: solid;
    border-color: var(--steel-650);
    border-radius: 12px;
    cursor: pointer;
    margin-left: 5px;
    margin-right: 7px;
  }

  span.toggle-button circle {
    fill: var(--tertiary-text);
    transition: cx 0.1s ease;
  }
</style>
