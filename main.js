import { IfcViewerAPI } from 'web-ifc-viewer';
import { Color } from 'three';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(255, 255, 255) });
// viewer.axes.setAxes();
// viewer.grid.setGrid();
// viewer.shadowDropper.darkness = 1.5;

// Set up stats
viewer.context.ifcCamera.cameraControls

const manager = viewer.IFC.loader.ifcManager;


// viewer.IFC.loader.ifcManager.useWebWorkers(true, 'files/IFCWorker.js');
viewer.IFC.setWasmPath('files/');


// Setup loader

// const lineMaterial = new LineBasicMaterial({ color: 0x555555 });
// const baseMaterial = new MeshBasicMaterial({ color: 0xffffff, side: 2 });

let model;

async function loadIfc(url) {

    model = await viewer.IFC.loadIfcUrl(url);
    await viewer.shadowDropper.renderShadow(model.modelID);
    viewer.clipper.toggle();

};

loadIfc('models/Walkers.ifc');

const inputElement = document.createElement('input');
inputElement.setAttribute('type', 'file');
inputElement.classList.add('hidden');
// inputElement.addEventListener('change', loadIfc, false);

const handleKeyDown = async(event) => {
    if (event.code === 'Delete') {
        viewer.clipper.deletePlane();
        viewer.dimensions.delete();
    }
    if (event.code === 'Escape') {
        viewer.IFC.selector.unHighlightIfcItems();
    }
    if (event.code === 'KeyC') {
        viewer.context.ifcCamera.toggleProjection();
    }
    if (event.code === 'KeyD') {
        viewer.IFC.removeIfcModel(0);
    }
};

window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
window.onkeydown = handleKeyDown;
window.ondblclick = async() => {

    // if (viewer.clipper.active) {
    viewer.clipper.createPlane();

};