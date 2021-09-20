
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

      if (!query || query.length <= 1) {
        this.data = undefined;
        this.error = false;
        return;
      }
      
      const r = wq_query(query);

      this.data = JSON.parse(r);
      this.error = this.data.valid == false;

      if (this.is_entity_query(query)) {
        const er = wq_get_entity(query);
        this.entity_data = JSON.parse(er);
        if (this.entity_data.valid == false) {
          this.entity_data = undefined;
        }
      } else {
        this.entity_data = undefined;
      }
    },

    run_code(code) {
      const r = wq_run(code);
      const data = JSON.parse(r);
      this.run_ok = data.valid == true;
      this.run_error = data.valid == false;

      if (this.run_error) {
        this.run_msg = "Code contains errors!";
      } else {
        this.run_msg = "Code ran successfully!";;
      }

      this.$refs.query.changed();
      this.$refs.tree.update_expanded();
    },

    change_code() {
      this.run_msg = "Run the code!";
      this.run_ok = false;
      this.run_error = false;
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

    is_entity_query: function(query) {
      return (query.indexOf(",") == -1) && (query.indexOf("(") == -1);
    }    
  },

  data: {
    query_ok: "",
    error: false,
    run_ok: false,
    run_error: false,
    run_msg: "Run the code!",
    data: undefined,
    entity_data: undefined,
    url: undefined
  }
});
