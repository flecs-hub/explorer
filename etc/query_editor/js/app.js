
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return undefined;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Webasm module loading
let native_request;
let capture_keyboard_events;

function wasmModuleLoaded(wasm_url, onReady) {
  const name = wasm_url.slice(wasm_url.lastIndexOf("/") + 1, wasm_url.lastIndexOf("."));
  wasm_module = Function(`return ` + name + `;`)();
  wasm_module().then(function(Module) {
    native_request = Module.cwrap('flecs_explorer_request', 'string', ['string', 'string']);
    capture_keyboard_events = Module.sokol_capture_keyboard_events;
    if (capture_keyboard_events) {
      Module.sokol_capture_keyboard_events(false);
    }
    onReady();
  });
}

function loadWasmModule(wasm_url, onReady) {
  const oldEl = document.getElementById("wasm-module");
  if (oldEl) {
    oldEl.remove();
  }

  const scriptEl = document.createElement("script");
  scriptEl.id = "wasm-module";
  scriptEl.onload = () => {
    wasmModuleLoaded(wasm_url, onReady);
  };
  scriptEl.onerror = () => {
    console.error("failed to load wasm module " + wasm_url);
  };
  scriptEl.src = wasm_url;

  document.head.appendChild(scriptEl);
}

function nameQueryFromExpr(expr, oneof) {
  if (!expr) {
    return {
      parent: undefined,
      expr: undefined,
      query: undefined
    };
  }

  let parent;
  let last_sep = expr.lastIndexOf(".");
  if (last_sep != -1) {
    parent = expr.slice(0, last_sep);
    expr = expr.slice(last_sep + 1, expr.length);
  } else {
    parent = oneof;
  }

  let query;
  if (parent) {
    query = `(ChildOf, ${parent})`
    if (expr.length) {
      query += `, $this ~= "${expr}"`;
    }
  } else {
    query = `$this ~= "${expr}"`;
  }

  return {
    parent: parent,
    expr: expr,
    query: query
  };
}

let components = [
  loadModule('js/components/title-bar.vue', options),
  loadModule('js/components/icon.vue', options),
  loadModule('js/components/toggle.vue', options),
  loadModule('js/components/search-box.vue', options),
  loadModule('js/components/tabs.vue', options),
  loadModule('js/components/pane-query.vue', options),
  loadModule('js/components/pane-inspect.vue', options),
  loadModule('js/components/app-menu.vue', options),
  loadModule('js/components/query-editor.vue', options),
  loadModule('js/components/code-editor.vue', options),
  loadModule('js/components/query-list-item.vue', options),
  loadModule('js/components/prop-browser.vue', options),
  loadModule('js/components/query-browser.vue', options),
  loadModule('js/components/query-request.vue', options),
  loadModule('js/components/query-result.vue', options),
  loadModule('js/components/query-status.vue', options),
  loadModule('js/components/query-plan.vue', options),
  loadModule('js/components/query-expr.vue', options),
  loadModule('js/components/query-schema.vue', options),
  loadModule('js/components/query-inspect.vue', options),
  loadModule('js/components/query-c.vue', options),
  loadModule('js/components/query-cpp.vue', options),
  loadModule('js/components/query-js.vue', options),
  loadModule('js/components/query-rest.vue', options),
  loadModule('js/components/query-api.vue', options),
  loadModule('js/components/query-error.vue', options),
  loadModule('js/components/url-bar.vue', options),
  loadModule('js/components/entity-parent.vue', options),
];

let HostParam = getParameterByName("host");
if (HostParam) {
  if (HostParam.indexOf(":") == -1) {
    HostParam += ":27750";
  }
} else {
  HostParam = "localhost:27750";
}

let QueryParam = getParameterByName("query");
if (!QueryParam) {
  QueryParam = "(ChildOf, flecs)";
}

Promise.all(components).then((values) => {
  let app = Vue.createApp({
    data() {
      return {
        query: {
          expr: QueryParam,
          name: undefined,
          use_name: false
        },
        lastWord: "",
        host: "http://" + HostParam
      }
    }
  });

  for (let c of values) {
    app.component(c.name, c);
  }
  
  app.mount("#app");
});
