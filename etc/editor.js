const example_plecs = `Transitive(LocatedIn)

Continent(NorthAmerica)
Continent(Europe)

Country(UnitedStates)
Country(Italy)
Country(Sweden)

City(SanFrancisco)
City(Seattle)
City(Florence)
City(Stockholm)

LocatedIn(NorthAmerica, Earth)
LocatedIn(Europe, Earth)
LocatedIn(UnitedStates, NorthAmerica)
LocatedIn(Italy, Europe)
LocatedIn(Sweden, Europe)
LocatedIn(SanFrancisco, UnitedStates)
LocatedIn(Seattle, UnitedStates)
LocatedIn(Florence, Italy)
LocatedIn(Stockholm, Sweden)

LocatedIn(Sander, SanFrancisco)
LocatedIn(Cart, Seattle)
LocatedIn(Michele, Florence)
LocatedIn(OurMachinery, Stockholm)

AuthorOf(Sander, Flecs)
AuthorOf(Cart, Bevy)
AuthorOf(Michele, EnTT)
AuthorOf(OurMachinery, TheMachinery)
`

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
            code: example_plecs
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
