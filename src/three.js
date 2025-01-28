import {
  AmbientLight,
  PerspectiveCamera,
  Vector3,
  Scene,
  WebGLRenderer,
  DirectionalLight,
  EventDispatcher,
} from "three";
import { GLTFLoader, DRACOLoader } from "three/examples/jsm/Addons.js";

const dispatcher = new EventDispatcher();

function start({ scene, camera }) {
  const ambient = new AmbientLight(0xffffff, 2.5);
  const directional = new DirectionalLight(0xffffff, 2.5);
  scene.add(ambient);
  scene.add(directional);

  // Load Character
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  loader.setDRACOLoader(draco);

  loader.load("./model.glb", (gltf) => {
    const character = gltf.scene;
    character.name = "rpm_character";
    scene.add(gltf.scene);

    const head = character.getObjectByName("Head");
    head.updateMatrixWorld();

    camera.translateZ(0.5);
    camera.translateY(1.5);
    camera.lookAt(head.getWorldPosition(new Vector3()));
  });
}

export function mount3() {
  const renderer = new WebGLRenderer({ antialias: true });
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    5
  );
  const scene = new Scene();

  const state = { renderer, camera, scene };

  renderer.setSize(window.innerWidth, window.innerHeight);

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  renderer.setAnimationLoop((dt) => {
    dispatcher.dispatchEvent({ type: "animate", state, dt });
    renderer.render(scene, camera);
  });

  document.body.appendChild(renderer.domElement);

  start(state);

  return { state, dispatcher };
}
