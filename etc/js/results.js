
Vue.component('results', {
    props: ['data'],
    data: function() {
      return {
        show_terms: false
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
        if (this.data.filter.has_this) {
          return true;
        }
        if (this.data.filter.variable_count != 0) {
          return true;
        }
        return false;
      },
      has_this: function() {
        if (this.data && this.data.filter) {
          return this.data.filter.has_this;
        } else {
          return false;
        }
      },
      variable_count: function() {
        if (this.data && this.data.filter) {
          return this.data.filter.variable_count;
        } else {
          return 0;
        }
      },
      variables: function() {
        if (this.data) {
          return this.data.variables;
        } else {
          return [];
        }
      },
      term_count: function() {
        if (this.data) {
          return this.data.term_count;
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
      }
    },
    template: `
      <div class="ecs-results">
      <template v-if="data && data.valid && !has_this && (variable_count == 0)">
        <div v-if="data && is_true" class="ecs-yesno ecs-yes"> Yes </div>
        <div v-else class="ecs-yesno ecs-no"> No </div>
      </template>      
      <template>
        <content-container :disable="!data || !data.valid">
          <template v-slot:summary>
            Query results
          </template>

          <template v-slot:detail>
            <table>
              <thead>
                <tr>
                  <th v-if="has_this">Entities</th>
                  <th v-for="var_name in variables" class="content-container">
                    {{var_name}}
                  </th>
                  <th v-for="(n, index) in term_count" class="content-container-term" v-if="show_terms">
                    Term {{index + 1}}
                  </th>
                  <th class="content-container-squeeze"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="result in results">
                  <template v-if="has_this">
                    <tr v-for="entity in result.entities" class="content-container">
                      <td><entity-reference :entity="entity" :show_name="true" v-on="$listeners"></entity-reference></td>
                      <td v-for="variable in result.variables" class="content-container">
                        {{variable}}
                      </td>
                      <td v-for="term in result.terms" class="content-container-term" v-if="show_terms">
                        {{term}}
                      </td>
                      <td class="content-container-squeeze"></td>
                    </tr>
                  </template>
                  <template v-else>
                    <tr class="content-container">
                      <td v-for="variable in result.variables" class="content-container">
                        {{variable}}
                      </td>
                      <td v-for="term in result.terms" class="content-container-term" v-if="show_terms">
                        {{term}}
                      </td>
                      <td class="content-container-squeeze"></td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </template>
        </content-container>
      </template>
      </div>
      `
  });
