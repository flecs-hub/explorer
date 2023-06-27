<template>
  <div class="module-filter">
    <span v-for="(m, i) in modules" :class="css(i)"
        :style="'border-color: ' + color(i)" v-on:click="toggle(i)">
      {{ label(i) }}
    </span>
    <span class="noselect module-button select-all-button" v-on:click="select_all">Select all</span>
    <span class="noselect module-button select-all-button" v-on:click="deselect_all">Deselect all</span>
  </div>
</template>

<script>
  module.exports = {
    name: "module-filter",
    props: {
      modules: {
        type: Array,
        required: true
      },
      labels: {
        type: Array,
        required: false
      }
    },
    data: function() {
      return {
        enabled: []
      }
    },
    methods: {
      color: function(index) {
        return COLORS[index % COLORS.length];
      },
      toggle: function(index) {
        if (this.enabled[index] === undefined) {
          this.enabled[index] = true;
        }
        this.enabled[index] = !this.enabled[index];
        this.$emit("toggle", {module: this.modules[index], enabled: this.enabled[index]});
        this.$forceUpdate();
      },
      select_all: function() {
        this.toggle_all(true);
      },
      deselect_all: function() {
        this.toggle_all(false);
      },
      toggle_all: function(value) {
        for (let i = 0; i < this.modules.length; i++) {
          if (this.enabled[i] === undefined || this.enabled[i] != value) {
            this.enabled[i] = value;
            this.$emit("toggle", {module: this.modules[i], enabled: value});
          }
        }
        this.$forceUpdate();
      },
      is_enabled: function(index) {
        return this.enabled[index] === undefined || this.enabled[index];
      },
      css: function(index) {
        let result = "noselect module-button";
        if (!this.is_enabled(index)) {
          result += " module-button-disabled";
        }
        return result;
      },
      label(index) {
        if (this.labels) {
          return this.labels[index];
        } else {
          return this.modules[index];
        }
      }
    },
  }
</script>

<style>
  div.module-filter {
    margin-bottom: 12px;
  }

  span.module-button {
    background-color: var(--panel-bg);
    border-radius: 6px;
    border-style: solid;
    border-width: 1px;
    border-bottom-width: 3px;
    border-color: var(--steel-600);

    padding: 10px;
    padding-top: 7px;
    padding-bottom: 7px;
    margin-right: 8px;
    margin-bottom: 8px;
    color: var(--secondary-text);
    cursor: pointer;
    transition: color 0.1s ease-in-out;
  }

  span.module-button-disabled {
    color: var(--tertiary-text);
    opacity: 0.5;
  }

  span.select-all-button:hover {
    color: var(--primary-text);
  }
</style>
