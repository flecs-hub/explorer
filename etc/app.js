
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
      
      let r = wq_query(this.query);
      this.data = JSON.parse(r);
      this.error = this.data.valid == false;
    },
  },

  data: {
    query: "",
    query_ok: "",
    error: false,
    data: undefined
  }
});
