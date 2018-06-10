import d3 from "https://dev.jspm.io/d3";


const margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var endDate = new Date(2017, 0, 1); // - 1;
var startDate = new Date(2013, 0, 1);
// var x = d3.brushX()
var xAxisScale = d3
    .scaleTime()
    .domain([startDate, endDate])
    .rangeRound([0, width]) // adjusts size of slider
    //.rangeRound([0, 4])
    .clamp(true);
//.snap(true);
//.rangeRound([0, 1000]);

console.log(xAxisScale(new Date(2016, 0, 1))); // this prints out as 720

var xAxis = d3.axisBottom(xAxisScale).tickFormat(d3.timeFormat("%Y")); //.tickSize(0).tickPadding(20);

var svg2 = d3
    .select("#double-slider")
    //.attr("id", "double-slider")
    .attr("width", 1000)
    .attr("height", 100)
    .append("g")
    .attr("class", "map");

var brush = d3
    .brushX()
    //.extent([[startDate, 0], [endDate, 1000]])
    //.x(xAxisScale)
    .extent([[0, 0], [1000, 100]]) // dealin with the selection and range of brush region
    //.on("brush", brushed);
    .on("end", function() {
        if (d3.event.sourceEvent.type === "brush") return;

        console.log(d3.event.selection.map(xAxisScale.invert));
    });

export function drawSlider() {
    svg2.append("g")
        .attr("transform", "translate(20,80)")
        .call(xAxis.ticks(d3.timeYear));

    var brushg = svg2
        .append("g")
        .attr("class", "brush")
        .call(brush);

    brushg.selectAll("rect.handle").style("fill", "#276c86");
}
