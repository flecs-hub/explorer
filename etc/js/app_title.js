
Vue.component('app-title', {
  props: ['value', 'connection', 'retry_count'],
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
  computed: {
    show_icon: function() {
      return this.connection != ConnectionState.Local;
    },
    icon: function() {
      if (this.connection == ConnectionState.Remote) {
        return "connected";
      } else if (this.connection == ConnectionState.Connecting ||
        this.connection == ConnectionState.RetryConnecting ||
        this.connection == ConnectionState.Initializing)
      {
        return "connecting";
      } else if (this.connection == ConnectionState.ConnectionFailed) {
        return "error";
      }
    },
    title: function() {
      if (this.connection == ConnectionState.Remote || 
          this.connection == ConnectionState.Local ||
          this.connection == ConnectionState.RetryConnecting) 
      {
        let str = this.value.replaceAll("_", " ");
        str = str.charAt(0).toUpperCase() + str.slice(1);
        return str;
      } else if (this.connection == ConnectionState.Connecting ||
        this.connection == ConnectionState.Initializing)
      {
        return "Connecting";
      } else if (this.connection == ConnectionState.ConnectionFailed) {
        return "Failed to connect :(";
      }
    },
    detail_css: function() {
      let result = "app-title-detail noselect";
      if (this.connection != ConnectionState.RetryConnecting) {
        result += " app-title-detail-hide";
      }
      return result;
    }
  },
  template: `
    <div class="app-title">
      <span><span>{{title}}</span> <span :class="detail_css">reconnecting</span><old-icon-button v-if="show_icon" :src="icon" :rotate="retry_count % 2"/></span>
    </div>
    `
});
