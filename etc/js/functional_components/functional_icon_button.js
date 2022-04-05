Vue.component('icon-button', {
  functional: true,
  props: {
    icon: { type: String, required: true },
    size: { type: Number, required: false, default: 16 }
  },
  render: function (createElement, context) {
    let [iconset, icon] = context.props.icon.split(":");

    return createElement(
      'div', 
      {
        class: [
          "icon-button",
          "noselect",
          "clickable"
        ],
        style: {
          width: `${context.props.size}px`,
          height: `${context.props.size}px`,
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
            }
        })
      ]
    );
  }
})