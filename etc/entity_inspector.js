
Vue.component('entity-property', {
  props: ['prop'],
  computed: {
    css: function() {
      if (this.prop.overridden) {
        return "entity-property entity-property-overridden";
      } else {
        return "entity-property";
      }
    }
  },
  template: `
    <div :class="css">
      <span class="outer">
        <span class="inner">
          <span class="noselect">{{prop.pred}}</span><template v-if="prop.obj">, <span class="noselect">{{prop.obj}}</span></template>
        </span>
      </span>
    </div>
    `
});

Vue.component('entity-property-inspector', {
  props: ['entity'],
  template: `
    <div>
      <entity-property v-for="(prop, k) in entity.type" :prop="prop" :key="k"></entity-property>
    </div>
    `
});

Vue.component('entity-base-inspector', {
  props: ['path', 'type'],
  template: `
    <div>
      <div class="entity-property-header">from {{path}}</div>
      <entity-property v-for="(prop, k) in type" :prop="prop" :key="k"></entity-property>
    </div>
    `
});

Vue.component('entity-inspector', {
  props: ['entity', 'selection'],
  computed: {
    parent: function() {
      const pos = this.selection.path.lastIndexOf(".");
      if (pos != -1) {
        return this.selection.path.slice(0, pos);
      } else {
        return "";
      }
    }
  },
  template: `
    <div class="entity-inspector" v-if="entity">
      <div v-if="entity && entity.valid" class="ecs-table">
        <entity-icon x="0" y="0" :entity_data="selection">
        </entity-icon>
        {{selection.name}}
        <div class="entity-inspector-parent" v-if="parent.length">
          {{parent}}
        </div>

        <div class="entity-property-inspector">
          <template v-for="(v, k) in entity.inherit">
            <entity-base-inspector  :path="k" :type="v.type">
            </entity-base-inspector>
          </template>

          <div v-if="entity.inherit" class="entity-property-header">{{selection.path}}</div>
          <entity-property-inspector :entity="entity">
          </entity-property-inspector>
        </div>
      </div>
    </div>
    `
});
