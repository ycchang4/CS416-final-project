const margin = { top: 20, right: 30, bottom: 40, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

const parseTime = d3.timeParse("%Y");
const formatTime = d3.timeFormat("%Y");

function styleAxis(selection) {
    selection.selectAll("text").style("fill", "#dce8f5").style("font-size", "13px");
    selection.selectAll("path, line").style("stroke", "rgba(255,255,255,0.3)");
}

d3.csv("data/data.csv").then(data => {
    data.forEach(d => {
        d.Year = parseTime(d.Year);
        d.Anomaly = +d.Anomaly;
    });

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.Anomaly) - 0.1, d3.max(data, d => d.Anomaly) + 0.1])
        .range([height, 0]);

    // ── Defs: gradient + clip ─────────────────────────────────────
    const defs = svg.append("defs");

    // red/blue diverging gradient based on anomaly (warm above 0, cool below)
    const areaGradient = defs.append("linearGradient")
        .attr("id", "areaGradient")
        .attr("x1", "0").attr("y1", "0")
        .attr("x2", "0").attr("y2", "1");
    areaGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#f97316")
        .attr("stop-opacity", 0.5);
    areaGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#f97316")
        .attr("stop-opacity", 0.02);

    defs.append("clipPath")
        .attr("id", "chart-clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    // ── Axes ──────────────────────────────────────────────────────
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .call(styleAxis);

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .call(styleAxis);

    // ── Zero reference line ───────────────────────────────────────
    svg.append("line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", y(0)).attr("y2", y(0))
        .attr("stroke", "rgba(255,255,255,0.25)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4");

    // ── Generators ────────────────────────────────────────────────
    const area = d3.area()
        .x(d => x(d.Year))
        .y0(y(0))
        .y1(d => y(d.Anomaly))
        .curve(d3.curveMonotoneX);

    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Anomaly))
        .curve(d3.curveMonotoneX);

    // ── Area fill ─────────────────────────────────────────────────
    // warm (positive anomaly)
    svg.append("path")
        .datum(data)
        .attr("clip-path", "url(#chart-clip)")
        .attr("fill", "rgba(249,115,22,0.25)")
        .attr("d", d3.area()
            .x(d => x(d.Year))
            .y0(y(0))
            .y1(d => y(Math.max(0, d.Anomaly)))
            .curve(d3.curveMonotoneX));

    // cool (negative anomaly)
    svg.append("path")
        .datum(data)
        .attr("clip-path", "url(#chart-clip)")
        .attr("fill", "rgba(96,180,247,0.25)")
        .attr("d", d3.area()
            .x(d => x(d.Year))
            .y0(y(0))
            .y1(d => y(Math.min(0, d.Anomaly)))
            .curve(d3.curveMonotoneX));

    // ── Main line with draw animation ─────────────────────────────
    const path = svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#f97316")
        .attr("stroke-width", 2)
        .attr("d", line);

    const totalLength = path.node().getTotalLength();
    path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition().duration(2000).ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);

    // ── Labels ────────────────────────────────────────────────────
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("fill", "#dce8f5")
        .style("font-family", "sans-serif")
        .text("Anomaly (°C)");

    svg.append("text")
        .attr("x", 0)
        .attr("y", height + margin.bottom - 2)
        .style("font-size", "10px")
        .style("fill", "rgba(220,232,245,0.5)")
        .style("font-family", "sans-serif")
        .text("Source: https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/time-series");

    // ── Hover: crosshair + circle ─────────────────────────────────
    const crosshair = svg.append("line")
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", "rgba(255,255,255,0.3)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4")
        .style("pointer-events", "none")
        .style("opacity", 0);

    const circle = svg.append("circle")
        .attr("r", 0)
        .attr("fill", "#f97316")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .attr("opacity", 0.9)
        .style("pointer-events", "none");

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", function(event) {
            const [xCoord] = d3.pointer(event);
            const bisect = d3.bisector(d => d.Year).left;
            const x0 = x.invert(xCoord);
            const i = bisect(data, x0, 1);
            const d = Math.abs(x0 - data[i-1]?.Year) < Math.abs(x0 - data[i]?.Year) ? data[i-1] : data[i];
            if (!d) return;

            crosshair.attr("x1", x(d.Year)).attr("x2", x(d.Year)).style("opacity", 1);
            circle.attr("cx", x(d.Year)).attr("cy", y(d.Anomaly)).attr("r", 5);
            tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 40}px`)
                .html(`<strong>Year: ${formatTime(d.Year)}</strong><br>Anomaly: ${d.Anomaly > 0 ? "+" : ""}${d.Anomaly}°C`);
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
            circle.attr("r", 0);
            crosshair.style("opacity", 0);
        });

    // ── Annotation ────────────────────────────────────────────────
    const annotations = [{
        note: {
            label: "Base Period: 1901-2000",
            align: "right",
            wrap: 180,
            padding: 10
        },
        connector: { type: "elbow", end: "dot" },
        color: ["#dce8f5"],
        x: width - 280,
        y: 180,
        dy: -50,
        dx: -50
    }];

    svg.append("g")
        .attr("class", "annotation-group")
        .call(d3.annotation().annotations(annotations));

}).catch(error => {
    console.error("Error loading CSV:", error);
});