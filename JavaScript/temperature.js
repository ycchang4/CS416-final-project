//Set dimensions and margins for the chart
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

//set up the x and y scale
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

//create the SVG element 
const svg = d3.select("#chart-container")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


const tooltip = d3.select("body")
.append("div")
.attr("class", "tooltip");



// Parse the Data
d3.csv("data/data.csv").then(data => {

    // Format the data
    data.forEach(d => {
        d.Year = +d.Year;
        d.Anomaly = +d.Anomaly;
    });


    // Add X axis
    const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.Year) - 1, d3.max(data, d => d.Year) + 1])
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "14px");

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.Anomaly) - 0.1, d3.max(data, d => d.Anomaly) + 0.1])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", "14px");

    // Add tooltip
    const tooltip = d3.select(".tooltip");

    // Add dots
    svg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d.Anomaly))
        .attr("r", 4)
        .attr("class", "dot")
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Year: ${d.Year}<br>Anomaly: ${d.Anomaly}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

        });
    // Add annotation 
    const annotations = [
        {
            note: {
                label: "Base Period: 1901-2000",
                align: "right", 
                wrap: 180, 
                padding: 10  
            },
            connector: {
                type: "elbow",
                end: "dot" 
            },
            color: ["#2c3e50"],
            x: width - 350, 
            y: 150, 
            dy: -50, 
            dx: -50 
        }
    ];

    // Create annotation object + add to SVG
    const makeAnnotations = d3.annotation()
        .annotations(annotations);

    svg.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);

    //add source
    svg.append("text")
        .attr("class", "source-credit")
        .attr("x", width - 750)
        .attr("y", height + margin.bottom -3)
        .style("font-size", "9px")
        .style("font-family", "sans-serif")
        .text("Source: https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/time-series");

    //add y axis label
    svg.append("text")
    .attr("transform", 'rotate(-90)')
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height/2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-family", "sans-serif")
    .text("Anamoly (\u00B0 C)");
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});