
Vue.component('content-container', {
    props: ['disable', 'no_padding', 'overflow'],
    methods: {
      expand: function() {
        this.$refs.toggle.expand();
      }
    },
    computed: {
      wrapper_css: function() {
        let result = "content-container-wrapper";
        if (this.overflow) {
          result += " content-container-wrapper-overflow";
        }
        return result;
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
          <detail-toggle summary_toggle="true" :collapse="disable" :disable="disable" ref="toggle">
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
          </detail-toggle>
        </div>
      </div>
    `
  });
  