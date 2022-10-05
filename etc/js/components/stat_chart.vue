<template>
  <div :class="css">
  <svg class="noselect clickable stat-chart" :width="chart_width" :height="chart_height" 
    v-on:click="toggle_zoom_in"
    v-on:click.right="toggle_zoom_out"
    v-on:contextmenu.prevent>
    <template v-if="zoom_value >= 2">
      <line :x1="to_x(0)" :y1="scale_y(min_max.min)" :x2="to_x(59)" :y2="scale_y(min_max.min)" 
          :stroke="stroke_color_ruler"/>
      <line :x1="to_x(0)" :y1="scale_y(min_max.max)" :x2="to_x(59)" :y2="scale_y(min_max.max)" 
          :stroke="stroke_color_ruler"/>
    </template>
    <line :x1="to_x(0)" :y1="scale_y(min_max.avg)" :x2="to_x(59)" :y2="scale_y(min_max.avg)" 
        :stroke="stroke_color_ruler"/>

    <text :font-size="text_size" :x="5" :y="chart_height - 10" :fill="text_color">
      {{fmt_float(min_max.min)}}
    </text>
    <text :font-size="text_size" :x="5" :y="19" :fill="text_color">
      {{fmt_float(min_max.max)}}
    </text>

    <template v-if="zoom_value >= 2">
      <text :font-size="text_size" :x="5" :y="chart_height / 2 + 5" :fill="text_color">
        {{fmt_float(min_max.avg)}}
      </text>
    </template>

    <template v-if="zoom_value >= 3">
      <line :x1="to_x(0)" :y1="scale_y(min_avg)" :x2="to_x(59)" :y2="scale_y(min_avg)" 
          :stroke="stroke_color_ruler"/>
      <line :x1="to_x(0)" :y1="scale_y(avg_max)" :x2="to_x(59)" :y2="scale_y(avg_max)" 
          :stroke="stroke_color_ruler"/>

      <text :font-size="text_size" :x="5" :y="chart_height * 0.75 - 3" :fill="text_color">
        {{fmt_float(min_avg)}}
      </text>
      <text :font-size="text_size" :x="5" :y="chart_height * 0.25 + 12" :fill="text_color">
        {{fmt_float(avg_max)}}
      </text>
    </template>

    <template v-for="i in 59">
      <line :x1="to_x(i - 1)" :y1="to_y_min(i - 1)" :x2="to_x(i)" :y2="to_y_min(i)" 
        :stroke="stroke_color_min"/>
    </template>

    <template v-for="i in 59">
      <line :x1="to_x(i - 1)" :y1="to_y_max(i - 1)" :x2="to_x(i)" :y2="to_y_max(i)" 
        :stroke="stroke_color_max"/>
    </template>

    <template v-for="i in 59">
      <line :x1="to_x(i - 1)" :y1="to_y(i - 1)" :x2="to_x(i)" :y2="to_y(i)" 
        :stroke="stroke_color" stroke-width="1.5"/>
    </template>

  </svg>
  </div>
</template>

<script>
  module.exports = {
    name: "stat-chart",
    props: {
      values: { type: Object, required: true },
      zoom: { type: Number, required: false, default: 2 },
      width: { type: Number, required: false, default: 500 },
      width_scale: { type: Boolean, required: false, default: false },
      width_margin: { type: Number, required: false, default: 0 },
      background_fill: { type: Boolean, required: false, default: true },
      disabled: { type: Boolean, required: false, default: false }
    },
    data: function() {
      return {
        zoom_value: 2
      }
    },
    mounted: function() {
      if (this.zoom) {
        this.zoom_value = this.zoom;
      }
    },
    computed: {
      min() {
        if (!this.values) {
          return 0;
        }

        let min = this.values.min[0];
        for (const v of this.values.min) {
          if (v < min) {
            min = v;
          }
        }

        return min;
      },
      max() {
        if (!this.values) {
          return 1;
        }

        let max = this.values.max[0];
        for (const v of this.values.max) {
          if (v > max) {
            max = v;
          }
        }

        return max;
      },
      min_max() {
        let min = this.min;
        let max = this.max;
        if (min == max) {
          min = min - 1.0;
          max = max + 1.0;
        }

        min = Math.floor(min);

        if (max - min < 0.001) {
          max += 0.001;
        }

        let avg = ((min + (max - min) / 2));

        return {
          min: Number.parseFloat(min), 
          max: Number.parseFloat(max), 
          avg: Number.parseFloat(avg)
        };
      },
      min_avg() {
        const min_max = this.min_max;
        const min = min_max.min;
        const avg = min_max.avg;
        let result = min + (avg - min) / 2.0;
        return Number.parseFloat(result.toFixed(1));
      },
      avg_max() {
        const min_max = this.min_max;
        const avg = min_max.avg;
        const max = min_max.max;
        let result = avg + (max - avg) / 2.0;
        return Number.parseFloat(result.toFixed(1));
      },
      chart_height() {
        if (this.zoom_value >= 3) {
          return 200;
        } else if (this.zoom_value >= 2) {
          return 100;
        } else if (this.zoom_value >= 1) {
          return 50;
        }
      },
      chart_width() {
        if (this.zoom_value >= 4) {
          return (this.width + this.width_margin) * 2;
        } else {
          return this.width;
        }
      },
      chart_padding() {
        return 15;
      },
      chart_y_ruler_width() {
        return 50;
      },
      stroke_color() {
        if (!this.disabled) {
          return "#A2D8B4";
        } else {
          return "#71717a";
        }
      },
      stroke_color_min() {
        return "#4d515a";
      },
      stroke_color_max() {
        return "#4d515a";
      },
      stroke_color_ruler() {
        return "#2e323c";
      },
      text_color() {
        return "#71717a";
      },
      text_size() {
        return 12;
      },
      max_zoom() {
        return this.width_scale ? 5 : 4;
      },
      css() {
        let result = "stat-chart";
        if (this.background_fill) {
          result += " stat-chart-bg-fill";
        }
        return result;
      }
    },
    methods: {
      to_x(index) {
        const offset = this.chart_y_ruler_width;
        const width = this.chart_width - offset;
        return index * (width / 60) + offset;
      },
      scale_y(value) {
        const min_max = this.min_max;
        const min = min_max.min;
        const max = min_max.max;
        const padding = this.chart_padding;
        const height = this.chart_height - padding * 2;

        let scaled = height * ((value - min) / (max - min));
        scaled = this.chart_height - scaled - padding;

        return scaled;
      },
      to_y(index) {
        if (!this.values) {
          return 0;
        }
        return this.scale_y(this.values.avg[index]);
      },
      to_y_min(index) {
        if (!this.values) {
          return 0;
        }
        return this.scale_y(this.values.min[index]);
      },
      to_y_max(index) {
        if (!this.values) {
          return 0;
        } 
        return this.scale_y(this.values.max[index]);
      },
      toggle_zoom_in() {
        this.zoom_value = this.zoom_value + 1;
        if (this.zoom_value == this.max_zoom) {
          this.zoom_value = 1;
        }
      },
      toggle_zoom_out() {
        this.zoom_value = this.zoom_value - 1;
        if (this.zoom_value == 0) {
          this.zoom_value = 1;
        }
      },
      fmt_float(v) {
        return fmt_float(v);
      }
    }
  }
</script>

<style>

div.stat-chart { }

div.stat-chart svg {
  border-width: 1px;
  border-color: var(--steel-700);
  border-radius: 2px;
}

div.stat-chart-bg-fill svg {
  background-color: #101115;
  border-style: solid;
}

</style>
