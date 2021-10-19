
Vue.component('entity-reference', {
    props: ['entity'],
    methods: {
        select_entity: function() {
            this.$emit('select-entity', this.entity);
        }
    },
    template: `
      <span class="entity-reference" v-on:click="select_entity">
        {{entity}}
      </span>
      `
  });
