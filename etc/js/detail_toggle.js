Vue.component('detail-toggle', {
  props: ['disable', 'collapse', 'hide_disabled', 'summary_toggle', 'show_divider'],
  data: function() {
    return {
      should_expand: true
    }
  },
  methods: {
    toggle: function() {
      this.should_expand = !this.should_expand;
    },
    summary_clicked: function() {
      if (this.summary_toggle && !this.disable) {
        this.should_expand = !this.should_expand;
      }
    },
    expand: function(expand) {
      if (expand === undefined) {
        this.should_expand = true;
      } else {
        this.should_expand = expand;
      }
    }
  },
  computed: {
    expanded: function() {
      return this.should_expand && (this.collapse === undefined || this.collapse === false);
    },
    summary_css: function() {
      let result = "detail-toggle-summary";
      if (this.summary_toggle) {
        result += " noselect";
      }
      if (!this.disable) {
        result += " clickable";
      }
      return result;
    },
    detail_css: function() {
      let result = "detail-toggle-detail"
      if (!this.expanded) {
        result += " detail-toggle-detail-hide";
      }
      if (this.disable && !this.hide_disable) {
        result += " detail-toggle-detail-disable";
      }
      return result;
    }
  },
  template: `
    <div class="detail-toggle">
      <div :class="summary_css" v-on:click.stop="summary_clicked">
        <template v-if="!disable">
          <icon src="nav" v-on:click.stop="toggle" :rotate="expanded"/>
        </template>
        <template v-else>
          <span class="icon noselect" v-if="!hide_disabled">
            <svg width="20" height="20">
              <circle r="2" cx="10" cy="10" fill="#fff"/>
            </svg>
          </span>
        </template>

        <slot name="summary"></slot>

        <div class="detail-toggle-divider" v-if="show_divider && !disable"></div>
      </div>

      <div :class="detail_css">
        <slot name="detail"></slot>
      </div>
    </div>
  `
});
