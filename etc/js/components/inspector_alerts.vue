<template>
  <div>
    <div :class="css(alert)" v-for="alert in alerts">
      <icon :icon="icon(alert)"
        :size="14" :opacity="0.7">
      </icon><span>&nbsp;{{alert.message}}</span>
    </div>
  </div>
</template>

<script>
  module.exports = {
    name: "inspector-alerts",
    props: {
      alerts: { type: Array, required: true },
    },
    methods: {
      icon: function(alert) {
        if (alert.severity === "Info") {
          return 'feather:info';
        } else if (alert.severity === "Warning") {
          return 'feather:alert-triangle';
        } else if (alert.severity === "Error") {
          return 'feather:alert-octagon';
        }
      },
      color: function(alert) {
        if (alert.severity === "Info") {
          return 'var(--alert-info)';
        } else if (alert.severity === "Warning") {
          return 'var(--alert-warning)';
        } else if (alert.severity === "Error") {
          return 'var(--alert-error)';
        }
      },
      css: function(alert) {
        let result = "inspector-alert";
        if (alert.severity === "Info") {
          result += " inspector-alert-info";
        } else if (alert.severity === "Warning") {
          result += " inspector-alert-warning";
        } else if (alert.severity === "Error") {
          result += " inspector-alert-error";
        }
        return result;
      }
    }
  }
</script>

<style>
  div.inspector-alert {
    border-radius: 3px;
    border-style: solid;
    border-width: 0px;
    border-left-width: 3px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 8px;
    margin-top: 4px;
    font-size: var(--text-fs-md);
    color: var(--secondary-text);
    white-space: nowrap;
  }

  div.inspector-alert-info {
    border-left-color: var(--alert-info);
    background-color: rgb(30, 34, 41);
  }
  div.inspector-alert-warning {
    border-left-color: var(--alert-warning);
    background-color: rgb(33, 33, 36);
  }
  div.inspector-alert-error {
    border-left-color: var(--alert-error);
    background-color: rgb(33, 31, 36);
  }
  
  div.inspector-alert img {
    top: 5px !important;
    margin-left: 2px;
    margin-right: 2px;
  }

  div.inspector-alert span {
    position: relative;
    top: 3px !important;
    margin-left: 2px;
    margin-right: 4px;
    white-space: normal;
    width: calc(100% - 24px);
  }
</style>
