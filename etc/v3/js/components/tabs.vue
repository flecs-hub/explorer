<template>
  <div>
    <span v-for="(p, i) in options" :class="css(i)"
      v-on:click="select(p.value)">{{ p.label }}</span>
  </div>
</template>

<script>
  module.exports = {
    name: "tabs",
    props: {
      options: { type: Array, required: true },
      default: { type: Number, default: 0 }
    },
    data: function() {
      return {
        value: this.options[this.default].value
      }
    },
    methods: {
      css(i) {
        let value = this.options[i].value;
        let pos = 'center';
        if (!i) {
          pos = 'left';
        } else if (i == this.options.length - 1) {
          pos = 'right';
        }

        let result = "noselect clickable tab-button tab-button-" + pos;
        if (value == this.value) {
          result += " tab-button-selected";
        }
        return result;
      },
      select(value) {
        this.value = value;
        this.$emit('select', value);
      }
    }
  }
</script>

<style>

span.tab-button {
  display: inline-block;
  height: 20px;
  padding: 5px;
  padding-left: 8px;
  padding-right: 8px;
  border-style: solid;
  border-color: var(--steel-650);
  border-bottom-width: 0px;
  background-color: var(--steel-850);
  color: var(--tertiary-text);
  transition: background-color 0.1s ease-out;
}

span.tab-button:hover {
  background-color: var(--prop-bg);
  color: var(--secondary-text);
}

span.tab-button-left {
  margin-right: 0px;
  border-top-left-radius: 3px;
}
span.tab-button-center {
  margin-left: 0px;
  margin-right: 0px;
  border-left-width: 0px;
  border-right-width: 1px;
}
span.tab-button-right {
  margin-left: 0px;
  border-top-right-radius: 3px;
  border-left-width: 0px;
}
span.tab-button-selected {
  background-color: var(--prop-bg);
  color: var(--secondary-text);
}

</style>
