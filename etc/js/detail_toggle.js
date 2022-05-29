
Vue.component('detail-toggle', {
  props: {
    show_summary: { type: Boolean, required: false, default: true },
    show_detail: { type: Boolean, required: false, default: true },
    show_divider: { type: Boolean, required: false, default: false }
  },
  data: function() {
    return {
      expanded: true,
      toggle_allowed: true
    }
  },
  methods: {
    toggle: function() {
      if (this.toggle_allowed) {
        this.expanded = !this.expanded;
      }
    },
    expand: function(expand) {
      if (expand === undefined) {
        this.expanded = true;
      } else {
        this.expanded = expand;
      }
    },
    allow_toggle: function(allow) {
      this.toggle_allowed = allow;
    }
  },
  computed: {
    summary_css: function() {
      let result = "detail-toggle-summary noselect clickable";
      return result;
    },
    detail_css: function() {
      let result = "detail-toggle-detail"
      if (!this.expanded || !this.show_detail) {
        result += " detail-toggle-detail-hide";
      }
      return result;
    }
  },
  template: `
    <div class="detail-toggle">
      <div :class="summary_css" v-on:click.stop="toggle" v-if="show_summary">
        <template v-if="show_detail">
          <old-icon-button src="nav" v-on:click.stop="toggle" :rotate="expanded"/>
        </template>
        <template v-else>
          <span class="icon noselect">
            <svg width="20" height="20">
              <circle r="2" cx="10" cy="10" fill="#fff"/>
            </svg>
          </span>
        </template>

        <slot name="summary"></slot>

        <div class="detail-toggle-divider" v-if="show_divider && show_detail">
        </div>
      </div>

      <div :class="detail_css">
        <slot name="detail"></slot>
      </div>

      <div>
        <slot name="footer"></slot>
      </div>
    </div>
  `
});
