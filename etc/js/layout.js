
Vue.component('layout', {
  mounted: function() {
    console.log(this.grid);
  },
  props: ['rows', 'columns'],
  methods: {
    add_component: function(row, column, component) {

    }
  },
  computed: {
    grid: function() {
      let result = [];

      for (let r = 0; r < this.rows; r ++) {
        let elem = result.push();
        for (let c = 0; c < this.columns; c ++) {
          elem.push();
        }
      }
    }
  },
  data: function() {
    return {

    }
  },
  template: `
    <div class="layout">{{ grid }}</div>
  `
});
