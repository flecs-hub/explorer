
Vue.component('property-value', {
  props: ['value'],
  computed: {
    is_object: function() {
      console.log("VALUE = " + this.value);
      return (typeof this.value) === "object";
    }
  },
  template: `
    <div class="properties">
      <template v-if="is_object">
        <div class="property" v-for="(v, k) in value">
          <span class="property-key">{{k}}</span>: <span class="property-value">{{v}}</span>
        </div>
      </template>
      <template v-else>
        <div class="property">
          <span class="property-key"></span><span class="property-value">{{value}}</span>
        </div>
      </template>
    </div>
    `
});

Vue.component('entity-property', {
  props: ['prop'],
  computed: {
    css: function() {
      if (this.prop.hidden) {
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
          <img src="nav-right.png" class="property-expand">
          <span class="noselect">{{prop.pred}}</span><template v-if="prop.obj">, <span class="noselect">{{prop.obj}}</span></template>
          <property-value v-if="prop.data" :value="prop.data"></property-value>
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
          <template v-for="(v, k) in entity.is_a">
            <entity-base-inspector  :path="k" :type="v.type">
            </entity-base-inspector>
          </template>

          <div v-if="entity.is_a" class="entity-property-header">from {{selection.path}}</div>
          <entity-property-inspector :entity="entity">
          </entity-property-inspector>
        </div>
      </div>
    </div>
    `
});
