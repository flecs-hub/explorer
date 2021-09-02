
Vue.component('editor', {
    props: ['run_ok', 'run_error', 'run_msg'],
    methods: {
        run() {
            this.$emit('run-code', this.code);
            this.changed = false;
        },
        text_changed() {
            this.changed = true;
            this.$emit('change-code');
        }
    },
    data: function() {
        return {
            changed: true,
            code: `Transitive(LocatedIn)

IsA(Planet, Location)
IsA(City, Thing)
IsA(City, Location)
IsA(Country, Thing)
IsA(Country, Location)

Planet(Earth)

Country(Netherlands)
Country(UnitedStates)

City(SanFrancisco)
City(NewYork)
City(LosAngeles)
City(Amsterdam)

LocatedIn(Netherlands, Earth)
LocatedIn(UnitedStates, Earth)
LocatedIn(SanFrancisco, UnitedStates)
LocatedIn(NewYork, UnitedStates)
LocatedIn(LosAngeles, UnitedStates)
LocatedIn(Amsterdam, Netherlands)            
            `
        }
    },
    computed: {
        button_css: function() {
            if (this.changed && this.code && this.code.length) {
                return "editor-button-run";
            } else {
                return "editor-button-run button-disabled";
            }
        },
        msg: function() {
            return this.run_msg;
        },
        msg_css: function() {
            if (this.run_ok) {
                return "editor-msg-bar editor-ok-bar";
            } else if (this.run_error) {
                return "editor-msg-bar editor-err-bar";
            } else {
                return "editor-msg-bar";
            }
        }
    },
    template: `
      <div class="editor">
        <div class="editor-top-bar"></div>
        <textarea v-model="code" v-on:keyup="text_changed"></textarea>
        <div :class="msg_css">{{msg}}</div>
        <button :class="button_css" v-on:click="run">Run</button>
      </div>
      `
  });
