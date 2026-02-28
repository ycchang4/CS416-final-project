const margin = { top: 20, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 380 - margin.top - margin.bottom;

const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const svg = d3.select("#chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const parseTime = d3.timeParse("%Y-%m-%d");
const formatTime = d3.timeFormat("%B %d, %Y");

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

function styleAxis(selection) {
    selection.selectAll("text").style("fill", "#dce8f5").style("font-size", "13px");
    selection.selectAll("path, line").style("stroke", "rgba(255,255,255,0.3)");
}

d3.csv("data/sea_level.csv").then(data => {
    data.forEach(d => {
        d.time = parseTime(d.time);
        d.sea_level = +d.sea_level;
        d.trend = +d.trend;
    });

    x.domain(d3.extent(data, d => d.time));
    y.domain([0, d3.max(data, d => d.sea_level) * 1.08]);

    // ── Defs: gradient + clip ─────────────────────────────────────
    const defs = svg.append("defs");

    const areaGradient = defs.append("linearGradient")
        .attr("id", "areaGradient")
        .attr("x1", "0").attr("y1", "0")
        .attr("x2", "0").attr("y2", "1");
    areaGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#60b4f7")
        .attr("stop-opacity", 0.45);
    areaGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#60b4f7")
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
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)))
        .call(styleAxis);

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .call(styleAxis);

    // ── Generators ────────────────────────────────────────────────
    const area = d3.area()
        .x(d => x(d.time))
        .y0(height)
        .y1(d => y(d.sea_level))
        .curve(d3.curveMonotoneX);

    const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.sea_level))
        .curve(d3.curveMonotoneX);

    const lineTrend = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.trend))
        .curve(d3.curveMonotoneX);

    // ── Gradient area ─────────────────────────────────────────────
    svg.append("path")
        .attr("class", "area")
        .datum(data)
        .attr("clip-path", "url(#chart-clip)")
        .attr("fill", "url(#areaGradient)")
        .attr("d", area);

    // ── Trend dashed line ─────────────────────────────────────────
    svg.append("path")
        .attr("class", "lineTrend")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.4)")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4 4")
        .attr("d", lineTrend);

    // ── Main line with draw animation ─────────────────────────────
    const path = svg.append("path")
        .attr("class", "line")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#60b4f7")
        .attr("stroke-width", 2)
        .attr("d", line);

    const totalLength = path.node().getTotalLength();
    path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeCubicInOut)
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
        .text("Change in global sea level (cm)");

    svg.append("text")
        .attr("class", "source-credit")
        .attr("x", 0)
        .attr("y", height + margin.bottom - 2)
        .style("font-size", "10px")
        .style("fill", "rgba(220,232,245,0.6)")
        .style("font-family", "sans-serif")
        .text("Source: CMEMS Ocean Monitoring Indicator based on the C3S sea level product. Credit: C3S/ECMWF/CMEMS.");

    // ── Hover: vertical crosshair + circle ────────────────────────
    const crosshair = svg.append("line")
        .attr("class", "crosshair")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "rgba(255,255,255,0.3)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4")
        .style("pointer-events", "none")
        .style("opacity", 0);

    const circle = svg.append("circle")
        .attr("r", 0)
        .attr("fill", "#60b4f7")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .attr("opacity", 0.9)
        .style("pointer-events", "none");

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousemove", function(event) {
            const [xCoord] = d3.pointer(event);
            const closestData = data.reduce((prev, curr) =>
                Math.abs(xCoord - x(curr.time)) < Math.abs(xCoord - x(prev.time)) ? curr : prev
            );
            const cx = x(closestData.time);
            const cy = y(closestData.sea_level);

            crosshair.attr("x1", cx).attr("x2", cx).style("opacity", 1);
            circle.attr("cx", cx).attr("cy", cy).attr("r", 5);

            tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 40}px`)
                .html(`<strong>${formatTime(closestData.time)}</strong><br>${closestData.sea_level} cm`);
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
            circle.attr("r", 0);
            crosshair.style("opacity", 0);
        });

    // ── Slider ────────────────────────────────────────────────────
    const sliderRange = d3.sliderBottom()
        .min(d3.min(data, d => d.time))
        .max(d3.max(data, d => d.time))
        .width(500)
        .tickFormat(d3.timeFormat('%Y-%m-%d'))
        .ticks(3)
        .default([d3.min(data, d => d.time), d3.max(data, d => d.time)])
        .fill('#60b4f7')
        .on('onchange', val => {
            x.domain(val);
            const filteredData = data.filter(d => d.time >= val[0] && d.time <= val[1]);

            svg.select(".area").attr("d", area(filteredData));
            svg.select(".line")
                .attr("d", line(filteredData))
                .attr("stroke-dasharray", null)
                .attr("stroke-dashoffset", null);
            svg.select(".lineTrend").attr("d", lineTrend(filteredData));

            y.domain([0, d3.max(filteredData, d => d.sea_level) * 1.08]);

            svg.select(".x-axis").transition().duration(300)
                .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)))
                .call(styleAxis);

            svg.select(".y-axis").transition().duration(300)
                .call(d3.axisLeft(y).ticks(10))
                .call(styleAxis);

            d3.select(".annotation-group").remove();
        });

    const gRange = d3.select('#slider-range')
        .append('svg')
        .attr('width', 560)
        .attr('height', 90)
        .append('g')
        .attr('transform', 'translate(30, 55)');

    gRange.call(sliderRange);

    d3.select('#slider-range').selectAll('text')
        .style('fill', '#dce8f5');

    // ── Annotation ────────────────────────────────────────────────
    const annotations = [{
        note: {
            label: "Trend: 3.4±0.3 mm/yr\nAcceleration: 0.11±0.05 mm/yr²",
            title: "Notes:",
            align: "right",
            wrap: 180,
            padding: 10
        },
        connector: { type: "elbow", end: "dot" },
        color: ["#dce8f5"],
        x: width - 450,
        y: 180,
        dy: -50,
        dx: -50
    }];

    svg.append("g")
        .attr("class", "annotation-group")
        .call(d3.annotation().annotations(annotations));
});