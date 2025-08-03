// Load the graph data
fetch("data_processing/network_graph.json")
  .then((res) => res.json())
  .then((data) => drawGraph(data));
function drawGraph(graph) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3.select("#graph").attr("width", width).attr("height", height);

  svg.selectAll("*").remove();

  // Add a group for zoom/pan
  const container = svg.append("g");

  // Simulation
  const simulation = d3
    .forceSimulation(graph.nodes)
    .force(
      "link",
      d3
        .forceLink(graph.edges)
        .id((d) => d.id)
        .distance(400)
        .strength(2)
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(120));

  // Draw links
  const link = container
    .append("g")
    .selectAll("line")
    .data(graph.edges)
    .join("line")
    .attr("class", "link");

  // Draw nodes
  const node = container
    .append("g")
    .selectAll("g")
    .data(graph.nodes)
    .join("g")
    .attr("class", (d) => "node " + d.type)
    .call(drag(simulation));

  node
    .append("circle")
    .attr("r", (d) => {
      if (d.type === "field") return 110;
      if (d.type === "institution") return 50;
      if (d.type === "person") return 30;
      return 60;
    })
    .on("click", (event, d) => {
      if (d.link) window.open(d.link, "_blank");
    })
    .append("title")
    .text((d) => d.id);

  // Helper to wrap text into lines of max N chars
  function wrapText(text, maxLineLength = 11) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let word of words) {
      if ((line + " " + word).trim().length > maxLineLength) {
        if (line) lines.push(line.trim());
        line = word;
      } else {
        line += " " + word;
      }
    }
    if (line) lines.push(line.trim());
    return lines;
  }

  node
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 0)
    .each(function (d) {
      const lines = wrapText(d.id, 11); // adjust 11 for circle size
      const lineHeight = (d) => {
        if (d.type === "field") return 28;
        if (d.type === "person") return 12;
        return 18;
      };
      const lh = lineHeight(d);
      const startY = -((lines.length - 1) / 2) * lh + 6;
      lines.forEach((line, i) => {
        d3.select(this)
          .append("tspan")
          .attr("x", 0)
          .attr("y", startY + i * lh)
          .text(line);
      });
    });

  node.append("title").text((d) => d.id);

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  // Drag behavior
  function drag(simulation) {
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
    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // Enable zoom and pan
  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      container.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Set initial zoom transform (e.g., 0.7 for 70% zoom)
  svg.call(
    zoom.transform,
    d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.2)
      .translate(-width, -height)
  );

  // Responsive resize
  window.addEventListener("resize", () => {
    const w = window.innerWidth,
      h = window.innerHeight;
    svg.attr("width", w).attr("height", h);
    simulation.force("center", d3.forceCenter(w / 2, h / 2));
    simulation.alpha(0.5).restart();
  });
}
