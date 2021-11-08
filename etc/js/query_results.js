
Vue.component('query-result', {
  props: ['result', 'entity', 'index', 'show_terms'],
  template: `
  <tr>
    <td v-if="entity">
      <entity-reference :entity="entity" :show_name="true" v-on="$listeners"/>
    </td>
    <td v-for="variable in result.vars">
      <entity-reference :entity="variable" :show_name="true" v-on="$listeners"/>
    </td>
    <td v-for="value in result.values" v-if="value !== 0">
      <inspector-value :value="value[index]" :list="true"/>
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
      term_id(term) {
        const elems = this.data.ids[term].split('.');
        return elems[elems.length - 1];
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
        <template v-if="data && valid && !has_this && (variable_count == 0)">
          <div v-if="data && is_true" class="noselect query-result-yes"> Yes </div>
          <div v-else class="noselect query-result-no"> No </div>
        </template>
        <template v-else>
          <table v-if="data">
            <thead>
              <tr>
                <th v-if="has_this">Entities</th>
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
