
Vue.component('entity-reference', {
    props: ['entity', 'show_name', 'disabled', 'label'],
    methods: {
      icon_clicked: function() {
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
      <span class="entity-reference">
        {{label}}&nbsp;<span>{{name}}</span>
        <icon src="follow" v-on:click.stop="icon_clicked" v-if="!disabled"/>
      </span>
      `
  });
