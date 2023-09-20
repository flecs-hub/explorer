
function parent_from_path(path) {
  const pos = path.lastIndexOf(".");
  if (pos != -1) {
    return path.slice(0, pos);
  } else {
    return "";
  }
}

function name_from_path(path) {
  if (typeof path === 'number') {
    return path;
  } else {
    return path.split('.').pop();
  }
}

Vue.component('entity-parent', {
  props: ['entity', 'enabled'],
  methods: {
    icon_clicked: function() {
      this.$emit('select-entity', this.entity);
    }
  },
  computed: {
    parent: function() {
      return parent_from_path(this.entity);
    },
  },
  template: `
    <span class="entity-parent" v-if="parent.length">
      <entity-reference :entity="parent" :disabled="!enabled" v-on="$listeners"/>
    </span>
  `
});
