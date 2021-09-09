
Vue.component('entity-explorer', {
    props: ['data'],
    template: `
      <div class="ecs-results" v-if="data && data.type">
        <div v-if="data && data.valid" class="ecs-table">
          <div class="box-header">Entity overview</div>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Object</th>
                <th>Role</th>
                <th class="ecs-table-squeeze"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="el in data.type">
                <tr class="ecs-table">
                  <td class="ecs-table">
                    {{el.pred}}
                  </td>
                  <td class="ecs-table" v-if="el.obj">
                    {{el.obj}}
                  </td>
                  <td v-else></td>
                  <td class="ecs-table" v-if="el.role">
                    {{el.role}}
                  </td>
                  <td v-else></td>
                  <td class="ecs-table-squeeze"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      `
  });
