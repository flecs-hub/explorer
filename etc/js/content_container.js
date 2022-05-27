
Vue.component('content-container', {
    props: {
      hide_detail: { type: Boolean, required: false, default: false },
      disable: { type: Boolean, required: false, default: false },
      no_padding: { type: Boolean, required: false },
      closable: { type: Boolean, required: false },
      hide_on_close: { type: Boolean, required: false, default: true },
    },
    data: function() {
      return {
        maximized: false
      }
    },
    methods: {
      expand: function(arg) {
        this.$refs.toggle.expand(arg);
      },
      enable_toggle(e) {
        this.$refs.toggle.enable_toggle(e);
      },
      evt_close: function() {
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
        let result = "content-container-wrapper  content-container-wrapper-overflow";
        if (this.disable && this.hide_on_close) {
          result += " disable";
        }
        if (this.maximized && !this.disable) {
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
          <detail-toggle summary_toggle="true" :collapse="disable || hide_detail" :disable="disable || hide_detail" ref="toggle">
            <template v-slot:summary>
              <span class="content-summary" ref="summary">
                <slot name="summary"></slot>
                <span class="content-container-icon-close" v-if="closable">
                  <icon-button 
                    :icon="'feather:' + maximize_icon"
                    :size="20"
                    v-on:click.stop="evt_maximize"
                    v-tooltip="maximize_icon"/>
                    
                  <icon-button 
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
              <slot name="footer"></slot>
            </template>
          </detail-toggle>
        </div>
      </div>
    `
  });
