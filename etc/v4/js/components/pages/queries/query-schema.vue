<template>
  <render/>
</template>

<script>
export default { name: "query-schema" };
</script>
  
<script setup>
import { h, defineProps } from 'vue';

const props = defineProps({
  result: {type: Object, required: true}
});

const token = (t, css) => {
  return h('span', {class: css}, t);
}

const jsType = (type) => {
  if (type == "int" || type == "float") {
    return "number";
  } else {
    return type;
  }
}

const appendType = (g, type, schema) => {
  g.keyword("interface");
  g.identifier(type);
  g.scopeOpen();

  let count = 0;
  for (const member in schema) {
    if (count) {
      g.comma();
    }
    g.member(member);
    g.type(jsType(schema[member][0]));
    count ++;
  }
  g.scopeClose();
  g.newLine();
  g.newLine();
}

const appendTypes = (g, schema) => {
  let types = {};
  for (const field of schema) {
    if (!field.schema || field.not) {
      continue;
    }

    types[field.type] = field.schema;
  }

  for (const type in types) {
    appendType(g, type, types[type]);
  }
}

const appendTags = (g, schema) => {
  let hasTags = false;
  let optional = true;
  for (const field of schema) {
    if (field.schema || field.not) {
      continue;
    }

    if (field.id[0] == '(') {
      continue;
    }

    hasTags = true;
    if (!field.optional) {
      optional = false;
    }
  }

  if (hasTags) {
    g.comma();
    if (optional) {
      g.optionalMember("tags");
    } else {
      g.member("tags");
    }
    g.type("string");
    g.operator("[]");
  }
}

const pairName = (pair) => {
  let elem = pair.split(",")[0];
  return elem.slice(1, elem.length);
}

const appendPairs = (g, schema) => {
  let hasPairs = false;
  let optional = true;

  for (const field of schema) {
    if (field.id[0] != '(' || field.not) {
      continue;
    }

    if (!field.optional) {
      optional = false;
    }
  }

  for (const field of schema) {
    if (field.id[0] != '(' || field.not) {
      continue;
    }

    g.comma();

    if (!hasPairs) {
      if (optional) {
        g.optionalMember("pairs");
      } else {
        g.member("pairs");
      }
      g.scopeOpen();
    }

    if (field.optional) {
      g.optionalMember(pairName(field.id));
    } else {
      g.member(pairName(field.id));
    }

    g.type("string");
    if (!field.exclusive) {
      g.operator("|");
      g.type("string");
      g.operator("[]");
    }

    hasPairs = true;
  }

  if (hasPairs) {
    g.scopeClose();
  }
}

const appendComponents = (g, schema) => {
  let hasComponents = false;
  let optional = true;

  for (const field of schema) {
    if (!field.schema || field.not) {
      continue;
    }

    if (!field.optional) {
      optional = false;
    }
  }

  for (const field of schema) {
    if (!field.schema || field.not) {
      continue;
    }

    g.comma();

    if (!hasComponents) {
      if (optional) {
        g.optionalMember("components");
      } else {
        g.member("components");
      }
      g.scopeOpen();
    }

    if (field.optional) {
      g.optionalMember(field.id);
    } else {
      g.member(field.id);
    }

    g.type(field.type);

    hasComponents = true;
  }

  if (hasComponents) {
    g.scopeClose();
  }
}

const appendVars = (g, vars) => {
  let hasVars = false;

  for (const v of vars) {
    g.comma();

    if (!hasVars) {
      g.member("vars");
      g.scopeOpen();
    }

    g.member(v);
    g.type("string");

    hasVars = true;
  }

  if (hasVars) {
    g.scopeClose();
  }
}

const render = () => {
  const vars = props.result.vars;
  const schema = props.result.field_info;
  if (!schema) {
    return h('pre', []);
  }

  let g = {
    elems: [],
    indent: 0,
    newline: false,
    push: function(t) {
      if (this.indent && this.newline) {
        this.elems.push(token(" ".repeat(this.indent * 2)));
      }
      this.elems.push(t);
      this.newline = false;
    },
    newLine: function() {
      this.elems.push("\n");
      this.newline = true;
    },
    scopeOpen: function() {
      this.operator("{");
      this.newLine();
      this.indent ++;
    },
    scopeClose: function() {
      this.newLine();
      this.indent --;
      this.operator("}");
    },
    comma: function() {
      this.operator(",");
      this.newLine();
    },
    operator: function(t) { this.push(token(t, "code-operator")) },
    keyword: function(t) { this.push(token(t + " ", "code-keyword")) },
    type: function(t) { this.push(token(t, "code-type")) },
    identifier: function(t) { this.push(token(t + " ", "code-identifier")) },
    member: function(t) { 
      this.push(token(t, "code-identifier"))
      this.operator(": ");
    },
    optionalMember: function(t) { 
      this.push(token(t, "code-identifier"))
      this.operator("?");
      this.operator(": ");
    },
  };

  appendTypes(g, schema);
  
  g.keyword("interface");
  g.identifier("Query");
  g.scopeOpen();
    g.member("results");
    g.scopeOpen();
      g.optionalMember("parent");
      g.type("string");
      g.comma();
      g.member("name");
      g.type("string");
      appendTags(g, schema);
      appendPairs(g, schema);
      if (vars) {
        appendVars(g, vars);
      }
      appendComponents(g, schema);
    g.scopeClose();
    g.operator("[]");
  g.scopeClose();

  return h('pre', g.elems);
};
</script>
  
<style scoped>
#query-schema pre {
  position: relative;
  margin: 0px;
}
</style>
