
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
    },
    div_css: function() {
      let result = "noselect icon clickable " + this.src;
      return result;
    }
  },
  template: `
    <span :class="css">
      <div :class="div_css" v-on="$listeners"> </div>
    </span>
    `
});
