import annotativeGridline from './components/annotativeGridline.js';
import annotativeDimension from './components/annotativeDimension.js';

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

var debug = {
  component: function(component) {
    if (DEBUG_MODE) {
      console.log(component.$options.name, "mounted")
    }
  },
  createVerticalGridline: function(left, unit = "px", label) {
    try {
      let annotativeGridlineClass = Vue.extend(annotativeGridline);
      let annotativeGridlineInstance = new annotativeGridlineClass({
        propsData: {
          position: left,
          unit: unit, 
          orientation: "vertical",
          label: label,
        }
      });
      annotativeGridlineInstance.$mount();
      app.$refs.app.appendChild(annotativeGridlineInstance.$el);

      return annotativeGridlineInstance;
      // returned instance has delete() method.
    } catch (e) {
      console.warn(e);
    }
  },
  createHorizontalGridline: function(top, unit = "px", label) {
    try {
      let annotativeGridlineClass = Vue.extend(annotativeGridline);
      let annotativeGridlineInstance = new annotativeGridlineClass({
        propsData: {
          position: top,
          unit: unit,
          orientation: "horizontal",
          label: label,
        }
      });
      annotativeGridlineInstance.$mount();
      app.$refs.app.appendChild(annotativeGridlineInstance.$el);

      return annotativeGridlineInstance;
      // returned instance has delete() method.
    } catch (e) {
      console.warn(e);
    }
  },
  annotateDimension: function(start, end, unit, label) {
    try {
      let annotativeDimensionClass = Vue.extend(annotativeDimension);
      let annotativeDimensionInstance = new annotativeDimensionClass({
        propsData: {
          start_point: start,
          end_point: end,
          unit: unit,
          label: label,
        }
      });
      annotativeDimensionInstance.$mount();
      app.$refs.app.appendChild(annotativeDimensionInstance.$el);

      return annotativeDimensionInstance;
    } catch (e) {
      console.warn(e);
    }
  },
}

export { browser, debug };