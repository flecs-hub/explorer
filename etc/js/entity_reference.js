
Vue.component('entity-reference', {
    props: ['entity', 'show_name', 'disabled'],
    methods: {
      select_entity: function() {
        if (!this.disabled) {
          this.$emit('select-entity', this.entity);
        }
      }
    },
    computed: {
      name: function() {
        if (this.show_name) {
          return this.entity.split('.').pop();
        } else {
          return this.entity;
        }
      },
      css: function() {
        if (!this.disabled) {
          return "entity-reference";
        } else {
          return "";
        }
      }
    },
    template: `
      <span :class="css" v-on:click="select_entity">
        {{name}}
      </span>
      `
  });
