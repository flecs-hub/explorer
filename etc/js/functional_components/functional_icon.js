Vue.component('icon', {
  functional: true,
  props: {
    icon: { type: String, required: true },
    size: { type: Number, required: false, default: 16 },
    opacity: { type: Number, required: false, default: 1.0 },
    rotate: { type: Number, required: false, default: 0 },
    top: {type: Number, required: false, default: 0 }
  },
  render: function (createElement, context) {
    let [iconset, icon] = context.props.icon.split(":");
    let css;

    if (iconset == "codicons") {
      css = "codicons-icon";
    } else {
      css = "feather-icon";
    }

    return createElement('img', {
        class: [
          css
        ],
        style: {
          position: "relative",
          width: `${context.props.size}px`,
          height: `${context.props.size}px`,
          transform: `rotate(${context.props.rotate}deg)`,
          top: `${context.props.top}px`,
          opacity: context.props.opacity
        },
        attrs: {
          src: `./img/icons/${iconset}-set/${icon}.svg`
        }
      }
    );
  }
})