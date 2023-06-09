
Vue.component('detail-toggle', {
  props: {
    show_summary: { type: Boolean, required: false, default: true },
    show_detail: { type: Boolean, required: false, default: true },
    show_divider: { type: Boolean, required: false, default: false },
    expanded: { type: Boolean }
  },
  model: {
    prop: 'expanded',
    event: 'toggle'
  },
  data: function() {
    return {
      expand_state: true,
      toggle_allowed: true
    }
  },
  watch: {
    expand_state: function() {
      this.$emit("toggle", this.expand_state)
    }
  },
  methods: {
    toggle: function() {
      if (this.toggle_allowed) {
        this.expand_state = !this.expand_state;
      }
    },
    expand: function(expand) {
      if (!this.expand_state && expand === undefined) {
        this.expand_state = true;
      } else if (this.expand_state != expand) {
        this.expand_state = expand;
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
      if (!this.expand_state || !this.show_detail) {
        result += " detail-toggle-detail-hide";
      }
      return result;
    }
  },
  template: `
    <div class="detail-toggle">
      <div :class="summary_css" v-on:click.stop="toggle" v-if="show_summary">
        <template v-if="show_detail">
          <old-icon-button src="nav" v-on:click.stop="toggle" :rotate="expand_state"/>
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
