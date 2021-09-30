const example_plecs = `// This example creates a solar system and shows 
// how to use entity hierarchies and relations. 
// Changing the code updates the viewer

// Planet queries must match RockyPlanet/GasGiant
(IsA, Planet) { RockyPlanet, GasGiant }

// Sun entity with Star tag & planets as children
Star(Sun) {
 // Create entities with RockyPlanet tag
 with RockyPlanet { Earth, Mars }

 // Create entities with GasGiant tag
 with GasGiant { Jupiter, Saturn }

 // Create entities with DwarfPlanet tag
 with DwarfPlanet { Pluto, Ceres }
}

// Add child entities to planets
Sun.Earth {
 with Satellite { Moon }
 with Continent {
  Europe, Asia, Africa, Australia, NorthAmerica, 
  SouthAmerica, Antartica
 }
 
 NorthAmerica {
  with Country { Canada, UnitedStates, Mexico }
  UnitedStates {
    with City { SanFrancisco }
  }
 }
}

Sun.Mars {
 with Satellite { Phobos, Deimos }
}

Sun.Jupiter {
 with Satellite { Europa, Io }
}

Sun.Pluto {
 with Satellite { Charon }
}

`

Vue.component('editor', {
  props: ['run_ok', 'run_error'],
  mounted: function() {
    this.ldt = new TextareaDecorator( 
      document.getElementById('plecs-editor'), syntax_highlighter );
  },
  updated: function() {
    this.ldt.update();
  },
  methods: {
    run() {
      if (this.code != this.last_code) {
        this.$emit('run-code', this.code);
        this.last_code = this.code;
      }
    },
    get_code() {
      return this.code;
    },
    set_code(code) {
      this.code = code;
      this.run();
    },
    tab_pressed (event) { }
  },
  data: function() {
    return {
      code: example_plecs,
      last_code: undefined
    }
  },
  computed: {
    button_css: function() {
      if (this.code != this.last_ran) {
        return "editor-button-run";
      } else {
        return "editor-button-run button-disabled";
      }
    }
  },
  template: `
    <div>
      <textarea 
          id="plecs-editor" 
          class="editor-textarea" 
          v-model="code" 
          v-on:keyup="run"
          v-on:keydown.tab.prevent="tab_pressed($event)">
      </textarea>
    </div>
    `
});
