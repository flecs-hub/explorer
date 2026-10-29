const flecsTerminal = {
  HELPER_LABEL: "flecs.explorer.helper",

  READONLY_COMMANDS: new Set([
    "help", "ls", "tree", "inspect", "schema", "schema_value", "pwd", "get",
    "man", "eval", "query", "find", "grep", "grep_i", "scripts", "script_read",
    "script_grep", "script_where", "script_errors", "script_diff", "pointer",
    "listeners"
  ]),

  INPUT_COMMANDS: new Set([
    "focus", "blur", "pointer", "move", "move_by", "press", "release", "click",
    "drag", "key", "key_down", "key_up", "type", "mouse_event",
    "keyboard_event", "listeners"
  ]),

  isSpace(ch) {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r" ||
      ch === "\f" || ch === "\v";
  },

  skipString(cmd, i) {
    i ++;
    while (i < cmd.length && cmd[i] !== '"') {
      if (cmd[i] === "\\" && i + 1 < cmd.length) {
        i ++;
      }
      i ++;
    }
    return i < cmd.length ? i + 1 : -1;
  },

  tokenize(cmd) {
    const tokens = [];
    let i = 0;
    while (true) {
      while (i < cmd.length && this.isSpace(cmd[i])) {
        i ++;
      }
      if (i >= cmd.length) {
        break;
      }

      const start = i;
      if (cmd.startsWith("```", i)) {
        const end = cmd.indexOf("```", i + 3);
        if (end === -1) {
          tokens.push({ kind: "raw", start, end: cmd.length,
            text: cmd.slice(i + 3), closed: false });
          break;
        }
        tokens.push({ kind: "raw", start, end: end + 3,
          text: cmd.slice(i + 3, end), closed: true });
        i = end + 3;
      } else if (cmd[i] === '"') {
        const end = this.skipString(cmd, i);
        if (end === -1) {
          tokens.push({ kind: "string", start, end: cmd.length,
            text: cmd.slice(i + 1), closed: false });
          break;
        }
        tokens.push({ kind: "string", start, end,
          text: this.unescape(cmd.slice(i + 1, end - 1)), closed: true });
        i = end;
      } else {
        const closers = [];
        let grouped = false;
        while (i < cmd.length) {
          const ch = cmd[i];
          if (!closers.length && this.isSpace(ch)) {
            break;
          }
          if (ch === '"') {
            const end = this.skipString(cmd, i);
            if (end === -1) {
              i = cmd.length;
              break;
            }
            i = end;
            continue;
          }
          if (ch === "(" || ch === "{" || ch === "[") {
            closers.push(ch === "(" ? ")" : ch === "{" ? "}" : "]");
            grouped = true;
          } else if (ch === ")" || ch === "}" || ch === "]") {
            if (closers.length && closers[closers.length - 1] === ch) {
              closers.pop();
            }
          }
          i ++;
        }
        tokens.push({ kind: grouped ? "group" : "word", start, end: i,
          text: cmd.slice(start, i), closed: !closers.length });
      }
    }
    return tokens;
  },

  unescape(str) {
    const map = { n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"', "0": "\0" };
    return str.replace(/\\(.)/g, (m, ch) => map[ch] !== undefined ? map[ch] : ch);
  },

  commandName(cmd) {
    const tokens = this.tokenize(cmd || "");
    return tokens.length ? tokens[0].text : "";
  },

  args(cmd) {
    return this.tokenize(cmd || "").slice(1).map((t) => t.text);
  },

  isPrefix(prefix, list) {
    if (prefix.length > list.length) {
      return false;
    }
    for (let i = 0; i < prefix.length; i ++) {
      if (prefix[i] !== list[i]) {
        return false;
      }
    }
    return true;
  },

  historyDiff(mirror, remote, historySize) {
    if (!historySize || remote.length < historySize) {
      if (this.isPrefix(mirror, remote)) {
        return { added: remote.slice(mirror.length), cleared: false };
      }
      return { added: remote.slice(), cleared: true };
    }
    for (let d = 0; d <= mirror.length; d ++) {
      const overlap = mirror.length - d;
      if (overlap > remote.length) {
        continue;
      }
      let match = true;
      for (let i = 0; i < overlap; i ++) {
        if (mirror[d + i] !== remote[i]) {
          match = false;
          break;
        }
      }
      if (match && (overlap > 0 || !mirror.length)) {
        return { added: remote.slice(overlap), cleared: false };
      }
    }
    return { added: remote.slice(), cleared: mirror.length > 0 };
  },

  matchResults(cmds, history, results) {
    const matched = [];
    let j = 0;
    for (const cmd of cmds) {
      while (j < history.length && history[j] !== cmd) {
        j ++;
      }
      matched.push(results[j] || undefined);
      j ++;
    }
    return matched;
  },

  isRoot(path) {
    return !path || path === "#0" || path === "0";
  },

  splitPath(path) {
    const result = [];
    let cur = "";
    for (let i = 0; i < path.length; i ++) {
      if (path[i] === "\\" && i + 1 < path.length) {
        cur += path[i] + path[i + 1];
        i ++;
      } else if (path[i] === ".") {
        result.push(cur);
        cur = "";
      } else {
        cur += path[i];
      }
    }
    result.push(cur);
    return result;
  },

  shortName(path) {
    if (this.isRoot(path)) {
      return "(root)";
    }
    const elems = this.splitPath(path);
    return elems[elems.length - 1].replaceAll("\\.", ".");
  },

  relativePath(path, scope) {
    if (this.isRoot(path)) {
      return "(root)";
    }
    if (!this.isRoot(scope) && path.startsWith(scope + ".")) {
      return path.slice(scope.length + 1);
    }
    return path;
  },

  formatId(id) {
    if (Array.isArray(id)) {
      if (id.length === 1) {
        return id[0];
      }
      return "(" + id.join(", ") + ")";
    }
    if (id === undefined || id === null || id === "#0" || id === 0) {
      return undefined;
    }
    return String(id);
  },

  parseId(text) {
    const str = String(text).trim();
    if (str[0] === "(" && str[str.length - 1] === ")") {
      const inner = str.slice(1, -1);
      let depth = 0;
      for (let i = 0; i < inner.length; i ++) {
        const ch = inner[i];
        if (ch === "(") depth ++;
        else if (ch === ")") depth --;
        else if (ch === "," && !depth) {
          return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
        }
      }
    }
    return [str];
  },

  unwrapValue(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length === 1) {
        return { type: keys[0], value: value[keys[0]] };
      }
    }
    return { type: undefined, value: value };
  },

  treeLines(nodes) {
    const result = [];
    const open = [];
    for (let i = 0; i < nodes.length; i ++) {
      const depth = nodes[i].depth;
      let last = true;
      for (let j = i + 1; j < nodes.length; j ++) {
        if (nodes[j].depth < depth) {
          break;
        }
        if (nodes[j].depth === depth) {
          last = false;
          break;
        }
      }
      open.length = depth;
      let prefix = "";
      for (let d = 0; d < depth; d ++) {
        prefix += open[d] ? "\u2502   " : "    ";
      }
      prefix += last ? "\u2514\u2500\u2500 " : "\u251c\u2500\u2500 ";
      open[depth] = !last;
      result.push({ entity: nodes[i].entity, depth: depth, prefix: prefix });
    }
    return result;
  },

  commonPrefix(values) {
    if (!values.length) {
      return "";
    }
    let prefix = values[0];
    for (const v of values) {
      let i = 0;
      while (i < prefix.length && i < v.length && prefix[i] === v[i]) {
        i ++;
      }
      prefix = prefix.slice(0, i);
    }
    return prefix;
  },

  completionContext(text, cursor) {
    const before = text.slice(0, cursor);
    const tokens = this.tokenize(before);
    let index = tokens.length;
    let token;
    if (tokens.length) {
      const last = tokens[tokens.length - 1];
      if (last.end === before.length && !this.isSpace(before[before.length - 1] || "")) {
        token = last;
        index = tokens.length - 1;
      }
    }
    if (token && (token.kind !== "word" || token.text.indexOf('"') !== -1)) {
      return undefined;
    }
    return {
      index: index,
      command: tokens.length ? tokens[0].text : "",
      prefix: token ? token.text : "",
      start: token ? token.start : cursor,
      end: cursor
    };
  },

  splitPartial(prefix) {
    const elems = this.splitPath(prefix);
    const name = elems.pop();
    return { parent: elems.join("."), name: name };
  },

  usage(info) {
    let result = info.name;
    for (const p of info.params || []) {
      result += p.optional ? ` [${p.name}]` : ` <${p.name}>`;
    }
    return result;
  },

  shortType(type) {
    if (!type || type === "#0") {
      return undefined;
    }
    const vec = type.match(/vector<(.*)>$/);
    if (vec) {
      return this.shortType(vec[1]) + "[]";
    }
    return this.shortName(type);
  },

  commandGroup(name) {
    if (name.startsWith("script_") || name === "scripts") {
      return "Script";
    }
    if (this.INPUT_COMMANDS.has(name)) {
      return "Input";
    }
    return "World";
  },

  isEntityParam(param) {
    if (!param) {
      return false;
    }
    if (param.type === "flecs.meta.entity" || param.type === "flecs.meta.id") {
      return true;
    }
    return param.name === "script";
  },

  SCRIPT_KEYWORDS: new Set([
    "using", "with", "module", "template", "prop", "const", "if", "else",
    "for", "in", "match", "new", "export", "struct", "enum", "true", "false",
    "on", "await", "async", "fn", "return"
  ]),

  highlightScript(code) {
    const result = [];
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"?)|(\b\d+(?:\.\d+)?\b)|(\$\w+|\$)|([A-Za-z_][\w.]*)|([{}()\[\],:;=<>+\-*/|&!])|(\s+)|(.)/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      let cls;
      if (m[1]) cls = "comment";
      else if (m[2]) cls = "string";
      else if (m[3]) cls = "number";
      else if (m[4]) cls = "variable";
      else if (m[5]) {
        if (this.SCRIPT_KEYWORDS.has(m[5])) {
          cls = "keyword";
        } else if (/^[A-Z]/.test(this.shortName(m[5]))) {
          cls = "type";
        } else {
          cls = "ident";
        }
      }
      else if (m[6]) cls = "punct";
      result.push({ text: m[0], cls: cls });
    }
    return result;
  },

  highlightCommand(text, commands) {
    const result = [];
    const tokens = this.tokenize(text);
    let pos = 0;
    tokens.forEach((t, i) => {
      if (t.start > pos) {
        result.push({ text: text.slice(pos, t.start) });
      }
      let cls;
      if (i === 0) {
        if (!commands || !commands.size) {
          cls = "cmd";
        } else {
          cls = commands.has(t.text) ? "cmd" : "cmd-unknown";
        }
      } else if (t.kind === "string" || t.kind === "raw") {
        cls = "string";
      } else if (t.kind === "group") {
        cls = "group";
      } else if (/^-?\d+(\.\d+)?$/.test(t.text)) {
        cls = "number";
      } else if (t.text === "$") {
        cls = "variable";
      } else {
        cls = "arg";
      }
      result.push({ text: text.slice(t.start, t.end), cls: cls });
      pos = t.end;
    });
    if (pos < text.length) {
      result.push({ text: text.slice(pos) });
    }
    return result;
  },

  diffLines(text) {
    if (!text) {
      return [];
    }
    const lines = text.split("\n");
    if (lines[lines.length - 1] === "") {
      lines.pop();
    }
    return lines.map((line) => {
      let cls = "context";
      if (line.startsWith("@@")) cls = "hunk";
      else if (line.startsWith("+++") || line.startsWith("---")) cls = "file";
      else if (line.startsWith("+")) cls = "add";
      else if (line.startsWith("-")) cls = "del";
      return { text: line, cls: cls };
    });
  },

  matchSegments(text, needle, caseInsensitive) {
    if (!needle || !text) {
      return [{ text: text || "", match: false }];
    }
    const hay = caseInsensitive ? text.toLowerCase() : text;
    const n = caseInsensitive ? needle.toLowerCase() : needle;
    const result = [];
    let pos = 0;
    let idx;
    while ((idx = hay.indexOf(n, pos)) !== -1) {
      if (idx > pos) {
        result.push({ text: text.slice(pos, idx), match: false });
      }
      result.push({ text: text.slice(idx, idx + n.length), match: true });
      pos = idx + n.length;
    }
    if (pos < text.length) {
      result.push({ text: text.slice(pos), match: false });
    }
    return result;
  },

  sessionIndexPath(session) {
    return "#" + (Number(session) % 4294967296);
  },

  widgetFor(command, type) {
    if (!type) {
      return undefined;
    }
    const vec = type.match(/vector<(.*)>$/);
    const elem = vec ? vec[1] : undefined;
    if (elem === "entity") return "entities";
    if (elem === "TreeNode") return "tree";
    if (elem === "QueryRow") return "query";
    if (elem === "CommandInfo") return "help";
    if (elem === "GrepMatch") return "grep";
    if (elem === "ScriptMatch") return "script-grep";
    if (elem === "ScriptInfo") return "scripts";
    if (elem === "ScriptLine") return "lines";
    if (elem === "ScriptError") return "script-errors";
    if (elem === "string") return "strings";
    if (elem) return "value";
    const name = this.shortName(type);
    if (name === "EntityInfo") return "inspect";
    if (name === "DocInfo") return "doc";
    if (name === "ScriptLine") return "lines";
    if (name === "ScriptLocation") return "location";
    if (name === "EventResult") return "event";
    if (type === "flecs.meta.entity") return "entity";
    if (type === "flecs.meta.id") return "id";
    if (type === "flecs.meta.bool") return "bool";
    if (type === "flecs.meta.string") {
      if (command === "script_diff") return "diff";
      if (command === "schema") return "code";
      return "string";
    }
    return "value";
  }
};

if (typeof module === "object" && module.exports) {
  module.exports = flecsTerminal;
}
