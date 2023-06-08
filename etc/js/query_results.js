
Vue.component('query-results-table', {
  props: {
    columns: {type: Object, required: true},
    show_this: {type: Boolean, required: true},
    headers: {type: Array, required: false },
    row_icon: {type: String, required: false }
  },
  data: function() {
    return {
      order_by: { kind: 'this', mode: 'asc', mode_index: 0 },
      group_enabled: {}
    }
  },
  methods: {
    // Get sorted index for i
    index(i) {
      if (this.columns.data.index && this.columns.data.index.length != 0) {
        return this.columns.data.index[i].index;
      } else {
        return i;
      }
    },
    // Get type info for term
    type_info(term) {
      if (this.columns.type_info) {
        let id = this.columns.ids[term];
        if (Array.isArray(id)) {
          let result = this.columns.type_info[id[0]];
          if (result) {
            return result;
          }
          return this.columns.type_info[id[1]];
        } else {
          return this.columns.type_info[id];
        }
      }
    },
    // Format header of (component) term
    id_elem(str) {
      const elems = str.split('.');
      return elems[elems.length - 1];
    },
    term_header(term) {
      const id = this.columns.ids[term];
      let result;

      if (Array.isArray(id)) {
        /* New format, pairs are split up in array */
        if (id.length == 1) {
          result = this.id_elem(id[0]);
        } else {
          const first = this.id_elem(id[0]);
          const second = this.id_elem(id[1]);
          result = "(" + first + "," + second + ")";
        }
      } else {
        /* Old format, backwards compatibility */
        const pair = id.split(',');
        if (pair.length == 1) {
          result = this.id_elem(pair[0]);
        } else {
          const first = this.id_elem(pair[0].slice(1));
          const second = this.id_elem(pair[1].slice(0, -1));
          result = "(" + first + "," + second + ")";
        }
      }

      let ti = this.type_info(term);
      if (ti) {
        // If type info has a single member we can use its type info for the
        // entire column, otherwise ignore.
        const keys = Object.keys(ti);
        if (keys.length == 1) {
          ti = ti[keys[0]];
        } else {
          ti = undefined;
        }
      }
      if (ti) {
        // Extended type properties are in the second element of the array
        const ext = ti[1];
        if (ext && ext.symbol) {
          if (ext.quantity != "flecs.units.Duration") {
            result += "\xa0(" + ext.symbol + ")";
          }
        }
      }
      return result;
    },
    // Is term a component or a tag
    term_is_tag(term) {
      if (!this.columns.data.values) {
        return true;
      }
      return !this.columns.data.values[term];
    },
    group_is_enabled(group) {
      let result = this.group_enabled[group];
      if (result === undefined) {
        result = true;
      }
      return result;
    },
    toggle_group(group) {
      let enabled = this.group_is_enabled(group);
      this.group_enabled[group] = !enabled;
    },
    create_none(h) {
      return h('td', [h('span', { class: "query-result-cell-none" }, ["None"])]);
    },
    // Order by logic
    on_order_by(evt) {
      let modes;
      let mode_index = 0;

      if (evt.kind !== 'var') {
        modes = ['asc', 'desc'];
      } else {
        modes = ['asc', 'desc', 'group', 'group_only'];
      }

      if (evt.kind == this.order_by.kind && evt.index == this.order_by.index) {
        mode_index = this.order_by.mode_index;
        mode_index = (mode_index + 1) % modes.length;
      }

      this.order_by.kind = evt.kind;
      this.order_by.index = evt.index;
      this.order_by.mode_index = mode_index;
      this.order_by.mode = modes[mode_index];

      this.$emit('order-by', this.order_by);
    },
    header_title(index, value) {
      if (this.headers && this.headers[index]) {
        return this.headers[index];
      }
      return value;
    },
    // Create table header
    create_header(h) {
      const columns = this.columns;
      const data = columns.data;
      let ths = [];

      const order_by_icon = {
        asc: "codicons:triangle-down",
        desc: "codicons:triangle-up",
        group: "codicons:diff-added",
        group_only: "codicons:diff-removed"
      }[this.order_by.mode];

      const icon = h('icon', { 
        props: { icon: order_by_icon, size: 10 } 
      });

      const icon_elem = h('span', { 
        class: 'query-results-order-by-icon' }, 
      [icon]);

      const icon_placeholder = h('span', {
        class: 'query-results-order-by-icon-placeholder'
      }, ["\xa0"]);

      if (this.order_by.mode !== 'group_only') {
        let column = 0;

        if (this.row_icon) {
          // Insert placeholder in header for row icon
          ths.push(h('th', {}));
        }

        if (data.entities && data.entities.length && this.show_this) {
          ths.push(h('th', { on: {
            click: () => { this.on_order_by({kind: 'this'}); }
          }}, [this.header_title(column, "Entity"), this.order_by.kind === "this" 
            ? icon_elem 
            : icon_placeholder
          ]));
          column ++;
        }

        if (columns.vars) {
          let i = 0;
          for (let var_name of columns.vars) {
            var_name_elems = var_name.split(".");
            var_name = var_name_elems[var_name_elems.length - 1];
            var_name = this.header_title(column, var_name);
            column ++;

            let index = i; // prevents hoisting of i
            ths.push(h('th', { on: {
              click: () => { this.on_order_by({kind: 'var', index: index}); }
            }}, [var_name, (this.order_by.kind === 'var' && this.order_by.index === i) 
              ? icon_elem 
              : icon_placeholder
            ]));

            i ++;
          }
        }

        if (columns.ids) {
          for (let i = 0; i < columns.ids.length; i ++) {
            if (!this.term_is_tag(i)) {
              let name = this.term_header(i);
              name = this.header_title(column, name);
              column ++;

              let index = i; // prevents hoisting of i
              ths.push(h('th', { on: {
                click: () => { this.on_order_by({kind: 'value', index: index}); }
              }}, [name, (this.order_by.kind === 'value' && this.order_by.index === i) 
                ? icon_elem 
                : icon_placeholder
              ]));
            }
          }
        }

        ths.push( h('th', { class: 'query-results-squeeze'}) );
      } else {
        const index = this.order_by.index;
        const var_name = columns.vars[index];
        ths.push(h('th', { on: {
          click: () => { this.on_order_by({kind: 'var', index: index}); }
        }}, [var_name, icon_elem]));
      }

      return h('thead', 
        { class: ['query-results-table-header'] },
        [ h('tr', { class: 'query-results-header-row' }, ths) ]
      );
    },
    // Create entity table cells
    create_entities(h, entities, labels) {
      let td_entities = [];
      if (entities.count && (!labels || !labels.count)) {
        labels = entities;
      }

      for (let i = 0; i < entities.length; i ++) {
        const index = this.index(i);
        const entity = entities[index];
        const label = labels[index];

        if (entity === '*') {
          td_entities.push(this.create_none(h));
          continue;
        }

        const hierarchy = h('entity-hierarchy', {
          props: { entity_path: entity } });

        const ref = h('entity-reference', {
          props: {
            entity: entity, label: label, show_name: true, show_parent: false 
          },
          on: this.$listeners });

        td_entities.push(h('td', [hierarchy, ref]));
      }

      return td_entities;
    },
    create_row_icons(h, count) {
      let td_icons = [];
      for (let i = 0; i < count; i ++) {
        let icon = h('icon', {
          props: { icon: this.row_icon, size: 18, opacity: 0.7 }
        });
        td_icons.push(h('td', {class: 'query-results-row-icon'}, [icon]));
      }
      return td_icons;
    },
    // Create alert table cells
    create_alerts(h, alerts) {
      let td_alerts = [];
      for (let i = 0; i < alerts.length; i ++) {
        const index = this.index(i);
        const alert = alerts[index];
        let icon = undefined;

        if (alert === true) {
          icon = h('icon', {
            props: { icon: "feather:alert-triangle", size: 18, opacity: 0.7 }
          });
        }

        td_alerts.push(h('td', {class: 'query-results-row-icon'}, [icon]));
      }
      return td_alerts;
    },
    // Create variable table cells
    create_vars(h) {
      const columns = this.columns;
      const data = this.columns.data;
      let vars = [];
      let var_groups = [];

      if (columns.vars) {
        for (let i = 0; i < columns.vars.length; i ++) {
          vars.push(
            this.create_entities(h, data.vars[i], data.var_labels[i])
          );
        }

        // Find var groups
        if (this.order_by.mode === 'group' || this.order_by.mode === 'group_only') {
          const var_values = data.vars[this.order_by.index];
          let var_last = undefined;
          let i = 0;

          for (let el of this.columns.data.index) {
            const var_cur = el.order_by;
            if ((var_cur !== var_last)) {
              if (var_groups.length) {
                var_groups[var_groups.length - 1].count = 
                  i - var_groups[var_groups.length - 1].row;
              }
              var_groups.push({
                group: var_cur,
                label: el.label,
                row: i,
              });
              var_last = var_cur;
            }
            i ++;
          }
          var_groups[var_groups.length - 1].count =
            i - var_groups[var_groups.length - 1].row;
        }
      }

      return [vars, var_groups];
    },
    // Create component value table cells
    create_values(h) {
      const columns = this.columns;
      const data = this.columns.data;
      let values = [];

      for (let i = 0; i < columns.ids.length; i ++) {
        if (this.term_is_tag(i)) {
          continue;
        }

        let value_array = [];
        if (data.values[i]) {
          for (let v = 0; v < data.values[i].length; v ++) {
            const index = this.index(v);
            if (!data.is_set[i][index]) {
              value_array.push(this.create_none(h));
            } else {
              const inspector = h('inspector-props', {
                props: {
                  value: data.values[i][index],
                  type: this.type_info(i),
                  list: true
                },
                on: this.$listeners 
              });

              value_array.push(h('td', [inspector]));
            }
          }
        }
        values.push( value_array );
      }

      return values;
    },
    // Create table row
    create_row(h, children, color) {
      let left_border_color = color;
      let row_color = color;

      if (!color) {
        left_border_color = "var(--steel-700)";
        row_color = "var(--steel-500)";
      }
      
      let style = "border-left-color: " + left_border_color + "; ";
      style += "background-color: " + row_color;

      return h('tr', { class: "query-results-row", style: style }, children );
    },
    group_cell(h, group, label, count, colspan) {
      const tree = h('entity-hierarchy', {
        props: { entity_path: group }});

      let chevron = h('icon', {
        props: { 
          icon: this.group_is_enabled(group) 
            ? 'codicons:chevron-down' 
            : 'codicons:chevron-right',
          opacity: 0.7,
          top: 1,
        }});

      chevron = h('div', {
        attrs: {
          style: 'float: left; margin-right: 5px;'
        }
      }, [chevron]);

      if (this.order_by.mode === 'group_only') {
        chevron = undefined;
      }

      const el = h('div', {
      }, [tree, label + "\xa0(" + count + ")"]);

      return h('td', {
        class: 'query-results-group noselect',
        attrs: {
          colspan: colspan + 1,
        }
      }, [chevron, el]);
    },
    // Create table body
    create_body(h) {
      const columns = this.columns;
      const data = columns.data;
      let column_count = 0;
      let trs = [];
      const [vars, var_groups] = this.create_vars(h);

      if (this.order_by.mode !== 'group_only') {
        // Create cells from columns
        let tds = {
          entities: [],
          vars: vars,
          values: this.create_values(h),
          alerts: this.create_alerts(h, data.alerts),
          row_icons: []
        };

        if (this.show_this) {
          tds.entities = this.create_entities(h, data.entities, data.labels);
        }
        if (this.row_icon) {
          tds.row_icons = this.create_row_icons(h, data.entities.length);
        }

        // Initialize rows
        let rows = [];
        for (let i = 0; i < columns.count; i ++) {
          rows.push([]);
        }

        // Populate row children arrays with td elements

        // Add row icons
        if (this.row_icon) {
          for (let i = 0; i < tds.row_icons.length; i ++) {
            rows[i].push(tds.row_icons[i]);
          }
        }

        // Add entity tds
        if (tds.entities.length) {
          column_count ++;
        }
        for (let i = 0; i < tds.entities.length; i ++) {
          rows[i].push(tds.entities[i]);
        }

        // Add variable tds
        for (let var_tds of tds.vars) {
          for (let i = 0; i < var_tds.length; i ++) {
            rows[i].push(var_tds[i]);
          }
          column_count ++;
        }

        // Add value tds
        for (let value_tds of tds.values) {
          for (let i = 0; i < value_tds.length; i ++) {
            rows[i].push(value_tds[i]);
          }
          column_count ++;
        }

        // Add td's at the end that push values to the left
        for (let row of rows) {
          row.push( h('td', { class: 'query-results-squeeze'}) );
        }

        // Add alert tds
        for (let i = 0; i < tds.alerts.length; i ++) {
          rows[i].push(tds.alerts[i]);
        }

        // Create row elements
        for (let i = 0; i < rows.length; i ++) {
          let color;
          if (data.colors) {
            color = data.colors[this.index(i)];
          }
          trs.push(this.create_row(h, rows[i], color));
        }

        // If variable grouping is enabled, insert group headers
        if (this.order_by.mode === 'group') {
          let inserted = 0;
          for (let group of var_groups) {
            const group_td = this.group_cell(
              h, group.group, group.label, group.count, column_count);

            let group_tr_sep = h('tr', {
              class: 'query-results-group-separator'
              }, [h('td', { attrs: { colspan: column_count + 1 } })]);

            let group_class = 'query-results-group-row';
            if (this.group_is_enabled(group.group)) {
              group_class += ' query-results-group-row-enabled';
            }

            let group_tr = h('tr', { 
              class: group_class,
              on: {
                click: (evt) => {
                  this.toggle_group(group.group);
                  this.$forceUpdate();
                }
              }
            }, [group_td]);

            trs.splice(group.row + inserted, 0, [group_tr_sep, group_tr]);
            inserted ++;

            // Remove group rows if group is disabled
            if (!this.group_is_enabled(group.group)) {
              trs.splice(group.row + inserted, group.count);
              inserted -= group.count;
            }
          }
        }
      } else {
        for (let group of var_groups) {
          const group_td = this.group_cell(
            h, group.group, group.label, group.count, column_count);

          let group_tr = h('tr', { 
            class: 'query-results-group-row' 
          }, [group_td]);

          trs.push(group_tr);
        }
      }

      return h('tbody', trs);
    },
    reset() {
      this.order_by = { kind: 'this', mode: 'asc', mode_index: 0 };
      this.group_enabled = {};
      this.$emit('order-by', this.order_by);
    }
  },
  render: function(h) {
    const header = this.create_header(h);
    const body = this.create_body(h);
    return h('table', {class: 'query-results-table'}, [header, body]);
  }
});

Vue.component('query-results', {
    props: {
      data: {type: Object, required: true},
      valid: {type: Boolean, required: true},
      show_this: {type: Boolean, required: false, default: true},
      headers: {type: Array, required: false },
      row_icon: {type: String, required: false }
    },
    data: function() {
      return {
        show_terms: false,
        order_by: { kind: 'this', mode: 'asc', mode_index: 0 }
      }
    },
    methods: {
      result_count(result) {
        if (result.entities) {
          return result.entities.length;
        } else if (result.values) {
          let count = 0;
          for (let i = 0; i < result.values.length; i ++) {
            if (result.values[i].length > count) {
              count = result.values[i].length;
            }
            if (count) {
              return count;
            }
          }
        }
        if (result.vars) {
          return 1;
        }
      },
      append_to(dst, src, count) {
        if (src === 0) {
          return;
        }

        if (Array.isArray(src) && src.length) {
          dst.push(...src);
        } else {
          for (let i = 0; i < count; i ++) {
            dst.push(src);
          }
        }
      },
      order_by_column(evt) {
        this.order_by = evt;
      },
      select_entity(evt) {
        this.$emit('select-entity', evt);
      },
      unpack_value(value) {
        // Return the first non-object value
        while (typeof value === 'object') {
          if (Array.isArray(value)) {
            value = value[0];
          } else {
            value = value[Object.keys(value)[0]];
          }
        }
        if (typeof value === 'string') {
          let num = parseFloat(value);
          if (!isNaN(num)) {
            return num;
          }
        }
        return value;
      },
      reset() {
        if (this.$refs.table) {
          this.$refs.table.reset();
        }
      }
    },
    computed: {
      is_true: function(){
        if (!this.data) {
            return false;
        }
        if (this.error) {
            return false;
        }
        if (!this.data.results) {
            return false;
        }
        if (!this.data.results.length) {
            return false;
        }
        return true;
      },
      has_this: function() {
        if (this.data && this.data.results) {
          if (this.data.results.length) {
            if (this.data.results[0].entities) {
              return true;
            }
          }
        }
        return false;
      },
      variable_count: function() {
        if (this.data && this.data.vars) {
          return this.data.vars.length;
        } else {
          return 0;
        }
      },
      variables: function() {
        if (this.data) {
          return this.data.vars;
        } else {
          return [];
        }
      },
      results: function() {
        if (this.data) {
          return this.data.results;
        } else {
          return [];
        } 
      },
      css: function() {
        let result = "query-results";
        if (this.data && !this.valid) {
          result += " invalid";
        }
        return result;
      },
      columns: function() {
        // Function that combines data from all results into single arrays.
        let r = {
          ids: this.data.ids,
          vars: this.data.vars,
          type_info: this.data.type_info,
          data: {
            index: [], /* Used for sorting */
            entities: [],
            labels: [],
            colors: [],
            is_set: [],
            values: [],
            vars: [],
            var_labels: [],
            alerts: []
          },
          count: 0
        };

        for (let result of this.results) {
          let count = this.result_count(result);

          // Build index for sorting
          // Sort by entity (this) id
          if (result.entities && this.order_by.kind === 'this') {
            let index = 0;
            for (let entity of result.entities) {
              let order_by_value = entity;
              if (result.entity_labels && result.entity_labels[index]) {
                order_by_value = result.entity_labels[index];
              }
              r.data.index.push({
                index: index + r.count,
                order_by: order_by_value
              });
              index ++;
            }
          // Sort by component value
          } else if (this.order_by.kind === 'value') {
            let index = 0;
            const values = result.values[this.order_by.index];
            if (values.length === 1) {
              let value = this.unpack_value(values[0]);
              for (let i = 0; i < (result.entities.length || 1); i ++) {
                r.data.index.push({
                  index: index + r.count,
                  order_by: value
                });
                index ++;
              }
            } else {
              for (let value of values) {
                value = this.unpack_value(value);
                r.data.index.push({
                  index: index + r.count,
                  order_by: value
                });
                index ++;
              }
            }
          // Sort by variable
          } else if (this.order_by.kind === 'var') {
            let index = 0;
            const order_by_value = result.vars[this.order_by.index];
            let label = result.var_labels[this.order_by.index];
            if (label === 0) {
              label = result.vars[this.order_by.index];
              label = label.split('.');
              label = label[label.length - 1];
            }
            if (label === '*') {
              label = 'None';
            }
            for (let i = 0; i < (result.entities.length || 1); i ++) {
              r.data.index.push({
                index: index + r.count,
                order_by: order_by_value,
                label: label
              });
              index ++;
            }
          }

          // Sort indices used for iterating the results
          r.data.index.sort((a, b) => {
            let a_str = a.order_by;
            let b_str = b.order_by;

            if (typeof a_str === 'number' && typeof b_str === 'number') {
              return (a_str - b_str) - (b_str - a_str);
            }

            if (typeof a_str === 'number') {
              a_str = "" + a_str;
            }
            if (typeof b_str === 'number') {
              b_str = "" + b_str;
            }

            return a_str.localeCompare(b_str);
          });

          // Apply order mode
          if (this.order_by.mode === 'desc') {
            r.data.index.reverse();
          }

          // Append entity names, labels and colors
          if (result.entities) {
            if (!result.parent) {
              r.data.entities.push(...result.entities);
            } else {
              for (let i = 0; i < result.entities.length; i ++) {
                const path = result.parent + "." + result.entities[i];
                r.data.entities.push(path);
              }
            }
            if (result.entity_labels) {
              r.data.labels.push(...result.entity_labels);
            } else {
              r.data.labels.push(...result.entities);
            }
            if (result.alerts === true) {
              this.append_to(r.data.colors, "var(--red)", count);
            } else {
              if (result.colors) {
                r.data.colors.push(...result.colors);
              } else {
                for (let i = 0; i < result.entities.length; i ++) {
                  r.data.colors.push(undefined);
                }
              }
            }
          }

          // Append component values
          if (result.values) {
            for (let i = 0; i < result.values.length; i ++) {
              if (r.data.values.length <= i) {
                if (result.values[i] === 0) {
                  r.data.values.push(0);
                } else {
                  r.data.values.push([]);
                }
                r.data.is_set.push([]);
              }

              let is_set = true;
              if (result.is_set) {
                is_set = result.is_set[i];
              }
              let value = 0;
              if (result.values) {
                value = result.values[i];
              }

              this.append_to(r.data.values[i], value, count);
              this.append_to(r.data.is_set[i], is_set, count);
            }
          }

          // Append variables & variable labels
          if (result.vars) {
            for (let i = 0; i < result.vars.length; i ++) {
              if (r.data.vars.length <= i) {
                r.data.vars.push([]);
              }
              if (r.data.var_labels.length <= i) {
                r.data.var_labels.push([]);
              }
              this.append_to(r.data.vars[i], result.vars[i], count);
              if (result.var_labels[i] !== 0) {
                this.append_to(r.data.var_labels[i], result.var_labels[i], count);
              } else {
                this.append_to(r.data.var_labels[i], result.vars[i], count);
              }
            }
          }

          // Append alerts
          if (result.alerts === true) {
            this.append_to(r.data.alerts, true, count);
          } else {
            this.append_to(r.data.alerts, false, count);
          }

          r.count += count;
        }

        return r;
      }
    },
    template: `
      <div :class="css">
        <template v-if="data && valid && !has_this && ((variable_count == 0) || !results.length)">
          <div v-if="data && is_true" class="noselect query-result-yesno"> Yes </div>
          <div v-else class="noselect query-result-yesno"> No results </div>
        </template>
        <template v-else>
          <query-results-table ref="table" 
            :columns="columns"
            :show_this="show_this"
            :headers="headers"
            :row_icon="row_icon"
            v-on:order-by="order_by_column"
            v-on:select-entity="select_entity">
          </query-results-table>
        </template>
      </div>`
  });
