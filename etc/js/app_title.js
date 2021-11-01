
Vue.component('app-title', {
  mounted: function() {
    var elem = document.getElementsByTagName("title");
    if (elem) {
      document.title = this.value;
    }
  },
  updated: function() {
    var elem = document.getElementsByTagName("title");
    if (elem) {
      document.title = this.value;
    }
  },
  props: ['value', 'remote'],
  template: `
    <div class="app-title">
      <span>{{value}} <icon v-if="remote" src="connected"/></span>
    </div>
    `
});
  