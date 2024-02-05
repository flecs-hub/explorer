
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return undefined;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

let components = [
  loadModule('js/components/title-bar.vue', options),
  loadModule('js/components/tabs.vue', options),
  loadModule('js/components/inspect-pane.vue', options),
  loadModule('js/components/app-menu.vue', options),
  loadModule('js/components/editor.vue', options),
  loadModule('js/components/code-editor.vue', options),
  loadModule('js/components/prop-explorer.vue', options),
  loadModule('js/components/prop-suggestion.vue', options),
  loadModule('js/components/query-request.vue', options),
  loadModule('js/components/query-result.vue', options),
  loadModule('js/components/query-status.vue', options),
  loadModule('js/components/query-plan.vue', options),
  loadModule('js/components/query-schema.vue', options),
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
        query: QueryParam,
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
