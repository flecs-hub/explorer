Vue.component('icon-button', {
  functional: true,
  props: {
    icon: { type: String, required: true },
    size: { type: Number, required: false, default: 16 },
    opacity: { type: Number, required: false, default: 1.0 },
    active: { type: Boolean, required: false, default: false },
  },
  render: function (createElement, context) {
    let [iconset, icon] = context.props.icon.split(":");

    let class_list = ["icon-button", "noselect", "clickable"];

    if (context.props.active) {
      class_list.push("icon-button-active");
    }

    return createElement(
      'div', 
      {
        class: class_list,
        style: {
          width: `${context.props.size}px`,
          height: `${context.props.size}px`
        },
        on: context.listeners, // pass down listeners
        directives: context.data.directives, // pass down directives
      }, 
      [
        createElement(
          'icon', 
          {
            props: {
              icon: context.props.icon,
              size: context.props.size * 0.8,
              opacity: context.props.opacity
            }
        })
      ]
    );
  }
})