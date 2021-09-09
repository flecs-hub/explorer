
var app = new Vue({
  el: '#app',

  methods: {
    ready() {
      this.$refs.editor.run();
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
    },

    change_code() {
      this.run_msg = "Run the code!";
      this.run_ok = false;
      this.run_error = false;
    }
  },

  data: {
    query_ok: "",
    error: false,
    run_ok: false,
    run_error: false,
    run_msg: "Run the code!",
    data: undefined
  }
});
