
Vue.component('term-id', {
    props: ['data'],
    computed: {
        css: function() {
            if (this.data.is_var) {
                return "ecs-var";
            } else {
                return "ecs-entity";
            }
        }
    },
    template: `<span><span :class="css">{{data.name}}</span>:<span class="ecs-set">{{data.set.mask}}</span></span>`
  });

Vue.component('filter-explorer', {
    props: ['data'],
    template: `
      <div class="ecs-filter" v-if="data && data.filter">
        <div class="box-header">Query exploder</div>
        <div v-for="(term, i) in data.filter.terms">
            <span v-if="term.pred"><term-id :data="term.pred"></term-id></span><span v-if="term.subj">(<term-id :data="term.subj"></term-id><span v-if="term.obj">, <term-id :data="term.obj"></term-id></span>)</span>
        </div>
      </div>
      `
  });
