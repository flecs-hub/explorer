<template>
    <div class="svg-container">
        <svg class="svg-content"></svg>
    </div>
</template>

<script>

  function widthFromText(el) {
    const parent = el.parentNode;
    const text = parent.querySelector('text');
    return text.getBBox().width + 10;
  }

  module.exports = {
    name: "stat-chart",
    props: {
      results: { type: Object, required: false }
    },
    data: function() {
      return {
        sim: undefined,
        link: undefined,
        node: undefined,
        node_fade: undefined,
        label: undefined,
        prevdata: undefined
      }
    },
    mounted: function() {
      this.prevdata = JSON.stringify(this.graph);
      this.createSim();
    },
    watch: {
      results: function() {
        const curdata = JSON.stringify(this.graph);
        if (curdata === this.prevdata) {
            return;
        }

        if (this.sim) {
            this.sim.stop();
        }

        this.createSim();

        this.prevdata = curdata;
      }
    },
    computed: {
        graph: function() {
          if (!this.results) {
            return {nodes: [], links: []};
          }

          let node_map = {};
          let nodes = [];
          let links = [];
          for (let i = 0; i < this.results.results.length; i++) {
            const result = this.results.results[i];

            for (let j = 0; j < result.ids.length; j++) {
              const id = result.ids[j];

              if (!Array.isArray(id)) {
                  continue;
              }
              if (id.length !== 2) {
                  continue;
              }

              const source = result.sources[0];
              let e = 0;
              do {
                let entity = source;
                let full_entity = entity;
                const default_color = 'rgba(71, 181, 118)';
                let color = default_color;

                if (entity === 0) {
                    full_entity = entity = result.entities[e];
                }
                if (result.parent) {
                    full_entity = result.parent + '.' + entity;
                }
                if (result.colors) {
                    color = result.colors[e];
                }

                if (result.entity_labels) {
                    entity = result.entity_labels[e];
                }

                const target = id[1];

                let source_index = node_map[full_entity];
                if (source_index === undefined) {
                    source_index = nodes.length;
                    node_map[full_entity] = source_index;
                    nodes.push({id: full_entity, label: entity, color: color});
                }

                if (target !== "*") {
                  let target_index = node_map[target];
                  if (target_index === undefined) {
                    target_index = nodes.length;
                    node_map[target] = target_index;

                    let target_elems = target.split('.');
                    let target_label = target_elems[target_elems.length - 1];
                    nodes.push({id: target, label: target_label, color: default_color});
                  }

                  links.push({source: source_index, target: target_index});
                }
              } while (++e < result.entities.length);
            }
          }

          return {nodes: nodes, links: links};
        },
    },

    methods: {
        // Update the SVG elements on each tick
        ticked: function() {
          this.link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

          this.node
            .attr('x', function(d) { return d.x - (widthFromText(this) / 2); } )
            .attr('y', d => d.y - 15)
            .attr('width', function(d) { return widthFromText(this); } );

          this.node_fade
            .attr('x', function(d) { return d.x - ((widthFromText(this) - 2) / 2); } )
            .attr('y', d => d.y - 14)
            .attr('width', function(d) { return (widthFromText(this) - 2); } );

          this.label
            .attr('x', d => d.x)
            .attr('y', d => d.y);
        },

        // Drag functionality
        drag: function(simulation) {
          function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          }

          function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
          }
          function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }

          return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
        },

        createSim: function() {
          d3.select("div.svg-container").selectAll("*").remove();
          const svg = d3.select("div.svg-container")
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "-500 -300 1000 600")
            .classed("svg-content", true);

          const width = +svg.attr("width");
          const height = +svg.attr("height");
          const nodes = this.graph.nodes;
          const links = this.graph.links;

          this.sim = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('link', d3.forceLink(links).distance(100).strength(0.1))
            .force('collision', d3.forceCollide().radius(50))
            .on('tick', this.ticked);

          this.link = svg.selectAll('line')
            .data(links)
            .join('line')
            .style('stroke', '#aaa');

          let node_parent = node = svg.selectAll("g.node")
            .data(nodes)
            .join('g')
            .attr('class', 'node');

          node_parent
            .selectAll("*")
            .remove();

          this.node = node_parent.append("rect")
            .attr('width', 0)
            .attr('height', 30)
            .attr("rx", 4)
            .attr("ry", 4)
            .style('fill', d => d.color)
            .call(this.drag(this.sim));

          this.node_fade = node_parent.append("rect")
            .attr('width', 0)
            .attr('height', 28)
            .attr("rx", 3)
            .attr("ry", 3)
            .style('fill', d => 'var(--steel-800)')
            .style('opacity', 0.75)
            .call(this.drag(this.sim));

          this.label = node_parent.append('text')
            .text(d => d.label)
            .attr('font-size', '16px')
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('dy', '.35em')
            .style('cursor', 'pointer')
            .call(this.drag(this.sim))
            .on('click', d => {
              this.$emit('select-entity', d.srcElement.__data__.id);
            });
        }
    }
  }
</script>

<style>

.svg-container {
    display: inline-block;
    position: relative;
    width: 100%;
    padding-bottom: 60%;
    vertical-align: top;
    overflow: hidden;
}

.svg-content {
    display: inline-block;
    position: absolute;
    top: 0;
    left: 0;
}

</style>
