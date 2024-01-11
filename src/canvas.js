import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import AutoBind from "./bind";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
const THREE_PATH = `https://unpkg.com/three@0.${THREE.REVISION}.x`;
import * as dat from "dat.gui";

export default class Canvas {
  constructor(element, canvas) {
    AutoBind(this);
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.textureLoader = new THREE.TextureLoader();

    this.clock = new THREE.Clock();
    this.element = element;
    this.sizes = this.elementSize;
    this.sceneLoaded = false;

    this.gui = new dat.GUI();
    this.modelName = this.element.getAttribute("data-name");
    this.guiControls = {
      speed: Number(this.element.getAttribute("data-speed") || 0.015),
    };
    // console.log(this.element.getAttribute("data-speed"));

    this.dracoLoader = new DRACOLoader().setDecoderPath(
      `${THREE_PATH}/examples/jsm/libs/draco/gltf/`,
    );

    this.cursor = {
      x: 0,
      y: 0,
    };

    this.createRenderer();
    this.loadAssets();
    this.addSpeedGUI();
  }

  get elementSize() {
    return {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
    };
  }

  addSpeedGUI() {
    this.gui
      .add(this.guiControls, "speed")
      .min(0.0001)
      .max(0.04)
      .step(0.0001)
      .name(`${this.modelName} animation speed`)
      .onFinishChange(() => {
        this.action.reset();
        this.action.setLoop(THREE.LoopOnce);
        this.action.play();
      });
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  loadAssets() {
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(this.dracoLoader);
    const model = this.element.getAttribute("data-three-section").split(",");
    const section = this.element;

    gltfLoader.load(model, (gltf) => {
      this.sceneLoaded = true;
      // console.log("loaded", model);

      gltf.scene.scale.set(0.8, 0.8, 0.8);
      this.shape = gltf.scene;
      this.animation = gltf.animations[0];
      this.mixer = new THREE.AnimationMixer(this.shape);
      this.action = this.mixer.clipAction(this.animation);
      const action = this.action;
      this.camera = gltf.cameras[0];

      // if (!this.camera) {
      //   console.log(gltf);
      //   this.camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
      //   this.camera.position.set(0, 1.5, 10);
      // }

      this.cameraGroup = new THREE.Group();
      this.scene.add(this.cameraGroup);
      this.cameraGroup.add(this.camera);

      this.action.setLoop(THREE.LoopOnce);
      this.action.clampWhenFinished = true;
      this.action.enable = true;
      this.playAnimation();

      const emmisiveColor = this.element.getAttribute("data-emissive");
      const isSwitch = this.element.getAttribute("data-video-switch");
      const isReverse = section.getAttribute("data-reverse");

      this.shape.traverse((child) => {
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

      if (isReverse) {
        section.addEventListener("click", () => {
          const delay = section.getAttribute("data-reverse-delay") || 0;
          action.paused = false;
          action.timeScale = -1;
          action.setLoop(THREE.LoopOnce);
          action.play();

          // replay animation when it ends
          setTimeout(
            () => {
              action.paused = false;
              action.timeScale = 1;
              action.setLoop(THREE.LoopOnce);
              action.play();
            },
            (this.animation.duration - Number(delay)) * 1000,
          );
        });
      }

      const switchVideo = (video) => {
        setTimeout(() => {
          video.remove();
          this.shape.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material.transparent = false;
              child.material.opacity = 1;
            }
          });
          this.action.paused = false;
          this.action.play();
          setTimeout(() => {
            this.addEventListeners();
          }, 2000);
        }, 1000);
      };

      if (isSwitch) {
        console.log(model, isSwitch, this.element);
        let video = Wistia.api("hero_video");
        const percentWatched = video?.percentWatched();

        let isPlaying = false;
        this.shape.children.forEach((item) => {
          item.position.y = item.position.y + 0.39;
        });

        if (!video) {
          console.log(document.getElementById("hero_video"));
          window._wq = window._wq || [];
          _wq.push({
            id: "yvicw8edhl",
            onReady: (video) => {
              video.bind("timechange", (time) => {
                if (time > 2.8) {
                  if (!isPlaying) {
                    switchVideo(video);
                    isPlaying = true;
                  }
                }
              });
            },
          });
        } else {
          if (percentWatched === 1) {
            if (!isPlaying) {
              // video.pause();
              switchVideo(video);
              isPlaying = true;
            }
          } else {
            video?.bind("timechange", (time) => {
              if (time > 2.8) {
                if (!isPlaying) {
                  // video.pause();
                  switchVideo(video);
                  isPlaying = true;
                }
              }
            });
          }
        }

        // const iframe = section
        //   .closest(".shape_wrapper")
        //   .querySelector("iframe");
        // iframe.style.transition = "opacity 1s";
        // const player = new Player(iframe);

        // player
        //   .ready()
        //   .then(() => {
        //     // player.getDuration().then((data) => console.log(data));
        //     // get current time in seconds
        //     player.on("timeupdate", (data) => {

        //       // console.log(data);
        //     });
        //   })
        //   .catch((err) => console.log(err));
      } else {
        this.addEventListeners();

        const video = section.parentNode.parentNode.querySelector(".bg-video");
        if (video) {
          video.style.opacity = 0;
          video.style.pointerEvents = "none";
          video.style.visibility = "hidden";
        }
      }

      this.scene.add(this.shape);
    });
  }

  onResize() {
    const width = this.element.clientWidth;
    const height = this.element.clientHeight;
    const aspect = this.camera.aspect || 1;

    // Update renderer
    this.renderer.setSize(width, width / aspect);
  }

  playAnimation() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.canvas.style.opacity = 1;

          if (window.location.pathname === "/jobs") {
            this.canvas.style.opacity = 0.65;
          }

          const isSwitch = this.element.getAttribute("data-video-switch");

          if (!isSwitch) {
            this.action.play();
          }
        } else {
          // this.action.stop();
        }
      });
    });

    observer.observe(this.element);
  }

  onTouchMove(event) {
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;

    this.cursor.x = x / sizes.width - 0.5;
    this.cursor.y = y / sizes.height - 0.5;
  }

  addEventListeners() {
    window.addEventListener("mousemove", this.onTouchMove, { passive: true });
    window.addEventListener("touchmove", this.onTouchMove, { passive: true });
  }

  render() {
    // Render
    this.renderer.clear();

    if (this.sceneLoaded) {
      const speed = this.element.getAttribute("data-speed");

      if (speed) {
        this.mixer?.update(this.guiControls.speed);
      } else {
        this.mixer?.update(this.guiControls.speed);
      }

      const parallaxX = -this.cursor.x * 0.8;
      const parallaxY = -this.cursor.y * 0.8;

      this.cameraGroup.rotation.y +=
        (parallaxX - this.cameraGroup.rotation.y) * 0.05;
      if (this.element.dataset.mouseZ) {
        this.cameraGroup.rotation.z +=
          (parallaxY - this.cameraGroup.rotation.z) * 0.05;
      } else {
        this.cameraGroup.rotation.x +=
          (parallaxY - this.cameraGroup.rotation.x) * 0.05;
      }

      this.renderer.render(this.scene, this.camera);
    }
  }
}
