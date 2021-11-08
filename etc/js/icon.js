
Vue.component('icon', {
  props: ['src', 'rotate'],
  computed: {
    css: function() {
      if (this.rotate) {
        return "icon icon-rotate";
      } else {
        return "icon";
      }
    }
  },
  template: `
    <span :class="css">
      <div :class="'noselect icon clickable ' + src" v-on="$listeners"> </div>
    </span>
    `
});
