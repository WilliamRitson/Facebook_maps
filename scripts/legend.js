const format = d3.format(",");


export class Legend {
    /**
     *
     *
     * @param {d3.seleciton} svg
     * @param {number[]} thresholds
     * @param {string[]} colorNames
     */
    constructor(svg, thresholds, colorNames) {
        this.thresholds = thresholds;
        this.colorNames = colorNames;
        this.svg = svg;

        let scaler = x => Math.pow(x, 1/4);

        this.sizes = [];
        for (let i = 0; i < thresholds.length - 1; i++) {
            let rawSize = thresholds[i + 1] - thresholds[i];
            this.sizes.push(scaler(rawSize));
        }
        let smallestSize = Math.min(...this.sizes);
        this.sizes = this.sizes.map(size => size / smallestSize);
        this.totalSize = this.sizes.reduce((a, b) => a + b);
    }

    draw(x, y, width, height) {
        this.legend = this.svg
            .append("g")
            .attr("transform", `translate(${x}, ${y})`);

        let yPos = 0;
        for (let i = 0; i < this.thresholds.length; i++) {
            let blockHeight = (this.sizes[i] / this.totalSize) * height;
            this.legend
                .append("text")
                .attr("x", width + 5)
                .attr("y", yPos + 5)
                .text(format(this.thresholds[i]));

            if (i < this.sizes.length) {
                this.legend
                    .append("rect")
                    .attr("y", yPos)
                    .attr("class", this.colorNames[i + 1])
                    .attr("width", width)
                    .attr("height", blockHeight);
            }
            yPos += blockHeight;
        }
    }
}
