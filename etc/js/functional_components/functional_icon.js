Vue.component('icon', {
  functional: true,
  props: {
    icon: { type: String, required: true },
    size: { type: Number, required: false, default: 16 }
  },
  render: function (createElement, context) {
    let [iconset, icon] = context.props.icon.split(":");
    let css;

    if (iconset == "codicons") {
      css = "codicons-icon";
    } else {
      css = "feather-icon";
    }

    return createElement('svg', {
      class: [
        css
      ],
      style: {
        width: `${context.props.size}px`,
        height: `${context.props.size}px`,
      }
    }, [
      createElement('use', {
        attrs: {
          href: `./img/icons/${iconset}.svg#${icon}`,
        }
      })
    ]);
  }
})