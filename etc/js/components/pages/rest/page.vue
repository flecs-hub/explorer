<template>
  <div id="page-rest" class="page-content">
    <div class="rest-request pane">
      <div class="rest-toolbar">
        <select class="rest-select" v-model="method">
          <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
        </select>

        <select class="rest-select rest-select-endpoint" v-model="endpointId">
          <option v-for="ep in availableEndpoints" :key="ep.id" :value="ep.id">
            {{ endpointDisplay(ep) }}
          </option>
        </select>

        <input
          v-if="endpoint && endpoint.pathParam"
          class="rest-input pane"
          type="text"
          v-model="pathValue"
          :placeholder="pathPlaceholder"
          @keyup.enter="onSend" />
        <input
          v-else-if="promotedParam"
          class="rest-input pane"
          type="text"
          v-model="paramValues[promotedParam.name]"
          :placeholder="promotedParam.placeholder || promotedParam.name"
          :title="promotedParam.description || ''"
          @keyup.enter="onSend" />
        <input
          v-else
          class="rest-input pane"
          type="text"
          placeholder="(no path parameter)"
          disabled />

        <action-button @click="onSend">Send</action-button>
        <button @click="onClear">Clear</button>
      </div>

      <template v-if="visibleParams.length">
        <div class="rest-input-params" v-if="inputParams.length">
          <template v-for="p in inputParams" :key="p.name">
            <template v-if="p.type === 'textarea'">
              <div class="rest-param rest-param-textarea" :title="p.description || ''">
                <span class="rest-param-name">
                  {{ p.name }}<span class="rest-required" v-if="p.required">*</span>
                </span>
                <textarea
                  class="rest-textarea pane"
                  v-model="paramValues[p.name]"
                  :placeholder="p.placeholder || ''"
                  rows="6">
                </textarea>
              </div>
            </template>
            <template v-else>
              <label class="rest-param rest-param-input" :title="p.description || ''">
                <span class="rest-param-name">
                  {{ p.name }}<span class="rest-required" v-if="p.required">*</span>
                </span>
                <input
                  class="rest-input pane"
                  type="text"
                  v-model="paramValues[p.name]"
                  :placeholder="p.placeholder || ''" />
              </label>
            </template>
          </template>
        </div>

        <div class="rest-bool-params" v-if="boolParams.length">
          <template v-for="p in boolParams" :key="p.name">
            <label
              class="rest-toggle-button rest-tri-toggle"
              :class="{ 'rest-tri-undefined': paramValues[p.name] === undefined }"
              :title="p.description || ''"
              @click.prevent="cycleTriState(p.name)">
              <input
                class="rest-checkbox"
                type="checkbox"
                :checked="paramValues[p.name] === true" />
              <span>
                {{ p.name }}<span class="rest-required" v-if="p.required">*</span>
              </span>
            </label>
          </template>
        </div>
      </template>

    </div>

    <div class="rest-response pane">
      <div class="rest-response-actions" v-show="responseTab === 'Response'">
        <label class="rest-toggle-button" title="Pretty-print JSON content">
          <input class="rest-checkbox" type="checkbox" v-model="pretty" />
          <span>Format</span>
        </label>
        <label class="rest-toggle-button" title="Syntax highlight JSON content">
          <input class="rest-checkbox" type="checkbox" v-model="syntaxHighlight" />
          <span>Syntax highlight</span>
        </label>
        <span class="rest-copy-feedback" v-if="copyFeedback">{{ copyFeedback }}</span>
        <button
          class="rest-copy-button"
          @click="onCopy"
          :disabled="!responseText"
          :title="responseText ? 'Copy to clipboard' : ''">
          <icon src="copy" :size="16"></icon>
        </button>
      </div>
      <tabs :items="['Response', 'API']" v-model:active_tab="responseTab" class="rest-response-tabs">
        <template v-slot:Response>
          <div class="rest-response-pane">
            <pre
              v-if="syntaxHighlight && responseText && !hasError"
              class="rest-response-body"
              v-html="highlightedResponse"></pre>
            <pre
              v-else
              class="rest-response-body"
              :class="{ 'rest-response-error': hasError }">{{ responseText }}</pre>
            <div :class="footerCss" v-if="status">{{ status }}</div>
          </div>
        </template>
        <template v-slot:API>
          <div class="rest-api-pane">
            <p>URL</p>
            <pre class="rest-api-block"><a v-if="restUrl" :href="restUrlAbs" target="_blank">{{ restUrl }}</a></pre>
            <p>curl</p>
            <pre class="rest-api-block">{{ curlSnippet }}</pre>
            <p>JavaScript</p>
            <pre class="rest-api-block">{{ jsSnippet }}</pre>
          </div>
        </template>
      </tabs>
    </div>
  </div>
</template>

<script>
export default { name: "page-rest" };
</script>

<script setup>
import { defineProps, defineModel, ref, computed, watch } from 'vue';

const props = defineProps({
  conn: { type: Object, required: true },
  app_state: { type: Object, required: true },
});

const app_params = defineModel("app_params");

const endpoints = [
  {
    id: "world",
    method: "GET",
    path: "/world",
    description: "Retrieve all serializable world data.",
    call: (conn, ctx) => conn.world(ctx.recv, ctx.err),
  },
  {
    id: "entity_get",
    method: "GET",
    path: "/entity/{path}",
    description: "Retrieve an entity with its tags, pairs, and components.",
    pathParam: { name: "path", required: true, placeholder: "flecs.core.World" },
    params: [
      { name: "entity_id", type: "boolean", description: "Include numeric entity identifier" },
      { name: "doc", type: "boolean", description: "Serialize documentation components" },
      { name: "full_paths", type: "boolean", description: "Use complete tag/pair/component paths" },
      { name: "inherited", type: "boolean", description: "Include inherited components from prefabs" },
      { name: "values", type: "boolean", description: "Serialize component values" },
      { name: "builtin", type: "boolean", description: "Include builtin components for parent & name" },
      { name: "type_info", type: "boolean", description: "Include component schema information" },
      { name: "matches", type: "boolean", description: "Serialize query matches" },
      { name: "alerts", type: "boolean", description: "Include active alerts for entity & descendants" },
      { name: "refs", type: "string", description: "Serialize relationship back references for entity" },
      { name: "try", type: "boolean", description: "Suppress HTTP errors on failure" },
    ],
    call: (conn, ctx) => conn.entity(ctx.path, ctx.params, ctx.recv, ctx.err),
  },
  {
    id: "entity_put",
    method: "PUT",
    path: "/entity/{path}",
    description: "Create a new entity at the specified path.",
    pathParam: { name: "path", required: true, placeholder: "my.new.entity" },
    call: (conn, ctx) => conn.create(ctx.path, ctx.recv, ctx.err),
  },
  {
    id: "entity_delete",
    method: "DELETE",
    path: "/entity/{path}",
    description: "Delete an entity and its contents.",
    pathParam: { name: "path", required: true, placeholder: "my.entity" },
    call: (conn, ctx) => conn.delete(ctx.path, ctx.recv, ctx.err),
  },
  {
    id: "component_get",
    method: "GET",
    path: "/component/{path}",
    description: "Retrieve a single component from an entity.",
    pathParam: { name: "path", required: true, placeholder: "my.entity" },
    params: [
      { name: "component", type: "string", required: true, description: "Component name to fetch" },
    ],
    call: (conn, ctx) => conn.get(ctx.path, ctx.params, ctx.recv, ctx.err),
  },
  {
    id: "component_put",
    method: "PUT",
    path: "/component/{path}",
    description: "Add or set a component on an entity.",
    pathParam: { name: "path", required: true, placeholder: "my.entity" },
    params: [
      { name: "component", type: "string", required: true, description: "Component to add/modify" },
      { name: "value", type: "textarea", description: "JSON-encoded component value (leave empty to just add)" },
    ],
    call: (conn, ctx) => {
      const component = ctx.params.component;
      let value = ctx.params.value;
      if (value !== undefined && value !== "") {
        if (typeof value === "object") {
          value = JSON.stringify(value);
        }
        value = encodeURIComponent(value);
        const path = conn._.escapePath(ctx.path);
        return conn._.request(conn, "PUT", "component/" + path,
          { component: component, value: value }, ctx.recv, ctx.err);
      }
      return conn.add(ctx.path, component, ctx.recv, ctx.err);
    },
  },
  {
    id: "component_delete",
    method: "DELETE",
    path: "/component/{path}",
    description: "Remove a component from an entity.",
    pathParam: { name: "path", required: true, placeholder: "my.entity" },
    params: [
      { name: "component", type: "string", required: true, description: "Component to remove" },
    ],
    call: (conn, ctx) => conn.remove(ctx.path, ctx.params.component, ctx.recv, ctx.err),
  },
  {
    id: "toggle_put",
    method: "PUT",
    path: "/toggle/{path}",
    description: "Enable or disable an entity or specific component.",
    pathParam: { name: "path", required: true, placeholder: "my.entity" },
    params: [
      { name: "enable", type: "boolean", description: "Toggle state (checked = enable, unchecked = disable)" },
      { name: "component", type: "string", description: "Specific component to toggle; leave empty to toggle entity" },
    ],
    call: (conn, ctx) => {
      const enable = ctx.params.enable;
      const component = ctx.params.component;
      if (enable === false) {
        return conn.disable(ctx.path, component, ctx.recv, ctx.err);
      }
      return conn.enable(ctx.path, component, ctx.recv, ctx.err);
    },
  },
  {
    id: "query",
    method: "GET",
    path: "/query",
    description: "Execute a query and retrieve matching results.",
    params: [
      { name: "expr", type: "string", description: "Query expression to evaluate", placeholder: "Position, Velocity" },
      { name: "name", type: "string", description: "Evaluate a named query (alternative to expr)" },
      { name: "entity_id", type: "boolean", description: "Include numeric entity identifiers" },
      { name: "doc", type: "boolean", description: "Serialize documentation components" },
      { name: "full_paths", type: "boolean", description: "Use complete paths" },
      { name: "inherited", type: "boolean", description: "Include inherited components" },
      { name: "values", type: "boolean", description: "Serialize component values" },
      { name: "builtin", type: "boolean", description: "Include builtin components" },
      { name: "fields", type: "boolean", description: "Serialize query fields" },
      { name: "table", type: "boolean", description: "Include all components for each match" },
      { name: "result", type: "boolean", description: "Include query results (uncheck for metadata-only)" },
      { name: "type_info", type: "boolean", description: "Include component schemas" },
      { name: "field_info", type: "boolean", description: "Serialize field metadata" },
      { name: "query_info", type: "boolean", description: "Serialize query structure information" },
      { name: "query_plan", type: "boolean", description: "Serialize query execution plan" },
      { name: "query_profile", type: "boolean", description: "Include query performance profiling" },
      { name: "try", type: "boolean", description: "Suppress HTTP errors on failure" },
    ],
    call: (conn, ctx) => {
      const params = Object.assign({}, ctx.params);
      const expr = params.expr;
      const name = params.name;
      delete params.expr;
      delete params.name;
      if (name) {
        return conn.queryName(name, params, ctx.recv, ctx.err);
      }
      return conn.query(expr || "", params, ctx.recv, ctx.err);
    },
  },
  {
    id: "script_put",
    method: "PUT",
    path: "/script/{path}",
    description: "Update Flecs script code.",
    pathParam: { name: "path", required: true, placeholder: "my.script" },
    params: [
      { name: "code", type: "textarea", required: true, description: "New script code to parse" },
      { name: "try", type: "boolean", description: "Suppress HTTP errors on failure" },
    ],
    call: (conn, ctx) => {
      const params = Object.assign({}, ctx.params);
      const code = params.code || "";
      delete params.code;
      return conn.scriptUpdate(ctx.path, code, params, ctx.recv, ctx.err);
    },
  },
  {
    id: "action_put",
    method: "PUT",
    path: "/action/{action}",
    description: "Invoke a named action.",
    pathParam: { name: "action", required: true, placeholder: "action_name" },
    call: (conn, ctx) => conn.action(ctx.path, ctx.recv, ctx.err),
  },
];

const methods = Array.from(new Set(endpoints.map((e) => e.method)));

const initialEndpointId = (app_params.value && app_params.value.rest && app_params.value.rest.endpoint) || endpoints[0].id;
const validInitial = endpoints.find((e) => e.id === initialEndpointId) || endpoints[0];

const method = ref(validInitial.method);
const endpointId = ref(validInitial.id);
const pathValue = ref("");
const paramValues = ref({});
const responseText = ref("");
const status = ref("");
const hasError = ref(false);
const copyFeedback = ref("");
const syntaxHighlight = ref(false);
const pretty = ref(false);
const responseTab = ref("Response");
let copyFeedbackTimer;

const availableEndpoints = computed(() =>
  endpoints.filter((e) => e.method === method.value)
);

function endpointDisplay(ep) {
  return ep.path.replace(/\/\{[^}]+\}$/, "");
}

const endpoint = computed(() => endpoints.find((e) => e.id === endpointId.value));

const pathPlaceholder = computed(() => {
  if (endpoint.value && endpoint.value.pathParam) {
    return endpoint.value.pathParam.placeholder || endpoint.value.pathParam.name;
  }
  return "";
});

const promotedParam = computed(() => {
  const ep = endpoint.value;
  if (!ep || ep.pathParam || !ep.params) return null;
  return ep.params.find((p) => p.type !== "boolean" && p.type !== "textarea") || null;
});

const visibleParams = computed(() => {
  const ep = endpoint.value;
  if (!ep || !ep.params) return [];
  const promoted = promotedParam.value;
  return ep.params.filter((p) => !promoted || p.name !== promoted.name);
});

const inputParams = computed(() =>
  visibleParams.value.filter((p) => p.type !== "boolean")
);

const boolParams = computed(() =>
  visibleParams.value.filter((p) => p.type === "boolean")
);

const footerCss = computed(() => {
  return ["rest-response-footer", hasError.value ? "rest-response-footer-error" : "rest-response-footer-ok"];
});

function escapePath(p) {
  return props.conn._.escapePath(p || "");
}

function paramStr(params) {
  return flecs._.paramStr(params);
}

function jsonLiteral(value) {
  return JSON.stringify(value);
}

function jsObjectLiteral(obj) {
  const entries = Object.entries(obj);
  if (!entries.length) return "{}";
  const inner = entries
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join(",\n");
  return `{\n${inner}\n}`;
}

function jsCallback(funcName, args) {
  const indent = (s) => "  " + s.replace(/\n/g, "\n  ");
  const callbacks =
    "  (reply) => {\n    // Success\n  },\n" +
    "  (err) => {\n    // Error\n  }";
  if (args.length) {
    const argLines = args.map(indent).join(",\n");
    return `${funcName}(\n${argLines},\n${callbacks});`;
  }
  return `${funcName}(\n${callbacks});`;
}

const requestPlan = computed(() => {
  const ep = endpoint.value;
  if (!ep) return null;

  const params = { ...buildParams() };
  const path = pathValue.value;
  let urlPath = "";
  let payload;
  let method = ep.method;
  let js = "";

  switch (ep.id) {
    case "world": {
      urlPath = "world";
      js = jsCallback("conn.world", []);
      break;
    }
    case "entity_get": {
      urlPath = "entity/" + escapePath(path);
      js = jsCallback("conn.entity", [
        jsonLiteral(path),
        jsObjectLiteral(params),
      ]);
      break;
    }
    case "entity_put": {
      urlPath = "entity/" + escapePath(path);
      js = jsCallback("conn.create", [jsonLiteral(path)]);
      break;
    }
    case "entity_delete": {
      urlPath = "entity/" + escapePath(path);
      js = jsCallback("conn.delete", [jsonLiteral(path)]);
      break;
    }
    case "component_get": {
      urlPath = "component/" + escapePath(path);
      js = jsCallback("conn.get", [
        jsonLiteral(path),
        jsObjectLiteral(params),
      ]);
      break;
    }
    case "component_put": {
      urlPath = "component/" + escapePath(path);
      const component = params.component;
      const value = params.value;
      const restParams = { component };
      if (value !== undefined && value !== "") {
        restParams.value = encodeURIComponent(value);
        js = `conn.set(${jsonLiteral(path)}, ${jsonLiteral(component || "")}, ${jsonLiteral(value || "")});`;
        params.component = component;
        params.value = encodeURIComponent(value);
      } else {
        js = jsCallback("conn.add", [
          jsonLiteral(path),
          jsonLiteral(component || ""),
        ]);
      }
      break;
    }
    case "component_delete": {
      urlPath = "component/" + escapePath(path);
      js = jsCallback("conn.remove", [
        jsonLiteral(path),
        jsonLiteral(params.component || ""),
      ]);
      break;
    }
    case "toggle_put": {
      urlPath = "toggle/" + escapePath(path);
      const enable = params.enable !== false;
      const component = params.component;
      const fn = enable ? "conn.enable" : "conn.disable";
      const args = [jsonLiteral(path), component ? jsonLiteral(component) : "undefined"];
      js = jsCallback(fn, args);
      if (params.enable === undefined) params.enable = true;
      break;
    }
    case "query": {
      urlPath = "query";
      const expr = params.expr;
      const name = params.name;
      const filtered = { ...params };
      delete filtered.expr;
      delete filtered.name;
      if (expr) {
        const trimmed = flecs.trimQuery(expr).replaceAll(", ", ",");
        params.expr = encodeURIComponent(trimmed);
        delete params.name;
        js = jsCallback("conn.query", [
          jsonLiteral(expr),
          jsObjectLiteral(filtered),
        ]);
      } else if (name) {
        params.name = encodeURIComponent(name);
        delete params.expr;
        js = jsCallback("conn.queryName", [
          jsonLiteral(name),
          jsObjectLiteral(filtered),
        ]);
      } else {
        js = jsCallback("conn.query", [
          jsonLiteral(""),
          jsObjectLiteral(filtered),
        ]);
      }
      break;
    }
    case "script_put": {
      urlPath = "script/" + escapePath(path);
      const code = params.code || "";
      delete params.code;
      payload = code;
      const restParams = { ...params };
      js = jsCallback("conn.scriptUpdate", [
        jsonLiteral(path),
        jsonLiteral(code),
        jsObjectLiteral(restParams),
      ]);
      break;
    }
    case "action_put": {
      urlPath = "action/" + escapePath(path);
      js = jsCallback("conn.action", [jsonLiteral(path)]);
      break;
    }
    default: {
      urlPath = "";
    }
  }

  const queryString = paramStr(params);
  const url = urlPath + queryString;
  return { method, url, js, payload };
});

const restUrl = computed(() => {
  const plan = requestPlan.value;
  return plan ? plan.url : "";
});

const restUrlAbs = computed(() => {
  if (!restUrl.value) return "";
  if (props.conn.url) return props.conn.url + "/" + restUrl.value;
  return "/" + restUrl.value;
});

const curlSnippet = computed(() => {
  const plan = requestPlan.value;
  if (!plan) return "";
  const url = restUrlAbs.value;
  let cmd = `curl -X ${plan.method} "${url}"`;
  if (plan.payload !== undefined) {
    const escaped = plan.payload.replace(/'/g, "'\\''");
    cmd += ` --data '${escaped}'`;
  }
  return cmd;
});

const jsSnippet = computed(() => {
  const plan = requestPlan.value;
  return plan ? plan.js : "";
});

const highlightedResponse = computed(() => highlightJson(responseText.value));

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightJson(json) {
  if (!json) return "";
  const escaped = escapeHtml(json);
  const re = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:?)|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)|([\{\}\[\]])/g;
  return escaped.replace(re, (match, str, kw, num, punct) => {
    if (str !== undefined) {
      if (/:$/.test(str)) {
        return `<span class="rest-json-key">${str}</span>`;
      }
      return `<span class="rest-json-string">${str}</span>`;
    }
    if (kw !== undefined) {
      return `<span class="rest-json-keyword">${kw}</span>`;
    }
    if (num !== undefined) {
      return `<span class="rest-json-number">${num}</span>`;
    }
    if (punct !== undefined) {
      return `<span class="rest-json-punct">${punct}</span>`;
    }
    return match;
  });
}

function resetParams() {
  const next = {};
  if (endpoint.value && endpoint.value.params) {
    for (const p of endpoint.value.params) {
      if (p.type === "boolean") {
        next[p.name] = undefined;
      } else {
        next[p.name] = "";
      }
    }
  }
  paramValues.value = next;
  pathValue.value = "";
}

function cycleTriState(name) {
  const v = paramValues.value[name];
  if (v === undefined) {
    paramValues.value[name] = true;
  } else if (v === true) {
    paramValues.value[name] = false;
  } else {
    paramValues.value[name] = undefined;
  }
}

watch(method, (newMethod) => {
  if (endpoint.value && endpoint.value.method === newMethod) {
    return;
  }
  const first = endpoints.find((e) => e.method === newMethod);
  if (first) {
    endpointId.value = first.id;
  }
});

watch(endpointId, (value) => {
  resetParams();
  responseText.value = "";
  status.value = "";
  hasError.value = false;
  const ep = endpoints.find((e) => e.id === value);
  if (ep && ep.method !== method.value) {
    method.value = ep.method;
  }
  if (app_params.value && app_params.value.rest) {
    app_params.value.rest.endpoint = value;
  }
});

resetParams();

function buildParams() {
  const ep = endpoint.value;
  if (!ep || !ep.params) return {};
  const out = {};
  for (const p of ep.params) {
    const v = paramValues.value[p.name];
    if (v === undefined) continue;
    if (p.type === "boolean") {
      out[p.name] = v;
    } else if (v !== "") {
      out[p.name] = v;
    }
  }
  return out;
}

function stringifyPayload(reply) {
  if (typeof reply !== "object" || reply === null) {
    return String(reply);
  }
  try {
    return pretty.value
      ? JSON.stringify(reply, null, 2)
      : JSON.stringify(reply);
  } catch (e) {
    return String(reply);
  }
}

function showReply(reply) {
  hasError.value = false;
  status.value = "OK";
  if (reply === undefined || reply === null || reply === "") {
    responseText.value = "(empty response)";
    return;
  }
  if (typeof reply === "string") {
    try {
      const parsed = JSON.parse(reply);
      responseText.value = stringifyPayload(parsed);
    } catch (e) {
      responseText.value = reply;
    }
    return;
  }
  responseText.value = stringifyPayload(reply);
}

function showError(reply) {
  hasError.value = true;
  status.value = "Error";
  if (reply === undefined || reply === null) {
    responseText.value = "(no response)";
    return;
  }
  if (typeof reply === "object") {
    responseText.value = stringifyPayload(reply);
  } else {
    responseText.value = String(reply);
  }
}

watch(pretty, () => {
  if (!responseText.value) return;
  try {
    const parsed = JSON.parse(responseText.value);
    responseText.value = pretty.value
      ? JSON.stringify(parsed, null, 2)
      : JSON.stringify(parsed);
  } catch (e) {
    // not JSON, leave as-is
  }
});

function flashCopyFeedback(msg) {
  copyFeedback.value = msg;
  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => {
    copyFeedback.value = "";
  }, 1500);
}

function onCopy() {
  if (!responseText.value) return;
  const text = responseText.value;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => flashCopyFeedback("Copied"))
      .catch(() => flashCopyFeedback("Copy failed"));
    return;
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    flashCopyFeedback("Copied");
  } catch (e) {
    flashCopyFeedback("Copy failed");
  }
}


function onSend() {
  const ep = endpoint.value;
  if (!ep) return;

  if (ep.pathParam && ep.pathParam.required && !pathValue.value) {
    hasError.value = true;
    status.value = "Error";
    responseText.value = `Missing required path parameter: ${ep.pathParam.name}`;
    return;
  }

  const params = buildParams();

  if (ep.params) {
    for (const p of ep.params) {
      if (p.required && (params[p.name] === undefined || params[p.name] === "")) {
        hasError.value = true;
        status.value = "Error";
        responseText.value = `Missing required parameter: ${p.name}`;
        return;
      }
    }
  }

  status.value = "Sending...";
  hasError.value = false;
  responseText.value = "";

  try {
    ep.call(props.conn, {
      path: pathValue.value,
      params: params,
      recv: showReply,
      err: showError,
    });
  } catch (e) {
    showError({ error: String(e) });
  }
}

function onClear() {
  resetParams();
  responseText.value = "";
  status.value = "";
  hasError.value = false;
}

</script>

<style scoped>

#page-rest {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--gap);
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
  overflow: hidden;
}

div.rest-request {
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

div.rest-toolbar {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  flex-wrap: wrap;
}

div.rest-toolbar > .rest-select {
  flex: 0 0 auto;
  min-width: 90px;
}

div.rest-toolbar > .rest-select-endpoint {
  min-width: 200px;
}

div.rest-toolbar > .rest-input {
  flex: 1 1 200px;
  min-width: 150px;
}

div.rest-toolbar > button {
  flex: 0 0 auto;
}

div.rest-description {
  color: var(--secondary-text);
  font-size: 0.85rem;
}

select.rest-select,
input.rest-input,
textarea.rest-textarea {
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--primary-text);
  background-color: var(--bg-input);
  padding: 6px 8px;
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--border);
  box-sizing: border-box;
  outline: none;
}

input.rest-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

select.rest-select:focus,
input.rest-input:focus,
textarea.rest-textarea:focus {
  background-color: var(--bg-input-select);
  border-color: var(--green);
}

textarea.rest-textarea {
  resize: vertical;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.85rem;
  width: 100%;
}

div.rest-input-params {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

div.rest-bool-params {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

div.rest-param-textarea {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  cursor: default;
  gap: 0.25rem;
  width: 100%;
}

label.rest-param-input {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: default;
}

label.rest-param-input > span.rest-param-name {
  min-width: 100px;
}

label.rest-param-input > input.rest-input {
  flex: 1 1 auto;
  min-width: 0;
}

span.rest-param-name {
  color: var(--secondary-text);
  font-size: 0.9rem;
  white-space: nowrap;
}

span.rest-required {
  color: var(--red);
  margin-left: 2px;
}

input.rest-checkbox {
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bg-input);
  box-sizing: content-box;
  width: 18px;
  height: 18px;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  position: relative;
  margin: 0;
}

input.rest-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 2px;
  width: 4px;
  height: 9px;
  border: solid #4981B5;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}

label.rest-toggle-button.rest-tri-undefined input.rest-checkbox {
  opacity: 0.5;
}


div.rest-response {
  position: relative;
  overflow: hidden;
  padding: 0;
}

div.rest-response-actions {
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

div.rest-response :deep(.rest-response-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

div.rest-response :deep(.rest-response-tabs > .tabs-overview-container) {
  padding: 0 0.5rem;
}

div.rest-response :deep(.rest-response-tabs > ul) {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
}

div.rest-response :deep(.rest-response-tabs .tabs-tab.selected) {
  height: 100%;
}

div.rest-response-pane {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  overflow: hidden;
}

div.rest-api-pane {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

div.rest-api-pane p {
  margin: 0;
  margin-top: 1rem;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 0.85rem;
}

div.rest-api-pane p:first-child {
  margin-top: 0;
}

pre.rest-api-block {
  margin: 0.5rem 0 0 0;
  padding: 1rem;
  background-color: var(--bg-content);
  color: var(--primary-text);
  border-radius: var(--border-radius-medium);
  overflow-x: auto;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
}

pre.rest-api-block a {
  color: var(--primary-text);
  text-decoration: none;
}

pre.rest-api-block a:hover {
  text-decoration: underline;
}

label.rest-toggle-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  background-color: var(--bg-button);
  color: var(--secondary-text);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;
  transition: background-color var(--animation-duration), color var(--animation-duration);
}

label.rest-toggle-button:hover {
  background-color: var(--bg-button-hover);
}

label.rest-toggle-button:has(input:checked),
label.rest-tri-toggle:not(.rest-tri-undefined) {
  color: var(--primary-text);
}

label.rest-toggle-button > span {
  white-space: nowrap;
}

button.rest-copy-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

button.rest-copy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

span.rest-copy-feedback {
  color: var(--bright-green);
  font-size: 0.8rem;
}

div.rest-response-footer {
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-top: 1px solid var(--border);
  text-align: right;
}

div.rest-response-footer-ok {
  color: var(--bright-green);
  background-color: var(--darker-green);
}

div.rest-response-footer-error {
  color: var(--bright-red);
  background-color: rgba(181, 73, 75, 0.25);
}


pre.rest-response-body {
  margin: 0;
  padding: 1rem;
  overflow: auto;
  background-color: var(--bg-content);
  color: var(--primary-text);
  font-size: 0.85rem;
  border-radius: 0;
}

pre.rest-response-error {
  color: var(--bright-red);
}

pre.rest-response-body :deep(.rest-json-key) {
  color: #98c379;
}

pre.rest-response-body :deep(.rest-json-string) {
  color: #61afef;
}

pre.rest-response-body :deep(.rest-json-number) {
  color: #d19a66;
}

pre.rest-response-body :deep(.rest-json-keyword) {
  color: #e06c75;
}

pre.rest-response-body :deep(.rest-json-punct) {
  color: #c678dd;
}

</style>
</content>
</invoke>