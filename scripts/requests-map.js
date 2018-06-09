import { makeLineGraph, makeLineGraphData } from "./line-graph.js";
import { tip } from "./tooltip-config.js";

const margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

const color = d3
    .scaleThreshold()
    .domain([0, 25, 250, 2500, 25000, 205000])
    .range([
        "rgb(150,150,150)",
        "rgb(254,240,217)",
        "rgb(253,204,138)",
        "rgb(252,141,89)",
        "rgb(227,74,51)",
        "rgb(179,0,0)"
    ]);

const svg = d3
    .select("#geomap")
    .attr("id", "line-graph")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("class", "map");

const projection = d3
    .geoNaturalEarth1()
    .scale(170)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

svg.call(tip);

// Percentage merge still has bugs
function mergeYears(data, startYear, endYear) {
    let countries = new Map();
    for (let year = startYear; year <= endYear; year++) {
        let yearData = data.filter(r => r.year == year);
        for (let country of yearData) {
            if (countries.has(country.id)) {
                let existing = countries.get(country.id);
                existing["requests"] =
                    +existing["requests"] + +country["requests"];
                existing["accounts"] =
                    +existing["accounts"] + +country["accounts"];
                existing["percentAccepted"] =
                    (+existing["percentAccepted"] * existing.datapoints +
                        +country["percentAccepted"]) /
                    (existing.datapoints + 1);
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

const defaultGraphCountries = [
    "United States",
    "India",
    "United Kingdom",
    "Germany",
    "France",
    "Canada"
];
const countriesToGraph = new Set();

function getCountriesToGraph() {
    if (countriesToGraph.size > 0) return countriesToGraph;
    return defaultGraphCountries;
}

function toggleCountry(requestData, country, yearLow, yearHigh) {
    if (countriesToGraph.has(country)) {
        countriesToGraph.delete(country);
    } else {
        countriesToGraph.add(country);
    }
    makeLineGraph(
        makeLineGraphData(requestData, getCountriesToGraph(), yearLow, yearHigh)
    );
}

function setData(geoData, request_data, yearLow, yearHigh) {
    makeLineGraph(
        makeLineGraphData(
            request_data,
            getCountriesToGraph(),
            yearLow,
            yearHigh
        )
    );

    var requestsById = {};
    var accountsById = {};
    var rateById = {};
    var names = {};

    var requests = mergeYears(request_data, yearLow, yearHigh);

    requests.forEach(function(d) {
        requestsById[d.id] = +d["requests"];
        accountsById[d.id] = +d["accounts"];
        rateById[d.id] = +d["percentAccepted"];
        names[d.id] = d.country;
    });

    geoData.features.forEach(function(d) {
        d.requests = requestsById[d.id];
        d.accounts = accountsById[d.id];
        d.rate = rateById[d.id];
    });

    // clear
    svg.selectAll("*").remove();

    //Changes to country color White
    svg.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("class", "country")

        .attr("d", path)

        .style("fill", function(d) {
            let colorVal =
                requestsById[d.id] == 0 || isNaN(requestsById[d.id])
                    ? -1
                    : requestsById[d.id];
            return color(colorVal);
        })

        // tooltips
        .on("mouseover", function(d) {
            tip.show(d);
        })
        .on("mouseout", function(d) {
            tip.hide(d);
        })
        .on("click", function(d) {
            if (requestsById[d.id] > 0)
                toggleCountry(request_data, names[d.id], yearLow, yearHigh);

            if (countriesToGraph.has(names[d.id])) {
                d3.select(this).attr("class", "selected");
            } else {
                d3.select(this).attr("class", "country");
            }
        });

    svg.append("path")
        .datum(
            topojson.mesh(geoData.features, function(a, b) {
                return a.id !== b.id;
            })
        )
        // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
        .attr("class", "names")
        .attr("d", path);

    //legend
    svg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(30,330)");

    var legendIndex = 0;
    var legendLinear = d3
        .legendColor()
        .shapeWidth(45)
        .shapeHeight(10)
        .title("Government Data Requests")
        .orient("vertical")
        .scale(color)
        .labelFormat(d => {
            if (isNaN(d)) return 0;
            legendIndex++;
            if (legendIndex % 2 == 0) return d + 1;
            return d;
        });

    svg.select(".legendLinear").call(legendLinear);
}

queue()
    .defer(d3.json, "data/world_countries.json")
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
