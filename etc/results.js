
Vue.component('results', {
    props: ['data'],
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
        }
    },
    template: `
      <div class="ecs-results">
      <template v-if="data">
        <div v-if="data && is_true" class="ecs-yesno ecs-yes">Yes</div>
        <div v-else class="ecs-yesno ecs-no">No</div>
      </template>
      <template v-if="data && is_true">
        <div v-if="data && data.valid" class="ecs-table">    
          <table>
            <thead>
              <tr>
                <th v-if="data.has_this">This (.)</th>
                <th v-for="var_name in data.variables" class="ecs-table">
                  {{var_name}}
                </th>
                <th v-for="(n, index) in data.term_count" class="ecs-table-term">
                  Term {{index + 1}}
                </th>
                <th class="ecs-table-squeeze"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="result in data.results">
                <template v-if="data.has_this">
                  <tr v-for="entity in result.entities" class="ecs-table">
                    <td>{{entity}}</td>
                    <td v-for="variable in result.variables" class="ecs-table">
                      {{variable}}
                    </td>
                    <td v-for="term in result.terms" class="ecs-table-term">
                      {{term}}
                    </td>
                    <td class="ecs-table-squeeze"></td>
                  </tr>
                </template>
                <template v-else>
                  <tr class="ecs-table">
                    <td v-for="variable in result.variables" class="ecs-table">
                      {{variable}}
                    </td>
                    <td v-for="term in result.terms" class="ecs-table-term">
                      {{term}}
                    </td>
                    <td class="ecs-table-squeeze"></td>
                  </tr>
                </template>

              </template>
            </tbody>
          </table>
        </div>
      </template>
      </div>
      `
  });
