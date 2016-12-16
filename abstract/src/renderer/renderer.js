
////
/* Renderer classes (View)
Renderers are responsible for data presentation. It knows how to generate renderable
data. It handles all internal states of a rendering engine, such as WebGL.
It also manages resources such as buffers, textures and programs
to maximize resource reuse. It handles rendering pipeline configuration too.
All rendering optimization (sorting/clipping etc...) happens here.
*/

// Base class, this should be a protocol / abstract class
export class Renderer {
  constructor({controller}) {
    this.controller = controller;
    // Render function controller
    this.activated = true;

    // These are an array that holds processed geometries ready for rendering. It's build partly according to the geometries array in the activeContainer but should be optimized for rendering performance.
    this.renderableGeometries = [];

  }
}
