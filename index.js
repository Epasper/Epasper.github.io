// https://observablehq.com/@roblallier/clustered-bubbles@529
export default function define(runtime, observer) {

  let dummyData = [
    { name: 'Steven', surname: 'Steven', height:2, population: 8674000},
    { name: 'Stanley', surname: 'Steven', height:2, population: 8406000},
    { name: 'Jen', surname: 'Steven', height:2, population: 4293000},
    { name: 'Paris', surname: 'Steven', height:2,  population: 2244000},
    { name: 'Dave', surname: 'Steven', height:2, population: 11510000}
  ];

  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Entity-Relation Diagram using Force Layout

Based on the work of Mike Bostock on [Clustered Bubbles](https://observablehq.com/@d3/clustered-bubbles), this is a test on how to create an entity-relation diagram using d3 force-layout.

To navigate faster in a loaded database, entities are sorted in color clusters.`
)});
  main.variable(observer("viewof replay")).define("viewof replay", ["html"], function(html){return(
html`<button>Replay`
)});
  main.variable(observer("replay")).define("replay", ["Generators", "viewof replay"], (G, _) => G.input(_));
  main.variable(observer("chart")).define("chart", ["replay","pack","populateLinks","d3","zone","width","height","forceCluster","forceCollide","DOM","MAGNIFIER","color","invalidation"], function(replay,pack,populateLinks,d3,zone,width,height,forceCluster,forceCollide,DOM,MAGNIFIER,color,invalidation)
{
  replay;

  const nodes = pack().leaves();
  console.log('%%% nodes: ', nodes);
  const links = populateLinks();
  console.log('%%% links: ', links);
  let zones = d3.rollup(nodes, zone, d => d.data.group);
  console.log('%%% zones: ', zones);

  const simulation = d3.forceSimulation(nodes)
      .force("x", d3.forceX(width / 2).strength(0.01))
      .force("y", d3.forceY(height / 2).strength(0.03))
      .force("links", d3.forceLink(links).strength(0.1))
      .force("cluster", forceCluster())
      .force("collide", forceCollide());

  const svg = d3.select(DOM.svg(width, height));
   
  // const area = svg.append("g")
  //   .selectAll("rect")
  //   .data(pack().children)
  //   .join("rect")
  //     .attr("x", d => d.x)
  //     .attr("y", d => d.y)
  //     .attr("width", d=> (d.value + 1) * MAGNIFIER)
  //     .attr("height", d => (d.value + 1) * MAGNIFIER)
  //     .attr("rx", 6)
  //     .attr("fill", d => color(d.data.children[0].group))
  //     .attr("opacity", 0.3)
  

   const link = svg.append("g")
    .selectAll("line")
    .data(links)
    .join("path")
      .attr("d", d => `M ${d.source.x + (d.source.value +1) * (MAGNIFIER/2)} ${d.source.y + (d.source.value +1) * (MAGNIFIER/2)} H ${d.target.x + (d.target.value +1) * (MAGNIFIER/2)} V ${d.target.y + (d.target.value +1) * (MAGNIFIER/2)}`)
      .attr("stroke", '#999')
      .attr("fill", 'none')
      .attr("stroke-width", 2);
  
  const node = svg.append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("width", d=> (d.value +1) * MAGNIFIER)
      .attr("height", d => (d.value +1)  * MAGNIFIER)
      .attr("rx", d => d.value)
      .attr("fill", d => color(d.data.group))
      .on("click", function(){
        console.log("CLICKED!")
      }); 

  // const text = svg.append("g")
  // .selectAll("text")
  // .data(nodes)
  // .join("text")
  //   .attr("x", d => d.x)
  //   .attr("y", d => d.y)
  //   // .attr("width", d=> (d.value +1))
  //   // .attr("height", d => (d.value +1))
  //   .attr("font-family", "Verdana")
  //   .attr("font-size", 20)
  //   .text(function(d) {
  //     return 'TEST TEXT';
  //   })
  
  node.transition()
      .delay((d, i) => Math.random() * 500)
      .duration(750)
      .attrTween("r", d => {
        const i = d3.interpolate(0, d.r);
        return t => d.r = i(t);
      });

  simulation.on("tick", () => {
    zones = d3.rollup(nodes, zone, d => d.data.group);
    svg
        .attr("x", d => {
          const {x1: x} = zones.get(d.data.children[0].group)
          return x - 5;
    })
        .attr("y", d => {
          const {y1: y} = zones.get(d.data.children[0].group)
          return y - 5;
    })
        .attr("width", d => {
          const {x1, x2} = zones.get(d.data.children[0].group)
          return 10 + x2 - x1;
    })
        .attr("height", d => {
          const {y1, y2} = zones.get(d.data.children[0].group)
          return 10 + y2 - y1;
    });
    node
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    link
      .attr("d", d => `M ${d.source.x + (d.source.value +1) * (MAGNIFIER/2)} ${d.source.y + (d.source.value +1) * (MAGNIFIER/2)} H ${d.target.x + (d.target.value +1) * (MAGNIFIER/2)} V ${d.target.y + (d.target.value +1) * (MAGNIFIER/2)}`);
  });

  invalidation.then(() => simulation.stop());

  return svg.node();
}
);
  main.variable(observer("forceCluster")).define("forceCluster", ["d3","centroid"], function(d3,centroid){return(
function forceCluster() {
  const strength = 0.2;
  let nodes;

  function force(alpha) {
    const centroids = d3.rollup(nodes, centroid, d => d.data.group);
    const l = alpha * strength;
    for (const d of nodes) {
      const {x: cx, y: cy} = centroids.get(d.data.group);
      d.vx -= (d.x - cx) * l;
      d.vy -= (d.y - cy) * l;
    }
  }

  force.initialize = _ => nodes = _;

  return force;
}
)});
  main.variable(observer("forceCollide")).define("forceCollide", ["d3"], function(d3){return(
function forceCollide() {
  const alpha = 0.4; // fixed for greater rigidity!
  const padding1 = 2; // separation between same-color nodes
  const padding2 = 20; // separation between different-color nodes
  let nodes;
  let maxRadius;

  function force() {
    const quadtree = d3.quadtree(nodes, d => d.x, d => d.y);
    for (const d of nodes) {
      const r = d.r + maxRadius; // r is the node's radius + the biggest node's radius + padding2
      const nx1 = d.x - r, ny1 = d.y - r;
      const nx2 = d.x + r, ny2 = d.y + r;
      quadtree.visit((q, x1, y1, x2, y2) => {
        if (!q.length) do {
          if (q.data !== d) {
            const r = d.r + q.data.r + (d.data.group === q.data.data.group ? padding1 : padding2);
            let x = d.x - q.data.x, y = d.y - q.data.y, l = Math.hypot(x, y);
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l, d.y -= y *= l;
              q.data.x += x, q.data.y += y;
            }
          }
        } while (q = q.next);
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    }
  }

  force.initialize = _ => maxRadius = d3.max(nodes = _, d => d.r) + Math.max(padding1, padding2);

  return force;
}
)});

  main.variable(observer("pack")).define("pack", ["d3","width","height","data"], function(d3,width,height,data){
    console.log('variable(observer("pack")', d3.pack()
    .size([width, height])
    .padding(1)
  (d3.hierarchy(data)
    .sum(d => d.value)))
    return(
() => d3.pack()
    .size([width, height])
    .padding(1)
  (d3.hierarchy(data)
    .sum(d => d.value))
)});

  main.variable(observer("data")).define("data", ["d3","n","m"], function(d3,n,m,nodeSize){return(
{
  children: Array.from(
    d3.group(
      Array.from({length: n}, (_, i) => ({
        id: i,
        group: Math.random() * m | 0, //ILS GROUP THE NODE INTO COLORED GROUPS
        value: 3 //ILS NODE SIZE
      })),
      d => d.group
    ),
    ([ , children]) => ({children})
  )
}
)});

  main.variable(observer("links")).define("links", function(){return(
[]
)});
  main.variable(observer("populateLinks")).define("populateLinks", ["links","l","n"], function(links,numberOfLinks,n){return(
() => {
  links.length = 0;
  console.log('numberOfLinks', numberOfLinks);
  //ILS l is the number of links
  for(let i = 0; i < numberOfLinks - 1; i++) {
    const source = i;
    let target = i + 1;
    while(source === target){
      target = Math.floor(Math.random() * n);
    }
    links.push({
      id: `${source}.${target}`,
      source, //ils NODE ID STARTING THE LINK
      target //ils NODE ID FINISHING THE LINK
    })  
  }
  return links
}
)});

  main.variable(observer("zone")).define("zone", ["d3","MAGNIFIER"], function(d3,MAGNIFIER){return(
(nodes) => {
  // const padding = 2;
  let x1, x2, y1, y2 = 0;
  x1 = d3.min(nodes, d => d.x);
  x2 = d3.max(nodes, d => d.x + (d.value +1) * MAGNIFIER);
  y1 = d3.min(nodes, d => d.y);
  y2 = d3.max(nodes, d => d.y + (d.value + 1) * MAGNIFIER);
  return {x1, x2, y1, y2}
}
)});
  main.variable(observer("centroid")).define("centroid", function(){return(
function centroid(nodes) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const d of nodes) {
    let k = d.r ** 2;
    x += d.x * k;
    y += d.y * k;
    z += k;
  }
  return {x: x / z, y: y / z};
}
)});
  main.variable(observer("drag")).define("drag", ["d3"], function(d3){return(
simulation => {
  
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  
  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}
)});
  main.variable(observer("n")).define("n", function(){return(
80
)});
  main.variable(observer("m")).define("m", function(){return(
10
)});
  main.variable(observer("l")).define("l", function(){return(
30
)});
  main.variable(observer("MAGNIFIER")).define("MAGNIFIER", function(){return(
7
)});
  main.variable(observer("color")).define("color", ["d3","m"], function(d3,m){return(
d3.scaleOrdinal(d3.range(m), d3.schemeCategory10)
)});
  main.variable(observer("height")).define("height", function(){return(
600
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5", "d3-array@2")
)});
  return main;
}
