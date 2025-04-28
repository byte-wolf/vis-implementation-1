/**
 * Erstellt ein Histogramm der Voxel-Intensitäten mit D3.js.
 * @param {Volume} volume - Das Volume-Objekt mit den .voxels Daten.
 * @param {string} containerId - Die ID des HTML-Elements, in das gezeichnet werden soll.
 * @param {number} [numBins=100] - Die ungefähre Anzahl der Bins für das Histogramm.
 */
function createHistogram(volume, containerId, numBins = 100) {
    if (!volume || !volume.voxels || volume.voxels.length === 0) {
        console.warn("Histogramm: Keine Voxeldaten zum Verarbeiten vorhanden.");
        // Optional: Alten Inhalt löschen
        d3.select(`#${containerId}`).select("svg").remove();
        return;
    }

    const data = volume.voxels;

    const container = d3.select(`#${containerId}`);

    container.select("svg").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const containerRect = container.node().getBoundingClientRect();
    const width = containerRect.width - margin.left - margin.right;
    const height = containerRect.height - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const boundedG = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
        .scaleLinear()
        .domain([0, 1]) // Dein Datenbereich ist 0 bis 1
        .range([0, width])
        .nice();

    const histogramLayout = d3
        .histogram()
        .value((d) => d) // Zugriff auf den Wert selbst
        .domain(xScale.domain()) // Definiert den Wertebereich
        .thresholds(xScale.ticks(numBins)); // Berechnet Bin-Grenzen basierend auf der Skala

    const bins = histogramLayout(data);

    const validBins = bins.filter((b) => typeof b.length === "number");

    const maxBinCount = d3.max(validBins, (d) => d.length);

    const effectiveMaxCount = maxBinCount > 0 ? maxBinCount : 1;

    // Skala für die HÖHE der BALKEN (basiert auf tatsächlicher Häufigkeit)
    const yBarScale = d3
        .scaleSqrt()
        .domain([0, effectiveMaxCount]) // Domain: 0 bis zur max. tatsächlichen Häufigkeit
        .range([height, 0]); // Range: Volle Pixelhöhe

    const yAxisScale = d3.scaleSqrt().domain([0, 1]).range([height, 0]);

    boundedG
        .selectAll("rect")
        .data(bins)
        .join("rect") // Kurzform für enter().append().merge()
        .attr("x", (d) => xScale(d.x0) + 1) // +1 für kleinen Abstand
        .attr("width", (d) => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1)) // -1 für Abstand, max(0,...) gegen negative Breite
        .attr("y", (d) => yBarScale(d.length || 0)) // || 0 für leere Bins
        .attr("height", (d) => Math.max(0, height - yBarScale(d.length || 0))) // || 0 für leere Bins
        .style("fill", "#ffffffaa");

    const xAxisGenerator = d3.axisBottom(xScale).ticks(5); // Anzahl Ticks anpassen

    boundedG
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxisGenerator);

    /* const yAxisGenerator = d3
        .axisLeft(yScale)
        // Formatiert große Zahlen (z.B. 10000 -> 10k)
        .tickFormat(d3.format(".2s"))
        .ticks(5);
    boundedG.append("g").attr("class", "y-axis").call(yAxisGenerator);
 */
    const yAxisGenerator = d3
        .axisLeft(yAxisScale)
        .ticks(5) // Anzahl der Ticks auf der 0-1 Skala
        .tickFormat(d3.format(".1f")); // Zeige eine Nachkommastelle (0.0, 0.2, ...)
    boundedG.append("g").attr("class", "y-axis").call(yAxisGenerator);

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.top + margin.bottom - 10) // Unterhalb der Achse
        .style("font-size", "12px")
        .text("density");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -(margin.top + height / 2))
        .attr("y", margin.left / 2 - 10) // Links neben der Achse
        .style("font-size", "12px")
        .text("intensity");
}
