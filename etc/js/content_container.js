
Vue.component('content-container', {
    props: ['hidden', 'disable', 'no_padding', 'closable'],
    methods: {
      expand: function(arg) {
        this.$refs.toggle.expand(arg);
      },
      enable_toggle(e) {
        this.$refs.toggle.enable_toggle(e);
      },
      evt_close: function() {
        this.$emit('close');
      }
    },
    computed: {
      wrapper_css: function() {
        return "content-container-wrapper  content-container-wrapper-overflow";
      },
      detail_css: function() {
        let result = "content-detail ";
        if (!this.no_padding) {
          result += " content-detail-padding";
        }
        return result;
      }
    },
    template: `
      <div :class="wrapper_css">
        <div class="content-container">
          <detail-toggle summary_toggle="true" :collapse="disable || hidden" :disable="disable || hidden" ref="toggle">
            <template v-slot:summary>
              <span class="content-summary" ref="summary">
                <slot name="summary"></slot>
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
  