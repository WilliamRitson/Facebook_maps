var format = d3.format(",");

// Set tooltips
var tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([100, 0])
    .html(function (d) {
        if (isNaN(d.requests) || (d.requests == 0)) {
            return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Data Requests: </strong><span class='details'>" + "No Requests Made" + "<br></span>" + "<strong>Accounts Requested: </strong><span class='details'>" + "0" + "</span>" + "<br><strong>Approval Rate: </strong><span class='details'>" + "Not Applicable" + "</span>";
        }
        else if(isNaN(d.rate)){
            return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Data Requests: </strong><span class='details'>" + format(d.requests) + "<br></span>" + "<strong>Accounts Requested: </strong><span class='details'>" + format(d.accounts) + "</span>" + "<br><strong>Instances Data Was Provided: </strong><span class='details'>" + "0" + "</span>" + "<br><strong>Approval Rate: </strong><span class='details'>"  + "0%" + "</span>";
        }
        else {
            return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Data Requests: </strong><span class='details'>" + format(d.requests) + "<br></span>" + "<strong>Accounts Requested: </strong><span class='details'>" + format(d.accounts) + "</span>" + "<br><strong>Instances Data Was Provided: </strong><span class='details'>" + format(Math.round(d.requests * d.rate / 100)) + "</span>" + "<br><strong>Approval Rate: </strong><span class='details'>" + format(d.rate) + "%" + "</span>";
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
    .domain([0, 50, 300, 600, 1000, 4000, 8000, 17000, 35000, 70000])
    .range(["rgb(150,150,150)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,81,156)", "rgb(0,76,153)", "rgb(0,0,153)"]);

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("class", "map");

var projection = d3.geoMercator()
    .scale(130)
    .translate([width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

queue()
    .defer(d3.json, "world_countries.json")
    .defer(d3.tsv, "data/facebook_output/all.tsv")
    .await(ready);


// Percentage merge still has bugs
function mergeYears(data, startYear, endYear) {
    let countries = new Map();
    for (let year = startYear; year <= endYear; year++) {
        let yearData = data.filter(r => r["Year"] == year);
        for (let country of yearData) {
            if (countries.has(country.id)) {
                let existing = countries.get(country.id);
                existing["Total Data Requests"] = +existing["Total Data Requests"] + +country["Total Data Requests"];
                existing["Total Users/Accounts Requested"] = +existing["Total Users/Accounts Requested"] + +country["Total Users/Accounts Requested"];
                existing["Percent Requests Where Some Data Produced"] =
                    (+existing["Percent Requests Where Some Data Produced"] * existing.datapoints +
                        +country["Percent Requests Where Some Data Produced"]) / (existing.datapoints + 1);
                existing.datapoints += 1;
                countries.set(country.id, existing);
            } else {
                country.datapoints = 1;
                countries.set(country.id, country);
            }
        }
    }
    return Array.from(countries.values());
}

function ready(error, data, requests, accounts, rate) {
    var requestsById = {};
    var accountsById = {};
    var rateById = {};

    requests = mergeYears(requests, 2013, 2017);

    requests.forEach(function (d) {
        requestsById[d.id] = +d["Total Data Requests"];
        accountsById[d.id] = +d["Total Users/Accounts Requested"];
        rateById[d.id] = +d["Percent Requests Where Some Data Produced"];
    });

    data.features.forEach(function (d) {
        d.requests = requestsById[d.id];
        d.accounts = accountsById[d.id];
        d.rate = rateById[d.id];
    });

    //Changes to country color White
    svg.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function (d) {
            let colorVal = requestsById[d.id] == 0 ||  isNaN(requestsById[d.id] ) ? -1 : requestsById[d.id];
            return color(colorVal);
        })
        .style("stroke", "white")
        .style("stroke-width", 1.5)
        .style("opacity", 0.8)
        // tooltips
        .style("stroke", "white")
        .style("stroke-width", 0.3)
        .on("mouseover", function (d) {
            tip.show(d);

            d3.select(this)
                .style("opacity", 1)
                .style("stroke", "white")
                .style("stroke-width", 3);
        })
        .on("mouseout", function (d) {
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
