<template>
  <div>
    <tabs :options="[{
        label: '1 second',
        value: '1s'
      }, {
        label: '1 minute',
        value: '1m'
      }, {
        label: '1 hour',
        value: '1h'
      }, {
        label: '1 day',
        value: '1d'
      }, {
        label: '1 week',
        value: '1w'
    }]" v-on:select="select"></tabs>
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
      select(evt) {
        this.period = evt;
      }
    }
  }
</script>

<style>
</style>
