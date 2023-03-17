import { IfcViewerAPI } from 'web-ifc-viewer';
import {
    MeshBasicMaterial,
    LineBasicMaterial,
    Color,
    Vector2,
    DepthTexture,
    WebGLRenderTarget,
    Material,
    BufferGeometry,
    BufferAttribute,
    Mesh,
    Raycaster,
    MeshLambertMaterial
} from 'three';

import {
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCDOOR,
    IFCWINDOW,
    IFCFURNISHINGELEMENT,
    IFCMEMBER,
    IFCPLATE
} from 'web-ifc';
import {
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree,
} from 'three-mesh-bvh';

import * as dat from 'dat.gui';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitControlsGizmo } from "three/examples/jsm/controls/OrbitControlsGizmo.js";

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(255, 255, 255) });
// viewer.axes.setAxes();
// viewer.grid.setGrid();
// viewer.shadowDropper.darkness = 1.5;

// Set up stats

// const fov = 45;
// const aspect = window.innerWidth / window.innerHeight; // the canvas default
// const near = 0.25;
// const far = 20;

var camera = viewer.IFC.context.getCamera();
var renderer = viewer.IFC.context.getRenderer();
var controls = viewer.context.ifcCamera.cameraControls;

// var controlsGizmo = new OrbitControlsGizmo(controls, { size: 100, padding: 8 });

// console.log('OKJKJKJKJKJKKKKKKKKKKKKK', controlsGizmo)

// const OrbitControls = new OrbitControls(camera, renderer.domElement);

// viewer.context.ifcCamera.cameraControls.enabled = false;

// camera.fov = fov;
// camera.aspect = aspect;
// camera.near = near;
// camera.far = far;
// camera.position.set(-1.8, 0.6, 2.7);
// camera.updateProjectionMatrix();

var ck = true;

var GUIControl = {
    get fov() {
        return camera.fov;
    },
    set fov(value) {
        camera.fov = value;
        camera.updateProjectionMatrix();
    },
    get near() {
        return camera.near;
    },
    set near(value) {
        camera.near = value;
        camera.updateProjectionMatrix();
    },
    get far() {
        return camera.far;
    },
    set far(value) {
        camera.far = value;
        camera.updateProjectionMatrix();
    },
    get checkbox() {
        return ck;
    },
    set checkbox(value) {
        ck = ck ? false : true;
    }
}

const gui1 = new dat.GUI();

gui1.domElement.style.position = 'absolute';
gui1.domElement.style.top = '15px';
gui1.domElement.style.right = '0';

const folder_camera = gui1.addFolder('Camera');
folder_camera.add(GUIControl, 'fov', 0, 50);
folder_camera.add(GUIControl, 'near', 0, 50);
folder_camera.add(GUIControl, 'far', 0, 50);
folder_camera.open();


// folder_models.add(GUIControl, 'autoRotate');
// folder_models.open();

// const folder_OrbitControls = gui.addFolder('OrbitControls');
// folder_OrbitControls.add(GUIControl, 'minDistance', 0, 50);
// folder_OrbitControls.add(GUIControl, 'maxDistance', 0, 100);
// folder_OrbitControls.open();

// viewer.context.ifcCamera.perspectiveCamera.fov = fov;
// viewer.context.ifcCamera.perspectiveCamera.aspect = aspect;
// viewer.context.ifcCamera.perspectiveCamera.near = near;
// viewer.context.ifcCamera.perspectiveCamera.far = far;
// viewer.context.ifcCamera.perspectiveCamera.position.set(-1.8, 0.6, 2.7);

// viewer.context.ifcCamera.cameraControls.minDistance = 2;
// viewer.context.ifcCamera.cameraControls.maxDistance = 10;
// viewer.context.ifcCamera.cameraControls.setTarget(0, 0, -0.2);
// viewer.context.ifcCamera.cameraControls.update();

const manager = viewer.IFC.loader.ifcManager;


// viewer.IFC.loader.ifcManager.useWebWorkers(true, 'files/IFCWorker.js');
viewer.IFC.setWasmPath('files/');


// Setup loader

// const lineMaterial = new LineBasicMaterial({ color: 0x555555 });
// const baseMaterial = new MeshBasicMaterial({ color: 0xffffff, side: 2 });

let model, modelID, scene;

async function loadIfc(url) {

    model = await viewer.IFC.loadIfcUrl(url);

    viewer.IFC.loader.ifcManager.setupThreeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);

    model.removeFromParent();

    await viewer.shadowDropper.renderShadow(model.modelID);
    viewer.clipper.toggle();

    const manager = viewer.IFC.loader.ifcManager;
    scene = viewer.IFC.context.getScene();



    modelID = viewer.IFC.getModelID();
    const ifcProject = await manager.getSpatialStructure(modelID, true);

    function flatten(arr) {
        return arr.reduce((acc, { expressID, type, children }) => {
            const childArr = children.length ? flatten(children) : [];
            return [...acc, type, ...childArr];
        }, []);
    }

    const flatArr = flatten([ifcProject]);
    const array2 = [...new Set(flatArr)];

    const array1 = manager.typesMap;

    const makeTypesMap = {};

    for (const key in array1) {
        if (array2.includes(array1[key])) {
            makeTypesMap[array1[key]] = Number(key);
        }
    }

    // Sets up optimized picking


    // let typesMap = manager.typesMap;
    // let keyMap = Object.keys(typesMap);

    // let cc = {};
    // for (let i in keyMap) {
    //     cc[typesMap[keyMap[i]]] = Number(keyMap[i]);
    // }

    // List of categories names
    const categories = makeTypesMap;

    console.log('scene', categories)

    // Gets the name of a category
    function getName(category) {
        const names = Object.keys(categories);
        return names.find(name => categories[name] === category);
    }

    // Gets all the items of a category
    async function getAll(category) {
        return manager.getAllItemsOfType(0, category, false);
    }

    // Creates a new subset containing all elements of a category
    async function newSubsetOfType(category) {
        const ids = await getAll(category);
        return manager.createSubset({ modelID: 0, scene, ids, removePrevious: true, customID: category.toString() });
    }

    // Stores the created subsets
    const subsets = {};

    async function setupAllCategories() {
        const allCategories = Object.values(categories);
        for (let i = 0; i < allCategories.length; i++) {
            const category = allCategories[i];
            await setupCategory(category);
        }
    }

    // Creates a new subset and configures the checkbox
    async function setupCategory(category) {
        subsets[category] = await newSubsetOfType(category);
        setupCheckBox(category);
    }

    function setupCheckBox(category) {
        const name = getName(category);
        // const checkBox = document.getElementById(name);
        // checkBox.addEventListener('change', (event) => {
        //     const checked = event.target.checked;
        //     const subset = subsets[category];
        //     if (checked) scene.add(subset);
        //     else subset.removeFromParent();
        // });

    }



    await setupAllCategories();

    var gui2 = new dat.GUI();

    gui2.domElement.style.position = 'absolute';
    gui2.domElement.style.top = '15px';
    gui2.domElement.style.left = '15px';

    var folder_models = gui2.addFolder('Models');
    folder_models.open();

    var keyTypesMap = Object.keys(makeTypesMap);

    var GUIControlModels = {};

    for (let i = 1; i < keyTypesMap.length; i++) {
        let key = keyTypesMap[i].split('IFC')[1];
        GUIControlModels[key] = true;
        let f = folder_models.add(GUIControlModels, key).onChange(function(checked) {
            let name = 'IFC' + key;
            let subset = subsets[makeTypesMap[name]];
            if (checked) scene.add(subset);
            else subset.removeFromParent();
        });
    }

    let hover = folder_models.domElement.lastElementChild;
    var subsetsHover = {},
        subsetsHoverState = null;

    hover.addEventListener("mousemove", (event) => {
        try {
            let target = event.target;
            if (typeof target.firstChild.type != 'undefined') {
                if (typeof target.firstChild.attributes.type.value != 'undefined') {
                    if (target.firstChild.attributes.type.value == 'checkbox') {
                        let type = event.target.parentNode.firstChild.innerText;
                        let name = 'IFC' + type;

                        let subset = subsetsHover[makeTypesMap[name]];

                        if (typeof subset == 'undefined') {
                            let key = Object.keys(subsetsHover);
                            for (let i in key) {
                                subsetsHover[key[i]].removeFromParent();
                                delete subsetsHover[key[i]];
                            }
                            activeSubset();
                        }

                        async function activeSubset() {
                            let ids = await viewer.IFC.loader.ifcManager.getAllItemsOfType(0, makeTypesMap[name], false);

                            // Creates subset material
                            const material = new MeshLambertMaterial({
                                transparent: true,
                                opacity: 0.5,
                                color: 0xffeb3b,
                                depthTest: false,
                            });

                            let e = viewer.IFC.loader.ifcManager.createSubset({
                                modelID: modelID,
                                ids: ids,
                                material: material,
                                scene: scene,
                                removePrevious: true
                            });

                            subsetsHover[makeTypesMap[name]] = e;
                            subsetsHoverState = makeTypesMap[name];
                        }
                    }
                }
            }
        } catch {}
    });

    document.addEventListener("mousemove", (event) => {
        if (event.target.tagName == 'CANVAS') {
            let key = Object.keys(subsetsHover);
            if (key.length > 0) {
                for (let i in key) {
                    subsetsHover[key[i]].removeFromParent();
                    delete subsetsHover[key[i]];
                }
            }
        }
    });

    // for (let i in hover) {
    //     hover[i].addEventListener("mousemove", (event) => {
    //         console.log(event)
    //     });
    // }

    // hover.addEventListener("mousemove", (event) => {
    //     console.log(event)
    // });

    // console.log('hover', document.querySelectorAll(hover))

    console.log('camera', viewer)

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


window.onmousemove = () => {

    viewer.IFC.selector.prePickIfcItem()
};
window.onkeydown = handleKeyDown;
window.ondblclick = async() => {

    // if (viewer.clipper.active) {
    viewer.clipper.createPlane();


    // console.log(await viewer.IFC.selector.highlightIfcItem(true))
};