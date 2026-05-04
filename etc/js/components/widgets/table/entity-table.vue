<template>
  <div class="entity-table">
    <table>
      <thead>
        <template v-for="(col, i) in tableHeaders">
          <th class="noselect" @click="toggleOrderBy(col, i)">
            {{ col.name }}
            <template v-if="orderByIndex === i">
              <template v-if="sortMode === 'asc'">
                <icon src="arrow-down"></icon>
              </template>
              <template v-if="sortMode === 'desc'">
                <icon src="arrow-up"></icon>
              </template>
              <template v-if="sortMode === 'group'">
                <icon src="diff-added"></icon>
              </template>
              <template v-if="sortMode === 'group_min'">
                <icon src="diff-removed"></icon>
              </template>
            </template>
          </th>
        </template>
        <th class="squeeze"></th>
      </thead>
      <tbody>
        <template v-for="row in displayedRows">
          <tr v-if="row.type === 'group'"
              class="entity-table-group-row noselect"
              @click="toggleGroup(row.key)">
            <td :colspan="tableHeaders.length + 1" class="entity-table-group-cell">
              <div :class="['entity-table-group-content', { 'entity-table-group-content-collapsed': isGroupCollapsed(row.key) }]">
                <span class="entity-table-group-chevron">
                  <icon :src="isGroupCollapsed(row.key) ? 'chevron-right' : 'chevron-down'"
                        :opacity="0.7">
                  </icon>
                </span>
                <template v-if="row.isEntity && row.value !== undefined && row.value !== '*'">
                  <div class="entity-table-name">
                    <entity-parent :path="row.value"></entity-parent>
                    <span><entity-name :path="row.value"></entity-name>&nbsp;({{ row.count }})</span>
                  </div>
                </template>
                <template v-else>
                  <span class="entity-table-group-label">{{ row.label }}&nbsp;({{ row.count }})</span>
                </template>
              </div>
            </td>
          </tr>
          <tr v-else :class="trCss(row.result)" @click="onSelect(row.result)">
            <td v-for="col in tableHeaders" :class="tdCss(row.rowIndex)" :title="isEntity(col) ? null : cellTitle(col.get(row.result))">
              <template v-if="isEntity(col)">
                <template v-if="col.get(row.result) === '*' || col.get(row.result) === undefined">
                  <div class="entity-table-none">
                    None
                  </div>
                </template>
                <template v-else>
                  <div class="entity-table-name">
                    <entity-parent :path="col.get(row.result)"></entity-parent>
                    <span class="entity-link" @click.stop="onSelectEntity(col.get(row.result))">
                      <entity-name :path="col.get(row.result)"></entity-name>
                    </span>
                  </div>
                </template>
              </template>
              <template v-else>
                <template v-if="col.get(row.result)">
                  <entity-inspector-preview
                    :value="col.get(row.result)"
                    :type="col.schema"
                    :expand="false"
                    :readonly="true"
                    :compact="true"
                    fieldClass="table-field">
                  </entity-inspector-preview>
                </template>
                <template v-else>
                  <div class="entity-table-none">
                    None
                  </div>
                </template>
              </template>
            </td>
            <td :class="tdCss(row.rowIndex)"></td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script>
export default { name: "entity-table" }
</script>

<script setup>
import { defineProps, defineEmits, defineExpose, computed, ref } from 'vue';

const orderByModes = ["none", "asc", "desc", "group", "group_min"];
const groupCollapsed = ref({});
const emit = defineEmits(["select", "update:sort_col", "update:sort_mode"]);

const props = defineProps({
  result: {type: Object, required: true },
  sort_col: {type: String, default: undefined },
  sort_mode: {type: String, default: undefined }
});

const sortMode = computed(() => props.sort_mode || 'none');

const orderByIndex = computed(() => {
  if (!props.sort_col) {
    return -1;
  }
  return tableHeaders.value.findIndex(c => c.name === props.sort_col);
});

function componentToColumnName(component, schema) {
  let result = explorer.shortenComponent(component);

  // If value is an object with a single member, add the unit symbol to the
  // column name if the schema has one.
  const keys = Object.keys(schema);
  if (keys.length == 1) {
    const first = schema[keys[0]];
    if (first.length > 1) {
      const symbol = first[1].symbol;
      if (symbol) {
        result += ` (${symbol})`;
      }
    }
  }

  return result;
}

const tableHeaders = computed(() => {
  const result = props.result;
  const columns = [];

  // Append each variable as column
  const query_info = result.query_info;
  if (query_info && query_info.vars) {
    for (let i = 0; i < query_info.vars.length; i ++) {
      const varName = query_info.vars[i];
      if (varName === "this") {
        if (!i || query_info.vars[i] !== "this") {
          columns.push({
            name: "Entity",
            schema: ["entity"],
            get: (result) => {
              const name = result.name[0] === '#'
                ? result.name
                : result.name.replaceAll(".", "\\.");
              if (result.parent && result.name[0] !== '#') {
                return result.parent + "." + name;
              } else {
                return name;
              }
            }
          });
        }
      } else {
        columns.push({
          name: varName,
          schema: ["entity"],
          get: (result) => {
            return result.vars ? result.vars[varName] : undefined;
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
        name: componentToColumnName(field.id, field.schema),
        schema: field.schema,
        get: (result) => {
          if (!result.fields.is_set || result.fields.is_set[i]) {
            if (result.fields.values) {
              return result.fields.values[i];
            } else {
              return {};
            }
          } else {
            return undefined;
          }
        }
      });
    }
  }

  return columns;
});

const orderByIndices = computed(() => {
  const mode = sortMode.value;
  if (!mode || mode === 'none') {
    return undefined;
  }

  const colIndex = orderByIndex.value;
  if (colIndex < 0) {
    return undefined;
  }
  let orderByValues = [];

  const result = props.result;
  if (!result.results) {
    return [];
  }

  let resultIndex = 0;
  for (let r of result.results) {
    const value = tableHeaders.value[colIndex].get(r);
    orderByValues.push({value: value, resultIndex: resultIndex});
    resultIndex ++;
  }

  const sortDir = (mode === 'desc') ? -1 : 1;
  const isGroupMode = (mode === 'group' || mode === 'group_min');

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

      if (aValue === undefined) aValue = "";
      if (bValue === undefined) bValue = "";

      comp = aValue.localeCompare(bValue);
    }

    if (comp === 0 && isGroupMode &&
        typeof a.value === 'object' && a.value !== null &&
        typeof b.value === 'object' && b.value !== null) {
      comp = JSON.stringify(a.value).localeCompare(JSON.stringify(b.value));
    }

    return comp * sortDir;
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

function groupKeyOf(value) {
  if (value === undefined || value === null) {
    return "\0undefined";
  }
  if (typeof value === "object") {
    return "\0obj:" + JSON.stringify(value);
  }
  return "\0" + typeof value + ":" + String(value);
}

function groupLabelOf(value, col) {
  if (value === undefined || value === null) {
    return "None";
  }
  if (typeof value === "object") {
    return cellTitle(value);
  }
  return String(value);
}

const groups = computed(() => {
  const mode = sortMode.value;
  if (mode !== 'group' && mode !== 'group_min') {
    return undefined;
  }
  const indices = orderByIndices.value;
  if (!indices) {
    return [];
  }
  const col = tableHeaders.value[orderByIndex.value];
  if (!col) {
    return [];
  }
  const out = [];
  let last;
  for (let i = 0; i < indices.length; i ++) {
    const value = indices[i].value;
    const key = groupKeyOf(value);
    if (!last || last.key !== key) {
      last = {
        key: key,
        value: value,
        label: groupLabelOf(value, col),
        isEntity: isEntity(col),
        startIndex: i,
        count: 0,
      };
      out.push(last);
    }
    last.count ++;
  }
  return out;
});

const displayedRows = computed(() => {
  const rows = [];
  const data = results.value;
  if (!data) {
    return rows;
  }
  const grps = groups.value;

  if (!grps) {
    for (let i = 0; i < data.length; i ++) {
      rows.push({type: 'data', result: data[i], rowIndex: i});
    }
    return rows;
  }

  let dataIndex = 0;
  for (const g of grps) {
    rows.push({
      type: 'group',
      key: g.key,
      value: g.value,
      label: g.label,
      isEntity: g.isEntity,
      count: g.count,
    });
    const collapsed = isGroupCollapsed(g.key);
    if (!collapsed) {
      for (let i = 0; i < g.count; i ++) {
        rows.push({type: 'data', result: data[dataIndex + i], rowIndex: dataIndex + i});
      }
    }
    dataIndex += g.count;
  }
  return rows;
});

function isGroupCollapsed(key) {
  if (sortMode.value === 'group_min') {
    return groupCollapsed.value[key] !== false;
  }
  return groupCollapsed.value[key] === true;
}

function toggleGroup(key) {
  groupCollapsed.value = {
    ...groupCollapsed.value,
    [key]: !isGroupCollapsed(key),
  };
}

function isEntity(col) {
  if (col.schema && Array.isArray(col.schema)) {
    return col.schema[0] === "entity";
  } else {
    return false;
  }
}

function cellTitle(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "object") {
    const parts = [];
    for (const k in value) {
      const v = value[k];
      parts.push(typeof v === "object" ? JSON.stringify(v) : String(v));
    }
    return parts.join(", ");
  }
  return String(value);
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
    return "entity-table-row-selectable";
  } else {
    return "";
  }
}

function toggleOrderBy(col, i) {
  if (orderByIndex.value !== i) {
    emit("update:sort_col", col.name);
    emit("update:sort_mode", "asc");
    groupCollapsed.value = {};
  } else {
    let modeIndex = orderByModes.indexOf(sortMode.value);
    if (modeIndex == -1) {
      modeIndex = 0;
    } else {
      modeIndex = (modeIndex + 1) % orderByModes.length;
    }

    const newMode = orderByModes[modeIndex];
    if (newMode === "none") {
      emit("update:sort_col", undefined);
      emit("update:sort_mode", undefined);
    } else {
      emit("update:sort_mode", newMode);
    }
    groupCollapsed.value = {};
  }
}

function onSelect(result) {
  if (result.name) {
    if (result.name[0] == '#') {
      return emit("select", result.name);
    }

    const name = result.name.replaceAll(".", "\\.");

    if (result.parent) {
      return emit("select", result.parent + '.' + name);
    }

    return emit("select", name);
  }
}

function onSelectEntity(e) {
  return emit("select", e);
}

function resetQuery() {
  emit("update:sort_col", undefined);
  emit("update:sort_mode", undefined);
  groupCollapsed.value = {};
}

defineExpose({resetQuery});

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

td :deep(div.input-wrapper) {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

tr.entity-table-row-selectable {
  cursor: pointer;
}

tr.entity-table-row-selectable:hover td {
  background-color: var(--bg-cell-hover);
}

span.entity-link:hover {
  color: var(--green);
}

tr.entity-table-group-row {
  cursor: pointer;
}

td.entity-table-group-cell {
  padding: 0;
  background-color: var(--bg-input);
  color: var(--secondary-text);
}

td.entity-table-group-cell :deep(*) {
  color: var(--secondary-text);
}

div.entity-table-group-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: var(--table-padding);
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.45);
  position: relative;
  z-index: 1;
}

div.entity-table-group-content-collapsed {
  box-shadow: none;
}

span.entity-table-group-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
}

span.entity-table-group-label {
  color: var(--secondary-text);
}

</style>
