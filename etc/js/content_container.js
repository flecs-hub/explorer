
Vue.component('content-container', {
    props: {
      show_detail: { type: Boolean, required: false, default: true },
      collapse: { type: Boolean, required: false, default: false },
      no_padding: { type: Boolean, required: false },
      closable: { type: Boolean, required: false }
    },
    data: function() {
      return {
        closed: false,
        maximized: false,
        expanded: true
      }
    },
    methods: {
      open() {
        this.closed = false;
        this.$emit("panel-update");
      },
      close() {
        this.closed = true;
        this.maximized = false;
        this.$emit("panel-update");
      },
      is_closed() {
        return this.closed;
      },
      expand: function(arg) {
        this.$refs.toggle.expand(arg);
      },
      allow_toggle(e) {
        this.$refs.toggle.allow_toggle(e);
      },
      evt_close: function() {
        this.close();
        this.maximized = false;
        this.$emit('close');
      },
      evt_maximize: function() {
        this.maximized = !this.maximized;
        if (this.disable) {
          this.maximized = false;
        }
      }
    },
    computed: {
      wrapper_css: function() {
        let result = "content-container-wrapper content-container-wrapper-overflow";
        if (this.closed) {
          result += " disable";
        }
        if (this.maximized) {
          result += " maximized";
        }
        return result;
      },
      detail_css: function() {
        let result = "content-detail ";
        if (!this.no_padding) {
          result += " content-detail-padding";
        }
        return result;
      },
      footer_css: function() {
        if (!this.expanded) {
          return "hidden";
        } else {
          return "";
        }
      },
      maximize_icon: function() {
        if (this.maximized) {
          return "minimize";
        } else {
          return "maximize";
        }
      }
    },
    template: `
      <div :class="wrapper_css">
        <div class="content-container">
          <detail-toggle ref="toggle"
              summary_toggle="true" 
              :collapse="collapse" 
              :show_detail="show_detail"
              v-model="expanded">
            <template v-slot:summary>
              <span class="content-summary" ref="summary">
                <slot name="summary"></slot>
                <span class="content-container-icon-close">
                  <icon-button 
                    :icon="'feather:' + maximize_icon"
                    :size="20"
                    v-on:click.stop="evt_maximize"
                    v-tooltip="maximize_icon"/>
                    
                  <icon-button 
                    v-if="closable"
                    icon="feather:x"
                    :size="20"
                    v-on:click.stop="evt_close"
                    v-tooltip="'close'"/>
                </span>
              </span>
            </template>
            <template v-slot:detail>
              <div :class="detail_css" ref="detail">
                <slot name="detail"></slot>
              </div>
            </template>
            <template v-slot:footer>
              <div :class="footer_css">
                <slot name="footer"></slot>
              </div>
            </template>
          </detail-toggle>
        </div>
      </div>
    `
  });
