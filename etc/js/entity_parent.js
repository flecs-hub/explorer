
Vue.component('entity-parent', {
  props: ['entity'],
  methods: {
    icon_clicked: function() {
      this.$emit('select-entity', this.entity);
    }
  },
  computed: {
    parent: function() {
      const pos = this.entity.lastIndexOf(".");
      if (pos != -1) {
        return this.entity.slice(0, pos);
      } else {
        return "";
      }
    },
  },
  template: `
    <span class="entity-parent" v-if="parent.length">
      <entity-reference :entity="parent" :disabled="true" v-on="$listeners"/>
    </span>
  `
});
