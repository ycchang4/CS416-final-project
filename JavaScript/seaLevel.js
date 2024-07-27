//Set dimensions and margins for the chart
const margin = {top: 20, right:30, bottom: 40, left: 50};
const width = 800 - margin.left - margin.right;
const height =  400- margin.top - margin.bottom;

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


const parseTime = d3.timeParse("%Y-%m-%d");

const tooltip = d3.select("body")
.append("div")
.attr("class", "tooltip");



d3.csv("data/sea_level.csv").then(data => {
    console.log("raw data", data);
    

    data.forEach(function(d) {
        d.time = parseTime(d.time);
        d.sea_level = +d.sea_level;
        d.trend = +d.trend;
    });

    //Define x and y domain

    x.domain(d3.extent(data, d => d.time));
    y.domain([0, d3.max(data, d=> d.sea_level)]);

    //add x axis and y axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .attr("stroke-width", 1)
        .style("font-size", "15px")
        .call(d3.axisBottom(x)
            .ticks(d3.timeYear.every(5)));

    svg.append("g")
        .attr("class", "y-axis")
        .attr("stroke-width", 1)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "15px");

    //create the line generator
    const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.sea_level));

    //Add line to the grap
    svg.append("path")
    .attr("class", "line")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    //Add the dotted line for the smooth trend
    const lineTrend = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.trend));
    svg.append("path")
        .attr("class", "lineTrend")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4 4")
        .attr("d", lineTrend);
    
    //add y axis label
    svg.append("text")
        .attr("transform", 'rotate(-90)')
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height/2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-family", "sans-serif")
        .text("change in gloabl sea level (cm)");


    //add source
    svg.append("text")
        .attr("class", "source-credit")
        .attr("x", width - 720)
        .attr("y", height + margin.bottom -3)
        .style("font-size", "12px")
        .style("font-family", "sans-serif")
        .text("Source: CMEMS Ocean Monitoring Indicator based on the C3S sea level product. Credit: C3S/ECMWF/CMEMS.");

    //Add a circle element
    const circle = svg.append("circle")
        .attr("r", 0)
        .attr("fill", "steelblue")
        .style("stroke", "white")
        .attr("opacity", 0.70)
        .style("pointer-events", "none");

    //Creaet the SVG element and append it to the chart
    const listeningRect = svg.append("rect")
        .attr("width",width)
        .attr("height", height);

        listeningRect
        .on("mousemove", function(event) {
            const [xCoord, yCoord] = d3.pointer(event);
    
            // Find the closest data point to the mouse position
            const closestData = data.reduce((prev, curr) => 
                Math.abs(xCoord - x(curr.time)) < Math.abs(xCoord - x(prev.time)) ? curr : prev
            );
    
            // Update the tooltip position and content
            tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY - 28}px`)
                .html(`${formatTime(closestData.time)}<br>${closestData.sea_level} cm`);
    
            // Update the circle position
            circle
                .attr("cx", x(closestData.time))
                .attr("cy", y(closestData.sea_level))
                .attr("r", 5);
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
            circle.attr("r", 0);
        });
        const formatTime = d3.timeFormat("%B %d, %Y");

    const sliderRange = d3
    .sliderBottom()
    .min(d3.min(data, d => d.time))
    .max(d3.max(data, d => d.time))
    .width(300)
    .tickFormat(d3.timeFormat('%Y-%m-%d'))
    .ticks(3)
    .default([d3.min(data, d => d.time), d3.max(data, d => d.time)])
    .fill('steelblue')
    .on('onchange', val => {
        x.domain(val);
 

        // Filter data based on slider values
        const filteredData = data.filter(d => d.time >= val[0] && d.time <= val[1]);


        // Update all the lines
        svg.select(".line").attr("d", line(filteredData));
        svg.select(".lineTrend").attr("d", lineTrend(filteredData));

        // Set the y domain
        y.domain([0, d3.max(filteredData, d => d.sea_level)]);

        // Update the x-axis with new domain
    svg.select(".x-axis")
      .transition()
      .duration(300) // transition duration in ms
      .call(d3.axisBottom(x)
        .tickValues(x.ticks(d3.timeYear.every(5)))
        .tickFormat(d3.timeFormat("%Y")));

    // Update the y-axis with new domain
    svg.select(".y-axis")
      .transition()
      .duration(300) // transition duration in ms
      .call(d3.axisLeft(y)
        .ticks(10));

        d3.select(".annotation-group").remove();
    });

    const gRange = d3 
        .select('#slider-range')
        .append('svg')
        .attr('width', 500)
        .attr('height',100)
        .append('g')
        .attr("transform", 'translate(150, 50)');

        gRange.call(sliderRange);

    // Add annotation 
    const annotations = [
        {
            note: {
                label: "Trend: 3.4±0.3 mm/yr\n Acceleration: 0.11±0.05 mm/yr²",
                title: "Notes:",
                align: "right", 
                wrap: 180, 
                padding: 10  
            },
            connector: {
                type: "elbow",
                end: "dot" 
            },
            color: ["#2c3e50"],
            x: width -450, 
            y: 180, 
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


});