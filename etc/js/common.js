explorer = {
  shortenEntity: function(entity) {
    if (entity) {
      let escaped = entity.replaceAll("\\.", "@@");
      escaped = escaped.split(".").pop();
      escaped = escaped.replaceAll("@@", ".");
      return escaped;
    }
  },

  entityParent: function(path) {
    path = path.replaceAll("\\\.", "@@");
    const names = path.split(".");
    names.pop();
    return names.join(".").replaceAll("@@", ".");
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
