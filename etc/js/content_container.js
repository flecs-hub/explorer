
Vue.component('content-container', {
    props: ['disable', 'no_padding', 'closable'],
    methods: {
      expand: function(arg) {
        this.$refs.toggle.expand(arg);
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
          <detail-toggle summary_toggle="true" :collapse="disable" :disable="disable" ref="toggle">
            <template v-slot:summary>
              <span class="content-summary" ref="summary">
                <slot name="summary"></slot>
              </span>
              <icon src="close" v-if="closable" 
                :rotate="disable" 
                :hide="disable"
                v-on:click.stop="evt_close">
              </icon>
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
  