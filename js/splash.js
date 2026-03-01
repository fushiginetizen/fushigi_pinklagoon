import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff);

// Camera
const camera = new THREE.PerspectiveCamera(
  60, // 75 is wide and slightly distorted
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 3, 8);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

document.body.appendChild(renderer.domElement);

// Resize handler (now correctly placed)
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting (less harsh)
const directional = new THREE.DirectionalLight(0xffffff, 1.5);
directional.position.set(5, 10, 7);
scene.add(directional);

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

// Model
let model;

const loader = new GLTFLoader();
loader.load(
  '../assets/models/splash.glb', // ← adjust if needed
  (gltf) => {
    model = gltf.scene;
    scene.add(model);
    console.log("Model loaded");
  },
  undefined,
  (error) => {
    console.error("Error loading GLB:", error);
  }
);

// Animation
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    model.rotation.y += 0.002;
  }

  renderer.render(scene, camera);
}

animate();