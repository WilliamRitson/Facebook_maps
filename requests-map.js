var format = d3.format(",");

// Set tooltips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([100, 0])
    .html(function (d) {
          if (isNaN(d.requests)) {
               return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Data Requests: </strong><span class='details'>" + "No Requests Made" + "<br></span>"+ "<strong>Accounts Requested: </strong><span class='details'>" + "0" + "</span>"+ "<br><strong>Approval Rate: </strong><span class='details'>" + "Not Applicable" + "</span>";
            }
        else{
        return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Data Requests: </strong><span class='details'>" + format(d.requests) + "<br></span>"+ "<strong>Accounts Requested: </strong><span class='details'>" + format(d.accounts) + "</span>"+ "<br><strong>Instances Data Was Provided: </strong><span class='details'>" + format(Math.round(d.requests * d.rate / 100)) + "</span>" + "<br><strong>Approval Rate: </strong><span class='details'>" + format(d.rate) + "%" + "</span>";
        }
    })

var margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var color = d3.scaleThreshold()
    .domain([1, 10, 50, 100, 150, 250, 500, 1000, 5000, 12000])
    .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,81,156)", "rgb(0,76,153)", "rgb(0,0,153)"]);

var path = d3.geoPath();

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g')
    .attr('class', 'map');

var projection = d3.geoMercator()
    .scale(130)
    .translate([width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

queue()
    .defer(d3.json, "world_countries.json")
    .defer(d3.tsv, "Data_Requests_2013_H1.tsv")
    .await(ready);

function ready(error, data, requests, accounts, rate) {
    var requestsById = {};
    var accountsById = {};
    var rateById = {};

    requests.forEach(function (d) {
        requestsById[d.id] = +d.requests;
        accountsById[d.id] = +d.accounts;
        rateById[d.id] = +d.rate;
    });
    data.features.forEach(function (d) {
        d.requests = requestsById[d.id]
        d.accounts = accountsById[d.id]
        d.rate = rateById[d.id]
    });
    console.log;

    svg.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function (d) {
            return color(requestsById[d.id]);
        })
        .style('stroke', 'white')
        .style('stroke-width', 1.5)
        .style("opacity", 0.8)
        // tooltips
        .style("stroke", "white")
        .style('stroke-width', 0.3)
        .on('mouseover', function (d) {
            tip.show(d);

            d3.select(this)
                .style("opacity", 1)
                .style("stroke", "white")
                .style("stroke-width", 3);
        })
        .on('mouseout', function (d) {
            tip.hide(d);

            d3.select(this)
                .style("opacity", 0.8)
                .style("stroke", "white")
                .style("stroke-width", 0.3);
        });

    svg.append("path")
        .datum(topojson.mesh(data.features, function (a, b) {
            return a.id !== b.id;
        }))
        // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
        .attr("class", "names")
        .attr("d", path);
}
