<template>
  <div class="load">
    <div class="load-bar">
      <div :class="load_css" :style="'width: ' + load_width + 'px;'"></div>
    </div>
    <span class="load-text">{{ load_value }}%</span>
  </div>
</template>

<script>
  module.exports = {
    name: 'load',
    props: {
      value: { type: Number, required: true }
    },
    computed: {
      load_value: function() {
        return (100 * this.value).toFixed(0);
      },
      load_width: function() {
        let value = this.value;
        if (value > 1) {
          value = 1;
        }
        return value * 100;
      },
      load_css: function() {
        let css = "load-bar-load";
        if (this.value > 0.9) {
          css += " load-bar-load-high";
        } else if (this.value > 0.75) {
          css += " load-bar-load-medium";
        }
        return css;
      }
    }
  }
</script>

<style>
  div.load {
    width: 100px;
  }

  div.load-bar {
    background-color: var(--panel-bg-secondary);
    width: 100px;
    height: 22px;
  }

  div.load-bar-load {
    background-color: #40805B;
    position: relative;
    top: 0px;
    left: 0px;
    height: 100%;
    opacity: 0.7;
  }

  div.load-bar-load-high {
    background-color: var(--alert-error);
  }

  div.load-bar-load-medium {
    background-color: var(--alert-warning);
  }

  span.load-text {
    position: absolute;
    top: 0px;
    right: 5px;
    padding-top: 2px;
    margin-left: 5px;
    color: var(--secondary-text);
  }
</style>