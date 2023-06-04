<template>
  <div v-if="result">
    <div class="query-results-stats">
      <span>Returned {{count}} entities in {{eval_time}}</span>
    </div>
    <div class="query-results-nav">
      <span class="noselect">Results</span> <input type="text" :placeholder="limit"
        ref="limit"
        v-on:keyup.enter="on_limit"
        v-on:blur="on_limit"></input>
      <span class="noselect">Page</span> <input type="text" :placeholder="page" 
        ref="page"
        v-on:keyup.enter="on_page"
        v-on:blur="on_page"></input>
      <icon-button 
        icon="codicons:chevron-left" 
        :size="28"
        :active="has_prev"
        :opacity="0.7"
        v-on:click="on_prev"></icon-button>
      <icon-button 
        icon="codicons:chevron-right" 
        :size="28"
        :active="has_next"
        :opacity="0.7"
        v-on:click="on_next"></icon-button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    name: "query-footer",
    props: {
      result: { type: Object, required: false },
    },
    data: function() {
      return {
        offset: 0,
        limit: QueryDefaultLimit,
      };
    },
    methods: {
      set_offset_limit(offset, limit) {
        if (offset !== undefined) {
          if (typeof offset !== "number") {
            offset = parseInt(offset);
          }
          this.offset = offset;
        }
        if (limit !== undefined) {
          if (typeof limit !== "number") {
            limit = parseInt(limit);
          }
          this.limit = limit;
        }
      },
      on_prev() {
        if (this.has_prev) {
          this.offset -= this.limit;
          if (this.offset < 0) {
            this.offset = 0;
          }
          this.update_page();
          this.$emit("refresh");
        }
      },
      on_next() {
        if (this.has_next) {
          this.offset += this.limit;
          this.update_page();
          this.$emit("refresh");
        }
      },
      on_limit(evt) {
        this.limit = parseInt(evt.target.value);
        this.update_page();
        this.$emit("refresh");
        evt.target.blur();
      },
      on_page(evt) {
        this.offset = parseInt(evt.target.value) * this.limit;
        this.$emit("refresh");
        evt.target.blur();
      },
      update_page() {
        this.$refs.page.value = this.page;
      },
    },
    computed: {
      count: function() {
        if (!this.result || !this.result.results) {
          return 0;
        }

        let result = 0;
        for (let i = 0; i < this.result.results.length; i ++) {
          const elem = this.result.results[i];
          if (elem.entities) {
            result += elem.entities.length;
          } else {
            result ++;
          }
        }
        return result;
      },
      page: function() {
        if (this.limit) {
          return Math.floor(this.offset / this.limit);
        } else {
          return 0;
        }
      },
      eval_time: function() {
        let t = this.result.eval_duration;
        let r;
        if (t < (1 / (1000 * 1000))) {
          r = Math.round(t * 1000 * 1000 * 1000) + "ns";
        } else if (t < (1 / (1000))) {
          r = Math.round(t * 1000 * 1000) + "us";
        } else if (t < 1) {
          r = Math.round(t * 1000) + "ms";
        } else {
          r = t + "s";
        }
        return r;
      },
      has_next: function() {
        return this.count == this.limit;
      },
      has_prev: function() {
        return this.offset != 0;
      },
    }
  }
</script>

<style>
</style>
