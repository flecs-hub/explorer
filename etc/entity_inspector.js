
Vue.component('inspector-toggle', {
  props: ['expand'],
  methods: {
    toggle: function() {
      this.$emit('toggle');
    }
  },
  template: `
    <div class="entity-component-expand-icon">
      <img src="nav-right.png" class="noselect entity-component-expand" v-if="!expand" v-on:click="toggle">
      <img src="nav-down.png" class="noselect entity-component-expand" v-if="expand" v-on:click="toggle">
    </div>
  `
});

Vue.component('entity-property-value', {
  props: ['prop_key', 'value'],
  template: `
    <div class="entity-property-value">
      <span class="entity-property-key">{{prop_key}}</span><span class="entity-property-value">{{value}}</span>
    </div>
    `
});

Vue.component('entity-component-property', {
  props: ['value', 'expand'],
  computed: {
    is_object: function() {
      return (typeof this.value) === "object";
    },
    css: function() {
      if (this.expand) {
        return "collapsible-container";
      } else {
        return "collapsible-container collapsed";
      }
    }
  },
  template: `
    <div :class="css">
      <div class="entity-component-property collapsible">
        <template v-if="is_object">
          <div class="entity-property" v-for="(v, k) in value">
            <entity-property-value :prop_key="k" :value="v">
            </entity-property-value>
          </div>
        </template>
        <template v-else>
          <div class="entity-property-value-kv">
            <entity-property-value prop_key="" :value="v">
            </entity-property-value>
          </div>
        </template>
      </div>
    </div>
    `
});

Vue.component('entity-component', {
  props: ['prop'],
  data: function() {
    return {
      expand: true
    }
  },
  methods: {
    toggle: function() {
      this.expand = !this.expand;
    },
  },
  computed: {
    name_css: function() {
      if (this.prop.hidden) {
        return "entity-component-name entity-component-overridden";
      } else {
        return "entity-component-name";
      }
    },
    height: function() {
      if (this.expand) {
        return "auto";
      } else {
        return "0px";
      }
    },
    hide_property: function() {
      if (this.prop.pred == "flecs.doc.Description" || this.prop.pred == "Identifier") {
        return true;
      }
      return false;
    }
  },
  template: `
    <div class="entity-component" v-if="!hide_property">
      <div class="entity-component-label">
        <template v-if="prop.data">
          <inspector-toggle :expand="expand" v-on:toggle="toggle">
          </inspector-toggle>
        </template>
        <template v-else>
          <div class="noselect entity-component-expand-nodata"></div>
        </template>
        <div :class="name_css">
          <span class="outer">
            <span class="inner">
              <entity-reference :entity="prop.pred" :show_name="true" v-on="$listeners"></entity-reference>
              <template v-if="prop.obj">
                , <entity-reference :entity="prop.obj" :show_name="true" v-on="$listeners"></entity-reference>
              </template>
            </span>
          </span>
        </div>
      </div>
      <entity-component-property v-if="prop.data !== undefined" :expand="expand" :value="prop.data">
      </entity-component-property>
    </div>
    `
});

Vue.component('inspector-components', {
  props: ['entity', 'path', 'type', 'show_header'],
  data: function() {
    return {
      expand: true
    }
  },
  methods: {
    toggle: function() {
      this.expand = !this.expand;
    }
  },
  computed: {
    entity_type: function() {
      if (this.type) {
        return this.type;
      }

      if (this.entity.type) {
        return this.entity.type;
      }
      
      return [];
    },
    css: function() {
      let result;

      if (this.expand) {
        result = "collapsible-container";
      } else {
        result = "collapsible-container collapsed";
      } 

      if (this.show_header) {
        result += " inspector-components-nested";
      }

      return result;
    }
  },
  template: `
    <div class="inspector-components">
      <div v-if="show_header" class="entity-property-header">
        <inspector-toggle :expand="expand" v-on:toggle="toggle">
        </inspector-toggle>
        from {{path}}
      </div>
      <div :class="css">
        <div class="inspector-components-content collapsible">
          <entity-component v-for="(prop, k) in entity_type" :prop="prop" :key="k" v-on="$listeners">
          </entity-component>
        </div>
      </div>
    </div>
    `
});

Vue.component('inspector-base', {
  props: ['path', 'type'],
  template: `
    <div>
      <inspector-components :path="path" :type="type" :show_header="true">
      </inspector-components>
    </div>
    `
});

Vue.component('inspector', {
  props: ['entity', 'selection'],
  computed: {
    parent: function() {
      const pos = this.selection.path.lastIndexOf(".");
      if (pos != -1) {
        return this.selection.path.slice(0, pos);
      } else {
        return "";
      }
    },
    brief: function() {
      if (!this.entity) {
        return undefined;
      }

      if (!this.entity.type) {
        return undefined;
      }

      for (let i = 0; i < this.entity.type.length; i ++) {
        const obj = this.entity.type[i];
        if (obj.pred == "flecs.doc.Description" && obj.obj == "flecs.doc.Brief") {
          return obj.data.value;
        }
      }
    },
    link: function() {
      if (!this.entity) {
        return undefined;
      }

      if (!this.entity.type) {
        return undefined;
      }

      for (let i = 0; i < this.entity.type.length; i ++) {
        const obj = this.entity.type[i];
        if (obj.pred == "flecs.doc.Description" && obj.obj == "flecs.doc.Link") {
          return obj.data.value;
        }
      }
    },
    has_doc: function() {
      return this.brief || this.link;
    }
  },
  template: `
    <div class="inspector" v-if="entity">
      <div v-if="entity && entity.valid" class="content-container">
        <div class="inspector-name">
          <div class="inspector-icon">
            <entity-icon x="0" y="0" :entity_data="selection">
            </entity-icon>
          </div>
          {{selection.name}}
          <span class="inspector-parent" v-if="parent.length">
          - <entity-reference :entity="parent" v-on="$listeners">
          </entity-reference>
          </span>
        </div>

        <div class="inspector-doc" v-if="has_doc">
          <span class="inspector-brief" v-if="brief">
            {{brief}}
          </span>
          <span class="inspector-link" v-if="link">
            <a :href="link" target="_blank">[link]</a>
          </span>
        </div>

        <div class="inspector-components">
          <template v-for="(v, k) in entity.is_a">
            <inspector-base :path="k" :type="v.type" v-on="$listeners">
            </inspector-base>
          </template>

          <inspector-components :entity="entity" :path="selection.path" :show_header="entity.is_a" v-on="$listeners">
          </inspector-components>
        </div>
      </div>
    </div>
    `
});
