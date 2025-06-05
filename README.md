## How to Use


### Input file and render mode

- Load one of the provided volume files through the GUI. 
- Change the render mode using the drop down menu.
- Render modes with _TF_ can be adjusted using the transfer function above the histogram.
- Render modes with _TF*_ also use the transfer fuction, but the Iso-surface range and falloff mode can't be adjusted.

### View and camera settings

- Adjust the background color using the color picker.
- Adjust the foreground color using the color picker (only available in the MIP mode).
- Auto-rotation of the camera can be toggled via the checkbox.

### Cutting plane settings

- To use the cutting plane, first enable the cutting plane via the checkbox.
- Then, the cutting plane gets rendered in the 3D view.
- The cutting plane controls are only visible when the cutting plane is active.
- _Hidden_ makes the controls invisible, but the cutting plane is still rendered.
- _Translate_ and _Rotate_ can be used to manipulate the position of the cutting plane.
- With the checkbox, the cutting plane can be flipped so that the other side of the plane is cut.

### Histogram and transfer function settings

- With the histogram scale factor slider, the y-axis of the histogram can be scaled. (1 is equidistant steps)
- When a mode with _TF_ is selected, the iso surface range and falloff mode can be adjusted. (changes also visible in the transfer function)

### Iso points

- Up to 5 points can be added for the transfer function.
- The color can be changed by pressing on the box next to the name or directly on the point in transfer function.
- The position and intensity of the points can be adjusted by dragging directly in the transfer function interface.


## Framework Description

This framework uses three.js and d3.js for volume rendering and setting the appearance, respectively. 
The following files are provided: 
* **index.html**: contains the HTML content. Please enter your names! Otherwise, it does not need to be changed 
(but can be, if required). 
* **style.css**: CSS styles (can be adjusted, but does not need to be changed). 
* **three.js/build/three.js**: Contains the three.js library. **Do not modify!**
* **d3.js/d3.v7.js**: Contains the d3.js library. **Do not modify!**
* **shaders**: Folder containing a dummy vertex and fragment shader. **Add your shaders to this folder!** 
* **js**: Folder containing all JavaScript files. **Add new classes as separate js-files in this folder!** 
    * **vis1.js**: Main script file. Needs to be modified. 
    * **shader.js**: Base shader class. Does not need to be modified. Derive your custom shader materials from this class!
    * **testShader.js**: Example shader class demonstrating how to create and use a shader material 
    using external .essl files. Should not be used in the final submission.
    * **camera.js**: Simple orbit camera that moves nicely around our volumes. Does not need to be modified. 
    
Created 2021 by Manuela Waldner, Diana Schalko, amd Laura Luidolt based on the Vis1 Task 1 Qt framework 
initially created by Johanna Schmidt, Tobias Klein, and Laura Luidolt. Updated 2022 and 2023 by Manuela Waldner. 

## JavaScript

Javascript files should go to folder 'js' and end with '.js'. All new javascript files have to be included in index.html. 

Recommended IDE: Webstorm (free educational version available using TU Wien e-mail address)

*Important*: do not run index.html from the file system! Only execute it from inside WebStorm 
(by selecting a browser icon from the top right panel that appears when you open index.html) 
or from hosting the project within another web server. Opening index.html directly in the browser without a server
will result in an error when trying to load the the .essl shader files. 


## Shaders

.essl is the OpenGL ES shading language. Shader files should all be located in the folder 'shaders' and end with '.essl'.  

Recommended code editor: Visual Studio Code (free): https://code.visualstudio.com/

Install syntax highlighting for shading languages: https://marketplace.visualstudio.com/items?itemName=slevesque.shader

Enable syntax highlighting: open shader file --> in the bar on the bottom right, switch from plain text to GLSL.  