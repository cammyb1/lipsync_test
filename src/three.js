import {
  AmbientLight,
  PerspectiveCamera,
  Vector3,
  Scene,
  WebGLRenderer,
  DirectionalLight,
  EventDispatcher,
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  Clock,
  AdditiveAnimationBlendMode,
} from "three";
import { GLTFLoader, DRACOLoader } from "three/examples/jsm/Addons.js";
import { makeClipAdditive } from "three/src/animation/AnimationUtils.js";

const dispatcher = new EventDispatcher();

function start({ scene, camera, actions, mixer }) {
  const ambient = new AmbientLight(0xffffff, 2.5);
  const directional = new DirectionalLight(0xffffff, 2.5);
  scene.add(ambient);
  scene.add(directional);

  // Load Character
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  loader.setDRACOLoader(draco);

  loader.load("./visemes.glb", (gltf) => {
    const character = gltf.scene;
    character.name = "rpm_character";
    scene.add(character);

    gltf.animations.forEach((anim) => {
      const additiveClip = makeClipAdditive(anim, 0, anim, 30);
      const action = mixer.clipAction(additiveClip, character);
      action.blendMode = AdditiveAnimationBlendMode;
      action.setLoop(LoopOnce);
      action.setEffectiveWeight(0);
      action.reset().play();
      action.enabled = true;
      actions[anim.name] = action;
    });

    actions["FAnim_Blink"].setEffectiveWeight(1).setLoop(LoopRepeat);

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
  const mixer = new AnimationMixer();
  const actions = {};
  const clock = new Clock();

  const state = { renderer, camera, mixer, scene, actions };

  renderer.setSize(window.innerWidth, window.innerHeight);

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    dispatcher.dispatchEvent({ type: "animate", state, dt });
    mixer.update(dt);
    renderer.render(scene, camera);
  });

  document.body.appendChild(renderer.domElement);

  start(state);

  return { state, dispatcher };
}
