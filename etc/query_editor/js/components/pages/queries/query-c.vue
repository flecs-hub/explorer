<template>
  <p>Creation</p>
  <render_create/>
  <p>Iteration</p>
  <render_iter/>
</template>

<script>
export default { name: "query-c" }
</script>

<script setup>
import { defineProps, h } from 'vue';

const props = defineProps({
  result: {type: Object, required: true}
});

const token = (t, css) => {
  return h('span', {class: css}, t);
}

const defaultTrav = (term) => {
  if (term.flags.join("|") == "self") {
    return term.dont_inherit == true;
  }

  if (!term.trav || term.trav.entity != "flecs.core.IsA") {
    return false;
  }

  if (term.flags.join("|") != "self|up") {
    return false;
  } 

  return true;
}

const defaultSrc = (term) => {
  if (!term.src || term.src.var != "this") {
    return false;
  }
  return true;
}

const isSimpleId = (term) => {
  if (term.first.entity !== undefined) {
    if (!term.second || term.second.entity !== undefined) {
      return true;
    }
  }
  return false;
}

const isSimpleTerm = (term) => {
  if (!isSimpleId(term)) {
    return false;
  }
  if (!defaultSrc(term)) {
    return false;
  }
  if (!defaultTrav(term)) {
    return false;
  }
  if (term.oper != "and") {
    return false;
  }
  if (term.inout != "default") {
    return false;
  }
  return true;
}

const refIsSpecialVar = (g, ref) => {
  if (ref.var) {
    if (ref.var == "*") {
      return true;
    } else if (ref.var == "_") {
      return true;
    } else if (ref.var == "$") {
      return true;
    }
  }
  return false;
}

const getCSymbol = (sym) => {
  return sym.replaceAll(".", "::");
}

const entityToken = (g, ref, identifierOnly) => {
  if (ref.var) {
    if (ref.var == "*") {
      g.identifier("EcsWildcard");
    } else if (ref.var == "_") {
      g.identifier("EcsAny");
    } else if (ref.var == "$") {
      g.identifier("EcsVariable");
    } else {
      g.string("$" + ref.var);
    }
  } else {
    if (ref.symbol) {
      if (ref.type) {
        if (!identifierOnly) {
          g.function("ecs_id");
          g.operator("(");
        }
        g.type(getCSymbol(ref.symbol));
        if (!identifierOnly) {
          g.operator(")");
        }
      } else {
        g.identifier(getCSymbol(ref.symbol));
      }
    } else if (ref.entity) {
      if (ref.entity == "0") {
        g.number(0);
      } else {
        g.identifier("ecs_lookup");
        g.operator("(");
        g.identifier("world");
        g.operator(", ");
        g.string(ref.entity);
        g.operator(")");
      }
    } else if (ref.name) {
      g.string(ref.name);
    }
  }
}

const refToken = (g, term, refName) => {
  const ref = term[refName];
  g.operator(".");
  g.identifier(refName);
  g.operator(".");
  if (refIsSpecialVar(g, ref) || ref.entity) {
    g.identifier("id");
  } else if (ref.var || ref.name) {
    g.identifier("name");
  }
  g.operator(" = ");
  entityToken(g, ref);
  if (ref.name) {
    g.operator(", ");
    g.newLine();
    g.operator(".");
    g.identifier(refName); 
    g.operator("."); g.identifier("flags");
    g.operator(" = ");
    g.identifier("EcsIsName");
  } else if (ref.entity == "0") {
    g.operator(", ");
    g.newLine();
    g.operator(".");
    g.identifier(refName); 
    g.operator("."); g.identifier("flags");
    g.operator(" = ");
    g.identifier("EcsIsEntity");
  }
}

const simpleIdToken = (g, term) => {
  g.operator("."); g.identifier("id"); g.operator(" = ");
  let needsClose = false;
  let shorthand = false;
  if (term.second) {
    if (term.first.type && term.first.symbol) {
      g.function("ecs_pair_t");
    } else {
      if (term.first.symbol == "EcsChildOf") {
        g.function("ecs_childof");
        shorthand = true;
      } else if (term.first.symbol == "EcsIsA") {
        g.function("ecs_isa");
        shorthand = true;
      } else if (term.first.symbol == "EcsDependsOn") {
        g.function("ecs_dependson");
        shorthand = true;
      } else {
        g.function("ecs_pair");
      }
    }
    g.operator("(");
    needsClose = true;
  }

  if (!shorthand) {
    entityToken(g, term.first);
  }
  if (term.second) {
    if (!shorthand) {
      g.operator(", ");
    }
    entityToken(g, term.second);
  }

  if (needsClose) {
    g.operator(")");
  }
}

const travTokens = (g, term) => {
  let termFlags = false;
  if (term.flags && term.flags.length) {
    g.operator(".");
    g.identifier("src");
    g.operator(".");
    g.identifier("flags");
    g.operator(" = ");

    let i = 0;
    for (const flag of term.flags) {
      if (i) {
        g.operator("|");
      }
      let flagStr;
      if (flag == "self") {
        flagStr = "EcsSelf";
      } else if (flag == "up") {
        flagStr = "EcsUp";
      } else if (flag == "cascade") {
        flagStr = "EcsCascade";
      }
      g.identifier(flagStr);
      i ++;
    }

    termFlags = true;
  }

  if (term.trav) {
    if (term.trav.entity != "flecs.core.IsA") {
      if (termFlags) {
        g.operator(", ");
      }
      g.newLine();
      g.operator(".");
      g.identifier("src");
      g.operator(".");
      g.identifier("trav");
      g.operator(" = ");
      entityToken(g, term.trav);
    }
  }
}

const inoutToken = (g, term) => {
  g.operator("."); g.identifier("inout"); g.operator(" = ");
  if (term.inout == "in") {
    g.identifier("EcsIn");
  } else if (term.inout == "out") {
    g.identifier("EcsOut");
  } else if (term.inout == "inout") {
    g.identifier("EcsInOut");
  } else if (term.inout == "none") {
    g.identifier("EcsInOutNone");
  } else if (term.inout == "default") {
    g.identifier("EcsInOutDefault");
  }
}

const operToken = (g, term) => {
  g.operator("."); g.identifier("oper"); g.operator(" = ");
  if (term.oper == "and") {
    g.identifier("EcsAnd");
  } else if (term.oper == "not") {
    g.identifier("EcsNot");
  } else if (term.oper == "or") {
    g.identifier("EcsOr");
  } else if (term.oper == "optional") {
    g.identifier("EcsOptional");
  } else if (term.oper == "andfrom") {
    g.identifier("EcsAndFrom");
  } else if (term.oper == "notfrom") {
    g.identifier("EcsNotFrom");
  } else if (term.oper == "orfrom") {
    g.identifier("EcsOrFrom");
  }
}

const termTokens = (g, qi) => {
  let i = 0;
  for (const term of qi.terms) {
    if (i) {
      g.operator(", ");
      g.newLine();
    }

    if (isSimpleTerm(term)) {
      g.operator("{ ");
      simpleIdToken(g, term);
      g.operator(" }");
    } else {
      g.operator("{");
      g.indent ++;
      g.newLine();
      if (isSimpleId(term)) {
        simpleIdToken(g, term);
      } else {
        refToken(g, term, "first");

        if (term.second) {
          g.operator(",");
          g.newLine();
          refToken(g, term, "second");
        }
      }

      if (!defaultSrc(term)) {
        g.operator(",");
        g.newLine();
        refToken(g, term, "src");
      }

      if (term.first.entity != "flecs.core.ScopeOpen" &&
          term.first.entity != "flecs.core.ScopeClose")
      {
        if (!defaultTrav(term)) {
          g.operator(",");
          g.newLine();
          travTokens(g, term);
        }
      }

      if (term.inout != "default") {
        g.operator(",");
        g.newLine();
        inoutToken(g, term);
      }

      if (term.oper != "and") {
        g.operator(",");
        g.newLine();
        operToken(g, term);
      }

      g.indent --;
      g.newLine();
      g.operator("}");
    }

    i ++;
  }
}

const fieldTokens = (g, fi) => {
  let i = 0, fields = 0;
  if (fi) {
    for (const field of fi) {
      if (field.symbol) {
        g.type(getCSymbol(field.symbol) + " ");
        g.operator("*");
        g.identifier("f" + (i + 1));
        g.operator(" = ");
        g.function("ecs_field");
        g.operator("(&"); g.identifier("it"); g.operator(", ");
        g.type(getCSymbol(field.symbol)); g.operator(", ");
        g.number(i + 1);
        g.operator(");");
        g.newLine();
        fields ++;
      }
      i ++;
    }
  }
  if (fields) {
    g.newLine();
  }
}

const generator = () => {
  return {
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
    operator: function(t) { this.push(token(t, "code-operator")) },
    keyword: function(t) { this.push(token(t, "code-keyword")) },
    qualifier: function(t) { this.push(token(t, "code-qualifier")) },
    type: function(t) { this.push(token(t, "code-type")) },
    identifier: function(t) { this.push(token(t, "code-identifier")) },
    function: function(t) { this.push(token(t, "code-function")) },
    string: function(t) { this.push(token('"' + t + '"', "code-string")) },
    number: function(t) { this.push(token(t, "code-number")) },
  };
}

const render_create = () => {
  const qi = props.result.query_info;
  if (!qi) {
    return h('pre', []);
  }

  let g = generator();

  g.type("ecs_rule_t");
  g.operator(" *");
  g.identifier("q");
  g.operator(" = ");
  g.identifier("ecs_rule");
  g.operator("(");
  g.identifier("world");
  g.operator(", {");
  g.newLine();
    g.indent ++;
    g.operator(".");
    g.identifier("terms");
    g.operator(" = ");
    g.operator("{");
    g.newLine();
      g.indent ++;
      termTokens(g, qi);
      g.indent --;
    g.newLine();
    g.operator("}");
  g.indent --;
  g.newLine();
  g.operator("});");

  return h('pre', g.elems);
}

const render_iter = () => {
  const fi = props.result.field_info;

  let g = generator();
  g.type("ecs_iter_t ");
  g.identifier("it");
  g.operator(" = ");
  g.function("ecs_rule_iter");
  g.operator("(");
  g.identifier("world");
  g.operator(", ");
  g.identifier("q");
  g.operator(");");
  g.newLine();
  g.newLine();

  g.keyword("while");
  g.operator(" (");
  g.function("ecs_rule_next");
  g.operator("(&");
  g.identifier("it");
  g.operator(")) {");
  g.newLine();
  g.indent ++;

  fieldTokens(g, fi);

  g.keyword("for");
  g.operator(" ("); g.type("int "); g.identifier("i"); g.operator("; ");
  g.identifier("i"); g.operator(" < "); 
    g.identifier("it"); g.operator("."); g.identifier("count"); 
      g.operator("; ");
  g.operator("++");
  g.identifier("i");
  g.operator(") {");
    g.newLine();
    g.indent ++;
    g.type("ecs_entity_t "); g.identifier("e"); g.operator(" = ");
    g.identifier("it"); g.operator("."); g.identifier("entities");
    g.operator("["); g.identifier("i"); g.operator("];");
    g.indent--;
    g.newLine();
    g.newLine();
  g.operator("}");

  g.indent --;
  g.newLine();
  g.operator("}");

  return h('pre', g.elems);
}

</script>
