import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* =========================
   SCENE SETUP
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff); // Background sky color

const camera = new THREE.PerspectiveCamera(
  60,                      // CAMERA FOV (50–70 good range)
  window.innerWidth / window.innerHeight,
  0.1,                     // Near clip
  100                      // Far clip (keep tight for precision)
);

camera.position.set(0, 5, 8); // Camera position (x, y, z)
camera.rotation.x = -0.5; // Slight downward tilt for better view of island

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1; // whatever exposure means (0.8–1.5 range)

document.body.appendChild(renderer.domElement);

/* =========================
   RESIZE HANDLER
========================= */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =========================
   LIGHTING (affects island only)
========================= */

const directional = new THREE.DirectionalLight(0xffffff, 1.5); // Light intensity
directional.position.set(5, 10, 7);
scene.add(directional);

const ambient = new THREE.AmbientLight(0xffffff, 0.35); // Soft fill light, I think
scene.add(ambient);

/* =========================
   MODEL LOADING
========================= */

let model;
let waterShader; // Stores shader reference directly (no per-frame traverse)

const loader = new GLTFLoader();
loader.load(
  '../assets/models/splash.glb',
  (gltf) => {
    model = gltf.scene;
    scene.add(model);

    model.traverse((child) => {
      if (child.isMesh && child.name === "pink_ocean") {
        applyWaterShader(child);
      }
    });

    addFellaVideo();

    console.log("Model loaded");
  }
);

/* =========================
   WATER SHADER
========================= */

function applyWaterShader(mesh) {

  const material = new THREE.ShaderMaterial({
    transparent: true,      
    depthWrite: false,      

    uniforms: {
      time: { value: 0.0 }
    },

    vertexShader: `
      uniform float time;

      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vWaveHeight; 

      void main() {
        vNormal = normal;
        vec3 pos = position;

        // Calculate the chaotic waves exactly as before
        float wave1 = sin(pos.x * 3.0 + time * 0.2) * 0.05;
        float wave2 = sin(pos.z * 2.0 - time * 0.15) * 0.04;
        float wave3 = sin((pos.x + pos.z) * 5.0 + time * 0.3) * 0.02;
        float wave4 = cos((pos.x - pos.z) * 7.0 - time * 0.4) * 0.015;

        float rawDisplacement = wave1 + wave2 + wave3 + wave4;

        // NEW: Create a smooth mask based on how "upward" the surface is pointing.
        // normal.y is 1.0 when perfectly flat on top, and approaches 0.0 as it rounds the corner.
        // smoothstep(min, max, value) smoothly interpolates between 0.0 and 1.0.
        float edgeMask = smoothstep(0.85, 0.99, normal.y);

        // Multiply displacement by the mask. 
        // Flat top gets 100% (1.0). Edges fade to 0% (0.0).
        float finalDisplacement = rawDisplacement * edgeMask;

        // Apply displacement vertically
        pos.y += finalDisplacement;

        vWaveHeight = finalDisplacement;

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,

    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vWaveHeight;

      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

        float fresnel = pow(
          1.0 - dot(normalize(vNormal), viewDirection),
          2.5
        );

        vec3 deepPink  = vec3(0.85, 0.25, 0.55);
        vec3 lightPink = vec3(1.0, 0.6, 0.8);

        // Calculate color based on height
        float heightFactor = clamp(vWaveHeight * 8.0 + 0.5, 0.0, 1.0);

        vec3 baseColor = mix(deepPink, lightPink, heightFactor);

        vec3 finalColor = baseColor + fresnel * 0.25;

        gl_FragColor = vec4(finalColor, 0.8);
      }
    `
  });

  mesh.material = material;
  waterShader = material;
}

function addFellaVideo() {

  /* =========================
     EDITABLE SETTINGS
  ========================= */

  const FELLA_SIZE = 0.275;        // Size of the character plane
  const FELLA_HEIGHT = 1.2;      // How high above water
  const FELLA_RADIUS = 0.75;     // Distance from center (planet radius)
  const FELLA_ROTATION_Y = Math.PI * 0.9; // Rotate around planet

  /* ========================= */

  const video = document.createElement('video');
  video.src = "../assets/mp4s/almos_boogie.mp4";
  video.loop = true;
  video.muted = true;
  video.play();

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshBasicMaterial({
    map: videoTexture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const geometry = new THREE.PlaneGeometry(FELLA_SIZE, FELLA_SIZE);
  const fella = new THREE.Mesh(geometry, material);

  const x = Math.sin(FELLA_ROTATION_Y) * FELLA_RADIUS;
  const z = Math.cos(FELLA_ROTATION_Y) * FELLA_RADIUS;

  fella.position.set(x, FELLA_HEIGHT, z);

  fella.lookAt(0, FELLA_HEIGHT, 0);

  model.add(fella);
}

/* =========================
   ANIMATION LOOP
========================= */

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    model.rotation.y += 0.0025; // Planet spin speed (should be 0.0025)
  }

  if (waterShader) {
    waterShader.uniforms.time.value += 0.1; // Wave animation speed multiplier
  }

  renderer.render(scene, camera);
}

animate();