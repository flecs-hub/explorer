const example_plecs = `// This is Plecs, a simple language that lets us create
// entities and queries without having to write or
// compile C++ code.

// With the builtin IsA relation we can make one entity
// inherit from another. This lets us query for Planet,
// and get DwarfPlanets, RockyPlanets and GasGiants.
(IsA, CelestialBody) { 
  Star, Satellite
  (IsA, Planet) {
    DwarfPlanet, RockyPlanet, GasGiant
  }
}

// This creates the Sun entity with a Star tag. The { }
// operators are used to create hierarchies which use the
// builtin ChildOf relation.
Star(Sun) {
 // A 'with' statement lets us add the same component(s)
 // to multiple entities.
 with RockyPlanet {
  Mercury, Venus, Earth, Mars 
 }

 with GasGiant { 
  Jupiter, Saturn, Neptune, Uranus 
 }

 with DwarfPlanet { Pluto, Ceres }
}

// To avoid deep indentation, we can open the scope of
// a nested entity outside of the initial hierarchy.
Sun.Earth {
 Satellite(Moon)
 with Satellite, Artificial { HubbleTelescope, ISS }
}

Sun.Mars {
 with Satellite { Phobos, Deimos }
 with Satellite, Artificial { MarsOrbiter }
}

Sun.Jupiter {
 with Satellite { Europa, Io, Callisto, Ganymede }
}

Sun.Saturn {
 with Satellite { Titan, Enceladus }
}

Sun.Pluto {
  Satellite(Charon)
}

// Further extend Earth's hierarchy
Sun.Earth {
 with Continent { 
  Europe, Asia, Africa, NorthAmerica, SouthAmerica,
  Australia, Antartica
 }

 NorthAmerica {
  with Country { UnitedStates, Canada }

  UnitedStates {
    with City {
      SanFrancisco, LosAngeles, NewYorkCity, Seattle 
    }
  }
 }

 Europe {
  with Country { Netherlands, Germany, France, UK }
 }
}

`

Vue.component('editor', {
  props: ['run_ok', 'run_error', 'run_msg'],
  mounted: function() {
    this.ldt = new TextareaDecorator( 
      document.getElementById('plecs-editor'), syntax_highlighter );
  },
  updated: function() {
    this.ldt.update();
  },
  methods: {
    run() {
      this.$emit('run-code', this.code);
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
      code: example_plecs
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
