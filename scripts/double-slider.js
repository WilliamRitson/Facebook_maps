import d3 from "https://dev.jspm.io/d3";

const svg = d3
    .select("#double-slider")
    .attr("width", 740)
    .attr("height", 100)
    .append("g")
    .attr("class", "map");

const endDate = new Date(2017, 0, 1);
const startDate = new Date(2013, 0, 1);

const xAxisScale = d3
    .scaleTime()
    .domain([startDate, endDate])
    .range([0, 500]) // adjusts size of xaxisline 500 was width previously
    .clamp(true);

const xAxis = d3.axisBottom(xAxisScale).tickFormat(d3.timeFormat("%Y"));

svg.append("g")
    .attr("transform", "translate(20,80)")
    .call(xAxis.ticks(d3.timeYear));

const formatTime = d3.timeFormat("%Y");
function brushed(callback) {
    return () => {
        if (!d3.event.sourceEvent) return; // Only transition after input.

        if (d3.event.sourceEvent.type === "brush") return;
        let d0 = d3.event.selection.map(xAxisScale.invert),
            d1 = d0.map(d3.timeYear.round);

        let enTime = formatTime(d1[1]);
        let begTime = formatTime(d1[0]);

        callback(begTime, enTime);

        // If empty when rounded, use floor instead.
        if (d1[0] >= d1[1]) {
            d1[0] = d3.timeYear.floor(d0[0]);
            d1[1] = d3.timeYear.offset(d1[0]);
        }

        d3.select(this).call(d3.event.target.move, d1.map(xAxisScale));
    };
}

export function makeSlider(callback) {
    const brush = d3
        .brushX()
        .extent([[0, 0], [520, 100]])
        .on("brush", brushed(callback));

    const brushg = svg
        .append("g")
        .attr("class", "brush")
        .call(brush)
        .attr("transform", "translate(20, 50)");

    brushg.selectAll("rect.handle").style("fill", "#276c86");
}
