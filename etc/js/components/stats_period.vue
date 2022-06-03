<template>
  <div>
    <span :class="css('1s', 'left')" v-on:click="select('1s')">
        1 second
    </span><span :class="css('1m', 'center')" v-on:click="select('1m')">
        1 minute
    </span><span :class="css('1h', 'center')" v-on:click="select('1h')">
        1 hour
    </span></span><span :class="css('1d', 'center')" v-on:click="select('1d')">
        1 day
    </span></span><span :class="css('1w', 'right')" v-on:click="select('1w')">
        1 week
    </span>
  </div>
</template>

<script>
  module.exports = {
    name: "stats-period",
    data: function() {
      return {
        period: "1m"
      }
    },
    methods: {
      css(period, pos) {
        let result = "noselect clickable stats-period stats-period-" + pos;
        if (period == this.period) {
          result += " stats-period-selected";
        }
        return result;
      },
      select(period) {
        this.period = period;
      }
    }
  }
</script>

<style>

span.stats-period {
  display: inline-block;
  height: 20px;
  padding: 5px;
  padding-left: 8px;
  padding-right: 8px;
  border-style: solid;
  border-color: #3f3f46;
  margin-bottom: 10px;
  background-color: #242832;
  color: #aaaeb5;
  transition: background-color 0.1s ease-out;
}

span.stats-period:hover {
  background-color: #383c46;
}

span.stats-period-left {
  margin-left: 20px;
  margin-right: 0px;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}
span.stats-period-center {
  margin-left: 0px;
  margin-right: 0px;
  border-left-width: 0px;
  border-right-width: 1px;
}
span.stats-period-right {
  margin-left: 0px;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border-left-width: 0px;
}
span.stats-period-selected {
  background-color: #4d515a;
  color: #fff;
}

</style>
