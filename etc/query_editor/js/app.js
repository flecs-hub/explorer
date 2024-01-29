
let components = [
  loadModule('js/components/title-bar.vue', options),
  loadModule('js/components/app-menu.vue', options),
  loadModule('js/components/editor.vue', options),
  loadModule('js/components/code-editor.vue', options),
  loadModule('js/components/prop-explorer.vue', options),
  loadModule('js/components/prop-suggestion.vue', options),
  loadModule('js/components/query-request.vue', options),
  loadModule('js/components/query-result.vue', options),
  loadModule('js/components/query-status.vue', options),
  loadModule('js/components/url-bar.vue', options),
  loadModule('js/components/entity-parent.vue', options),
];

Promise.all(components).then((values) => {
  let app = Vue.createApp({
    data() {
      return {
        query: "(ChildOf, flecs)",
        lastWord: "",
        host: "http://localhost:27750"
      }
    }
  });

  for (let c of values) {
    app.component(c.name, c);
  }
  
  app.mount("#app");
});
