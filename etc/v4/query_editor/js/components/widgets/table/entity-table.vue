<template>
  <div class="entity-table">
    <table>
      <thead>
        <template v-for="col in tableHeaders">
          <th class="noselect" @click="toggleOrderBy(col)">
            {{ col.name }}
            <template v-if="orderBy.index === col.index">
              <template v-if="orderBy.mode === 'none'">
              </template>
              <template v-if="orderBy.mode === 'asc'">
                <icon src="arrow-down"></icon>
              </template>
              <template v-if="orderBy.mode === 'desc'">
                <icon src="arrow-up"></icon>
              </template>
            </template>
          </th>
        </template>
        <th class="squeeze"></th>
      </thead>
      <tbody>
        <tr v-for="(result, i) in results">
          <td v-for="col in tableHeaders" :class="tdCss(i)">
            <template v-if="isEntity(col)">
              <template v-if="col.get(result) === '*'">
                <div class="entity-table-none">
                  None
                </div>
              </template>
              <template v-else>
                <div class="entity-table-name">
                  <entity-parent :path="col.get(result)"></entity-parent>
                  <entity-name :path="col.get(result)"></entity-name>
                </div>
              </template>
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
import { defineProps, computed, ref } from 'vue';

const orderByModes = ["none", "asc", "desc"];
const orderBy = ref({});

const props = defineProps({
  result: {type: Object, required: true }
});

const tableHeaders = computed(() => {
  const result = props.result;
  const columns = [];
  let index = 0;

  // Append each variable as column
  const query_info = result.query_info;
  if (query_info && query_info.vars) {
    for (let i = 0; i < query_info.vars.length; i ++) {
      const varName = query_info.vars[i];
      if (varName === "this") {
        columns.push({
          name: "Entity",
          schema: ["entity"],
          index: index++,
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
          schema: ["entity"],
          index: index++,
          get: (result) => {
            return result.vars[varName];
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
        index: index++,
        get: (result) => {
          return result.fields[i].data;
        }
      });
    }
  }

  return columns;
});

const orderByIndices = computed(() => {
  if (!orderBy.value.mode || orderBy.value.mode === 'none') {
    return undefined;
  }

  let orderByIndex = orderBy.value.index;
  let orderByValues = [];

  const result = props.result;
  let resultIndex = 0;
  for (let r of result.results) {
    const value = tableHeaders.value[orderByIndex].get(r);
    orderByValues.push({value: value, resultIndex: resultIndex});
    resultIndex ++;
  }

  orderByValues.sort((a, b) => {
    let aValue = a.value;
    let bValue = b.value;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) - (bValue - aValue);
    }

    if (typeof aValue === 'number') {
      aValue = "" + aValue;
    }
    if (typeof bValue === 'number') {
      bValue = "" + bValue;
    }

    if (typeof aValue === 'object') {
      aValue = JSON.stringify(aValue);
    }
    if (typeof bValue === 'object') {
      bValue = JSON.stringify(bValue);
    }

    let comp = aValue.localeCompare(bValue);
    if (orderBy.value.mode === 'desc') {
      comp *= -1;
    }

    return comp;
  });

  return orderByValues;
});

const results = computed(() => {
  if (!orderByIndices.value) {
    return props.result.results;
  } else {
    let results = [];
    for (let elem of orderByIndices.value) {
      results.push(props.result.results[elem.resultIndex]);
    }
    return results;
  }
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

function toggleOrderBy(col) {
  if (orderBy.value.index != col.index) {
    orderBy.value.index = col.index;
    orderBy.value.mode = orderByModes[1];
  } else {
    let orderByIndex = orderByModes.indexOf(orderBy.value.mode);
    if (orderByIndex == -1) {
      orderByIndex = 0;
    } else {
      orderByIndex = (orderByIndex + 1) % orderByModes.length;
    }

    orderBy.value.mode = orderByModes[orderByIndex];
  }
}

</script>

<style scoped>

div.entity-table {
  position: relative;
  top: -0.5rem; /* table header has padding */
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
  color: var(--primary-text);
  background-color: var(--bg-cell);
  cursor: pointer;
}

th.squeeze {
  width: 100%;
  background-color: var(--bg-cell);
  cursor: default;
}

th:hover {
  background-color: var(--bg-cell-hover);
}

th.squeeze:hover {
  background-color: var(--bg-cell);
}

tr {
  border-style: solid;
  border-width: 0px;
  border-bottom-width: 1.5px;
  border-bottom-color: var(--tab-separator-color);
}

td {
  padding: var(--table-padding);
  padding-top: calc(var(--table-padding) * 0.5);
  padding-bottom: calc(var(--table-padding) * 0.5);
  background-color: var(--bg-cell);
}

td.cell-alt {
  background-color: var(--bg-cell-alt);
}

div.entity-table-name {
  display: flex;
  flex-direction: column;
  color: var(--primary-text);
}

div.entity-table-none {
  color: var(--secondary-text);
}

</style>
