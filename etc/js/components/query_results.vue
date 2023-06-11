<template>
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
  </div>
</template>

<script>
  module.exports = {
    name: "query-results",
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
    }
  };
</script>

<style>
  div.query-results {
    position: relative;
  }
</style>
