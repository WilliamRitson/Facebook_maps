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
    //width = 980;
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

var svg2 = d3.select("#double-slider")
    .append("svg")
    //.attr("id", "double-slider")
    .attr("width", 600)
    .attr("height", 100)
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

/*function brushed() {
    /*
      The brush attributes are no longer stored 
      in the brush itself, but rather in the 
      element it is brushing. That's where much of
      the confusion around v4's brushes seems to be.
      The new method is a little difficult to adapt
      to, but seems more efficient. I think much of
      this confusion comes from the fact that 
      brush.extent() still exists, but means
      something completely different.

      Instead of calling brush.extent() to get the 
      range of the brush, call 
      d3.brushSelection(node) on what is being 
      brushed.

    d3.select('#start-number')
      .text(Math.round(brush.extent()[0]));
    d3.select('#end-number')
      .text(Math.round(brush.extent()[1]));
    */

/*
    var range = d3.brushSelection(this)
    //.map(xAxisScale.invert(1))
    .map(xAxisScale.invert(this));
    //.map(xAxisScale);
    //.map(xAxisScale.invert); //try this one again!
    //.map(brush.invert);

    d3.select("#double-slider")
        .text(function (d, i) {
            return Math.round(range[i])
        })
} */

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
        .style("opacity", 0.8)
        // tooltips
        .style("stroke", "white")
        .style("stroke-width", 0.3)
        .on("mouseover", function (d) {
            tip.show(d);

            if (!countriesToGraph.has(names[d.id])) {
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "rgb(175,238,238)")
                    .style("stroke-width", 3);
            }
        })
        .on("mouseout", function (d) {
            tip.hide(d);

            if (!countriesToGraph.has(names[d.id])) {
                d3.select(this)
                    .style("opacity", 0.8)
                    .style("stroke", "white")
                    .style("stroke-width", 0.3);
            }
        })
        .on("click", function (d) {
            if (requestsById[d.id] > 0)
                toggleCountry(request_data, names[d.id], yearLow, yearHigh);

            if (countriesToGraph.has(names[d.id])) {
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke", "cornflowerblue")
                    .style("stroke-width", 3);
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

var padding = 20;
var endDate = new Date(2018, 0, 1);
var startDate = new Date(2013, 0, 1);
//console.log(startDate); //720
//console.log(endDate);

// var x = d3.brushX()
var xAxisScale = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, 500]) // adjusts size of xaxisline 500 was width previously
    //.rangeRound([0, 4])
    .clamp(true)
    //.snap(true);
//.rangeRound([0, 1000]);

console.log(xAxisScale(new Date(2018, 0, 1))) // this prints out as 500
console.log(xAxisScale(new Date(2013, 0, 1))) // 0

var xAxis = d3.axisBottom(xAxisScale).tickFormat(d3.timeFormat("%Y"));//.tickSize(0).tickPadding(20);

//.tickSize(0)
//.tickPadding(20);

svg2.append("g").attr("transform", "translate(20,80)").call(xAxis.ticks(d3.timeYear));
console.log(xAxis.length);

function brushended() {
    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.
    var d0 = d3.event.selection.map(xAxisScale.invert),
        d1 = d0.map(d3.timeYear.round);
  
    // If empty when rounded, use floor & ceil instead.
    if (d1[0] >= d1[1]) {
      d1[0] = d3.timeYear.floor(d0[0]);
      d1[1] = d3.timeYear.offset(d1[0]);
    }
  
    d3.select(this).call(d3.event.target.move, d1.map(xAxisScale));
}

// using this function not brushended
function brushed() {
    if (!d3.event.sourceEvent) return; // Only transition after input.
    //if (!d3.event.selection) return; // Ignore empty selections.
    if (d3.event.sourceEvent.type === "brush") return;
    var d0 = d3.event.selection.map(xAxisScale.invert),
        //d1 = d0.map(xAxisScale);
        //d1 = d0.map(Math.ceil); //use Math.round as a parameter for temp fix !problem is brush won't go to the end of axis
        //d1 = d0.map(function () {return d3.timeYear});
        d1 = d0.map(d3.timeYear.round);
        //d1 = d0.map(d3.timeYear);
        //trying to extend the brush range to end of axis but this condition doesn't work
        //if (d1[1] == 1483257600000) {
            //d1[1] = new Date(2017, 0, 1);
            //d1[1] = d3.timeYear;
        //}
    
    console.log(d0);
    console.log(d1);
    //if (d1[1] >= 1483257600000) {
        //d1[1] = endDate;
        //d1[1] = xAxisScale(endDate);
    //}
  
    // If empty when rounded, use floor instead.
    if (d1[0] >= d1[1]) {
      d1[0] = d3.timeYear.floor(d0[0]);//Math.floor(d0[0]);
      d1[1] = d3.timeYear.offset(d1[0]);//d1[0] + 1;
      //d1[0] = Math.floor(d0[0]);
      //d1[1] = d1[0] + 1;
    }
  
    d3.select(this).call(d3.event.target.move, d1.map(xAxisScale));
}

var brush = d3.brushX()
    //.extent([[startDate, 0], [endDate, 1000]])
    //.x(xAxisScale)
    .extent([[0, 0], [520, 100]]) 
    .on("brush", brushed);
    //.on("brush", brushended);
    //.on('end', function() {
        //if (d3.event.sourceEvent.type === "brush") return;

        //console.log(d3.event.selection.map(xAxisScale.invert))
    //})


var brushg = svg2.append("g")
    .attr("class", "brush")
    .call(brush)
    .attr('transform', 'translate(20, 50)')
    //brushg.attr('transform', 'translate(50, 50)')
    //brushg.selectAll('rect').attr('height', height)
    //brushg.selectAll('.overlay')
      //.style('fill', '#4b9e9e')
    //brushg.selectAll('.selection')
      //.attr('fill', null)
      //.attr('fill-opacity', 1)
      //.style('fill', '#78c5c5')
    brushg.selectAll('rect.handle')
      .style('fill', '#276c86')
    
    //brush.move(brushg, [22, 28].map(xAxisScale))
    //brush.move(brushg, [startDate, endDate].map(xAxisScale))

// this is breaking the ui
//brush.move(brushg, [2013, 2017].map(xAxisScale));
//brush.move(brushg, [startDate, endDate].map(xAxis));


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
/*
    // Render the slider in the div and give it functionality
    d3.select('#slider').call(slider
        .on("slide", function (evt, targetyear) {
            d3.select("#handle-one").select(".yearBox")
                .html(targetyear[0]);
            d3.select("#handle-two").select(".yearBox")
                .html(targetyear[1]);
            svg.selectAll(".fire").each(function (d) {
                if (d.values[0].properties.year > targetyear[0] && d.values[0].properties.year < targetyear[1]) {
                    //this.style.opactiy += 0.8;
                    this.setAttribute("hoverable", "true");
                    //this.style.opacity = (d.values[0].properties.year > targetyear[0] && d.values[0].properties.year < targetyear[1]) ? .8 : 0;
                    // iterate through fires, only display fires in slider range
                    //this.style.opacity = (d.values[0].properties.year > targetyear[0] && d.values[0].properties.year < targetyear[1]) ? .8 : 0;
                } else {
                    //this.style.opacity += 0;
                    //this.style.opacity = (d.values[0].properties.year > targetyear[0] && d.values[0].properties.year < targetyear[1]) ? .8 : 0;
                    this.setAttribute("hoverable", "false");
                }
                this.style.fillOpacity = (d.values[0].properties.year > targetyear[0] && d.values[0].properties.year < targetyear[1]) ? .5 : 0;
            })
        })
    )
    .selectAll(".d3-slider-handle")
        .append("div")
        .attr("class", "yearBox")
    
    d3.select("#handle-one").select(".yearBox")
        .html("1895");
    d3.select("#handle-two").select(".yearBox")
        .html("2015");
        */

