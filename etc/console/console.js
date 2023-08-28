
const entity_options = {
  type_info: false,
  alerts: false,
  raw: false,
  full_paths: false,
  label: false, 
  brief: false, 
  link: false, 
  ids: true,
  id_labels: false,
  base: false, 
  values: false, 
  private: false, 
};

const query_options = {
  type_info: false,
  raw: false,
  full_paths: false,
  term_ids: false,
  term_labels: false,
  ids: false,
  id_labels: false,
  sources: false, 
  variables: true,
  is_set: false, 
  values: false, 
  entities: true, 
  entity_labels: false,
  entity_ids: false,  
  variable_labels: false, 
  variable_ids: false,
  table: false
};

function deepCopy(arg) {
  return JSON.parse(JSON.stringify(arg));
}

let entity_options_actual = deepCopy(entity_options);
let query_options_actual = deepCopy(query_options);

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
      if (typeof options[k] == "boolean") {
        if (count) {
          result += ", ";
        }
        result += k + ": " + options[k];
        count ++;
      }
    }
  }
  result += "}";
  return result;
}

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return undefined;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

new Vue({
  el: '#app',

  watch: {
    kind: function() {
      if (this.kind == "entity") {
        this.options = entity_options_actual
        this.option_defaults = entity_options;
      } else if (this.kind == "query") {
        this.options = query_options_actual;
        this.option_defaults = query_options;
      } else if (this.kind == "query_name") {
        this.options = query_options_actual;
        this.option_defaults = query_options;
      }
    }
  },

  mounted: function() {
    const host = getParameterByName("host");
    if (host) {
      this.host = host;
    }
  },

  methods: {
    toggle_option: function(option) {
      this.options[option] = !this.options[option];
    },

    browse: function() {
      window.open("http://" + window.location.host + "?host=" + this.host, "_blank");
    },

    request: function() {
      this.result = "";

      let params = optionDifference(this.option_defaults, this.options);

      flecs.connect("http://" + this.host);

      if (this.kind == "entity") {
        this.url = flecs.entity(this.entity, params, (data) => {
          this.result = JSON.stringify(data, null, 2);
        }, (err) => {
          this.result = JSON.stringify(err, null, 2);
        }).url;

        this.code = "flecs.entity(\"" + this.entity + "\", ";
        this.code += optionsToCode(params);
        this.code += ", (result) => {});";
      } else if (this.kind == "query") {
        this.url = flecs.query(this.query, params, (data) => {
          this.result = JSON.stringify(data, null, 2);
        }, (err) => {
          this.result = JSON.stringify(err, null, 2);
        }).url;

        this.code = "flecs.query(\"" + this.query + "\", ";
        this.code += optionsToCode(params);
        this.code += ", (result) => {});";
      } else if (this.kind == "query_name") {
        this.url = flecs.query_name(this.query_name, params, (data) => {
          this.result = JSON.stringify(data, null, 2);
        }, (err) => {
          this.result = JSON.stringify(err, null, 2);
        }).url;

        this.code = "flecs.query_name(\"" + this.query_name + "\", ";
        this.code += optionsToCode(params);
        this.code += ", (result) => {});";
      }
    },

    show_option: function(option) {
      if (option == "raw" || option == "table") {
        return true;
      } else {
        if (!this.options.raw) {
          if (option == "type_info" || option == "alerts" || option == "full_paths") {
            return true;
          } else {
            return false;
          }
        } else {
          if (option == "full_paths") {
            return false;
          } else {
            return true;
          }
        }
      }
    }
  },

  data: function() {
    return {
      host: "localhost:27750",
      kind: "entity",
      entity: "flecs.core.World",
      query: "(ChildOf, flecs.core), Component",
      query_name: "flecs.pipeline.BuiltinPipeline",
      options: entity_options_actual,
      option_defaults: entity_options,
      result: "",
      url: "",
      code: " "
    }
  }
});
