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

window.addEventListener("mousemove", onTouchMove, { passive: true });
window.addEventListener("touchmove", onTouchMove, { passive: true });
// window.addEventListener("mouseup", onTouchEnd, { passive: true });
// window.addEventListener("touchend", onTouchEnd, { passive: true });

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
    // shape.rotation.y = 0.58;

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
      const iframe = document.getElementById("hero-vimeo");
      const player = new Player(iframe);
      let isPlaying = false;
      shape.children.forEach((child) => {
        child.position.y = 0;
      });
      window.removeEventListener("mousemove", onTouchMove, { passive: true });
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
                }, 100);

                isPlaying = true;
              }
            }

            // console.log(data);
          });
        })
        .catch((err) => console.log(err));
    }

    // if (i === 1) {
    //   action.setLoop(THREE.LoopRepeat);
    //   valuestoTweak.loopAnimation = true;
    // }

    gui
      .add(valuestoTweak, "loopAnimation")
      .onChange(() => {
        action.loop = valuestoTweak.loopAnimation
          ? THREE.LoopRepeat
          : THREE.LoopOnce;

        action.reset();
      })
      .name(`Loop frames ${i}`);

    gui
      .add(shape.rotation, "x")
      .min(-10)
      .max(2)
      .step(0.001)
      .name("model rotation x");

    gui
      .add(shape.rotation, "y")
      .min(-10)
      .max(2)
      .step(0.001)
      .name("model rotation y");

    gui
      .add(shape.rotation, "z")
      .min(-10)
      .max(2)
      .step(0.001)
      .name("model rotation z");

    // console.log(scene);

    // const camera = new THREE.PerspectiveCamera(81, 1, 0.5, 100);
    // camera.position.z = 2;
    let camera = gltf.cameras[0];
    if (!camera) {
      camera = new THREE.PerspectiveCamera(100, 1, 0.5, 100);
      camera.position.z = 40;
    }
    const cameraGroup = new THREE.Group();
    scene.add(cameraGroup);

    // if (i === 0) {
    //   gui.add(camera.position, "x").min(-1).max(2).step(0.001);
    //   gui.add(camera.position, "y").min(-1).max(2).step(0.001);
    //   gui.add(camera.position, "z").min(-1).max(2).step(0.001);

    //   gui
    //     .add(camera, "fov")
    //     .min(0)
    //     .max(180)
    //     .step(0.001)
    //     .onChange(() => {
    //       camera.updateProjectionMatrix();
    //     });

    //   gui
    //     .add(camera, "aspect")
    //     .min(0)
    //     .max(3)
    //     .step(0.001)
    //     .onChange(() => {
    //       camera.updateProjectionMatrix();
    //     });

    //   gui
    //     .add(camera, "near")
    //     .min(0)
    //     .max(3)
    //     .step(0.001)
    //     .onChange(() => {
    //       camera.updateProjectionMatrix();
    //     });

    //   gui
    //     .add(camera, "far")
    //     .min(0)
    //     .max(100)
    //     .step(0.001)
    //     .onChange(() => {
    //       camera.updateProjectionMatrix();
    //     });

    //   gui
    //     .add(camera.rotation, "x")
    //     .min(-1)
    //     .max(2)
    //     .step(0.001)
    //     .onChange(() => {
    //       camera.updateProjectionMatrix();
    //     });

    //   gui
    //     .add(camera.rotation, "y")
    //     .min(-1)
    //     .max(2)
    //     .step(0.001)
    //     .onChange(() => {
    //       camera.updateProjectionMatrix();
    //     });

    //   gui
    //     .add(camera.rotation, "z")
    //     .min(-1)
    //     .max(2)
    //     .step(0.001)
    //     .onChange(() => {
    //       camera.updateProjectionMatrix();
    //     });
    // }

    // the element that represents the area we want to render the scene
    scene.userData.element = section;
    cameraGroup.add(camera);
    // content.appendChild(element);

    scene.userData.camera = camera;
    scene.userData.cameraGroup = cameraGroup;

    // const controls = new OrbitControls(
    //   scene.userData.camera,
    //   scene.userData.element
    // );
    // controls.minDistance = 2;
    // controls.maxDistance = 5;
    // controls.enablePan = false;
    // controls.enableZoom = false;
    // scene.userData.controls = controls;
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

  // if (scenes.length === sections.length) {
  //   playAnimation();
  // }
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

  if (window.location.pathname === "/build") {
    canvas.style.zIndex = 0;
  }

  // const content = document.getElementById("content");
  sections.forEach((section, i) => {
    const scene = new THREE.Scene();
    // camera.position.set(-0.3, 0, 1.5);

    // console.log(section);
    // camera.rotation.y = -0.3;

    const model = section.getAttribute("data-three-section").split(",");

    loadModel(model, scene, section, i);
  });

  // for (let i = 0; i < 10; i++) {

  // }

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
  updateSize();

  // canvas.style.transform = `translateY(${window.scrollY}px)`;

  // renderer.setClearColor(0x000000);
  renderer.setScissorTest(false);
  renderer.clear();

  // renderer.setClearColor(0x000000);
  renderer.setScissorTest(true);

  if (scenesLoaded) {
    scenes.forEach(function (scene) {
      // so something moves
      // scene.children[0].rotation.y = Date.now() * 0.001;

      // get the element that is a place holder for where we want to
      // draw the scene
      const element = scene.userData.element;

      const isSwitch = section.getAttribute("data-video-switch");

      if (isSwitch) {
        scene.userData.mixer?.update(0.008);
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

      //camera.aspect = width / height; // not changing in this example
      //camera.updateProjectionMatrix();

      // scene.userData.controls.update();

      renderer.render(scene, camera);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  init();
  animate();
});
