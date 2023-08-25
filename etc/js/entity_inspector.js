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

function unit_from_type(type) {
  if (type && type.length > 1) {
    if (inspector_is_object(undefined, type[1])) {
      return type[1].unit;
    }
  }
}

function fmt_float(value) {
  let str = value.toString();
  if (str.indexOf('.') == -1 || str.indexOf('e') != -1) {
    /* if number is not a floating point or has e notation, don't change
     * anything */
    return value;
  } else {
    /* if number is floating point, reduce precision to readable amount */
    let num = 4 - str.split('.')[0].length;
    if (num < 0) {
      num = 0;
    }
    return Number.parseFloat(value.toFixed(num));
  }
}

// Formatting functions for units
function fmt_percentage(value) {
  return fmt_float(value *= 100);
}

function fmt_duration(seconds) {
  let result = "";

  if (seconds === 0) {
    return "0s";
  }

  let days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * (24 * 60 * 60);

  let hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * (60 * 60);

  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  
  if (days) {
    result += days + "d\xa0";
  }
  if (hours || (result.length && minutes && seconds)) {
    result += hours + "h\xa0";
  }
  if (minutes || (result.length && seconds)) {
    result += minutes + "min\xa0";
  }
  if (seconds) {
    if (seconds < 1 && (!days && !hours && !minutes)) {
      result += fmt_float(seconds);
    } else {
      // don't bother with decimals of seconds when the duration is longer than
      // a minute.
      result += Math.round(seconds);
    }
    result += "s";
  }

  return result;
}

function fmt_date(seconds) {
  let date = new Date(seconds * 1000);
  return date.toDateString();
}

// Key (property name)
Vue.component('inspector-key', {
  props: {
    prop_key: { type: String, required: true },
  },
  template: `<span v-if="prop_key !== undefined" class="inspector-key">{{prop_key}}</span>`
});

// Inspector-value component
Vue.component('inspector-value', {
  props: {
    type: { type: Array, required: true },
    value: { type: [Boolean, Number, String, Object, Array], required: true },
    symbol: { type: String, required: false },
    separator: { type: Boolean, required: false },
    list: { type: Boolean, required: true }
  },
  functional: true,
  render: function (h, context) {
    const props = context.props;
    const type = props.type ? props.type[0] : undefined;
    const value = props.value;
    let unit = unit_from_type(props.type);
    let error_range, warning_range;
    if (props.type[1]) {
      error_range = props.type[1].error_range;
      warning_range = props.type[1].warning_range;
    }

    let formatted_value = value;
    let actual_symbol = props.symbol;
    let css_classes = ["inspector-value"];
    let content = props.separator ? ",\xa0" : "";

    if (typeof(value) == "object") {
      formatted_value = JSON.stringify(value); // TODO
    } else
    if (type) {
      css_classes.push(`inspector-value-${context.props.type[0]}`);
      if (type === "text") {
        if (unit === undefined) {
          if (value) {
            formatted_value = "\"" + value + "\"";
          } else {
            formatted_value = "";
          }
        }
      } else
      if (unit) {
        if (unit === "flecs.units.Percentage") {
          formatted_value = fmt_percentage(value);
        } else 
        if (unit === "flecs.units.Duration.Seconds") {
          formatted_value = fmt_duration(value);
          actual_symbol = undefined;
        } else
        if (unit === "flecs.units.Duration.Minutes") {
          formatted_value = fmt_duration(value * 60);
        } else
        if (unit === "flecs.units.Duration.Minutes") {
          formatted_value = fmt_duration(value * 60);
        } else
        if (unit === "flecs.units.Duration.Hours") {
          formatted_value = fmt_duration(value * 60 * 60);
        } else
        if (unit === "flecs.units.Duration.Days") {
          formatted_value = fmt_duration(value * 60 * 60 * 24);
        } else
        if (unit === "flecs.units.Time.Date") {
          formatted_value = fmt_date(value);
        } else if (typeof(value) == "number") {
          formatted_value = fmt_float(value);
        }
      } else if (typeof(value) == "number") {
        formatted_value = fmt_float(value);
      }
    }

    content += formatted_value.toString().trim();
    if (actual_symbol) {
      content += "\xa0" + actual_symbol;
    }

    let is_error = false;
    if (error_range) {
      if (value < error_range[0] || value > error_range[1]) {
        css_classes.push("inspector-value-error");
        is_error = true;
      }
    }
    if (warning_range) {
      if (value < warning_range[0] || value > warning_range[1]) {
        if (!is_error) {
          css_classes.push("inspector-value-warning");
        }
      }
    }

    if (type == "entity") {
      if (content != "0") {
        let hierarchy;
        if (props.list) {
          hierarchy = h('entity-hierarchy', {
            props: { entity_path: content } });
        }

        content = 
          h(
            'entity-reference', { 
              props: {
                entity: content,
                show_name: true,
                click_name: false
              },
              on: {
                "select-entity": (evt) => {
                  const emit_event = context.listeners["select-entity"];
                  if (emit_event) {
                    emit_event(evt);
                  }
                }
              }
            }
          );
        
        if (hierarchy) {
          content = h('div', [hierarchy, content]);
        }

        css_classes.push("inspector-component-object");
      } else {
        content = "null";
      }
    }

    if (unit === "flecs.units.Uri.Hyperlink") {
      content = h(
        'a', { 
          attrs: {
            href: content,
            target: "_blank"
          },
          class: ["inspector-link"]
        }, 
        [content]
      );
    }

    return h(
      'span', { class: css_classes, }, [content]
    );
  }
});

// Inspector-value component
Vue.component('inspector-editable-value-input', {
  props: {
    type: { type: Array, required: true },
  },
  data: function() {
    return {
      edit_value: ""
    }
  },
  methods: {
    focus(value) {
      this.edit_value = value;
      this.$refs.input.focus();
      this.$nextTick(() => {
        this.$refs.input.select();
      });
    },
    to_json() {
      return this.edit_value;
    },
    on_submit() {
      this.$emit("submit-value");
    }
  },
  template: `
    <div>
      <input type="text" 
        class="inspector-editable-value-input" 
        @focus="$event.target.select()"
        @keydown.enter="on_submit"
        v-model="edit_value"
        ref="input">
      </input>
    </div>
  `
});

// Inspector-value component
Vue.component('inspector-editable-value', {
  props: {
    type: { type: Array, required: true },
    value: { type: [Boolean, Number, String, Object, Array], required: true },
    symbol: { type: String, required: false },
    value_css: { type: String, required: true },
    list: { type: Boolean, required: true }
  },
  data: function() {
    return {
      edit: false
    }
  },
  methods: {
    on_edit() {
      this.edit = true;
      this.$nextTick(() => {
        this.$refs.input.focus(this.value);
        this.$emit("edit-value", this);
      });
    },
    on_discard() {
      this.edit = false;
      this.$emit("discard-value");
    },
    to_json() {
      return this.$refs.input.to_json();
    },
    discard() {
      this.on_discard();
    },
    on_submit() {
      this.$emit("submit-value");
    }
  },
  template: `
    <div class="inspector-editable-value">
      <template v-if="edit">
        <inspector-editable-value-input
          :css="value_css"
          :type="type"
          ref="input"
          v-on:submit-value="on_submit"/>
          <icon-button icon="codicons:discard" :size="16" v-on:click="on_discard"/>
      </template>
      <template v-else>
        <inspector-value 
          :css="value_css" 
          :type="type" 
          :value="value" 
          :symbol="symbol" 
          :list="list"
          v-on="$listeners"/>
        <icon-button icon="codicons:edit" :size="16" v-on:click="on_edit"/>
      </template>
    </div>
  `
});

// Inspector-value component
Vue.component('inspector-extended-value', {
  props: {
    type: { type: Array, required: true },
    value: { type: [Boolean, Number, String, Object, Array], required: true },
  },
  functional: true,
  render: function (h, context) {
    const props = context.props;
    const unit = unit_from_type(props.type);
    if (unit === "flecs.units.Uri.Image") {
      const img = h('img', {
        attrs: {
          src: props.value
        },
        class: ["inspector-image"]
      });

      return h('a', {
        attrs: {
          href: props.value,
          target: "_blank"
        }
      }, [ img ]);
    }
  }
});

// Key-value pair (as shown in entity inspector)
Vue.component('inspector-kv', {
  props: {
    parent_prop: { required: false },
    prop_key: { required: false },
    type: { type: Array, required: true },
    value: { type: [Boolean, Number, String, Object, Array, null], required: true },
    list: { type: Boolean, required: true },
    first: { type: Boolean, required: false }
  },
  methods: {
    edit_value(input) {
      this.$emit("edit-key-value", {
        key: this.full_prop,
        input: input
      });
    },
    discard_value(input) {
      this.$emit("discard-key-value");
    }
  },
  computed: {
    is_object: function() {
      return inspector_is_object(this.type, this.value);
    },
    value_css: function() {
      return "inspector-kv-value";
    },
    symbol: function() {
      if (this.type && this.type.length > 1) {
        if (inspector_is_object(undefined, this.type[1])) {
          return this.type[1].symbol;
        }
      }
      return "";
    },
    full_prop: function() {
      if (this.parent_prop) {
        return this.parent_prop + '.' + this.prop_key;
      }
      return this.prop_key;
    },
    extended_value: function() {
      let unit = unit_from_type(this.type);
      if (unit == "flecs.units.Uri.Image") {
        return true;
      }
      return false;
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
                <inspector-props :parent_prop="full_prop" :type="type" :value="value" :list="list"
                  v-on="$listeners">
                </inspector-props>
              </template>
            </detail-toggle>
          </div>
        </template>
        <template v-else>
          <div class="inspector-kv-column">
            <div class="inspector-kv-column-row">
              <inspector-key :prop_key="prop_key"/>
              <inspector-editable-value 
                :value_css="value_css" 
                :type="type" 
                :value="value" 
                :symbol="symbol"
                :list="list"
                v-on:edit-value="edit_value"
                v-on:discard-value="discard_value"
                v-on="$listeners">
              </inspector-editable-value>
            </div>
            <template v-if="extended_value">
              <inspector-extended-value
                :type="type" 
                :value="value">
              </inspector-extended-value>
            </template>
          </div>
        </template>
      </template>
      <template v-else>
        <inspector-value :type="type" :value="value" :separator="!first" :list="list"
          v-on="$listeners"/>
      </template>
    </div>
    `
});

// Component properties
Vue.component('inspector-props', {
  props: {
    parent_prop: { required: false },
    type: { type: Object, required: true },
    value: { type: [Boolean, Number, String, Object, Array], required: true },
    list: { type: Boolean, required: true }
  },
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
          <div class="inspector-prop" v-for="(v, k, i) in value"><template v-if="i && list">,&nbsp</template><inspector-kv :parent_prop="parent_prop" :type="prop_type(k)" ":value="v" :list="list" v-on="$listeners"/></div>
        </template>
        <template v-else>
          <div class="inspector-prop" v-for="(v, k, i) in value"><inspector-kv :parent_prop="parent_prop" :prop_key="k" :type="prop_type(k)" :value="v" :list="list" :first="i == 0" v-on="$listeners"/></div>
        </template>
      </template>
      <template v-else>
        <div class="inspector-prop">
          <inspector-kv :parent_prop="parent_prop" :type="type" :value="value" :list="list" 
            v-on="$listeners"/>
        </div>
      </template>
    </div>
    `
});

// Component
Vue.component('inspector-component', {
  props: ['entity', 'index'],
  methods: {
    search_component() {
      if (this.obj) {
        this.$emit('append-query', '(' + this.pred + ", " + this.obj + ')');
      } else {
        this.$emit('append-query', this.pred);
      }
    },
    search_relationship() {
      this.$emit('append-query', '$(' + this.pred + ')');
    },
    edit_key_value(kv) {
      this.$emit("edit-component", {
        id: this.id,
        kv: kv
      })
    },
    discard_key_value() {
      this.$emit("discard-component", {
        id: this.id,
      });
    }
  },
  computed: {
    id: function() {
      return this.entity.ids[this.index];
    },
    id_label: function() {
      if (this.entity.id_labels) {
        return this.entity.id_labels[this.index];
      } else {
        if (this.obj) {
          return [name_from_path(this.pred), name_from_path(this.obj)];
        } else {
          return [name_from_path(this.pred)];
        }
      }
    },
    pred: function() {
      return this.id[0];
    },
    obj: function() {
      if (this.id.length > 1) {
        return this.id[1];
      } else {
        return undefined;
      }
    },
    pred_label: function() {
      return this.id_label[0];
    },
    obj_label: function() {
      return this.id_label[1];
    },
    value: function() {
      if (this.entity.values) {
        let result = this.entity.values[this.index];
        if (result !== 0) {
          return result;
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    },
    type_info: function() {
      if (this.entity.type_info) {
        return this.entity.type_info[this.index];
      } else {
        return 0;
      }
    },
    hidden: function() {
      if (this.entity.hidden) {
        return this.entity.hidden[this.index];
      } else {
        return false;
      }
    },
    name_css: function() {
      if (this.hidden) {
        return "inspector-component-name inspector-component-overridden";
      } else {
        return "inspector-component-name";
      }
    }
  },
  template: `
    <div class="inspector-component">
      <div class="inspector-component-name">
        <detail-toggle :show_detail="value != undefined" summary_toggle="true">
          <template v-slot:summary>
            <div :class="name_css">
              <entity-reference :entity="pred" :label="pred_label" :disabled="true" show_name="true" v-on="$listeners"/><template v-if="obj">:&nbsp;<span class="inspector-component-object"><entity-reference 
                :entity="obj" 
                :label="obj_label"
                show_name="true" 
                click_name="true"
                v-on="$listeners"/></span></template>
              <icon-button icon="codicons:search" :size="16" v-on:click.stop="search_component"/>
              <template v-if="obj">
                <icon-button icon="codicons:regex" :size="16" v-on:click.stop="search_relationship"/>
              </template>
            </div>
          </template>
          <template v-slot:detail>
            <inspector-props v-if="value !== undefined" 
              :type="type_info" 
              :value="value"
              :list="false"
              v-on:edit-key-value="edit_key_value"
              v-on:discard-key-value="discard_key_value"
              v-on="$listeners"/>
          </template>
        </detail-toggle>
      </div>
    </div>
    `
});

// Components of entity and/or base entities
Vue.component('inspector-components', {
  props: ['entity', 'show_header', 'is_base'],
  computed: {
    ids: function() {
      if (!this.entity) {
        return [];
      }
      return this.entity.ids;
    },
    categories: function() {
      if (!this.entity) {
        return [];
      }

      let parents = {};
      const ids = this.entity.ids;
      
      for (let i = 0; i < ids.length; i ++) {
        let id = this.entity.ids[i];
        let parent = parent_from_path(id[0]);
        if (!parent.length) {
          parent = "root";
        }

        if (parents[parent] === undefined) {
          parents[parent] = [];
        }

        parents[parent].push(i);
      }

      return parents;
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
      <detail-toggle :show_summary="show_header" :show_divider="true">
        <template v-slot:summary>
          <span class="inspector-header" v-if="show_header">
            <entity-reference 
              :text="is_base ? 'inherited from' : ''" 
              :entity="entity.path" 
              show_name="true" 
              :disabled="true" 
              icon_link="true" 
              v-on="$listeners"/>
          </span>
        </template>
        <template v-slot:detail>
          <div :class="detail_css">
            <div class="inspector-components-content">
              <div v-for="(category_ids, k) in categories">
                <div class="inspector-category">
                  <detail-toggle>
                    <template v-slot:summary>
                      <div class="inspector-category-header">
                        <entity-hierarchy :entity_path="k" :is_path="true"></entity-hierarchy>
                      </div>
                    </template>
                    <template v-slot:detail>
                      <div class="inspector-props" v-on="$listeners">
                        <inspector-component v-for="k in category_ids" 
                          :entity="entity" 
                          :index="k"
                          :key="k" 
                          v-on="$listeners">
                        </inspector-component>
                      </div>
                    </template>
                  </detail-toggle>
                </div>
              </div>
            </div>
          </div>
        </template>
      </detail-toggle>
    </div>
    `
});

// Top level inspector
const inspector_component = Vue.component('inspector', {
  props: ['valid'],
  data: function() {
    return {
      entity: undefined,
      entity_name: undefined,
      error: undefined,
      edit_count: 0,
      edit_inputs: {},
      url: undefined,
      view: "components",
      show_private: false
    }
  },
  watch: {
    show_private: function() {
      this.refresh();
    }
  },
  methods: {
    expand() {
      this.$refs.container.expand();
    },
    select_query() {
      this.$emit('select-query', this.entity_name);
    },
    invalid_entity_error(msg) {
      this.error = msg;
    },
    refresh() {
      if (!this.entity_name) {
        return;
      }

      if (this.$refs.container.is_closed()) {
        return;
      }

      const request_alerts = this.view == "alerts";
      const request_components = this.view == "components";
      const request_refs = this.view == "refs";

      const r = app.request_entity('inspector', this.entity_name, (reply, url) => {
        if (reply) {
          this.error = reply.error;
        }
        if (this.error === undefined) {
          this.entity = reply;
          this.url = url;
          this.error = undefined;
        } else {
          this.invalid_entity_error(this.error);
        }
      }, () => {
        this.invalid_entity_error(
          "request for entity '" + this.entity_name + "' failed");
      }, {
        type_info: request_components, 
        label: true,
        brief: true, 
        link: true, 
        color: true,
        id_labels: request_components, 
        values: request_components,
        alerts: request_alerts,
        refs: request_refs ? "*" : undefined,
        private: this.show_private
      });

      if (this.$refs.container) {
        this.$refs.container.set_url(r);
      }
    },
    set_entity(path) {
      if (path == this.entity_name) {
        return;
      }

      app.request_abort('inspector');

      this.entity = undefined;
      this.error = undefined;
      this.entity_name = path;
      this.view = "components";

      if (path == undefined) {
        this.close();
        return;
      } else {
        this.open();
      }

      this.expand();
      this.refresh();
    },
    name_from_path(path) {
      return name_from_path(path);
    },
    open() {
      this.$refs.container.open();
    },
    close() {
      this.$refs.container.close();
    },
    get_entity() {
      return this.entity_name;
    },
    evt_panel_update() {
      this.$emit('panel-update');
    },
    evt_close() {
      this.$emit('select-entity');
    },
    has_id(look_for) {
      const entity = this.entity;
      if (entity && entity.ids) {
        for (let i = 0; i < entity.ids.length; i ++) {
          const id = entity.ids[i].join(",");
          if (id === look_for) {
            return true;
          }
        }
      }
      return false;
    },
    set_as_query() {
      if (this.entity) {
        this.$emit('select-query', "?- " + this.entity.path);
      }
    },
    navigate() {
      if (this.entity) {
        this.$emit('tree-navigate', this.entity.path);
      }
    },
    navigate_parent() {
      if (this.entity) {
        this.$emit('select-entity', this.parent);
      }
    },
    enable_entity() {
      app.enable_entity(this.entity.path);
    },
    disable_entity() {
      app.disable_entity(this.entity.path);
    },
    set_components() {
      let set_request = {
        ids: [],
        values: []
      };

      for (const component in this.edit_inputs) {
        const comp_input = this.edit_inputs[component];
        const comp_input_value = comp_input.value;
        if (typeof comp_input_value === 'object') {
          let comp_value = {};
          for (const key in comp_input_value) {
            const input = comp_input_value[key];
            comp_value[key] = input.to_json();
            input.discard();
          }
          set_request.ids.push(comp_input.id);
          set_request.values.push(comp_value);
        } else {
          set_request.ids.push(comp_input.id);
          set_request.values.push(comp_input_value.to_json());
          comp_input_value.discard();
        }
      }

      app.set_components(this.entity.path, set_request);
    },
    delete_entity() {
      app.delete_entity(this.entity.path);
    },
    edit_component(evt) {
      this.edit_count ++;

      let id = evt.id.join(",");
      if (!this.edit_inputs[id]) {
        this.edit_inputs[id] = {count: 0, id: evt.id};
      }

      const edit_comp = this.edit_inputs[id];
      if (evt.kv.key) {
        if (!edit_comp.value) {
          edit_comp.value = {};
        }
        edit_comp.value[evt.kv.key] = evt.kv.input;
      } else {
        edit_comp.value = evt.kv.input;
      }
      edit_comp.count ++;

      this.$emit("request-focus");
    },
    discard_component(evt) {
      this.edit_count --;
      this.edit_inputs[evt.id].count --;
      if (!this.edit_inputs[evt.id].count) {
        delete this.edit_inputs[evt.id];
      }
    },
    select_view(view) {
      this.view = view;
      this.refresh();
    }
  },
  computed: {
    parent: function() {
      return parent_from_path(this.entity.path);
    },
    has_parent: function() {
      return this.parent.length != 0;
    },
    brief: function() {
      if (!this.entity) {
        return undefined;
      }

      return this.entity.brief;
    },
    link: function() {
      if (!this.entity) {
        return undefined;
      }

      return this.entity.link;
    },
    has_doc: function() {
      return this.brief || this.link;
    },
    is_valid: function() {
      return this.valid && (this.error === undefined);
    },
    content_css: function() {
      if (!this.is_valid) {
        return "inspector invalid";
      } else {
        return "inspector";
      }
    },
    status_error: function() {
      return Status.Error;
    },
    is_query: function() {
      return this.has_id("flecs.core.Poly,flecs.core.Query") || this.has_id("flecs.core.Query");
    },
    is_disabled: function() {
      return this.has_id("flecs.core.Disabled");
    },
    connected() {
      return app.connection == ConnectionState.Remote;
    },
    alerts: function() {
      if (!this.entity || !this.entity.alerts) {
        return [];
      }

      let map = {};
      let result = [];
      for (let a of this.entity.alerts) {
        let path = a.path;
        const root = this.entity.path;
        if (!a.path) {
          path = "self";
        } else {
          path = path.slice(root.length + 1);
        }

        let obj = map[path];
        if (!obj) {
          obj = {path: path, alerts: []};
          result.push(obj);
          map[path] = obj;
        }

        obj.alerts.push(a);
      }

      return result;
    },
    refs: function() {
      if (!this.entity || !this.entity.refs) {
        return [];
      }

      return this.entity.refs;
    }
  },
  template: `
    <content-container 
      ref="container"
      :no_padding="true"
      :closable="true"
      :show_detail="entity_name != undefined"
      v-on:close="evt_close"
      v-on:panel-update="evt_panel_update">
      
      <template v-slot:summary>
        <template>
          <div v-if="entity">
            <entity-icon :entity_data="entity" :x="0" :y="0"></entity-icon>
            &nbsp;
          </div>
        </template>
        <template v-if="entity && entity.label">
          {{entity.label}}
        </template>
        <template v-else-if="entity && entity.path">
          {{name_from_path(entity.path)}}
        </template>
        <template v-else-if="entity_name">
          {{name_from_path(entity_name)}}
        </template>
        <template v-else>
          Entity inspector
        </template>
      </template>

      <template v-slot:detail v-if="entity">
        <div :class="content_css">
          <div class="inspector-doc" v-if="has_doc">
            <span class="inspector-brief" v-if="brief">
              {{brief}}
            </span>
            <span class="inspector-link" v-if="link">
              <a :href="link" target="_blank">[link]</a>
            </span>
          </div>

          <div class="inspector-buttons">
            <span class="inspector-button inspector-icon-button noselect"
              v-on:click="navigate" v-tooltip="'Show in treeview'">
                &nbsp;<icon icon="codicons:list-tree" :size="16"></icon>&nbsp;
            </span>
            <span class="inspector-button inspector-icon-button noselect" v-if="parent"
              v-on:click="navigate_parent" v-tooltip="'Go to parent ' + parent">
                &nbsp;<icon icon="codicons:arrow-up" :size="16"></icon>&nbsp;
            </span>
            <template v-if="is_query">
              <span class="inspector-button noselect"
                v-on:click="set_as_query" v-tooltip="'Use as query'">
                &nbsp;<icon icon="codicons:search" :size="16"></icon>&nbsp;
              </span>
            </template>
            <template v-if="is_disabled">
              <span class="inspector-button noselect" 
                  style="display: inline-block; width: 50px; text-align: center;"
                  v-on:click="enable_entity" v-tooltip="'Enable/Disable'">
                Enable
              </span>
            </template>
            <template v-else>
              <span class="inspector-button noselect" 
                  style="display: inline-block; width: 50px; text-align: center;"
                  v-on:click="disable_entity" v-tooltip="'Enable/Disable'">
                Disable
              </span>
            </template>
            <template v-if="edit_count">
              <span class="inspector-button inspector-icon-button noselect"
                v-on:click="set_components">
                  &nbsp;<icon icon="codicons:save" :size="16" v-tooltip="'Save modifications'"></icon>&nbsp;
              </span>
            </template>
            <template v-else>
              <span class="inspector-button inspector-button-disabled inspector-icon-button noselect"
                v-on:click="set_components">
                  &nbsp;<icon icon="codicons:save" :size="16"></icon>&nbsp;
              </span>
            </template>
            <span class="inspector-button inspector-icon-button noselect"
              v-on:click="delete_entity" v-tooltip="'Delete entity'">
                &nbsp;<icon icon="codicons:trash" :size="16"></icon>&nbsp;
            </span>
          </div>

          <div class="inspector-view">
            <tabs :options="[{
              label: 'Components',
              value: 'components'
            }, {
              label: 'Referenced by',
              value: 'refs'
            }, {
              label: 'Alerts',
              value: 'alerts'
            }]" v-on:select="select_view"></tabs>
          </div>

          <template v-if="view == 'components'">
            <div class="inspector-toggle noselect">
              <toggle-button v-model="show_private"></toggle-button>
              Show private
            </div>
            <div class="inspector-content">
              <template v-for="(v, k) in entity.is_a">
                <inspector-components :entity="v" :show_header="true" is_base="true" v-on="$listeners"/>
              </template>

              <inspector-components 
                :entity="entity" 
                :show_header="entity.is_a != undefined" 
                v-on:edit-component="edit_component"
                v-on:discard-component="discard_component"
                v-on:submit-value="set_components"
                v-on="$listeners"/>
            </div>
          </template>
          <template v-else-if="view == 'refs'">
            <template v-if="Object.keys(refs).length != 0">
              <div class="inspector-refs inspector-category" v-for="(v, k) in refs">
                <detail-toggle>
                  <template v-slot:summary>
                    <div class="inspector-category-header">
                      {{k}}
                    </div>
                  </template>
                  <template v-slot:detail>
                    <inspector-refs :refs="v" v-on="$listeners"></inspector-refs>
                  </template>
                </detail-toggle>
              </div>
            </template>
            <template v-else>
              <div class="inspector-no-content">
                No references
              </div>
            </template>
          </template>
          <template v-else-if="view == 'alerts'">
            <template v-if="alerts.length != 0">
              <div class="inspector-alerts inspector-category" v-for="a in alerts">
                <detail-toggle>
                  <template v-slot:summary>
                    <div class="inspector-category-header">
                      {{a.path}}
                    </div>
                  </template>
                  <template v-slot:detail>
                    <inspector-alerts :alerts="a.alerts"></inspector-alerts>
                  </template>
                </detail-toggle>
              </div>
            </template>
            <template v-else>
              <div class="inspector-no-content">
                No alerts
              </div>
            </template>
          </template>
        </div>
      </template>

      <template v-slot:footer>
        <status :status="error"
          :kind="status_error">
        </status>
      </template>
    </content-container>
    `
});
