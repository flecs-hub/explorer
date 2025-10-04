explorer = {
  shortenEntity: function(entity) {
    if (entity) {
      if (entity[0] === "(") {
        let pair = this.parsePair(entity);
        return "(" + this.shortenEntity(pair[0]) + ", " + pair[1] + ")";
      }

      let escaped = entity.replaceAll("\\.", "@@");
      escaped = escaped.split(".").pop();
      escaped = escaped.replaceAll("@@", ".");
      return escaped;
    }
  },

  parsePair: function(expr) {
    if (expr[0] !== "(") {
      return undefined;
    }

    let pair = expr.slice(1, -1).split(",");
    pair[0] = pair[0].trim();
    pair[1] = pair[1].trim();
    return pair;
  },

  shortenComponent: function(component) {
    let result;
    if (component[0] !== "(") {
      // Not a pair
      result = this.shortenEntity(component);
    } else {
      let pair = this.parsePair(component);
      let rel = this.shortenEntity(pair[0]);
      result = "(" + this.shortenEntity(pair[0]) + ", " + pair[1] + ")";
    }
    return result;
  },

  entityParent: function(path) {
    path = path.replaceAll("\\\.", "@@");
    if (path[0] === "(") {
      path = this.parsePair(path)[0];
    }
    const names = path.split(".");
    names.pop();
    return names.join(".").replaceAll("@@", ".");
  },

  calculateMemoryTotal: function(data) {
    let result = 0;
    for (let key in data) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
      if (key.startsWith('bytes_')) { 
        result += data[key];
      }
    }
    return result;
  },

  fmtSize: function(size) {
    if (typeof size === 'string') {
      size = parseInt(size);
    }

    if (typeof size !== 'number') {
      return "n/a";
    }

    if (size === 0) {
      return "0 B";
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];

    let i = 0;
    while (size > 1000) {
      size /= 1000;
      i ++;
    }

    return size.toFixed(2) + ' ' + sizes[i];
  },

  fmtDuration: function(seconds) {
    let result = "";
  
    if (seconds === 0) {
      return "0s";
    }
  
    let days = Math.floor(seconds / (24 * 60 * 60));
    seconds -= days * (24 * 60 * 60);
  
    let hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * (60 * 60);
  
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    
    if (days) {
      result += days + "d\xa0";
    }
    if (hours || (result.length && minutes && seconds)) {
      result += hours + "h\xa0";
    }
    if (minutes || (result.length && seconds)) {
      result += minutes + "min\xa0";
    }
    if (seconds) {
      if (seconds < 1.0 && (!days && !hours && !minutes)) {
        // Small duration, multiply until we have something that's > 1
        let multiplied = 0;
        if (seconds > 0) {
          do {
            multiplied ++;
            seconds *= 1000;
          } while (seconds < 1.0);
        }
  
        result += seconds.toFixed(2);
        result += ['s', 'ms', 'us', 'ns', 'ps'][multiplied];
      } else {
        // don't bother with decimals of seconds when the duration is longer than
        // a minute.
        result += Math.round(seconds);
        result += "s";
      }
    }
  
    return result;
  }
}
