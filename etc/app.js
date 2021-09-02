
var app = new Vue({
  el: '#app',

  methods: {
    query_on_changed(e) {
      this.query = e.query;

      if (!this.query || this.query.length <= 1) {
        this.data = undefined;
        this.error = false;
        return;
      }
      
      const r = wq_query(this.query);
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
    },

    change_code() {
      this.run_msg = "Run the code!";
      this.run_ok = false;
      this.run_error = false;
    }
  },

  data: {
    query: "",
    query_ok: "",
    error: false,
    run_ok: false,
    run_error: false,
    run_msg: "Run the code!",
    data: undefined
  }
});
