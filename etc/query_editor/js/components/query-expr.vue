<template>
  <render/>
</template>

<script>
export default { name: "query-expr" }
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

const entityStr = (ref) => {
  if (ref.var) {
    if (ref.var == "*") {
      return "*";
    } else if (ref.var == "_") {
      return "_";
    } else if (ref.var == "$") {
      return "$";
    } else {
      return "$" + ref.var;
    }
  } else {
    if (ref.entity) {
      let elems = ref.entity.split(".");
      if (elems.length >= 3 && elems[0] == "flecs" && elems[1] == "core") {
        return elems[2];
      } else {
        return ref.entity;
      }
    } else if (ref.name) {
      return ref.name;
    }
  }
}

const entityToken = (g, ref) => {
  if (ref.var) {
    if (ref.var == "*" || ref.var == "_" || ref.var == "$") {
      g.identifier(entityStr(ref));
    } else {
      g.variable("$" + ref.var);
    }
  } else {
    if (ref.entity) {
      g.identifier(entityStr(ref));
    } else if (ref.name) {
      g.string(entityStr(ref));
    }
  }
}

const entityLen = (ref) => {
  let str = entityStr(ref);
  if (ref.name) {
    str += '""';
  }
  return str.length;
}

const travTokens = (g, term) => {
  let i = 0;

  for (const flag of term.flags) {
    if (i) {
      g.operator("|");
    }
    g.keyword(flag);
    i ++;
  }

  if (term.trav) {
    if (term.trav.entity != "flecs.core.IsA") {
      g.operator("(");
      entityToken(g, term.trav);
      g.operator(")");
    }
  }
}

const inoutToken = (g, inout, columnWidth) => {
  if (columnWidth) {
    if (inout != "default") {
      g.operator("[");
      g.qualifier(inout);
      g.operator("]" + " ".repeat(1 + columnWidth - inout.length));
    } else {
      g.operator(" ".repeat(columnWidth + 3));
    }
  }
}

const preOperToken = (g, term) => {
  if (term.oper == "not") {
    g.operator("!");
  } else if (term.oper == "optional") {
    g.operator("?");
  } else {
    g.operator(" ");
  }
}

const skipInout = (term) => {
  if (!term.inout || term.inout == "default") {
    return true;
  }

  if (term.oper == "not" || (!term.has_data && term.inout == "none")) {
    return true;
  }

  if (term.first.entity == "flecs.core.PredEq" ||
      term.first.entity == "flecs.core.PredMatch" ||
      term.first.entity == "flecs.core.ScopeOpen" ||
      term.first.entity == "flecs.core.ScopeClose")
  {
    return true;
  }

  return false;
}

const termTokens = (g, qi) => {
  let i = 0, inoutWidth = 0, firstWidth = 0;

  // Find width of inout column
  for (const term of qi.terms) {
    if (skipInout(term)) {
      continue;
    }

    if (term.inout.length > inoutWidth) {
      inoutWidth = term.inout.length;
    }
  }

  // Find width of term.first column
  for (const term of qi.terms) {
    let len = entityLen(term.first);
    if (len > firstWidth) {
      firstWidth = len;
    }
  }

  let insertComma = false;

  for (const term of qi.terms) {
    if (i) {
      if (insertComma) {
        if (term.first.entity != "flecs.core.ScopeClose") {
          g.operator(",");
        }
      }
      g.newLine();
    }
    
    if (term.first.entity == "flecs.core.ScopeOpen") {
      inoutToken(g, "default", inoutWidth);

      preOperToken(g, term);

      g.operator("{");
      g.indent ++;
      insertComma = false;
    } else {
      if (term.first.entity == "flecs.core.ScopeClose") {
        g.indent --;
        inoutToken(g, "default", inoutWidth);
        g.operator("}");
      } else if (term.first.entity == "flecs.core.PredEq") {
        inoutToken(g, "default", inoutWidth);
        g.operator(" ");
        entityToken(g, term.src);
        if (term.oper == "not") {
          g.operator(" != ");
        } else {
          g.operator(" == ");
        }
        entityToken(g, term.second);
      } else if (term.first.entity == "flecs.core.PredMatch") {
        inoutToken(g, "default", inoutWidth);
        g.operator(" ");
        entityToken(g, term.src);
        g.operator(" ~= ");
        entityToken(g, term.second);      
      } else {
        if (skipInout(term)) {
          inoutToken(g, "default", inoutWidth);
        } else {
          inoutToken(g, term.inout, inoutWidth);
        }

        preOperToken(g, term);

        let firstLen = entityLen(term.first);
        entityToken(g, term.first);
        g.operator(" ".repeat(firstWidth - firstLen) + " (");
        entityToken(g, term.src);
        if (!defaultTrav(term)) {
          g.operator(":");
          travTokens(g, term);
        }
        if (term.second) {
          g.operator(", ");
          entityToken(g, term.second);
        }
        g.operator(")");
      }

      insertComma = true;
      if (term.oper == "or") {
        g.operator(" ||");
        insertComma = false;
      }
    }

    i ++;
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
    identifier: function(t) { this.push(token(t, "code-identifier")) },
    variable: function(t) { this.push(token(t, "code-variable")) },
    function: function(t) { this.push(token(t, "code-function")) },
    string: function(t) { this.push(token('"' + t + '"', "code-string")) },
    number: function(t) { this.push(token(t, "code-number")) },
  };
}

const render = () => {
  const qi = props.result.query_info;
  if (!qi) {
    return h('pre', []);
  }

  let g = generator();

  termTokens(g, qi);

  return h('pre', g.elems);
}

</script>
