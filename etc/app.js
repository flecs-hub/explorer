
Vue.config.devtools = true;

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return undefined;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

var app = new Vue({
  el: '#app',

  methods: {
    ready() {
      const q_encoded = getParameterByName("q");
      const p_encoded = getParameterByName("p");

      if (q_encoded != undefined) {
        const q = wq_decode(q_encoded);
        this.$refs.query.set_query(q);
      }

      if (p_encoded != undefined) {
        const p = wq_decode(p_encoded);
        this.$refs.plecs.set_code(p);
      }

      this.$refs.plecs.run();
      this.$refs.tree.update();
    },

    query_on_changed(e) {
      const query = e.query;

      this.$refs.terminal.clear();

      this.$refs.terminal.log({
        text: "Run query \"" + query + "\"",
        kind: "command"
      });

      if (!query || query.length <= 1) {
        this.data = undefined;
        this.error = false;
        if (query.length == 1) {
          this.$refs.terminal.log({
            text: "Query is too short \"" + query + "\"",
            kind: "error"
          });
        }
        return;
      }

      const r = wq_query(query);
      this.data = JSON.parse(r);

      if (this.data.valid == false) {
        this.$refs.terminal.log({text: this.data.error, kind: "error"});
      } else {
        this.$refs.terminal.log({text: "Ok", kind: "ok" });
      }

      this.error = this.data.valid == false;
    },

    run_code(code) {
      this.$refs.terminal.clear();

      const r = wq_run(code);
      const data = JSON.parse(r);

      this.run_ok = data.valid == true;
      this.run_error = data.valid == false;

      if (!this.$refs.query.is_empty()) {
        this.$refs.query.refresh();
      } else {
        this.$refs.terminal.log({
          text: "Run plecs code",
          kind: "command"
        });

        if (!this.run_error) {
          this.$refs.terminal.log({text: "Ok", kind: "ok" });
        } else {
          this.$refs.terminal.log({text: data.error, kind: "error"});
        }
      }

      this.$refs.tree.update_expanded();
      this.select(this.selection);
    },

    show_url() {
      const query = this.$refs.query.get_query();
      const plecs = this.$refs.plecs.get_code();

      const query_encoded = wq_encode(query);
      const plecs_encoded = wq_encode(plecs);
      
      this.url = window.location.href + 
        "?q=" + query_encoded + "&p=" + plecs_encoded;

      this.$refs.url.show();
    },

    select(e) {
      this.selection = e;
      if (e) {
        const r = wq_get_entity(e.path);
        this.entity_data = JSON.parse(r);
        
        if (this.entity_data.valid == false) {
          this.entity_data = undefined;
        }
      } else {
        this.entity_data = undefined;
      }
    },

    evt_select(evt) {
      this.select({path: evt});
    }
  },

  data: {
    query_ok: "",
    error: false,
    run_ok: false,
    run_error: false,
    data: undefined,
    entity_data: undefined,
    selection: undefined,
    url: undefined
  }
});
