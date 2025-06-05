const MARGIN = { top: 40, right: 30, bottom: 60, left: 80 };

let noDataGroup;
let containerId;
let width;
let height;
let yAxisScale = 0.3;
let lastVolume;
let cachedBins = null;
let cachedMaxValue = 0;

let worker = new Worker("js/histogramWorker.js");
worker.addEventListener('message', updateHistogramD3);

/**
 * Updates only the Y-axis scale and bar heights without reprocessing data
 */
function updateBarsScale() {
    if (!cachedBins || cachedBins.length === 0) return;

    const container = d3.select(`#${containerId}`);
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const inner = container.select("svg").select("g");

    // Create new Y scale with updated exponent
    const yScale = d3
        .scalePow()
        .exponent(yAxisScale)
        .domain([0, cachedMaxValue])
        .range([0, innerHeight]);

    // Update bars with new scale
    inner
        .selectAll("rect.histogram-bar")
        .transition()
        .duration(200)
        .attr("height", (d, i) => yScale(cachedBins[i]?.length || 0));
}

/**
 * Update the histogram based on the cutting plane position and rotation.
 */
function updateHistogram() {
    const {
        volume,
        position,
        rotation,
    } = getVolumeCuttingPlaneProps();
    const {
        enabled,
        flipped,
    } = getCuttingPlaneProps();

    if (flipped) {
        rotation.x *= -1;
        rotation.y *= -1;
        rotation.z *= -1;
    }

    const innerWidth = width - MARGIN.left - MARGIN.right;

    worker.postMessage({
        enabled,
        volume,
        position,
        rotation,
        innerWidth,
    });
}

/**
 * Updates the histogram with the given volume data.
 *
 * @param {Volume} volume
 */
function updateHistogramD3(event) {
    const { bins } = event.data;

    const container = d3.select(`#${containerId}`);

    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const inner = container.select("svg").select("g");

    console.time("updateHistogramD3");

    cachedBins = bins;

    const validBins = bins.filter((b) => typeof b.length === "number");

    const maxValue = d3.sum(validBins, (d) => d.length);
    cachedMaxValue = maxValue;

    const yScale = d3
        .scalePow()
        .exponent(yAxisScale)
        .domain([0, maxValue])
        .range([0, innerHeight]);

    noDataGroup.style("display", "none");

    inner
        .selectAll("rect.histogram-bar")
        .data(bins, (d, idx) => idx)
        .join("rect")
        .attr("class", "histogram-bar")
        .transition()
        .duration(800)
        .attr("height", (d) =>
            yScale(d.length || 0)
        );

    console.timeEnd("updateHistogramD3");
}

/**
 * Creates the histogram and sets up the SVG elements.
 *
 * @param {Volume} volume - The Volume object containing the voxel data.
 * @param {string} targetId - The ID of the target HTML element where the histogram will be rendered.
 * @param {number} [numBins=100] - The number of bins for the histogram.
 */
function createHistogram(targetId, numBins = 100) {
    containerId = targetId;
    binCount = numBins;

    const container = d3.select(`#${targetId}`);
    const containerRect = container.node().getBoundingClientRect();

    width = containerRect.width;
    height = (containerRect.height - 5) / 2;
    // console.log("height", height);

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;
    // console.log("innerHeight", innerHeight);

    const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", containerRect.height - 5);

    const inner = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // X Axis
    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]).nice();
    inner
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x));

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", innerWidth + MARGIN.left)
        .attr("y", innerHeight + MARGIN.top + MARGIN.bottom / 2 + 5)
        .style("font-size", "12px")
        .text("density");

    // Y Axis
    const y = d3
        .scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0]);
    inner
        .append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickFormat(d3.format(".1f")));

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("x", -MARGIN.top)
        .attr("y", MARGIN.left / 2)
        .style("font-size", "12px")
        .text("intensity");

    // Bars
    inner
        .selectAll("rect.histogram-bar")
        .data(d3.range(binCount), (d, idx) => idx)
        .join("rect")
        .attr("class", "histogram-bar")
        .attr("x", (d) => x(d / binCount) + 1)
        .attr("y", (d) => innerHeight)
        .attr("width", (d) =>
            Math.max(0, x((d + 1) / binCount) - x(d / binCount) - 1)
        )
        .attr("height", (d) => 0)
        .style("fill", "#ffffff88");

    noDataGroup = inner.append("g").attr("class", "no-data-container");

    noDataGroup
        .append("text")
        .attr("class", "no-data-message")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + innerHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("No data");

    drawInteractivePoints(inner, x, y);
}

/**
 * Update the Y-axis scale.
 * @param {number} value - The new Y-axis scale value.
 */
function updateYAxisScale(value) {
    yAxisScale = value;

    document.getElementById("scaleValue").value = yAxisScale;
    document.getElementById("scaleRange").value = yAxisScale;

    updateBarsScale();

}
