<template>
  <div class="content-container-wrapper content-container-wrapper-overflow">
    <div class="content-container">
      <div class="detail-toggle">
        <div :class="summary_css" v-on:click.stop="toggle">
          <!-- CAT -->
          <span>
            <icon src="nav" v-on:click.stop="toggle" :rotate="!collapsed_state"/>
          </span>
          <!-- TITLE -->
          <span class="content-summary" ref="summary">
            <slot name="summary"></slot>

            <span class="content-container-icon-close">
              <icon src="close" v-if="closable" 
                :rotate="disabled" 
                :hide="disabled"
                v-on:click.stop="evt_close">
              </icon>
            </span>
          </span>
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
    </div>
  </div>
</template>

<script>
  module.exports = {
    name: "collapsible-panel",
    props: {
      initial_collapsed_state: { type: Boolean, required: false, default: false },
      disabled: { type: Boolean, required: false, default: false },
      closable: { type: Boolean, required: false, default: false }
    },
    data: function() {
      return {
        collapsed_state: false,
      }
    },
    methods: {
      evt_close: function() {
        this.$emit('close');
      },
      toggle() {
        // Normal expand/collapse method, toggles only when not disabled
        if (!this.disabled) {
          this.collapsed_state = !this.collapsed_state;
        }
      },
      force_expand() {
        // Forces panel to expand whether or not it's disabled
        this.collapsed_state = false;
      },
      force_collapse() {
        // Forces panel to collapse whether or not it's disabled
        this.collapsed_state = true;
      }
    },
    computed: {
      summary_css: function() {
        let result = "detail-toggle-summary";
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