
Vue.component('entity-reference', {
    props: ['entity', 'show_name', 'show_parent', 'disabled', 'label'],
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
        <template v-if="label && label.length">{{label}}&nbsp;</template><span>{{name}}</span><template v-if="show_parent">&nbsp;-&nbsp;<entity-parent :entity="entity"/></template><icon src="follow" v-on:click.stop="icon_clicked" v-if="!disabled"/>
      </span>
      `
  });
