/*
  THIS COMPONENT IS DEPRECATED
  DO NOT USE
*/

Vue.component('content-container', {
    props: {
      hidden: { type: Boolean, required: false, default: false }, 
      disabled: { type: Boolean, required: false, default: false }, 
      closable: { type: Boolean, required: false, default: false }
    },
    components: {
      'detail-toggle-alt': httpVueLoader('js/detail_toggle_alt.vue')
    },
    methods: {
      evt_close: function() {
        this.$emit('close');
      },
      force_expand() {
        this.$refs.toggle.force_expand();
      }
    },
    computed: {
      wrapper_css: function() {
        return "content-container-wrapper content-container-wrapper-overflow";
      },
      detail_css: function() {
        let result = "content-detail content-detail-padding";
        return result;
      }
    },
    template: `
      <div :class="wrapper_css">
        <div class="content-container">
          <detail-toggle-alt 
            ref="toggle">
            <template v-slot:summary>
              <span class="content-summary" ref="summary">
                <slot name="summary"></slot>

                <span class="content-container-icon-close">
                  <icon src="close" v-if="closable" 
                    :rotate="disabled" 
                    :hide="disabled"
                    v-on:click.stop="evt_close">
                  </icon>
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
          </detail-toggle-alt>
        </div>
      </div>
    `
  });
  