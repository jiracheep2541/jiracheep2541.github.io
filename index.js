import { Color } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';

function CreateViewer(container) {
    let viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
    viewer.axes.setAxes();
    viewer.grid.setGrid();

    return viewer;
}



const container = document.getElementById('viewer-container');
let viewer = CreateViewer(container);

// viewer.IFC.loader.ifcManager.applyWebIfcConfig({
//     USE_FAST_BOOLS: true,
//     COORDINATE_TO_ORIGIN: true
// });


// console.log('viewer', viewer.axes.dispose())

const input = document.getElementById("file-input");

const handleKeyDown = async(event) => {
    if (event.code === 'Escape') {
        try {

            viewer.clipper.deleteAllPlanes();
            viewer.clipper.planes = [];
        } catch {}

    }
}


window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
// Select items and log properties
window.onkeydown = handleKeyDown;

window.ondblclick = async() => {

    if (viewer.clipper.active) {
        viewer.clipper.createPlane();
    }

}

input.addEventListener("change",

    async(changed) => {

        const file = changed.target.files[0];
        const ifcURL = URL.createObjectURL(file);
        loadIfc(ifcURL);
    },

    false
);

async function loadIfc(url) {
    await viewer.dispose();
    viewer = CreateViewer(container);
    // await viewer.IFC.setWasmPath("static/wasm/");
    const model = await viewer.IFC.loadIfcUrl(url);
    viewer.shadowDropper.renderShadow(model.modelID);

    viewer.clipper.toggle();

    // viewer.axes.dispose();
    // viewer.grid.dispose();
}

loadIfc('models/Walkers.ifc');

// window.onkeydown = (event) => {
//     if (event.code === 'KeyP') {
//         viewer.clipper.createPlane();
//     } else if (event.code === 'KeyO') {
//         viewer.clipper.deletePlane();
//     } else if (event.code === 'Escape') {
//         viewer.IFC.selector.unpickIfcItems();
//     }
// }