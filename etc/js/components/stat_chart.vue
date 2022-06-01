<template>
  <div class="stat-chart">
  <svg class="stat-chart" :width="chart_width" :height="chart_height">
    <line :x1="to_x(0)" :y1="scale_y(min_max.min)" :x2="to_x(59)" :y2="scale_y(min_max.min)" 
        :stroke="stroke_color_ruler"/>
    <line :x1="to_x(0)" :y1="scale_y(min_max.max)" :x2="to_x(59)" :y2="scale_y(min_max.max)" 
        :stroke="stroke_color_ruler"/>
    <line :x1="to_x(0)" :y1="scale_y(min_max.avg)" :x2="to_x(59)" :y2="scale_y(min_max.avg)" 
        :stroke="stroke_color_ruler"/>

    <text :x="5" :y="chart_height - 10" :fill="text_color">{{min_max.min}}</text>
    <text :x="5" :y="19" :fill="text_color">{{min_max.max}}</text>
    <text :x="5" :y="chart_height / 2 + 5" :fill="text_color">{{min_max.avg}}</text>

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
        :stroke="stroke_color"/>
    </template>

  </svg>
  </div>
</template>

<script>
  module.exports = {
    name: "stat-chart",
    props: {
      values: Object
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
        let avg = ((min + (max - min) / 2));

        if (avg > 1) {
          avg = avg.toFixed(1);
        } else {
          avg = avg.toFixed(3);
        }
        if (max > 1) {
          max = max.toFixed(1);
        } else {
          max = max.toFixed(3);
        }

        return {
          min: Number.parseFloat(min), 
          max: Number.parseFloat(max), 
          avg: Number.parseFloat(avg)
        };
      },
      chart_width() {
        return 500;
      },
      chart_height() {
        return 100;
      },
      chart_padding() {
        return 15;
      },
      chart_y_ruler_width() {
        return 40;
      },
      stroke_color() {
        return "#A2D8B4";
      },
      stroke_color_min() {
        return "#383c46";
      },
      stroke_color_max() {
        return "#383c46";
      },
      stroke_color_ruler() {
        return "#1f222a";
      },
      text_color() {
        return "#71717a";
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
      }
    }
  }
</script>

<style>

div.stat-chart {
  margin-top: 5px;
  margin-bottom: 10px;
  margin-left: 18px;
}

div.stat-chart svg {
  background-color: #101115;
  border-style: solid;
  border-width: 1px;
  border-color: #3f3f46;
  border-radius: 5px;
}

</style>
