
Vue.component('icon', {
  props: ['src', 'rotate', 'hide'],
  computed: {
    css: function() {
      let result = "icon";
      if (this.rotate) {
        result += " icon-rotate";
      }
      if (this.hide) {
        result += " icon-hide";
      }
      return result;
    }
  },
  template: `
    <span :class="css">
      <img :class="'noselect icon clickable ' + src" v-on="$listeners"/>
    </span>
    `
});
