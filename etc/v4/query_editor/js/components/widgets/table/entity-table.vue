<template>
  <div class="entity-table">
    <table>
      <thead>
        <th v-for="col in tableHeaders">{{ col.name }}</th>
        <th class="squeeze"></th>
      </thead>
      <tbody>
        <tr v-for="(result, i) in result.results">
          <td v-for="col in tableHeaders" :class="tdCss(i)">
            <template v-if="isEntity(col)">
              <div class="entity-table-name">
                <entity-parent :path="col.get(result)"></entity-parent>
                <entity-name :path="col.get(result)"></entity-name>
              </div>
            </template>
            <template v-else>
              <entity-inspector-preview
                :value="col.get(result)"
                :type="col.schema"
                :expand="false"
                :readonly="true"
                :compact="true"
                fieldClass="table-field">
              </entity-inspector-preview>
            </template>
          </td>
          <td :class="tdCss(i)"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default { name: "entity-table" }
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  result: {type: Object, required: true }
});

const query_json_str = computed(() => {
  if (props.result.error) {
    return props.result.error.split("\n").join("\n  ");
  } else {
    return JSON.stringify({results: props.result}, null, 2);
  }
});

const tableHeaders = computed(() => {
  const result = props.result;
  const columns = [];

  // Append each variable as column
  const query_info = result.query_info;
  if (query_info && query_info.vars) {
    for (let i = 0; i < query_info.vars.length; i ++) {
      const varName = query_info.vars[i];
      if (varName === "this") {
        columns.push({
          name: "Entity",
          schema: ["entity"],
          get: (result) => {
            if (result.parent) {
              return result.parent + "." + result.name;
            } else {
              return result.name;
            }
          }
        });
      } else {
        columns.push({
          name: varName,
          get: (result) => {
            return result.vars[i];
          }
        });
      }
    }
  }

  // Append fields
  const fields = result.field_info;
  if (!fields) {
    return columns;
  }

  for (let i = 0; i < fields.length; i ++) {
    const field = fields[i];
    if (field.schema) {
      columns.push({
        name: field.id,
        schema: field.schema,
        get: (result) => {
          return result.fields[i].data;
        }
      });
    }
  }

  return columns;
});

function isEntity(col) {
  if (col.schema && Array.isArray(col.schema)) {
    return col.schema[0] === "entity";
  } else {
    return false;
  }
}

function tdCss(i) {
  if (!(i % 2)) {
    return "cell-alt"
  } else {
    return "cell";
  }
}

</script>

<style scoped>

div.entity-table {
  height: 100%;
  overflow-y: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
  text-align: left;
  font-variant: inherit;
  font-size: inherit;
  white-space: nowrap;
}

table thead {
  position: sticky;
  top: 0px;
  z-index: 2;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.35);
}

th {
  padding: var(--table-padding);
  height: 1.5rem;
  min-width: 100px;
  text-align: center;
  color: var(--primary-text);
  background-color: var(--bg-cell);
}

th.squeeze {
  width: 100%;
}

table th:first-child {
  text-align: left;
}

tr {
  border-style: solid;
  border-width: 0px;
  border-bottom-width: 1.5px;
  border-bottom-color: var(--tab-separator-color);
}

td {
  padding: var(--table-padding);
  background-color: var(--bg-cell);
}

td.cell-alt {
  background-color: var(--bg-cell-alt);
}

div.entity-table-name {
  display: flex;
  flex-direction: column;
}

</style>
