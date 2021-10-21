
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
      this.messages.push(msg);
    }
  },
  template: `
    <div class="terminal">
      <div id="terminal" class="terminal-content">
        <div :class="'terminal-log terminal-' + msg.kind" v-for="msg in messages">
          <span class="terminal-icon" v-if="msg.kind == 'command'">
            <img src="img/nav-right.png">
          </span>
          <span :class="'terminal-msg terminal-' + msg.kind">{{msg.text}}</span>
        </div>
      </div>
    </div>
    `
});
