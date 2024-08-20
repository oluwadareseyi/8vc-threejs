import "./styles/critical.css";
import Canvas from "./canvas";

const sections = document.querySelectorAll("[data-three-section]");

console.log(sections);

let canvases = [];

sections.forEach((section) => {
  const canvas = document.createElement("canvas");
  canvas.id = "webgl";
  section.appendChild(canvas);
  canvases.push(new Canvas(section, canvas));
});

const render = () => {
  // Update canvas
  canvases.forEach((canvas) => {
    canvas.render();
  });

  // Call render again on the next frame
  window.requestAnimationFrame(render);
};

render();

// resize event
window.addEventListener("resize", () => {
  canvases.forEach((canvas) => {
    canvas.onResize();
  });
});
