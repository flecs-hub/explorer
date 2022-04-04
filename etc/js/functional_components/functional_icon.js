Vue.component('icon', {
  functional: true,
  props: {
    icon: { type: String, required: true },
    size: { type: Number, required: false, default: 16 }
  },
  render: function (createElement, context) {
    let [iconset, icon] = context.props.icon.split(":");

    return createElement('svg', {
      class: [
        "icon-obj",
      ],
      attrs: {
        width: context.props.size,
        height: context.props.size,
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