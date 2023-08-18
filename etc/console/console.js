
const entity_options = {
  label: false, 
  brief: false, 
  link: false, 
  ids: true, 
  id_labels: false,
  base: false, 
  values: false, 
  private: false, 
  type_info: false,
  alerts: false
};

const query_options = {
  term_ids: false, 
  ids: false, 
  sources: false, 
  variables: true,
  is_set: false, 
  values: false, 
  entities: true, 
  entity_labels: false,
  entity_ids: false,  
  variable_labels: false, 
  variable_ids: false,
  type_info: false,
};

function deepCopy(arg) {
  return JSON.parse(JSON.stringify(arg));
}

function optionDifference(defaults, input) {
  let result = {};
  for (let k in input) {
    if (defaults[k] != input[k]) {
      result[k] = input[k];
    }
  }
  return result;
}

function optionsToCode(options) {
  let result = "{";
  if (Object.keys(options).length) {
    let count = 0;
    for (let k in options) {
      if (count) {
        result += ", ";
      }
      result += k + ": " + options[k];
      count ++;
    }
  }
  result += "}";
  return result;
}

new Vue({
  el: '#app',

  watch: {
    kind: function() {
      if (this.kind == "entity") {
        this.options = deepCopy(entity_options);
        this.option_defaults = entity_options;
      } else if (this.kind == "query") {
        this.options = deepCopy(query_options);
        this.option_defaults = query_options;
      } else if (this.kind == "query_name") {
        this.options = deepCopy(query_options);
        this.option_defaults = query_options;
      }
    }
  },

  methods: {
    toggle_option: function(option) {
      this.options[option] = !this.options[option];
    },

    browse: function() {
      window.open("https://flecs.dev/explorer?host=" + this.host, "_blank");
    },

    request: function() {
      this.result = "";

      let params = optionDifference(this.option_defaults, this.options);

      if (this.kind == "entity") {
        this.url = flecs.entity(this.entity, params, (data) => {
          this.result = JSON.stringify(JSON.parse(data), null, 2);
        }, (err) => {
          this.result = JSON.stringify(JSON.parse(err), null, 2);
        }).url;

        this.code = "flecs.entity(\"" + this.entity + "\", ";
        this.code += optionsToCode(params);
        this.code += ", (result) => {});";
      } else if (this.kind == "query") {
        this.url = flecs.query(this.query, params, (data) => {
          this.result = JSON.stringify(JSON.parse(data), null, 2);
        }, (err) => {
          this.result = JSON.stringify(JSON.parse(err), null, 2);
        }).url;

        this.code = "flecs.query(\"" + this.query + "\", ";
        this.code += optionsToCode(params);
        this.code += ", (result) => {});";
      } else if (this.kind == "query_name") {
        this.url = flecs.query_name(this.query_name, params, (data) => {
          this.result = JSON.stringify(JSON.parse(data), null, 2);
        }, (err) => {
          this.result = JSON.stringify(JSON.parse(err), null, 2);
        }).url;

        this.code = "flecs.query_name(\"" + this.query_name + "\", ";
        this.code += optionsToCode(params);
        this.code += ", (result) => {});";
      }
    }
  },

  data: function() {
    return {
      host: "localhost:27750",
      kind: "entity",
      entity: "flecs.core.World",
      query: "(ChildOf, flecs.core)",
      query_name: "flecs.pipeline.BuiltinPipeline",
      options: deepCopy(entity_options),
      option_defaults: entity_options,
      result: "",
      url: "",
      code: " "
    }
  }
});
