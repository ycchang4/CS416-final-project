


function scrollToSlide(index) {
    if (typeof document !== 'undefined') {
        const slide = document.querySelector(`[data-slide="${index}"]`);
        slide.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to update the active dot based on scroll position
function updateActiveDot() {
    const scenes = document.querySelectorAll('.scene');
    const dots = document.querySelectorAll('.dot');

    let activeIndex = 0;
    scenes.forEach((scene, index) => {
        const rect = scene.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            activeIndex = index;
        }
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
    });
}

// Initialize by showing the first scene
scrollToSlide(0);

// Add scroll event listener to update the active dot
// window.addEventListener('scroll', updateActiveDot);

document.addEventListener('DOMContentLoaded', function() {
    d3.text('data/temperature_data.csv').then(function(rawData) {
        // Split the raw text data by lines
        const lines = rawData.split('\n');

        // Remove the first five lines
        const relevantLines = lines.slice(5).join('\n');

        // Parse the CSV from the remaining lines
        const data = d3.csvParse(relevantLines, d => {
            return {
                Year: +d.Year,
                Anomaly: +d.Anomaly
            };
        });
        console.log('Parsed Data:', data); // Log parsed data to console
        createTemperatureChart(data);
    });


    function createTemperatureChart(data) {
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const width = document.getElementById('chart1').clientWidth - margin.left - margin.right;
        const height = document.getElementById('chart1').clientHeight - margin.top - margin.bottom;

        const svg = d3.select("#chart1")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.Year, 0, 1)))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([d3.min(data, d => d.Anomaly), d3.max(data, d => d.Anomaly)])
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")));

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => x(new Date(d.Year, 0, 1)))
                .y(d => y(d.Anomaly))
            );
    }
});
