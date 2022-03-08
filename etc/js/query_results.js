
Vue.component('query-result', {
  props: ['result', 'entity', 'index', 'show_terms'],
  methods: {
    var_label: function(var_index) {
      if (this.result.var_labels) {
        return this.result.var_labels[var_index];
      } else {
        return this.vars[var_index];
      }
    },
    get_value(value, index) {
      if (Array.isArray(value)) {
        // Owned
        return value[index];
      } else {
        // Shared
        return value;
      }
    }
  },
  computed: {
    entity_label: function() {
      if (this.result.entity_labels) {
        return this.result.entity_labels[this.index];
      } else {
        return this.entity;
      }
    }
  },
  template: `
  <tr>
    <td class="query-result-entity" v-if="entity">
      <entity-reference :entity="entity" :label="entity_label" :show_name="true" :show_parent="true" v-on="$listeners"/>
    </td>
    <td v-for="(variable, vi) in result.vars">
        <template v-if="variable !== '*'">
          <entity-reference :entity="variable" :label="var_label(vi)" :show_name="true" v-on="$listeners"/>
        </template>
        <template v-else>
          <span class="query-result-no">No</span>
        </template>
    </td>
    <td v-for="(value, vi) in result.values" v-if="value !== 0">
      <template v-if="result.is_set[vi]">
        <inspector-props :value="get_value(value, index)" :list="true"/>
      </template>
      <template v-else>
        <span class="query-result-no">No</span>
      </template>
    </td>
    <td v-if="show_terms" v-for="term in result.terms" class="content-container-term">
      {{term}}
    </td>
    <td class="content-container-squeeze"></td>
  </tr>
  `
});

Vue.component('query-results', {
    props: ['data', 'valid'],
    data: function() {
      return {
        show_terms: false
      }
    },
    methods: {
      term_has_values(term) {
        if (this.data && this.data.results && this.data.results[0] && this.data.results[0].values) {
          if (this.data.results[0].values[term] !== 0) {
            return true;
          } else {
            return false;
          }
        }
        return false;
      },
      id_elem(str) {
        const elems = str.split('.');
        return elems[elems.length - 1];
      },
      term_id(term) {
        const pair = this.data.ids[term].split(',');
        if (pair.length == 1) {
          return this.id_elem(pair[0]);
        } else {
          const first = this.id_elem(pair[0].slice(1));
          const second = this.id_elem(pair[1].slice(0, -1));
          return "(" + first + "," + second + ")";
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
      show_results: function() {
        if (this.is_true == false) {
          return false;
        }
        if (this.show_terms) {
          return true;
        }
        if (this.has_this) {
          return true;
        }
        if (this.variable_count != 0) {
          return true;
        }
        return false;
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
      values: function(result) {
        return result.values;
      },
      term_count: function() {
        if (this.data && this.data.ids) {
          return this.data.ids.length;
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
      }
    },
    template: `
      <div :class="css">
        <template v-if="data && valid && !has_this && ((variable_count == 0) || !results.length)">
          <div v-if="data && is_true" class="noselect query-result-yes"> Yes </div>
          <div v-else class="noselect query-result-no"> No </div>
        </template>
        <template v-else>
          <table v-if="data">
            <thead>
              <tr>
                <th v-if="has_this">Entity</th>
                <th v-for="var_name in variables" class="query-results-header">
                  {{var_name}}
                </th>
                <th v-for="(id, i) in data.ids" v-if="term_has_values(i)">
                  {{term_id(i)}}
                </th>
                <th v-for="(n, index) in term_count" class="query-results-header-term" v-if="show_terms">
                  Term {{index + 1}}
                </th>
                <th class="query-results-squeeze"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="result in results">
                <template v-if="has_this">
                  <template v-for="(entity, index) in result.entities">
                    <query-result 
                      :entity="entity"
                      :index="index"
                      :result="result"
                      :show_terms="show_terms"
                      v-on="$listeners"/>
                  </template>
                </template>
                <template v-else>
                  <query-result 
                    :result="result" 
                    :index="0"
                    :show_terms="show_terms"
                    v-on="$listeners"/>
                </template>
              </template>
            </tbody>
          </table>
        </template>
      </div>`
  });
