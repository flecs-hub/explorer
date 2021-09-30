Vue.component('entity-icon', {
  props: ['x', 'y', 'entity_data'],
  computed: {
    icon_color: function() {
      if (this.entity_data.is_module) {
        return "#FFE100";
      } else if (this.entity_data.is_component) {
        return "#4981B5";
      } else if (this.entity_data.is_prefab) {  
        return "#DDE0E6";
      } else {
        return "#47B576";
      }
    }
  },
  template: `
    <svg :width="x + 8" :height="y + 8">
      <rect :x="x" :y="y" width="8px" height="8px" :fill="icon_color"></rect>
    </svg>`
});
