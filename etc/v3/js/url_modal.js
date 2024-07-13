
Vue.component('url-modal', {
  props: ['url'],
  data: function() {
      return {
          hidden: true
      }
  },
  methods: {
    show() {
        this.hidden = false;
    },
    hide() {
        this.hidden = true;
    },
    no_hide() {

    }
  },
  computed: {
    css() {
      if (this.hidden) {
        return "url-modal-hidden";
      } else {
        return "url-modal";
      }
    }
  },
  template: `
    <div :class="css" v-on:click="hide">
      <div class="url-modal-content" v-on:click.stop> 
        <h1>Copy link to share!</h1>
        <div class="url-modal-url-container">
          <div class="url-modal-url">
            <a :href="url" target="_blank">{{ url }}</a>
          </div>
        </div>
      </div>
    </div>
    `
});
