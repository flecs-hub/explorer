
Vue.component('status', {
  props: {
    status: String,
    kind: Symbol
  },
  computed: {
    has_status: function() {
      return (this.status !== undefined);
    },
    css: function() {
      let result = "content-status";
      if (this.has_status) {
        result += " content-status-visible";
        if (this.kind == Status.Error) {
          result += " content-status-error";
        }
      }
      return result;
    },
    text: function() {
      if (!this.has_status) {
        return;
      }
      return this.status.split('\n')[0];
    },
    text_css: function() {
      if (!this.has_status) {
        return;
      }
      let result = "content-status-text";
      if (this.kind == Status.Error) {
        result += " content-status-text-error";
      }
      return result;
    },
    status_icon: function() {
      if (this.kind == Status.Error) {
        return "error";
      }
    }
  },
  template: `
    <div :class="css">
      <template v-if="has_status">
        <old-icon-button :src="status_icon" v-if="status_icon"></old-icon-button>
        <span :class="text_css">{{text}}</span>
      </template>
    </div>
    `
});
