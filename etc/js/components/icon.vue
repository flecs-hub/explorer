<template>
  <svg class="icon-obj" :class="icon_css" :width="dimension" :height="dimension">
    <use :href="asset_url"/>
  </svg>
</template>

<script>
/*
  Icon component provides a base icon object that can be sourced from several iconsets.
*/

const available_icon_sets = new Set([
  "feather",
    // Gallery: https://feathericons.com/
  "codicons"
    // Gallery: https://microsoft.github.io/vscode-codicons/dist/codicon.html 
])

module.exports = {
  name: "icon",
  props: {
    icon: { type: String, required: true },
    // expected format: "set:name"
    size: { type: Number, required: false },
    // if a size is not set, the containing element font size will be used.
  },
  data() {
    return {
      asset_url: undefined,
      icon_set: undefined,
      icon_name: undefined,
      dimension: 0,
    }
  },
  computed: {
    icon_css() {
      return this.icon_set;
    }
  },
  created() {
    let icon_set, icon_name;
    
    [this.icon_set, this.icon_name] = this.icon.split(":");

    if (available_icon_sets.has(this.icon_set)) {
      // Use icon-set specific sprite sheets
      if (this.icon_set == "feather") {
        this.asset_url = `./img/icons/feather-sprite.svg#${this.icon_name}`;
      }
      if (this.icon_set == "codicons") {
        this.asset_url = `./img/icons/codicon.svg#${this.icon_name}`;
      }
    }

    if (this.size) {
      // if size is defined...
      this.dimension = this.size;

    } else {
      // if size is undefined, then take parent element's font size as dimension.
      let re = /^[0-9]+/;
      let elem = this.$parent.$el;

      let font_size_str = window.getComputedStyle(elem, null).getPropertyValue('font-size');
      let font_size = parseInt( font_size_str.match(re)[0] );
      this.dimension = font_size;
    }
  }
}
</script>

<style scoped>

.icon-obj {
  stroke: white;
  stroke-width: 2;
  fill: none;
  overflow: visible;
}

.codicons {
  stroke-width: 0.25px;
}

</style>