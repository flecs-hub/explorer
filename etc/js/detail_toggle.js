

Vue.component('detail-toggle', {
  props: {

    disabled: { type: Boolean, required: false, default: false},
    collapse: { type: Boolean, required: false, default: false},
    hide_when_disabled: { type: Boolean, required: false, default: false},
    collapsible: { type: Boolean, required: false, default: false},
    show_divider: { type: Boolean, required: false, default: false},
  },
  data: function() {
    return {
      expanded_state: true,
      can_toggle: true
    }
  },
  methods: {
    toggle: function() {
      this.expanded_state = !this.expanded_state;
    },
    summary_clicked: function() {
      if (!this.can_toggle) {
        return;
      }
      if (this.collapsible && !this.disabled) {
        this.expanded_state = !this.expanded_state;
      }
    },
    expand: function(expand) {
      if (expand === undefined) {
        this.expanded_state = true;
      } else {
        this.expanded_state = expand;
      }
    },
  },
  computed: {
    expanded: function() {
      return this.expanded_state && (this.collapse === undefined || this.collapse === false);
    },
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
      if (!this.expanded) {
        result += " detail-toggle-detail-hide";
      }
      if (this.disabled && !this.hide_when_disabled) {
        result += " detail-toggle-detail-disable";
      }
      return result;
    }
  },
  template: `
    <div class="detail-toggle">
      <div :class="summary_css" v-on:click.stop="summary_clicked">
        <!-- LEFT ICON -->
        <template v-if="!disabled">
          <icon src="nav" v-on:click.stop="toggle" :rotate="expanded"/>
        </template>
        <template v-else>
          <span class="icon noselect" v-if="!hide_when_disabled">
            <svg width="20" height="20">
              <circle r="2" cx="10" cy="10" fill="#fff"/>
            </svg>
          </span>
        </template>

        <!-- TITLE -->
        <slot name="summary"></slot>

        <!-- UNKNOWN -->
        <div class="detail-toggle-divider" v-if="show_divider && !disabled"></div>
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
  `
});
