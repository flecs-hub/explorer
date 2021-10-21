Vue.component('entity-property-value', {
  props: ['prop_key', 'value'],
  computed: {
    is_object: function() {
      return (typeof this.value) === "object";
    }
  },
  template: `
    <div class="entity-property-value">
      <template v-if="is_object">
        <div class="entity-property-object">
          <detail-toggle>
            <template v-slot:summary>
              <span>{{prop_key}}</span>
            </template>
            <template v-slot:detail>
              <inspector-properties :value="value"></inspector-properties>
            </template>
          </detail-toggle>
        </div>
      </template>
      <template v-else>
        <span class="entity-property-key">{{prop_key}}</span><span class="entity-property-value">{{value}}</span>
      </template>
    </div>
    `
});

Vue.component('inspector-properties', {
  props: ['value'],
  computed: {
    is_object: function() {
      return (typeof this.value) === "object";
    },
    has_objects: function() {
      for (let k in this.value) {
        const v = this.value[k];
        if ((typeof v) === "object") {
          return true;
        }
      }
      return false;
    },
    css: function() {
      let result = "inspector-properties";
      if (this.has_objects) {
        result += " inspector-properties-vertical";
      }
      return result;
    }
  },
  template: `
    <div :class="css">
      <template v-if="is_object">
        <div class="entity-property" v-for="(v, k) in value">
          <entity-property-value :prop_key="k" :value="v">
          </entity-property-value>
        </div>
      </template>
      <template v-else>
        <div class="entity-property">
          <entity-property-value prop_key="value" :value="value">
          </entity-property-value>
        </div>
      </template>
    </div>
    `
});

Vue.component('entity-component', {
  props: ['prop'],
  computed: {
    name_css: function() {
      if (this.prop.hidden) {
        return "entity-component-name entity-component-overridden";
      } else {
        return "entity-component-name";
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
      <div class="inspector-component-name">
        <detail-toggle :disable="prop.data == undefined">
          <template v-slot:summary>
            <div :class="name_css">
              <entity-reference :entity="prop.pred" :show_name="true" v-on="$listeners"></entity-reference>
              <template v-if="prop.obj">
                , <entity-reference :entity="prop.obj" :show_name="true" v-on="$listeners"></entity-reference>
              </template>
            </div>
          </template>

          <template v-slot:detail>
            <inspector-properties v-if="prop.data !== undefined" :value="prop.data">
            </inspector-properties>
          </template>
        </detail-toggle>
      </div>
    </div>
    `
});

Vue.component('inspector-components', {
  props: ['entity', 'path', 'type', 'show_header'],
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
      let result = "inspector-components";
      if (this.show_header) {
        result += " inspector-components-with-header";
      }
      return result;
    },
    detail_css: function() {
      let result = "";

      if (this.show_header) {
        result += " inspector-components-nested";
      }

      return result;
    }
  },
  template: `
    <div :class="css">
      <detail-toggle :disable="!show_header" :hide_disabled="true" :show_divider="true">
        <template v-slot:summary>
          <div class="inspector-header" v-if="show_header">
            from <entity-reference :entity="path" :show_name="true" :disabled="entity != undefined" v-on="$listeners">
            </entity-reference>
          </div>
        </template>
        <template v-slot:detail>
          <div :class="detail_css">
            <div class="inspector-components-content">
              <entity-component v-for="(prop, k) in entity_type" :prop="prop" :key="k" v-on="$listeners">
              </entity-component>
            </div>
          </div>
        </template>
      </detail-toggle>
    </div>
    `
});

Vue.component('inspector', {
  props: ['entity', 'selection'],
  methods: {
    expand: function() {
      this.$refs.container.expand();
    }
  },
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
    <div class="inspector">
      <content-container :disable="!entity || !entity.valid" ref="container">
        <template v-slot:summary>
          Entity inspector
        </template>
        <template v-slot:detail v-if="entity && entity.valid">
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

          <div class="inspector-content">
            <template v-for="(v, k) in entity.is_a">
              <inspector-components :path="k" :type="v.type" :show_header="true" v-on="$listeners">
              </inspector-components>
            </template>

            <inspector-components :entity="entity" :path="selection.path" :show_header="entity.is_a" v-on="$listeners">
            </inspector-components>
          </div>
        </template>
      </content-container>
    </div>
    `
});
