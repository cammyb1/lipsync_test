import { createWLipSyncNode } from "wlipsync";
import { mount3 } from "./three";
import profile from "./profile.json";
import "./index.css";

let lipSyncNode;

// Mount three js stuff
const { state, dispatcher } = mount3();

// Visemes and morphtargets mapping
export const VISEMES = {
  A: "FAnim_VisemA",
  I: "FAnim_VisemI",
  U: "FAnim_VisemU",
  E: "FAnim_VisemE",
  O: "FAnim_VisemO",
  // "-": "FAnim_Blink",
};

async function main() {
  let microphone = false;
  let audio = null;
  let context = new AudioContext();
  let source = null;
  let stream = null;
  let processor = null;
  let analyser = null;

  const microButton = document.getElementById("micro");
  const dropZone = document.getElementById("dropzone");

  function onAnimate() {
    const character = state.scene.getObjectByName("rpm_character");

    if (!character) return;

    for (const key in lipSyncNode.weights) {
      const viseme = VISEMES[key];
      const value = lipSyncNode.weights[key] * lipSyncNode.volume;
      const action = state.actions[viseme];

      if (action) {
        action
          .reset()
          .setEffectiveWeight(1)
          .setEffectiveTimeScale(value * 75);
      }
      // With Morph Targets
      // character.traverse((node) => {
      //   if (node.isSkinnedMesh && node.morphTargetDictionary) {
      //     const index = node.morphTargetDictionary[viseme];
      //     node.morphTargetInfluences[index] = value;
      //   }
      // });
    }
  }

  async function connectAudio() {
    lipSyncNode = await createWLipSyncNode(context, profile);
    dispatcher.addEventListener("animate", onAnimate);
  }

  function stopStream() {
    microButton.classList.remove("active");

    if (stream)
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    if (analyser) analyser.disconnect();
    if (source) source.disconnect();
    if (processor) processor.disconnect();
    if (audio) audio = null;
  }

  microButton.addEventListener("click", async () => {
    microphone = !microphone;

    if (microphone) {
      if (context.state === "suspended") {
        context.resume();
      }

      microButton.classList.add("active");
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      source = context.createMediaStreamSource(stream);

      source.connect(lipSyncNode);
    } else if (source && stream) {
      stopStream();
    }
  });

  dropZone.addEventListener("drop", async (ev) => {
    ev.preventDefault();

    if (ev.dataTransfer.items) {
      [...ev.dataTransfer.items].forEach((item, i) => {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file.type === "audio/mpeg") {
            microphone = false;
            audio = file;
          }
        }
      });
    }

    if (audio) {
      source = context.createBufferSource();
      const bufferStream = await audio.arrayBuffer();
      source.buffer = await context.decodeAudioData(bufferStream);

      processor = context.createScriptProcessor(2048, 1, 1);
      processor.onaudioprocess = () => {
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
      };
      analyser = context.createAnalyser();

      source.connect(context.destination);
      source.connect(analyser);
      source.connect(lipSyncNode);

      analyser.connect(processor);
      processor.connect(context.destination);

      source.start();
      setTimeout(disconnect, source.buffer.duration * 1000);
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  await connectAudio();
}

const enterB = document.getElementById("enter");

enterB.onclick = async () => {
  enterB.parentNode.classList.add("hidden");
  setTimeout(() => {
    enterB.parentNode.parentNode.removeChild(enterB.parentNode);
  }, 1000);

  await main();
};
