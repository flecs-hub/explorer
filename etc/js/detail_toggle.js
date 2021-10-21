Vue.component('detail-toggle', {
  props: ['disable', 'collapse', 'hide_disabled', 'summary_clickable', "show_divider"],
  data: function() {
    return {
      should_expand: true
    }
  },
  methods: {
    toggle: function() {
      this.should_expand = !this.should_expand;
    },
    summary_toggle: function() {
      if (this.summary_clickable && !this.disable) {
        this.should_expand = !this.should_expand;
      }
    },
    expand: function() {
      this.should_expand = true;
    }  
  },
  computed: {
    expanded: function() {
      return this.should_expand && (this.collapse === undefined || this.collapse === false);
    },
    css: function() {
      if (this.expanded) {
        return "detail-toggle-img";
      } else {
        return "detail-toggle-img detail-toggle-img-collapse";
      }
    },
    toggle_css: function() {
      if (!this.expanded) {
        return "detail-toggle-hide";
      } else {
        return "detail-toggle-show"
      }
    },
    summary_css: function() {
      let result = "detail-toggle-summary";
      if (this.summary_clickable) {
        result += " clickable noselect";
      }
      return result;
    }
  },
  template: `
    <div class="detail-toggle">
      <div :class="summary_css" v-on:click.stop="summary_toggle">
        <template v-if="!disable">
          <div :class="css">
            <img src="img/nav-right.png" class="noselect entity-component-should_expand" v-on:click.stop="toggle">
          </div>
        </template>
        <template v-else>
          <div class="noselect detail-toggle-img" v-if="!hide_disabled">
            <svg width="20" height="20">
              <circle r="2" cx="10" cy="10" fill="#4F5565"/>
            </svg>
          </div>
        </template>

        <slot name="summary"></slot>

        <div class="detail-toggle-divider" v-if="show_divider"></div>
      </div>

      <div :class="toggle_css">
        <slot name="detail"></slot>
      </div>
    </div>
  `
});
