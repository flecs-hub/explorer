explorer = {
  shortenEntity: function(entity) {
    if (entity) {
      let escaped = entity.replaceAll("\\.", "@@");
      escaped = escaped.split(".").pop();
      escaped = escaped.replaceAll("@@", ".");
      return escaped;
    }
  }
}
