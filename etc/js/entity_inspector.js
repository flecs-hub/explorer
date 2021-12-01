// Utility to check if type/value is object
function inspector_is_object(type, value) {
  if (type) {
    if (Array.isArray(type)) {
      return false;
    } else {
      return (typeof type) === "object";
    }
  }
  return (typeof value) === "object";
}

// Key (property name)
Vue.component('inspector-key', {
  props: ['prop_key'],
  template: `<span v-if="prop_key !== undefined" class="inspector-key">{{prop_key}}</span>`
});

// Single scalar value
Vue.component('inspector-value', {
  props: ['type', 'value'],
  computed: {
    formatted_value: function() {
      const type = this.type ? this.type[0] : undefined;
      const value = this.value;

      if (!type) {
        return value;
      }

      if (type === "text") {
        if (value) {
          return "\"" + value + "\"";
        } else {
          return "";
        }
      }

      if (type === "float") {
        let str = value.toString();
        if (str.indexOf('.') == -1) {
          return value;
        } else {
          let num = 4 - str.split('.')[0].length;
          if (num < 0) {
            num = 0;
          }
          return value.toFixed(num);
        }
      }

      return value;
    },
    css: function() {
      let result = "inspector-value ";
      if (this.type) {
        result += "inspector-value-" + this.type[0];
      }
      return result;
    }
  },
  template: `<span :class="css">{{formatted_value}}</span>`
});

// Key-value pair (as shown in entity inspector)
Vue.component('inspector-kv', {
  props: ['prop_key', 'type', 'value', 'list'],
  computed: {
    is_object: function() {
      return inspector_is_object(this.type, this.value);
    },
    value_css: function() {
      return "inspector-kv-value";
    }
  },
  template: `
    <div class="inspector-kv">
      <template v-if="!list">
        <template v-if="is_object">
          <div class="inspector-prop-object">
            <detail-toggle summary_toggle="true">
              <template v-slot:summary>
                <span>{{prop_key}}</span>
              </template>
              <template v-slot:detail>
                <inspector-props :type="type" :value="value"></inspector-props>
              </template>
            </detail-toggle>
          </div>
        </template>
        <template v-else>
          <inspector-key :prop_key="prop_key"/><inspector-value :css="value_css" :type="type" :value="value"/>
        </template>
      </template>
      <template v-else>
        <inspector-value :type="type" :value="value"></inspector-value>
      </template>
    </div>
    `
});

// Component properties
Vue.component('inspector-props', {
  props: ['value', 'type', 'list'],
  methods: {
    prop_type: function(prop_name) {
      if (this.type) {
        return this.type[prop_name];
      } else {
        return undefined;
      }
    }
  },
  computed: {
    is_object: function() {
      return inspector_is_object(this.type, this.value);
    },
    is_array: function() {
      return Array.isArray(this.value);
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
      let result = "inspector-props";
      if (this.list) {
        result += "-list"
      } else {
        if (this.has_objects) {
          result += " inspector-props-vertical";
        }
      }
      return result;
    }
  },
  template: `
    <div :class="css">
      <template v-if="is_object">
        <template v-if="is_array">
          <div class="inspector-prop" v-for="(v, k, i) in value"><template v-if="i && list">,&nbsp</template><inspector-kv :type="prop_type(k)" ":value="v" :list="list"/></div>
        </template>
        <template v-else>
          <div class="inspector-prop" v-for="(v, k, i) in value"><template v-if="i && list">,&nbsp</template><inspector-kv :prop_key="k" :type="prop_type(k)" :value="v" :list="list"/></div>
        </template>
      </template>
      <template v-else>
        <div class="inspector-prop">
          <inspector-kv :type="type" :value="value" :list="list"/>
        </div>
      </template>
    </div>
    `
});

// Component
Vue.component('inspector-component', {
  props: ['elem'],
  computed: {
    name_css: function() {
      if (this.elem.hidden) {
        return "inspector-component-name inspector-component-overridden";
      } else {
        return "inspector-component-name";
      }
    },
    hide_property: function() {
      if (this.elem.pred == "flecs.doc.Description" || this.elem.pred == "Identifier") {
        return true;
      }
      return false;
    }
  },

  template: `
    <div class="inspector-component" v-if="!hide_property">
      <div class="inspector-component-name">
        <detail-toggle :disable="elem.value == undefined" summary_toggle="true">
          <template v-slot:summary>
            <div :class="name_css">
              <entity-reference :entity="elem.pred" :disabled="true" show_name="true"/><template v-if="elem.obj">, {{elem.obj}}</template>
            </div>
          </template>
          <template v-slot:detail>
            <inspector-props v-if="elem.value !== undefined" 
              :type="elem.type_info" 
              :value="elem.value"/>
          </template>
        </detail-toggle>
      </div>
    </div>
    `
});

// Components of entity and/or base entities
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
      <detail-toggle :disable="!show_header" hide_disabled="true" show_divider="true" summary_toggle="true">
        <template v-slot:summary>
          <span class="inspector-header" v-if="show_header">
            <entity-reference 
              :label="entity == undefined ? 'inherited from' : ''" 
              :entity="path" 
              show_name="true" 
              :disabled="true" 
              icon_link="true" 
              v-on="$listeners"/>
          </span>
        </template>
        <template v-slot:detail>
          <div :class="detail_css">
            <div class="inspector-components-content">
              <inspector-component v-for="(elem, k) in entity_type" :elem="elem" :key="k" v-on="$listeners"/>
            </div>
          </div>
        </template>
      </detail-toggle>
    </div>
    `
});

// Top level inspector
Vue.component('inspector', {
  props: ['entity', 'selection', 'valid'],
  methods: {
    expand: function() {
      this.$refs.container.expand();
    },
    select_query: function() {
      this.$emit('select-query', this.selection.path);
    },
    evt_close: function() {
      this.$emit('select-entity');
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
          return obj.value.value;
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
          return obj.value.value;
        }
      }
    },
    has_doc: function() {
      return this.brief || this.link;
    },
    content_css: function() {
      if (!this.valid) {
        return "inspector invalid";
      } else {
        return "inspector";
      }
    }
  },
  template: `
    <content-container 
      ref="container" 
      :disable="!entity || !selection" 
      no_padding="true"
      closable="true" 
      v-on:close="evt_close">
      
      <template v-slot:summary>
        <template v-if="entity && selection">
          <div class="inspector-name">
            <div class="inspector-icon">
              <entity-icon x="0" y="0" :entity_data="selection"/>
            </div>
            {{selection.name}}
            <icon src="search" v-if="selection.is_component" v-on:click.stop="select_query"/>
            <span class="inspector-parent" v-if="parent.length">
            - <entity-reference :entity="parent" v-on="$listeners"/>
            </span>
          </div>
        </template>
        <template v-else>
          Entity inspector
        </template>
      </template>
      <template v-slot:detail v-if="entity && selection">
        <div :class="content_css">
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
              <inspector-components :path="k" :type="v.type" :show_header="true" v-on="$listeners"/>
            </template>

            <inspector-components 
              :entity="entity" 
              :path="selection.path" 
              :show_header="entity.is_a" 
              v-on="$listeners"/>
          </div>
        </div>
      </template>
    </content-container>
    `
});
