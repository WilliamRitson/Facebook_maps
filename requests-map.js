import {
    makeLineGraph,
    makeLineGraphData
} from "./line-graph.js";


var format = d3.format(",");

// Set tooltips
var tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([100, 0])
    .html(function (d) {
        if (isNaN(d.requests) || (d.requests == 0)) {
            return "<table><caption>Data Requests</caption><tr><th align='left'>Country</th><td align='center'>" + ":" + "</td><td align='right'>" + d.properties.name + "</td></tr><tr><th align='left'># Requests</th><td align='center'>" + ":" + "</td><td align='right'>" + "No Requests Made" + "</td></tr><tr><th align='left'># Accounts</th><td align='center'>" + ":" + "</td><td align='right'>" + "0" + "</td></tr><tr><th align='left'>Data Provided</th><td align='center'>" + ":" + "</td><td align='right'>" + "0" + "</td></tr><tr><th align='left'>Approval Rt</th><td align='center'>" + ":" + "</td><td align='right'>" + "Not Applicable" + "</td></tr></table>";

        } else if (isNaN(d.rate)) {

            return "<table><caption>Data Requests</caption><tr><th align='left'>Country</th><td align='center'>" + ":" + "</td><td align='right'>" + d.properties.name + "</td></tr><tr><th align='left'># Requests</th><td align='center'>" + ":" + "</td><td align='right'>" + format(d.requests) + "</td></tr><tr><th align='left'># Accounts</th><td align='center'>" + ":" + "</td><td align='right'>" + format(d.accounts) + "</td></tr><tr><th align='left'>Data Provided</th><td align='center'>" + ":" + "</td><td align='right'>" + "0" + "</td></tr><tr><th align='left'>Approval Rt</th><td align='center'>" + ":" + "</td><td align='right'>" + "0%" + "</td></tr></table>";

        } else {
            return "<table><caption>Data Requests</caption><tr><th align='left'>Country</th><td align='center'>" + ":" + "</td><td align='right'>" + d.properties.name + "</td></tr><tr><th align='left'># Requests</th><td align='center'>" + ":" + "</td><td align='right'>" + format(d.requests) + "</td></tr><tr><th align='left'># Accounts</th><td align='center'>" + ":" + "</td><td align='right'>" + format(d.accounts) + "</td></tr><tr><th align='left'>Data Provided</th><td align='center'>" + ":" + "</td><td align='right'>" + format(Math.round(d.requests * d.rate / 100)) + "</td></tr><tr><th align='left'>Approval Rt</th><td align='center'>" + ":" + "</td><td align='right'>" + format(Math.round(d.rate)) + "%" + "</td></tr></table>";

        }
    });

var margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var color = d3.scaleThreshold()
    .domain([0, 25, 250, 2500, 25000, 205000])
    .range(["rgb(150,150,150)", "rgb(254,240,217)", "rgb(253,204,138)", "rgb(252,141,89)", "rgb(227,74,51)", "rgb(179,0,0)"]);

var svg = d3.select("#geomap")
    .attr("id", "line-graph")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("class", "map");

var projection = d3.geoNaturalEarth1()
    .scale(170)
    .translate([width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

// Percentage merge still has bugs
function mergeYears(data, startYear, endYear) {
    let countries = new Map();
    for (let year = startYear; year <= endYear; year++) {
        let yearData = data.filter(r => r.year == year);
        for (let country of yearData) {
            if (countries.has(country.id)) {
                let existing = countries.get(country.id);
                existing["requests"] = +existing["requests"] + +country["requests"];
                existing["accounts"] = +existing["accounts"] + +country["accounts"];
                existing["percentAccepted"] =
                    (+existing["percentAccepted"] * existing.datapoints +
                        +country["percentAccepted"]) / (existing.datapoints + 1);
                existing.datapoints += 1;
                countries.set(country.id, existing);
            } else {
                let copy = Object.assign({}, country);
                copy.datapoints = 1;
                countries.set(copy.id, copy);
            }
        }
    }
    return Array.from(countries.values());
}

const defaultGraphCountries = ["United States", "India", "United Kingdom", "Germany", "France", "Canada"];
const countriesToGraph = new Set();

function getCountriesToGraph() {
    if (countriesToGraph.size > 0)
        return countriesToGraph;
    return defaultGraphCountries;
}

function toggleCountry(requestData, country, yearLow, yearHigh) {
    if (countriesToGraph.has(country)) {
        countriesToGraph.delete(country);
    } else {
        countriesToGraph.add(country);
    }
    makeLineGraph(makeLineGraphData(requestData, getCountriesToGraph(), yearLow, yearHigh));
}

function setData(geoData, request_data, yearLow, yearHigh) {
    makeLineGraph(makeLineGraphData(request_data, getCountriesToGraph(), yearLow, yearHigh));

    var requestsById = {};
    var accountsById = {};
    var rateById = {};
    var names = {};

    var requests = mergeYears(request_data, yearLow, yearHigh);

    requests.forEach(function (d) {
        requestsById[d.id] = +d["requests"];
        accountsById[d.id] = +d["accounts"];
        rateById[d.id] = +d["percentAccepted"];
        names[d.id] = d.country;
    });

    geoData.features.forEach(function (d) {
        d.requests = requestsById[d.id];
        d.accounts = accountsById[d.id];
        d.rate = rateById[d.id];
    });

    // clear
    svg.selectAll("*").remove();

    const widthThin = 0.3;
    const widthThick = 3;
    const normalColor = "white";
    const selectedColor = "darkred";
    const hoverColor = "rgb(175,238,238)";
    const normalOpacity = 0.8;
    const selectedOpacity = 1;

    //Changes to country color White
    svg.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(geoData.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function (d) {
            let colorVal = requestsById[d.id] == 0 || isNaN(requestsById[d.id]) ? -1 : requestsById[d.id];
            return color(colorVal);
        })
        .style("stroke", "white")
        .style("stroke-width", 1.5)
        .style("opacity", d => countriesToGraph.has(names[d.id]) ? selectedOpacity : normalOpacity)
        // tooltips
        .style("stroke", d => countriesToGraph.has(names[d.id]) ? selectedColor : normalColor)
        .style("stroke-width", d => countriesToGraph.has(names[d.id]) ? widthThick : widthThin)
        .on("mouseover", function (d) {
            tip.show(d);

            if (!countriesToGraph.has(names[d.id])) {
                d3.select(this)
                    .style("opacity", selectedOpacity)
                    .style("stroke", hoverColor)
                    .style("stroke-width", widthThick);
            }
        })
        .on("mouseout", function (d) {
            tip.hide(d);

            if (!countriesToGraph.has(names[d.id])) {
                d3.select(this)
                    .style("opacity", normalOpacity)
                    .style("stroke", normalColor)
                    .style("stroke-width", widthThin);
            }
        })
        .on("click", function (d) {
            if (requestsById[d.id] > 0)
                toggleCountry(request_data, names[d.id], yearLow, yearHigh);

            if (countriesToGraph.has(names[d.id])) {
                d3.select(this)
                    .style("opacity", selectedOpacity)
                    .style("stroke", selectedColor)
                    .style("stroke-width", widthThick);
            } else {
                d3.select(this)
                    .style("opacity", normalOpacity)
                    .style("stroke", normalColor)
                    .style("stroke-width", widthThin);
            }
        });

    svg.append("path")
        .datum(topojson.mesh(geoData.features, function (a, b) {
            return a.id !== b.id;
        }))
        // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
        .attr("class", "names")
        .attr("d", path);


    //legend  
    svg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(30,330)");

    var legendIndex = 0;
    var legendLinear = d3.legendColor()
        .shapeWidth(45)
        .shapeHeight(10)
        .title("Government Data Requests")
        .orient("vertical")
        .scale(color)
        .labelFormat((d) => {
            if (isNaN(d))
                return 0;
            legendIndex++;
            if (legendIndex % 2 == 0)
                return d + 1;
            return d;

        });



    svg.select(".legendLinear")
        .call(legendLinear);

}

queue()
    .defer(d3.json, "world_countries.json")
    .defer(d3.tsv, "data/facebook_output/all_facebook.tsv")
    .defer(d3.tsv, "data/google_output/all_google.tsv")
    .await(ready);


function ready(error, geoData, facebookRequets, googleRequets) {

    document.getElementById("select-facebook").addEventListener("click", () => {
        setData(geoData, facebookRequets, 2013, 2017);
    });

    document.getElementById("select-google").addEventListener("click", () => {
        setData(geoData, googleRequets, 2013, 2017);
    });

    setData(geoData, facebookRequets, 2013, 2017);



}