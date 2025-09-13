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
  }
}
