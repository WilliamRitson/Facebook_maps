import d3 from "https://dev.jspm.io/d3";

const format = d3.format(",");

export class VerticalLegend {
    /**
     * Creates a new legend with a given scale
     *
     * @param {d3.seleciton} svg
     * @param {number[]} thresholds
     * @param {string[]} colorNames
     * @param {(x:number) => number} scaler
     */
    constructor(svg, thresholds, colorNames, scaler) {
        this.thresholds = thresholds;
        this.colorNames = colorNames;
        this.svg = svg;

        this.sizes = [];
        for (let i = 0; i < thresholds.length - 1; i++) {
            let rawSize = Math.abs(thresholds[i + 1] - thresholds[i]);
            this.sizes.push(scaler(rawSize));
        }

        let smallestSize = Math.min(...this.sizes);
        this.sizes = this.sizes.map(size => size / smallestSize);
        this.totalSize = this.sizes.reduce((a, b) => a + b);
    }

    /**
     * Draws the legend in the given area
     *
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    draw(x, y, width, height) {
        this.legend = this.svg
            .append("g")
            .attr("transform", `translate(${x}, ${y})`);

        let yPos = 0;
        for (let i = this.thresholds.length - 1; i >= 0; i--) {
            let blockHeight = ((this.sizes[i] || 0) / this.totalSize) * height;
            let legendYPadding = i === 0 ? 0 : 5;

            if (i < this.sizes.length) {
                this.legend
                    .append("rect")
                    .attr("y", yPos)
                    .attr("class", this.colorNames[i + 1])
                    .attr("width", width)
                    .attr("height", blockHeight);
            }
            yPos += blockHeight;
            this.legend
                .append("text")
                .attr("x", width + 5)
                .attr("y", yPos + legendYPadding)
                .text(format(this.thresholds[i]));
        }
    }
}
