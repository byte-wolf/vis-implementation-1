const MARGIN = { top: 20, right: 30, bottom: 60, left: 80 };

let noDataGroup;

let containerId;
let binCount = 100;

let width;
let height;

let yAxisScale = 0.3;

let lastVolume;

/**
 * Updates the histogram with the given volume data.
 *
 * @param {Volume} volume
 */
function updateHistogram(volume) {
    lastVolume = volume;
    const data = volume.voxels;

    const container = d3.select(`#${containerId}`);
    const containerRect = container.node().getBoundingClientRect();

    console.log("height", height);

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    console.log("innerHeight", innerHeight);

    const inner = container.select("svg").select("g");

    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]).nice();

    const histogramLayout = d3
        .histogram()
        .value((d) => d)
        .domain(x.domain())
        .thresholds(x.ticks(binCount));

    const bins = histogramLayout(data);

    const validBins = bins.filter((b) => typeof b.length === "number");

    const maxBinCount = d3.max(validBins, (d) => d.length);

    const effectiveMaxCount = maxBinCount > 0 ? maxBinCount : 1;

    const maxValue = d3.sum(validBins, (d) => d.length);

    const yScale = d3
        .scalePow()
        .exponent(yAxisScale)
        .domain([0, maxValue])
        .range([innerHeight, 0]);

    noDataGroup.style("display", "none");

    inner
        .selectAll("rect")
        .data(bins, (d, idx) => idx)
        .join("rect")
        .transition()
        .duration(800)
        .attr("y", (d) => yScale(d.length || 0))
        .attr("height", (d) =>
            Math.max(0, innerHeight - yScale(d.length || 0))
        );
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
    height = containerRect.height;
    console.log("height", height);

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;
    console.log("innerHeight", innerHeight);

    const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height);

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
        .scalePow()
        .exponent(yAxisScale)
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
        .text("frequency");

    // Bars
    inner
        .selectAll("rect")
        .data(d3.range(binCount), (d, idx) => idx)
        .join("rect")
        .attr("x", (d) => x(d / binCount) + 1)
        .attr("y", (d) => innerHeight)
        .attr("width", (d) =>
            Math.max(0, x((d + 1) / binCount) - x(d / binCount) - 1)
        )
        .attr("height", (d) => 0)
        .style("fill", "#ffffff88");

    noDataGroup = inner.append("g").attr("class", "no-data-container"); // Eine Klasse für die Gruppe

    noDataGroup
        .append("text")
        .attr("class", "no-data-message")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("No data");
}

function updateYAxisScale(value) {
    yAxisScale = +value;

    document.getElementById("scaleValue").value = yAxisScale;
    document.getElementById("scaleRange").value = yAxisScale;

    const inner = d3.select(`#${containerId}`).select("svg").select("g");

    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const y = d3
        .scalePow()
        .exponent(yAxisScale)
        .domain([0, 1])
        .range([innerHeight, 0]);

    inner.select(".y-axis").remove();

    inner
        .append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickFormat(d3.format(".1f")));

    if (lastVolume) {
        updateHistogram(lastVolume);
    }
}
