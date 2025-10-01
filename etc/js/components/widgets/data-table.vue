<template>
  <div class="data-table">
    <template v-if="show_filter">
      <div class="data-table-filter">
        <span class="data-table-page">{{ offset }} - {{ offset + limit }}</span>
        <icon-button src="chevron-left" @click="onPrev"></icon-button>
        <icon-button src="chevron-right" @click="onNext"></icon-button>
        <search-box v-model="filter"></search-box>
      </div>
    </template>
    <div class="data-table-container">
      <table>
        <thead>
          <template v-for="(col, i) in headers">
            <th class="noselect" @click="toggleOrderBy(col, i)">
              {{ col.name }}
              <template v-if="orderBy.index === i">
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
          <tr v-for="(row, i) in pagedData" :class="trCss(row)" @click="onSelect(row)">
            <td v-for="col in headers" :class="tdCss(i)">
              <template v-if="isEntity(col)">
                <template v-if="col.get(row) === '*' || col.get(row) === undefined">
                  <div class="data-table-none">
                    None
                  </div>
                </template>
                <template v-else>
                  <div class="data-table-name">
                    <entity-parent :path="col.get(row)"></entity-parent>
                    <span class="entity-link" @click.stop="onSelectEntity(col.get(row))">
                      <entity-name :path="col.get(row)"></entity-name>
                    </span>
                  </div>
                </template>
              </template>
              <template v-else>
                <template v-if="col.get(row) !== undefined">
                  <template v-if="col.schema">
                    <entity-inspector-preview
                      :value="col.get(row)"
                      :type="col.schema"
                      :expand="false"
                      :readonly="true"
                      :compact="true"
                      fieldClass="table-field">
                    </entity-inspector-preview>
                  </template>
                  <template v-else>
                    {{ col.get(row) }}
                  </template>
                </template>
                <template v-else>
                  <div class="data-table-none">
                    None
                  </div>
                </template>
              </template>
            </td>
            <td :class="tdCss(i)"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="total-results">{{ data.length }} rows</td>
            <td v-for="(total, i) in totals">
              <template v-if="headers[i + 1].totals">
                {{ total }}
              </template>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script>
export default { name: "data-table" }
</script>

<script setup>
import { defineProps, defineEmits, defineExpose, defineModel,computed, ref, watch } from 'vue';

const orderByModes = ["none", "asc", "desc"];
const orderBy = ref({});
const emit = defineEmits(["select"]);
const offset = ref(0);
const limit = ref(25);

const props = defineProps({
  headers: {type: Array, required: true },
  data: {type: Object, required: true },
  show_filter: {type: Boolean, required: false, default: false}
});

const filter = defineModel("filter");

const orderByIndices = computed(() => {
  if (!orderBy.value.mode || orderBy.value.mode === 'none') {
    return undefined;
  }

  let orderByIndex = orderBy.value.index;
  let orderByValues = [];

  const headers = props.headers;
  const data = props.data;
  if (!data) {
    return [];
  }

  let resultIndex = 0;
  for (let r of data) {
    const value = headers[orderByIndex].get(r);
    orderByValues.push({value, resultIndex: resultIndex});
    resultIndex ++;
  }

  orderByValues.sort((a, b) => {
    let aValue = a.value;
    let bValue = b.value;

    // If both elements are objects with a first member of a number type, sort
    // on the first member so we don't compare numbers as strings.
    if (typeof aValue === 'object' && typeof bValue === 'object') {
      const aKeys = Object.keys(aValue);
      const bKeys = Object.keys(bValue);
      if (aKeys.length && bKeys.length) {
        const aFirst = aValue[aKeys[0]];
        const bFirst = bValue[bKeys[0]];

        if (typeof aFirst === 'number' && typeof bFirst === 'number') {
          aValue = aFirst;
          bValue = bFirst;
        }
      }
    }

    let comp;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comp = (aValue - bValue) - (bValue - aValue);
    } else {

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

      comp = aValue.localeCompare(bValue);
    }

    if (orderBy.value.mode === 'desc') {
      comp *= -1;
    }

    return comp;
  });

  return orderByValues;
});

const orderedData = computed(() => {
  if (!orderByIndices.value) {
    return props.data;
  } else {
    let results = [];
    for (let elem of orderByIndices.value) {
      results.push(props.data[elem.resultIndex]);
    }
    return results;
  }
});

const pagedData = computed(() => {
  return orderedData.value.slice(offset.value, offset.value + limit.value);
});

const totals = computed(() => {
  let colIndex = 0;
  let totals = [];
  for (let col of props.headers) {
    if (colIndex) {
      if (col.schema && (col.schema[0] === "int" || col.schema[0] === "uint" || col.schema[0] === "float")) {
        let total = 0;
        for (let row of props.data) {
          total += parseFloat(col.get(row));
        }

        // If floating point round to 2 decimal places
        if (col.schema[0] === "float") {
          total = total.toFixed(2);
        }

        totals.push(total);
      } else {
        totals.push("");
      }
    }
    colIndex ++;
  }
  return totals;
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

function trCss(result) {
  if (result.name) {
    return "data-table-row-selectable";
  } else {
    return "";
  }
}

function toggleOrderBy(col, i) {
  if (orderBy.value.index != i) {
    orderBy.value.index = i;
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

function onSelect(result) {
  if (result.name) {
    if (result.name[0] == '#') {
      return emit("select", result.name);
    }

    if (result.parent) {
      return emit("select", result.parent + '.' + result.name);
    }

    return emit("select", result.name);
  }
}

function onSelectEntity(e) {
  return emit("select", e);
}

function onPrev() {
  offset.value -= limit.value;
  if (offset.value < 0) {
    offset.value = 0;
  }
  if (offset.value % limit.value != 0) {
    offset.value = Math.ceil(offset.value / limit.value) * limit.value;
  }
}

function onNext() {
  let max = orderedData.value.length - limit.value;
  if (offset.value <= max) {
    offset.value += limit.value;
  }
}

watch(() => [filter.value], () => {
  offset.value = 0;
});

function resetQuery() {
  orderBy.value = {};
}

defineExpose({resetQuery});

</script>

<style scoped>

div.data-table {
  position: relative;
  height: 100%;
}

div.data-table-container {
  position: relative;
  height: 100%;
  overflow-y: auto;
}

div.data-table-filter {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: right;
  gap: 8px;
  position: absolute;
  width: 350px;
  top: 0;
  right: 16px;
  z-index: 20;
  background-color: var(--bg-cell);
}

span.data-table-page {
  color: var(--secondary-text);
  white-space: nowrap;
}

table {
  border-collapse: collapse;
  width: 100%;
  text-align: left;
  font-variant: inherit;
  font-size: inherit;
  white-space: nowrap;
  padding-bottom: 50px;
}

table thead {
  position: sticky;
  top: 0px;
  z-index: 2;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.35);
}

table tfoot {
  position: sticky;
  bottom: -1px;
  z-index: 2;
  box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.35);
  font-weight: 500;
  color: var(--secondary-text);
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
  height: 40px;
}

td {
  padding: var(--table-padding);
  padding-top: calc(var(--table-padding));
  padding-bottom: calc(var(--table-padding));
  background-color: var(--bg-cell);
}

td.cell-alt {
  background-color: var(--bg-cell-alt);
}

div.data-table-name {
  display: flex;
  flex-direction: column;
  color: var(--primary-text);
}

div.data-table-none {
  color: var(--secondary-text);
}

tr.data-table-row-selectable {
  cursor: pointer;
}

tr.data-table-row-selectable:hover td {
  background-color: var(--bg-cell-hover);
}

span.entity-link:hover {
  color: var(--green);
}
</style>