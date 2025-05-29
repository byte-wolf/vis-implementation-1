// At the top of your script, or in a relevant scope
let interactivePoints = [
    { id: 'iso1', x: 0.15, y: 0.5, color: "#00FFFF", label: "Surface 1" }, // Density 0.2, Opacity 0.8, Cyan
    { id: 'iso2', x: 0.3, y: 1.0, color: "#FF00FF", label: "Surface 2" }  // Density 0.7, Opacity 0.5, Magenta
];
let draggedPoint = null; // To keep track of the point being dragged

console.log("Interactive points initialized:", interactivePoints);

let pointToColor = null;



// Add this function, or integrate into createHistogram/updateHistogram
function drawInteractivePoints(svgInner, xScale, yScale) {
    setIsoPoints(pointsToIsoSurfacePoints(interactivePoints));
    
    const pointColorPicker = document.getElementById('pointColorPicker');

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
                    pointColorPicker.style.left = `${rect.left + window.scrollX}px`;
                    pointColorPicker.style.top = `${rect.bottom + window.scrollY + 5}px`; // Position below point
                    pointColorPicker.focus();
                    pointColorPicker.click(); // Programmatically open the color picker dialog
                });

                return group;
            }
        );

    pointColorPicker.addEventListener('input', function (event) {
        console.log("Color changed to:", event.target.value);

        if (pointToColor) {
            pointToColor.color = event.target.value; // Update data

            // Find the corresponding SVG group and update its visuals
            svgInner.selectAll('.interactive-point-group')
                .filter(d_svg => d_svg.id === pointToColor.id)
                .each(function (d_svg) { // 'this' is the <g> element
                    d3.select(this).select('circle').style('fill', pointToColor.color);
                });
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
}