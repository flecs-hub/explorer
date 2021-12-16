var browser = {
  is_mobile: function() {
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return true
    } else {
      return false
    }
  },
  is_desktop: function() {
    // Simple, readable inversion of is_mobile
    if (this.is_mobile()) {
      return false;
    } else {
      return true;
    }
  }
}

export { browser };