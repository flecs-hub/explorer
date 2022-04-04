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
        attrs: {
          width: context.props.size + 4,
          height: context.props.size + 4,
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
              size: context.props.size / 1.2,
            }
        })
      ]
    );
  }
})