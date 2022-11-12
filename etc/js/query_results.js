
Vue.component('query-results-table', {
  props: {
    columns: {type: Object, required: true}
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
        return this.columns.type_info[this.columns.ids[term]];
      }
    },
    // Format header of (component) term
    id_elem(str) {
      const elems = str.split('.');
      return elems[elems.length - 1];
    },
    term_header(term) {
      const pair = this.columns.ids[term].split(',');
      let result;
      if (pair.length == 1) {
        result = this.id_elem(pair[0]);
      } else {
        const first = this.id_elem(pair[0].slice(1));
        const second = this.id_elem(pair[1].slice(0, -1));
        result = "(" + first + "," + second + ")";
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
      return this.columns.data.values[term] === 0;
    },
    create_none(h) {
      return h('td', [h('span', { class: "query-result-cell-none" }, ["None"])]);
    },
    // Create table header
    create_header(h) {
      const columns = this.columns;
      const data = columns.data;
      let ths = [];

      if (data.entities && data.entities.length) {
        ths.push(h('th', ["Entity"]));
      }

      if (columns.vars) {
        for (let var_name of columns.vars) {
          ths.push(h('th', [var_name]));
        }
      }

      if (columns.ids) {
        for (let i = 0; i < columns.ids.length; i ++) {
          if (!this.term_is_tag(i)) {
            ths.push(h('th', [this.term_header(i)]));
          }
        }
      }

      ths.push( h('th', { class: 'query-results-squeeze'}) );

      return h('thead', 
        { class: 'query-results-table-header' },
        [ h('tr', ths) ]
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
    // Create variable table cells
    create_vars(h) {
      const columns = this.columns;
      const data = this.columns.data;
      let vars = [];

      if (columns.vars) {
        for (let i = 0; i < columns.vars.length; i ++) {
          vars.push(
            this.create_entities(h, data.vars[i], data.var_labels[i])
          );
        }
      }

      return vars;
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
                }
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
        left_border_color = "var(--steel-750)";
        row_color = "var(--row-bg)";
      }
      
      let style = "border-left-color: " + left_border_color + "; ";
      style += "background-color: " + row_color;

      return h('tr', { class: "query-results-row", style: style }, children );
    },
    // Create table body
    create_body(h) {
      const columns = this.columns;
      const data = columns.data;

      // Create cells from columns
      let tds = {
        entities: this.create_entities(h, data.entities, data.labels),
        vars: this.create_vars(h),
        values: this.create_values(h)
      };

      // Initialize rows
      let rows = [];
      for (let i = 0; i < columns.count; i ++) {
        rows.push([]);
      }

      // Populate row children arrays with td elements

      // Add entity tds
      for (let i = 0; i < tds.entities.length; i ++) {
        rows[i].push(tds.entities[i]);
      }

      // Add variable tds
      for (let var_tds of tds.vars) {
        for (let i = 0; i < var_tds.length; i ++) {
          rows[i].push(var_tds[i]);
        }
      }

      // Add value tds
      for (let value_tds of tds.values) {
        for (let i = 0; i < value_tds.length; i ++) {
          rows[i].push(value_tds[i]);
        }
      }

      // Add td's at the end that push values to the left
      for (let row of rows) {
        row.push( h('td', { class: 'query-results-squeeze'}) );
      }

      // Create row elements
      let trs = [];
      for (let i = 0; i < rows.length; i ++) {
        let color;
        if (data.colors) {
          color = data.colors[this.index(i)];
        }
        trs.push(this.create_row(h, rows[i], color));
      }

      return h('tbody', trs);
    }
  },
  render: function(h) {
    const header = this.create_header(h);
    const body = this.create_body(h);
    return h('table', {class: 'query-results-table'}, [header, body]);
  }
});

Vue.component('query-results', {
    props: ['data', 'valid'],
    data: function() {
      return {
        show_terms: false
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
            var_labels: []
          },
          count: 0
        };

        for (let result of this.results) {
          let count = this.result_count(result);
          
          // Build index for sorting
          if (result.entity_ids) {
            let index = 0;
            for (let entity_id of result.entity_ids) {
              let order_by_value = entity_id;
              if (result.entity_labels && result.entity_labels[index]) {
                order_by_value = result.entity_labels[index];
              } else if (result.entity_path && result.entity_path[index]) {
                order_by_value = result.entity_path[index];
              }
              r.data.index.push({
                index: index + r.count,
                order_by: order_by_value
              });
              index ++;
            }
          }

          // Sort indices used for iterating the results
          r.data.index.sort((a, b) => {
            let a_str = a.order_by;
            let b_str = b.order_by;
            if (typeof a_str === 'number') {
              a_str = "" + a_str;
            }
            if (typeof b_str === 'number') {
              b_str = "" + b_str;
            }
            return a_str.localeCompare(b_str);
          });

          // Append entity names, labels and colors
          if (result.entities) {
            r.data.entities.push(...result.entities);
          }
          if (result.entity_labels) {
            r.data.labels.push(...result.entity_labels);
          }
          if (result.colors) {
            r.data.colors.push(...result.colors);
          }

          // Append component values
          for (let i = 0; i < result.values.length; i ++) {
            if (r.data.values.length <= i) {
              if (result.values[i] === 0) {
                r.data.values.push(0);
              } else {
                r.data.values.push([]);
              }
              r.data.is_set.push([]);
            }

            this.append_to(r.data.values[i], result.values[i], count);
            this.append_to(r.data.is_set[i], result.is_set[i], count);
          }

          // Append variables
          if (result.vars) {
            for (let i = 0; i < result.vars.length; i ++) {
              if (r.data.vars.length <= i) {
                r.data.vars.push([]);
              }
              this.append_to(r.data.vars[i], result.vars[i], count);
            }
          }

          // Append variable labels
          if (result.var_labels) {
            for (let i = 0; i < result.var_labels.length; i ++) {
              if (r.data.var_labels.length <= i) {
                r.data.var_labels.push([]);
              }
              this.append_to(r.data.var_labels[i], result.var_labels[i], count);
            }
          }

          r.count += count;
        }

        return r;
      }
    },
    template: `
      <div :class="css">
        <template v-if="data && valid && !has_this && ((variable_count == 0) || !results.length)">
          <div v-if="data && is_true" class="noselect query-result-yes"> Yes </div>
          <div v-else class="noselect query-result-no"> No results </div>
        </template>
        <template v-else>
          <query-results-table :columns="columns"
            v-on="$listeners">
          </query-results-table>
        </template>
      </div>`
  });
