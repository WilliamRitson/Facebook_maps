import d3 from "https://dev.jspm.io/d3";

export function makeLineGraphData(data, countries, rangeLow, rangeHigh) {
    let goalCountries = new Map();
    for (let countryName of countries) {
        goalCountries.set(countryName, {
            id: countryName,
            values: []
        });
    }

    for (let country of data) {
        let year = parseInt(country.year);
        if (
            goalCountries.has(country.country) &&
            year >= rangeLow &&
            year <= rangeHigh
        ) {
            let row = goalCountries.get(country.country);
            row.values.push({
                id: new Date(country.year),
                value: parseInt(country.requests),
                year: country.year
            });
        }
    }

    for (let goalCountry of goalCountries.values()) {
        for (let year = rangeLow; year <= rangeHigh; year++) {
            if (!goalCountry.values.find(v => parseInt(v.year) === year)) {
                goalCountry.values.push({
                    id: new Date(year.toString()),
                    value: 0,
                    year: year
                });
            }
        }
        goalCountry.values.sort((a, b) => a.year - b.year);
    }

    return Array.from(goalCountries.values());
}

function getWidth() {
    return window.innerWidth || document.body.clientWidth;
}

const margin = {
        top: 20,
        right: 110,
        bottom: 40,
        left: 60
    },
    totalWidth = getWidth() - 865,
    totalHeight = 600,
    width = totalWidth - margin.left - margin.right,
    height = totalHeight - margin.top - margin.bottom;

const animationTime = 1000; // miliseconds
const svg = d3
    .select("#line-chart")
    .attr("width", totalWidth)
    .attr("height", totalHeight);

export function makeLineGraph(data) {
    // clear
    svg.selectAll("*").remove();
    svg.append("g").attr("class", "map");
    const g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    const colorScheme = Array.from(d3.schemeCategory10);
    colorScheme[1] = "black";
    colorScheme[3] = "gold";

    const x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(colorScheme );

    const line = d3
        .line()
        .curve(d3.curveBasis)
        .x(d => x(d.id))
        .y(d => y(d.value));

    // Adapted From https://sureshlodha.github.io/CMPS263_Winter2018/CMPS263FinalProjects/PrescriptionDrugs/index.html
    // Who got it from https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    // Draw grid lines for the chart
    const drawGridLines = () => {
        // grid lines for x-axis
        g.append("g")
            .attr("class", "grid grid-x")
            .attr("transform", "translate(0," + height + ")")
            .call(
                d3
                    .axisBottom(x)
                    .ticks(4)
                    .tickSize(-height)
                    .tickFormat("")
            )
            .attr("id", "xgrid");

        // grid lines for y-axis
        g.append("g")
            .attr("class", "grid grid-y")
            .call(
                d3
                    .axisLeft(y)
                    .ticks(7)
                    .tickSize(-width)
                    .tickFormat("")
            )
            .attr("id", "ygrid");
    };

    // Adapted From https://sureshlodha.github.io/CMPS263_Winter2018/CMPS263FinalProjects/PrescriptionDrugs/index.html
    // Who in turn got it from https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
    const drawMouseover = conditions => {
        const mouseG = g.append("g").attr("class", "mouse-over-effects");

        mouseG
            .append("path") // this is the black vertical line to follow mouse
            .attr("class", "mouse-line")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        const lines = document.getElementsByClassName("graph-line");

        const mousePerLine = mouseG
            .selectAll(".mouse-per-line")
            .data(conditions)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line");

        mousePerLine
            .append("circle")
            .attr("r", 7)
            .style("stroke", d => z(d.id))
            .style("fill", "none")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        mousePerLine
            .append("text")
            .attr("transform", "translate(10,3)")
            .style("font", "12px sans-serif");

        mouseG
            .append("svg:rect") // append a rect to catch mouse movements on canvas
            .attr("width", width) // can't catch mouse events on a g element
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mouseout", function() {
                // on mouse out hide line, circles and text
                d3.select(".mouse-line").style("opacity", "0");
                d3.selectAll(".mouse-per-line circle").style("opacity", "0");
                d3.selectAll(".mouse-per-line text").style("opacity", "0");
            })
            .on("mouseover", function() {
                // on mouse in show line, circles and text
                d3.select(".mouse-line").style("opacity", "1");
                d3.selectAll(".mouse-per-line circle").style("opacity", "1");
                d3.selectAll(".mouse-per-line text").style("opacity", "1");
            })
            .on("mousemove", function() {
                // mouse moving over canvas
                const mouse = d3.mouse(this);
                d3.select(".mouse-line").attr("d", function() {
                    var d = "M" + mouse[0] + "," + height;
                    d += " " + mouse[0] + "," + 0;
                    return d;
                });

                d3.selectAll(".mouse-per-line").attr("transform", function(
                    d,
                    i
                ) {
                    let beginning = 0;
                    let end = lines[i].getTotalLength();
                    let target = null;
                    let pos;

                    let done = false;
                    while (!done) {
                        target = Math.floor((beginning + end) / 2);
                        pos = lines[i].getPointAtLength(target);
                        if (
                            (target === end || target === beginning) &&
                            pos.x !== mouse[0]
                        ) {
                            break;
                        }
                        if (pos.x > mouse[0]) end = target;
                        else if (pos.x < mouse[0]) beginning = target;
                        else done = true; //position found
                    }

                    d3.select(this)
                        .select("text")
                        .text(y.invert(pos.y).toFixed(2));

                    return "translate(" + mouse[0] + "," + pos.y + ")";
                });
            });
    };

    function processDatagroup(dataGroup) {
        return dataGroup.map(country => {
            return {
                id: country.id,
                values: country.values.map(function(d) {
                    return {
                        year: d.id,
                        percentage: d.value
                    };
                }),
                display: true
            };
        });
    }

    // Transform the data into the desired shape
    const countries = data;

    // Set Scale/Axis Domains
    x.domain([new Date("2012-12-31"), new Date("2017-01-02")]);
    y.domain([0, d3.max(countries, c => d3.max(c.values, d => d.value))]);
    z.domain(countries.map(c => c.id));

    // Create X Axis
    g.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(4));
    g.append("text")
        .attr("y", height + margin.bottom / 2)
        .attr("x", width / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Year");

    // Create Y Axis
    g.append("g")
        .attr("class", "axis axis-y")
        .call(d3.axisLeft(y));
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Data Requests");

    // Create group for each country
    const country = g
        .selectAll(".country")
        .data(countries)
        .enter()
        .append("g");

    // Plot line for each country
    country
        .append("path")
        .attr("class", "graph-line")
        .attr("d", d => line(d.values))
        .style("stroke", d => z(d.id))
        // Animate the line
        .attr(
            "stroke-dasharray",
            totalWidth + totalHeight + " " + totalWidth + totalHeight
        )
        .attr("stroke-dashoffset", totalWidth + totalHeight)
        .transition()
        .duration(animationTime)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Add labels to lines
    country
        .append("text")
        .datum(d => {
            return {
                id: d.id,
                value: d.values[d.values.length - 1]
            };
        })
        .attr(
            "transform",
            d => "translate(" + x(d.value.id) + "," + y(d.value.value) + ")"
        )
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("class", "graph-label")
        .text(d => d.id);

    drawGridLines();
    drawMouseover(processDatagroup(countries, countries));
}
