
Vue.component('content-container', {
    props: ['disable'],
    methods: {
      expand: function() {
        this.$refs.toggle.expand();
      }
    },
    template: `
      <div class="content-container-wrapper">
        <div class="content-container">
          <detail-toggle :summary_clickable="true" :collapse="disable" :disable="disable" ref="toggle">
            <template v-slot:summary>
              <div class="content-summary">
                <slot name="summary"></slot>
              </div>
            </template>
            <template v-slot:detail>
              <div class="content-detail">
                <slot name="detail"></slot>
              </div>
            </template>
          </detail-toggle>
        </div>
      </div>
    `
  });
  