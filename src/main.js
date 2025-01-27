import { createWLipSyncNode } from "wlipsync";
import { mount3 } from "./three";
import profile from "./profile.json";
import "./index.css";

let lipSyncNode;

// Mount three js stuff
const { state, dispatcher } = mount3();

// Visemes and morphtargets mapping
export const VISEMES = {
  A: "viseme_aa",
  I: "viseme_I",
  U: "viseme_U",
  E: "viseme_E",
  O: "viseme_O",
  "-": "viseme_sil",
};

function onAnimate() {
  const character = state.scene.getObjectByName("rpm_character");

  if (!character) return;

  for (const key in lipSyncNode.weights) {
    const viseme = VISEMES[key];
    const value = lipSyncNode.weights[key] * lipSyncNode.volume;

    character.traverse((node) => {
      if (node.isSkinnedMesh && node.morphTargetDictionary) {
        const index = node.morphTargetDictionary[viseme];
        node.morphTargetInfluences[index] = value;
      }
    });
  }
}

async function connectAudio() {
  const audioContext = new AudioContext();
  lipSyncNode = await createWLipSyncNode(audioContext, profile);

  dispatcher.addEventListener("animate", onAnimate);

  window.addEventListener(
    "click",
    async (_) => {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const source = audioContext.createMediaStreamSource(stream);

      source.connect(lipSyncNode);
    },
    { passive: true, once: true }
  );
}

await connectAudio();
