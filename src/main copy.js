import "./styles/critical.css";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import Player from "@vimeo/player";

import * as dat from "dat.gui";

const sections = document.querySelectorAll("[data-three-section]");

let canvas, renderer;

const scenes = [];
const THREE_PATH = `https://unpkg.com/three@0.${THREE.REVISION}.x`;
let scenesLoaded = false;
const dracoLoader = new DRACOLoader().setDecoderPath(
  `${THREE_PATH}/examples/jsm/libs/draco/gltf/`
);
dracoLoader.setDecoderPath("/src/public/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const cursor = {
  x: 0,
  y: 0,
};

const sizes = {
  width: 0,
  height: 0,
};

const mouse = {
  x: 0,
  y: 0,
  parallaxEnabled: false,
};

const gui = new dat.GUI();

gui.add(mouse, "parallaxEnabled");
gui.hide();

// window.addEventListener("mousemove", onTouchMove, { passive: true });
// window.addEventListener("touchmove", onTouchMove, { passive: true });
// window.addEventListener("mouseup", onTouchEnd, { passive: true });
// window.addEventListener("touchend", onTouchEnd, { passive: true });
window.addEventListener("resize", onResize, { passive: true });

function loadModel(model, scene, section, i) {
  gltfLoader.load(model, (gltf) => {
    // gltf.scene.position.y = -0.25;
    const valuestoTweak = {
      scale: 0.8,
      loopAnimation: false,
    };

    const { scale } = valuestoTweak;
    const shape = gltf.scene;
    shape.scale.set(scale, scale, scale);

    const animation = gltf.animations[0];
    const mixer = new THREE.AnimationMixer(shape);

    const action = mixer.clipAction(animation);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.enable = true;
    scene.userData.mixer = mixer;
    scene.userData.action = action;

    mixer?.addEventListener("finished", () => {
      scene.userData.animationEnded = true;
    });

    const isReverse = section.getAttribute("data-reverse");

    if (isReverse) {
      section.addEventListener("click", () => {
        const delay = section.getAttribute("data-reverse-delay") || 0;
        action.paused = false;
        action.timeScale = -1;
        action.setLoop(THREE.LoopOnce);
        action.play();

        // replay animation when it ends
        setTimeout(() => {
          action.paused = false;
          action.timeScale = 1;
          action.setLoop(THREE.LoopOnce);
          action.play();
        }, (animation.duration - Number(delay)) * 1000);
      });
    }

    const isSwitch = section.getAttribute("data-video-switch");

    if (isSwitch) {
      window.removeEventListener("mousemove", onTouchMove, { passive: true });
      const iframe = section.closest(".shape_wrapper").querySelector("iframe");
      iframe.style.transition = "opacity 1s";
      const player = new Player(iframe);
      let isPlaying = false;
      shape.children.forEach((item) => {
        item.position.y = item.position.y - 1.58;
      });
      player
        .ready()
        .then(() => {
          // player.getDuration().then((data) => console.log(data));

          // get current time in seconds
          player.on("timeupdate", function (data) {
            if (data.seconds > 2.8) {
              if (!isPlaying) {
                player.pause();
                iframe.style.opacity = 0;
                shape.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.material.transparent = false;
                    child.material.opacity = 1;
                  }
                });
                action.paused = false;
                action.play();

                setTimeout(() => {
                  window.addEventListener("mousemove", onTouchMove, {
                    passive: true,
                  });
                }, 4000);

                isPlaying = true;
              }
            }

            // console.log(data);
          });
        })
        .catch((err) => console.log(err));
    } else {
      window.addEventListener("mousemove", onTouchMove, {
        passive: true,
      });
      const video = section.parentNode.parentNode.querySelector(".bg-video");
      if (video) {
        video.style.opacity = 0;
        video.style.pointerEvents = "none";
        video.style.visibility = "hidden";
      }
    }

    let camera = gltf.cameras[0];
    if (!camera) {
      console.log(gltf);
      camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
      camera.position.set(0, 0, 10);
    }
    const cameraGroup = new THREE.Group();
    scene.add(cameraGroup);

    // the element that represents the area we want to render the scene
    scene.userData.element = section;
    cameraGroup.add(camera);
    // content.appendChild(element);

    scene.userData.camera = camera;
    scene.userData.cameraGroup = cameraGroup;

    const emmisiveColor = section.getAttribute("data-emissive");

    shape.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (emmisiveColor) {
          child.material.emissive = new THREE.Color(emmisiveColor);
        } else {
          child.material.color = new THREE.Color(0xffffff);
        }

        if (isSwitch) {
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      }
    });

    scene.add(shape);
  });

  scenes.push(scene);
}

function init() {
  canvas = document.createElement("canvas");
  canvas.id = "webgl";
  document.body.appendChild(canvas);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  // renderer.setClearColor(0xffffff, 1);
  renderer.setPixelRatio(window.devicePixelRatio);

  onResize();

  if (window.location.pathname === "/build") {
    canvas.style.zIndex = 0;
  }

  // const content = document.getElementById("content");
  sections.forEach((section, i) => {
    const scene = new THREE.Scene();

    const model = section.getAttribute("data-three-section").split(",");

    loadModel(model, scene, section, i);
  });

  THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    if (itemsLoaded === itemsTotal) {
      scenesLoaded = true;
      playAnimation();
    }
  };
}

function updateSize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  sizes.width = width;
  sizes.height = height;

  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
  }
}

function onTouchMove(event) {
  const x = event.touches ? event.touches[0].clientX : event.clientX;
  const y = event.touches ? event.touches[0].clientY : event.clientY;

  mouse.x = x;
  mouse.y = y;

  cursor.x = mouse.x / sizes.width - 0.5;
  cursor.y = mouse.y / sizes.height - 0.5;
}

function onResize() {
  updateSize();
}

function playAnimation() {
  scenes.forEach((scene) => {
    // set up intersection observer to play animation when scene element is in view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          canvas.style.opacity = 1;

          if (window.location.pathname === "/jobs") {
            canvas.style.opacity = 0.65;
          }

          const isSwitch =
            scene.userData.element.getAttribute("data-video-switch");

          if (!isSwitch) {
            scene.userData.action.play();
          }
        } else {
          // scene.userData.action.stop();
        }
      });
    });

    observer.observe(scene.userData.element);
  });
}

function animate() {
  render();
  requestAnimationFrame(animate);
}

function render() {
  renderer.setScissorTest(false);
  // renderer.clear();

  renderer.setScissorTest(true);

  if (scenesLoaded) {
    scenes.forEach(function (scene) {
      // so something moves
      // scene.children[0].rotation.y = Date.now() * 0.001;

      // get the element that is a place holder for where we want to
      // draw the scene
      const element = scene.userData.element;

      const speed = element.getAttribute("data-speed");

      if (speed) {
        scene.userData.mixer?.update(Number(speed));
      } else {
        scene.userData.mixer?.update(0.015);
      }

      // get its position relative to the page's viewport
      const rect = element.getBoundingClientRect();

      // check if it's offscreen. If so skip it
      if (
        rect.bottom < 0 ||
        rect.top > renderer.domElement.clientHeight ||
        rect.right < 0 ||
        rect.left > renderer.domElement.clientWidth
      ) {
        return; // it's off screen
      }

      // set the viewport
      const width = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      const left = rect.left;
      const bottom = renderer.domElement.clientHeight - rect.bottom;

      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);

      const camera = scene.userData.camera;
      const cameraGroup = scene.userData.cameraGroup;

      const parallaxX = -cursor.x * 0.8;
      const parallaxY = -cursor.y * 0.8;

      cameraGroup.rotation.y += (parallaxX - cameraGroup.rotation.y) * 0.05;
      if (element.dataset.mouseZ) {
        cameraGroup.rotation.z += (parallaxY - cameraGroup.rotation.z) * 0.05;
      } else {
        cameraGroup.rotation.x += (parallaxY - cameraGroup.rotation.x) * 0.05;
      }
      // }

      renderer.render(scene, camera);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  init();
  animate();
});
