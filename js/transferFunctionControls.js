/* let interactivePoints = [
    { id: 'iso1', x: 0.15, y: 0.5, color: "#ff8f6a", label: "Surface 1" }, // Density 0.2, Opacity 0.8, Cyan
    { id: 'iso2', x: 0.3, y: 1.0, color: "#F9F6EE", label: "Surface 2" }  // Density 0.7, Opacity 0.5, Magenta
]; */
let interactivePoints = [
    { id: "iso1", x: 0.1, y: 0.5, color: "#ff8246" }, // Orange
    { id: "iso2", x: 0.3, y: 1.0, color: "#ffffff" }, // White
    { id: "iso3", x: 0.48, y: 0.5, color: "#0000ff" }, // Blue
];
let draggedPoint = null;
let pointToColor = null;
let currentIsoRange = 0.05;
let rangeIndicatorsVisible = true;

/**
 * Draw the interactive points and the range indicators based on the current iso points.
 * @param {d3.Selection} svgInner - The svg element.
 * @param {d3.ScaleLinear} xScale - The x scale.
 * @param {d3.ScaleLinear} yScale - The y scale.
 */
function drawInteractivePoints(svgInner, xScale, yScale) {
    window.svgInner = svgInner;
    window.xScale = xScale;
    window.yScale = yScale;

    const pointColorPicker = document.getElementById("pointColorPicker");

    setIsoPoints(pointsToIsoSurfacePoints(interactivePoints));

    // Range indicators
    let rangeContainer = svgInner.select(".iso-ranges-container");
    if (rangeContainer.empty()) {
        rangeContainer = svgInner
            .insert("g", ":first-child")
            .attr("class", "iso-ranges-container");
    }

    const rangeGroup = rangeContainer
        .selectAll(".iso-range-group")
        .data(interactivePoints, (d) => d.id + "-range")
        .join((enter) => {
            const group = enter.append("g").attr("class", "iso-range-group");

            // Add rectangle for binary mode
            group
                .append("rect")
                .attr("class", "iso-range-indicator-rect")
                .style("fill", (d) => d.color)
                .style("opacity", 0.15)
                .style("stroke", (d) => d.color)
                .style("stroke-width", 1)
                .style("stroke-opacity", 0.3);

            // Add triangle/polygon for linear mode
            group
                .append("polygon")
                .attr("class", "iso-range-indicator-triangle")
                .style("fill", (d) => d.color)
                .style("opacity", 0.15)
                .style("stroke", (d) => d.color)
                .style("stroke-width", 1)
                .style("stroke-opacity", 0.3);

            return group;
        });

    updateRangeIndicators(rangeGroup);

    const pointsGroup = svgInner
        .selectAll(".interactive-point-group")
        .data(interactivePoints, (d) => d.id)
        .join((enter) => {
            const group = enter
                .append("g")
                .attr("class", "interactive-point-group")
                .style("cursor", "grab");

            group
                .append("line")
                .attr("class", "point-to-axis-line")
                .style("stroke", (d) => "#ffffffaa")
                .style("stroke-width", 2);

            group
                .append("circle")
                .attr("class", "interactive-point")
                .attr("r", 8)
                .style("fill", (d) => d.color)
                .style("stroke", "white")
                .style("stroke-width", 2);

            group.on("click", function (event, d) {
                event.stopPropagation();

                pointToColor = d;

                pointColorPicker.value = d.color;
                pointColorPicker.focus();
                pointColorPicker.click();
            });

            return group;
        });

    pointColorPicker.addEventListener("input", onPointColorPickerInput);

    // Apply initial positions and line attributes
    updatePointVisuals(pointsGroup);

    const dragHandler = d3
        .drag()
        .on("start", function (event, d) {
            draggedPoint = d;
            d3.select(this).raise().style("cursor", "grabbing");

            d3.select(this)
                .select("circle")
                .transition()
                .duration(100)
                .attr("r", 10);

            d3.select(this)
                .select("line")
                .style("stroke", "#ffffffff")
                .attr("stroke-width", 1);
        })
        .on("drag", function (event, d) {
            const [mouseX, mouseY] = d3.pointer(event, svgInner.node());

            d.x = clamp(
                xScale.invert(mouseX),
                xScale.domain()[0],
                xScale.domain()[1]
            );
            d.y = clamp(
                yScale.invert(mouseY),
                yScale.domain()[0],
                yScale.domain()[1]
            );

            // Update the visual position
            updatePointVisuals(d3.select(this));

            // Update the corresponding range indicator
            updateRangeIndicators(
                rangeGroup.filter((range_d) => range_d.id === d.id)
            );

            onPointUpdate();
        })
        .on("end", function (event, d) {
            draggedPoint = null;
            d3.select(this).style("cursor", "grab");
            d3.select(this)
                .select("circle")
                .transition()
                .duration(100)
                .attr("r", 8);
            d3.select(this)
                .select("line")
                .style("stroke", "#ffffffaa")
                .attr("stroke-width", 2);

            onPointUpdate();
        });

    pointsGroup.call(dragHandler);
}

/**
 * Update the visuals of the point.
 * @param {d3.Selection} selection - The selection of the point.
 */
function updatePointVisuals(selection) {
    selection.attr(
        "transform",
        (d) => `translate(${xScale(d.x)}, ${yScale(d.y)})`
    );

    selection
        .select(".point-to-axis-line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", (d) => yScale(yScale.domain()[0]) - yScale(d.y));
}

/**
 * Update the iso surface color when the value of the color picker changes.
 * @param {Event} event - The event of the color input.
 */
function onPointColorPickerInput(event) {
    if (pointToColor) {
        pointToColor.color = event.target.value;

        svgInner
            .selectAll(".interactive-point-group")
            .filter((d_svg) => d_svg.id === pointToColor.id)
            .each(function () {
                d3.select(this)
                    .select("circle")
                    .style("fill", pointToColor.color);
            });

        svgInner
            .selectAll(".iso-range-group")
            .filter((d_svg) => d_svg.id === pointToColor.id)
            .each(function () {
                d3.select(this)
                    .select(".iso-range-indicator-rect")
                    .style("fill", pointToColor.color)
                    .style("stroke", pointToColor.color);
                d3.select(this)
                    .select(".iso-range-indicator-triangle")
                    .style("fill", pointToColor.color)
                    .style("stroke", pointToColor.color);
            });

        onPointUpdate();
    }
}

/**
 * Update the range indicators of the iso surfaces.
 */
function updateRangeIndicators() {
    if (window.svgInner === undefined) {
        return;
    }

    const isLinearMode =
        isoFalloffMode !== undefined ? isoFalloffMode === 0 : true;

    const showRangeIndicators = rangeIndicatorsVisible;

    // Update rectangle (for binary mode)
    const currentRangeGroup = window.svgInner
        .select(".iso-ranges-container")
        .selectAll(".iso-range-group");

    currentRangeGroup
        .select(".iso-range-indicator-rect")
        .attr("x", (d) => {
            const leftBound = Math.max(0, xScale(d.x - currentIsoRange));
            return leftBound;
        })
        .attr("y", (d) => yScale(d.y))
        .attr("width", (d) => {
            const leftBound = Math.max(0, xScale(d.x - currentIsoRange));
            const rightBound = Math.min(
                xScale.range()[1],
                xScale(d.x + currentIsoRange)
            );
            return Math.max(0, rightBound - leftBound);
        })
        .attr("height", (d) => yScale.range()[0] - yScale(d.y))
        .style(
            "display",
            !showRangeIndicators || isLinearMode ? "none" : "block"
        );

    // Update triangle (for linear mode)
    currentRangeGroup
        .select(".iso-range-indicator-triangle")
        .attr("points", (d) => {
            const pointX = xScale(d.x);
            const pointY = yScale(d.y);
            const leftBound = Math.max(0, xScale(d.x - currentIsoRange));
            const rightBound = Math.min(
                xScale.range()[1],
                xScale(d.x + currentIsoRange)
            );
            const bottomY = yScale.range()[0];

            // Create triangle points: peak at iso point, base at bottom
            return `${pointX},${pointY} ${leftBound},${bottomY} ${rightBound},${bottomY}`;
        })
        .style(
            "display",
            !showRangeIndicators || !isLinearMode ? "none" : "block"
        );
}

/**
 * Clamp a value between a minimum and maximum value.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Convert the list of points to the format expected by the iso surface shader.
 * @param {{x: number, y: number, color: string}[]} points
 * @returns {{x: number, y: number, color: number[]}[]}
 */
function pointsToIsoSurfacePoints(points) {
    return points.map((p) => ({
        x: p.x,
        y: p.y,
        color: hexToRgbArray(p.color),
    }));
}

/**
 * Pass the iso surfaces to the shader and update the transfer function UI.
 */
function onPointUpdate() {
    setIsoPoints(pointsToIsoSurfacePoints(interactivePoints));
    updateTransferFunctionUniforms();

    renderIsoPointsList();

    updateRangeIndicators();
}

/**
 * Render the iso points list UI.
 */
function renderIsoPointsList() {
    const container = document.getElementById("isoPointsList");
    if (!container) return;

    container.innerHTML = "";

    interactivePoints.forEach((point, index) => {
        const pointItem = document.createElement("div");
        pointItem.className = "iso-point-item";
        pointItem.innerHTML = `
            <div class="iso-point-info">
                <div class="iso-point-color" style="background-color: ${point.color
            }; cursor: pointer;" data-point-id="${point.id}"></div>
                <div class="iso-point-info-container">
                    <div class="iso-point-label">Surface ${index + 1}</div>
                    <div class="iso-point-coords">x: ${point.x.toFixed(
                2
            )}, y: ${point.y.toFixed(2)}</div>
                </div>
            </div>
            <button type="button" class="iso-point-remove" data-point-id="${point.id
            }" ${interactivePoints.length <= 1 ? "disabled" : ""}>
                X
            </button>
        `;

        pointItem
            .querySelector(".iso-point-color")
            .addEventListener("click", onColorIndicatorClick);

        pointItem
            .querySelector(".iso-point-remove")
            .addEventListener("click", onRemoveButtonClick);

        container.appendChild(pointItem);
    });

    const addButton = document.querySelector(".iso-point-add-button");
    const pointsCount = document.getElementById("isoPointsCount");

    // Enable/disable the add button based on the number of points
    if (addButton) {
        if (interactivePoints.length >= 5) {
            addButton.disabled = true;
        } else {
            addButton.disabled = false;
        }
        addButton.textContent = "Add Point";
    }

    if (pointsCount) {
        pointsCount.textContent = `${interactivePoints.length}/5`;
    }
}

/**
 * Clicking the color indicator opens the color picker.
 */
function onColorIndicatorClick(event) {
    event.stopPropagation();

    const pointId = this.getAttribute("data-point-id");
    const clickedPoint = interactivePoints.find((p) => p.id === pointId);

    if (clickedPoint) {
        const pointColorPicker = document.getElementById("pointColorPicker");
        pointToColor = clickedPoint;
        pointColorPicker.value = clickedPoint.color;
        pointColorPicker.focus();
        pointColorPicker.click();
    }
}

/**
 * Clicking the remove button removes the iso point.
 */
function onRemoveButtonClick(event) {
    const pointId = this.getAttribute("data-point-id");
    removeIsoPoint(pointId);
}

/**
 * Add a new iso point with default values.
 */
function addIsoPoint() {
    if (interactivePoints.length >= 5) {
        return;
    }

    const newId = "iso" + (Date.now() % 10000);
    const colors = [
        "#ff6b6b",
        "#4ecdc4",
        "#45b7d1",
        "#96ceb4",
        "#feca57",
        "#ff9ff3",
        "#54a0ff",
        "#5f27cd",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPoint = {
        id: newId,
        x: 0.5,
        y: 0.5,
        color: randomColor,
    };

    interactivePoints.push(newPoint);

    onPointUpdate();

    if (window.svgInner && window.xScale && window.yScale) {
        drawInteractivePoints(window.svgInner, window.xScale, window.yScale);
    }
}

/**
 * Remove an iso point from the list.
 * @param {string} pointId - The id of the point to remove.
 */
function removeIsoPoint(pointId) {
    if (interactivePoints.length <= 1) {
        return;
    }

    const pointIndex = interactivePoints.findIndex((p) => p.id === pointId);
    if (pointIndex !== -1) {
        interactivePoints.splice(pointIndex, 1);

        renderIsoPointsList();
        onPointUpdate();

        if (window.svgInner && window.xScale && window.yScale) {
            drawInteractivePoints(
                window.svgInner,
                window.xScale,
                window.yScale
            );
        }
    }
}

/**
 * Update the iso range.
 * @param {string} value - The value of the iso range.
 */
function updateIsoRange(value) {
    currentIsoRange = parseFloat(value);

    document.getElementById("isoRangeValue").value = currentIsoRange;
    document.getElementById("isoRangeInput").value = currentIsoRange;

    updateRangeIndicators();
    updateTransferFunctionUniforms();
}
