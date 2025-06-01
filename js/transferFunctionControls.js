// At the top of your script, or in a relevant scope
let interactivePoints = [
    { id: 'iso1', x: 0.15, y: 0.5, color: "#ff8f6a", label: "Surface 1" }, // Density 0.2, Opacity 0.8, Cyan
    { id: 'iso2', x: 0.3, y: 1.0, color: "#F9F6EE", label: "Surface 2" }  // Density 0.7, Opacity 0.5, Magenta
];
let draggedPoint = null; // To keep track of the point being dragged

let pointToColor = null;

// Global variable to track iso-range
let currentIsoRange = 0.05;

// Add this function, or integrate into createHistogram/updateHistogram
function drawInteractivePoints(svgInner, xScale, yScale) {
    // Store references globally for later use
    window.svgInner = svgInner;
    window.xScale = xScale;
    window.yScale = yScale;

    setIsoPoints(pointsToIsoSurfacePoints(interactivePoints));

    const pointColorPicker = document.getElementById('pointColorPicker');

    // Create a dedicated container for iso-range indicators (below everything else)
    let rangeContainer = svgInner.select('.iso-ranges-container');
    if (rangeContainer.empty()) {
        rangeContainer = svgInner.insert('g', ':first-child')
            .attr('class', 'iso-ranges-container');
    }

    // Draw iso-range indicators first (so they appear behind the points)
    const rangeGroup = rangeContainer.selectAll('.iso-range-group')
        .data(interactivePoints, d => d.id + '-range')
        .join(
            enter => {
                const group = enter.append('g')
                    .attr('class', 'iso-range-group');

                group.append('rect')
                    .attr('class', 'iso-range-indicator')
                    .style('fill', d => d.color)
                    .style('opacity', 0.15)
                    .style('stroke', d => d.color)
                    .style('stroke-width', 1)
                    .style('stroke-opacity', 0.3);

                return group;
            }
        );

    // Function to update range indicators
    function updateRangeIndicators(selection) {
        selection.select('.iso-range-indicator')
            .attr('x', d => {
                const leftBound = Math.max(0, xScale(d.x - currentIsoRange));
                return leftBound;
            })
            .attr('y', 0) // Full height from top
            .attr('width', d => {
                const leftBound = Math.max(0, xScale(d.x - currentIsoRange));
                const rightBound = Math.min(xScale.range()[1], xScale(d.x + currentIsoRange));
                return Math.max(0, rightBound - leftBound);
            })
            .attr('height', yScale.range()[0]); // Full height of the chart
    }

    // Apply initial range indicators
    updateRangeIndicators(rangeGroup);

    const pointsGroup = svgInner.selectAll('.interactive-point-group')
        .data(interactivePoints, d => d.id)
        .join(
            enter => {
                const group = enter.append('g')
                    .attr('class', 'interactive-point-group')
                    .style('cursor', 'grab'); // Indicate draggability

                group.append('line')
                    .attr('class', 'point-to-axis-line')
                    .style('stroke', d => '#ffffffaa') // Or a fixed color like 'gray'
                    .style('stroke-width', 2);

                group.append('circle')
                    .attr('class', 'interactive-point')
                    .attr('r', 8) // Radius of the point
                    .style('fill', d => d.color)
                    .style('stroke', 'white')
                    .style('stroke-width', 2);

                group.on('click', function (event, d) {
                    event.stopPropagation(); // Important if also using drag on the same element

                    pointToColor = d; // Store the data object of the clicked point
                    const circleElement = d3.select(this).select('circle').node();
                    const rect = circleElement.getBoundingClientRect();

                    pointColorPicker.value = d.color; // Set current color
                    pointColorPicker.focus();
                    pointColorPicker.click(); // Programmatically open the color picker dialog
                });

                return group;
            }
        );

    pointColorPicker.addEventListener('input', function (event) {
        if (pointToColor) {
            pointToColor.color = event.target.value; // Update data

            // Find the corresponding SVG group and update its visuals
            svgInner.selectAll('.interactive-point-group')
                .filter(d_svg => d_svg.id === pointToColor.id)
                .each(function (d_svg) { // 'this' is the <g> element
                    d3.select(this).select('circle').style('fill', pointToColor.color);
                });

            svgInner.selectAll('.iso-range-group')
                .filter(d_svg => d_svg.id === pointToColor.id)
                .select('.iso-range-indicator')
                .style('fill', pointToColor.color)
                .style('stroke', pointToColor.color);

            onPointUpdate();
        }
    });

    // Function to update both group transform and line attributes
    function updatePointVisuals(selection) {
        selection.attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`);

        selection.select('.point-to-axis-line')
            .attr('x1', 0) // Relative to the group's new position
            .attr('y1', 0) // Relative to the group's new position
            .attr('x2', 0) // Stays vertical
            .attr('y2', d => {
                // yScale.domain()[0] is the data value for y=0 (e.g., 0)
                // yScale(yScale.domain()[0]) is the screen y-coordinate of the x-axis
                // yScale(d.y) is the screen y-coordinate of the point
                // The difference is the length of the line in screen units
                return yScale(yScale.domain()[0]) - yScale(d.y);
            });
    }

    // Apply initial positions and line attributes
    updatePointVisuals(pointsGroup);

    // Add drag behavior
    const dragHandler = d3.drag()
        .on('start', function (event, d) {
            draggedPoint = d;
            d3.select(this).raise().style('cursor', 'grabbing'); // Bring to front and change cursor
            // Optionally, make the active point slightly larger or change its appearance
            d3.select(this).select('circle').transition().duration(100).attr('r', 10);
            d3.select(this).select('line').style('stroke', '#ffffffff').attr('stroke-width', 1); // Highlight the line
        })
        .on('drag', function (event, d) {
            // Convert mouse position back to data coordinates
            // d3.pointer(event, svgInner.node()) gives [x, y] relative to svgInner
            const [mouseX, mouseY] = d3.pointer(event, svgInner.node());

            // Clamp values to stay within the domain of your scales
            d.x = clamp(xScale.invert(mouseX), xScale.domain()[0], xScale.domain()[1]);
            d.y = clamp(yScale.invert(mouseY), yScale.domain()[0], yScale.domain()[1]);

            // Update the visual position
            updatePointVisuals(d3.select(this));

            // Update the corresponding range indicator
            updateRangeIndicators(rangeGroup.filter(range_d => range_d.id === d.id));

            // --- YOUR CONFIGURATION LOGIC HERE ---
            // This is where you'd call a function to update whatever these points control
            // For example: updateTransferFunction(interactivePoints);
            //console.log(`Point ${d.id} dragged to: x=${d.x.toFixed(2)}, y=${d.y.toFixed(2)}`);
            onPointUpdate(); // Call a general update function
        })
        .on('end', function (event, d) {
            draggedPoint = null;
            d3.select(this).style('cursor', 'grab');
            d3.select(this).select('circle').transition().duration(100).attr('r', 8);
            d3.select(this).select('line').style('stroke', '#ffffffaa').attr('stroke-width', 2); // Highlight the line
            // --- FINAL UPDATE ---
            onPointUpdate();
        });

    pointsGroup.call(dragHandler);

    window.updateRangeIndicators = function () {
        if (window.svgInner) {
            const rangeContainer = window.svgInner.select('.iso-ranges-container');
            const currentRangeGroup = rangeContainer.selectAll('.iso-range-group');
            updateRangeIndicators(currentRangeGroup);
        }
    };
}

// Helper clamp function
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function pointsToIsoSurfacePoints(points) {
    return points.map(p => ({ x: p.x, y: p.y, color: hexToRgbArray(p.color) }));
}

// Placeholder for your logic that uses the points
function onPointUpdate() {
    // Example: get the current values of all points
    // Here you would trigger updates to your shaders, other UI elements, etc.
    // For example, if these points define a transfer function for volume rendering:
    // updateShaderWithTransferFunction(currentPointValues);
    setIsoPoints(pointsToIsoSurfacePoints(interactivePoints));
    updateTransferFunctionUniforms();

    // Update the iso points list UI
    renderIsoPointsList();
}

function renderIsoPointsList() {
    const container = document.getElementById('isoPointsList');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Render each iso point
    interactivePoints.forEach((point, index) => {
        const pointItem = document.createElement('div');
        pointItem.className = 'iso-point-item';
        pointItem.innerHTML = `
            <div class="iso-point-info">
                <div class="iso-point-color" style="background-color: ${point.color}; cursor: pointer;" data-point-id="${point.id}"></div>
                <div class="iso-point-info-container">
                    <div class="iso-point-label">${point.label}</div>
                    <div class="iso-point-coords">x: ${point.x.toFixed(2)}, y: ${point.y.toFixed(2)}</div>
                </div>
            </div>
            <button class="iso-point-remove" onclick="removeIsoPoint('${point.id}')" ${interactivePoints.length <= 1 ? 'disabled' : ''}>
                X
            </button>
        `;

        // Add click handler to the color indicator
        const colorIndicator = pointItem.querySelector('.iso-point-color');
        colorIndicator.addEventListener('click', function (event) {
            event.stopPropagation();

            // Find the point data
            const pointId = this.getAttribute('data-point-id');
            const clickedPoint = interactivePoints.find(p => p.id === pointId);

            if (clickedPoint) {
                const pointColorPicker = document.getElementById('pointColorPicker');
                pointToColor = clickedPoint; // Set the global variable used by the color picker
                pointColorPicker.value = clickedPoint.color; // Set current color
                pointColorPicker.focus();
                pointColorPicker.click(); // Programmatically open the color picker dialog
            }
        });

        container.appendChild(pointItem);
    });

    // Update the add button state based on the current number of points
    const addButton = document.querySelector('.iso-point-add-button');
    const pointsCount = document.getElementById('isoPointsCount');

    if (addButton) {
        if (interactivePoints.length >= 5) {
            addButton.disabled = true;
        } else {
            addButton.disabled = false;
        }
        addButton.textContent = 'Add Point';
    }

    if (pointsCount) {
        pointsCount.textContent = `${interactivePoints.length}/5`;
    }
}

// Function to renumber all points sequentially
function renumberIsoPoints() {
    interactivePoints.forEach((point, index) => {
        point.label = `Surface ${index + 1}`;
    });
}

// Function to add a new iso point
function addIsoPoint() {
    if (interactivePoints.length >= 5) {
        return;
    }

    // Generate a unique ID
    const newId = 'iso' + (Date.now() % 10000);

    // Generate a vibrant random color
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Create a new point with default values
    const newPoint = {
        id: newId,
        x: 0.5, // Default x position (middle)
        y: 0.5, // Default y position (middle)
        color: randomColor,
        label: `Surface ${interactivePoints.length + 1}`
    };

    // Add to the array
    interactivePoints.push(newPoint);

    // Update the UI and visualization
    renderIsoPointsList();
    onPointUpdate();

    // If histogram is already created, redraw interactive points
    if (window.svgInner && window.xScale && window.yScale) {
        drawInteractivePoints(window.svgInner, window.xScale, window.yScale);
    }
}

// Function to remove an iso point
function removeIsoPoint(pointId) {
    // Ensure we don't remove the last point
    if (interactivePoints.length <= 1) {
        alert('Cannot remove the last iso point. At least one point must remain.');
        return;
    }

    // Find and remove the point
    const pointIndex = interactivePoints.findIndex(p => p.id === pointId);
    if (pointIndex !== -1) {
        interactivePoints.splice(pointIndex, 1);

        // Renumber all remaining points to maintain sequential order
        renumberIsoPoints();

        // Update the UI and visualization
        renderIsoPointsList();
        onPointUpdate();

        // If histogram is already created, redraw interactive points
        if (window.svgInner && window.xScale && window.yScale) {
            drawInteractivePoints(window.svgInner, window.xScale, window.yScale);
        }
    }
}

// Function to update iso-range value and visual representation
function updateIsoRange(value) {
    currentIsoRange = parseFloat(value);

    // Update the UI inputs to stay in sync
    document.getElementById("isoRangeValue").value = currentIsoRange;
    document.getElementById("isoRangeInput").value = currentIsoRange;

    // Update visual indicators if they exist
    if (window.updateRangeIndicators) {
        window.updateRangeIndicators();
    }

    // Update shader uniforms
    updateTransferFunctionUniforms();
}