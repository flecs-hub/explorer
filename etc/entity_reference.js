
Vue.component('entity-reference', {
    props: ['entity', 'show_name'],
    methods: {
      select_entity: function() {
        this.$emit('select-entity', this.entity);
      }
    },
    computed: {
      name: function() {
        if (this.show_name) {
          return this.entity.split('.').pop();
        } else {
          return this.entity;
        }
      }
    },
    template: `
      <span class="entity-reference" v-on:click="select_entity">
        {{name}}
      </span>
      `
  });
