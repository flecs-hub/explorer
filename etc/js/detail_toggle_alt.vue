<!--
  THIS IS UNUSED
  DO NOT USE
-->

<template>
  <div class="detail-toggle">
    <div :class="summary_css" v-on:click.stop="toggle">
      <!-- CAT -->
      <span>
        <icon src="nav" v-on:click.stop="toggle" :rotate="!collapsed_state"/>
      </span>
      <!-- TITLE -->
      <slot name="summary"></slot>
    </div>
    <!-- BODY -->
    <div :class="detail_css">
      <slot name="detail"></slot>
    </div>
    <!-- STATUS BAR -->
    <div>
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
  module.exports = {
    name: "detail-toggle-alt",
    props: {
      initial_collapsed_state: { type: Boolean, required: false, default: false },
      disabled: { type: Boolean, required: false, default: false }
    },
    data: function() {
      return {
        collapsed_state: false,
      }
    },
    methods: {
      toggle() {
        // Normal expand/collapse method
        if (!this.disabled) {
          this.collapsed_state = !this.collapsed_state;
        }
      },
      force_expand() {
        // Forces panel to expand whether or not it's enabled
        this.collapsed_state = false;
      },
      force_collapse() {
        // Forces panel to collapse whether or not it's enabled
        this.collapsed_state = true;
      }
    },
    computed: {
      summary_css: function() {
        let result = "detail-toggle-summary";
        if (this.collapsible) {
          result += " noselect";
        }
        if (!this.disabled) {
          result += " clickable";
        }
        return result;
      },
      detail_css: function() {
        let result = "detail-toggle-detail"
        if (this.collapsed_state) {
          result += " detail-toggle-detail-hide";
        }
        return result;
      }
    },
    created() {
      // Iniitialize starting collapse state
      this.collapsed_state = this.initial_collapsed_state;
    }
  }
</script>