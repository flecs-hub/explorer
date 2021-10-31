
Vue.component('terminal', {
  updated: function() {
    var div = document.getElementById("terminal");
    div.scrollTop = div.scrollHeight - div.clientHeight;
  },
  data: function() {
    return {
      messages: []
    }
  },
  methods: {
    clear() {
      this.messages = [];
    },
    log(msg) {
      msg.text = msg.text.split('\n')[0];
      this.messages.push(msg);
    },
    css_from_kind(msg) {
      if (msg.kind == "ok") {
        return "terminal-ok";
      } else if (msg.kind == "command-ok") {
        return "terminal-ok terminal-command";
      } else if (msg.kind == "error") {
        return "terminal-error";
      } else if (msg.kind == "command-error") {
        return "terminal-error terminal-command";
      } else if (msg.kind == "command") {
        return "terminal-command";
      }
    },
    wrapper_css(msg) {
      return "terminal-log " + this.css_from_kind(msg);
    },
    content_css(msg) {
      return "terminal-msg " + this.css_from_kind(msg);
    },
    show_arrow(msg) {
      if (msg.kind == "command" || msg.kind == "command-ok" || msg.kind == "command-error") {
        return true;
      } else {
        return false;
      }
    }
  },
  template: `
    <div class="terminal">
      <div id="terminal" class="terminal-content">
        <div :class="wrapper_css(msg)" v-for="msg in messages">
          <span class="terminal-icon" v-if="show_arrow(msg)">
            <img src="img/nav-right.png">
          </span>
          <span :class="content_css(msg)">{{msg.text}}</span>
        </div>
      </div>
    </div>
    `
});
