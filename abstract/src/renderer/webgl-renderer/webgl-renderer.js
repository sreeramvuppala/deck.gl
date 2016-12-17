import {Renderer} from '../renderer';
import {BufferManager} from './buffer-manager';
import {CameraManager} from './camera-manager';
import {FramebufferManager} from './framebuffer-manager';
import {ProgramManager} from './program-manager';
import {TextureManager} from './texture-manager';

import {Triangles, Lines, InstancedSpheres} from '../../mesh';
import {WebGLTriangles, WebGLLines, WebGLInstancedTriangles} from './webgl-renderable-mesh';

import {GL, createGLContext} from 'luma.gl';

/* This is here to match the Geometry class.
  It holds the renderable model of a layer
*/
class RenderableGeometry {
  constructor({id}) {
    this.groups = [];
    this.id = id;
  }
}

/* This is here to match the Group class
  Renderable group is here to merely add another
  layer of optimizability. It is designed that meshes within
  the same renderable group can be reordered without affecting
  the visual effect
*/
class RenderableGroup {
  constructor() {
    this.meshes = [];
  }
}

// On screen WebGL renderer
export default class WebGLRenderer extends Renderer {
  constructor({controller, canvas, debug, glOptions}) {
    super({controller});

   // Context creation
    this.currentCanvas = canvas;
    this.debug = debug;
    this.contextOptions = glOptions;
    try {
      this.glContext = createGLContext({canvas, debug: debug, ...glOptions});
      console.log("WebGL context successfully created: ", this.glContext);
    } catch (error) {
      console.log("Context creation failed");
      console.log("error: ", error);
      return;
    }

    // Initial WebGL states
    const gl = this.glContext;

    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.frontFace(gl.CCW);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // These are rendering resource managers.
    this.bufferManager = new BufferManager(this);
    this.textureManager = new TextureManager(this);
    this.programManager = new ProgramManager(this);

    /* We should have a camera manager here to handle all abstract camera from the container class.
    More importantly, we should have auxillary cameras for rendering advanced effects like shadows.
    It's not implemented yet. Right now, the renderer just take abstract camera from the container class.
    */

    this.cameraManager = new CameraManager(this);

    this.framebufferManager = new FramebufferManager(this);

    // if camera/viewport changed
    this.needsRedraw = false;

    this.frameNo = 0;
  }

  newPerspectiveCamera({id = 'main', pos, anchor, up, fovY, near, far, texture = false, width = this.currentCanvas.width, height = this.currentCanvas.height}) {
    const aspect = width / height;
    let target = null;
    if (texture === true) {
      target = this.framebufferManager.newFramebuffer({
        width,
        height
      });
    }
    this.cameraManager.newCamera({
      id,
      pos,
      anchor,
      up,
      fovY,
      aspect,
      near,
      far,
      target
    });
    this.needsRedraw = true;
  }

  /* Generating renderable geometry from abstract geometry.
  Renderable geometry doesn't need to match abstract geometry but to
  maximize the rendering performance. */
  regenerateRenderableGeometries(container) {

    /* When data structure changed, we need to update the rendering geometries.
    Right now, rendering geometries are regenerated from ground up. This should be
    optimized to regenerating only the change part of the whole scene tree.
    Major optimization could happen here */
    if (container.dataStructureChanged === true) {
      this.renderableGeometries = [];
      const renderableGeometries = this.renderableGeometries;

      for (let i = 0; i < container.layers.length; i++) {
        const layer = container.layers[container.layerOrder[i]];
        const currentGeometry = layer.geometry;
        const currentRenderableGeometry = new RenderableGeometry({id: layer.id});

        renderableGeometries.push(currentRenderableGeometry);

        for (let j = 0; j < currentGeometry.groups.length; j++) {
          const currentRenderableGroup = new RenderableGroup();
          currentRenderableGeometry.groups.push(currentRenderableGroup);

          const currentGroup = currentGeometry.groups[j];

          for (let k = 0; k < currentGroup.meshes.length; k++) {
            currentRenderableGroup.meshes.push(this.generateRenderableMeshes(currentGroup.meshes[k]));
          }
        }
      }

      // Optimizing renderingGeometries
      // TODO
    }
  }

  /* Generate renderable mesh from abstract mesh.
  Basically a switch statment right now.
  Most of the work are delegated to each RenderableMesh's constructor
  But eventually it will involve significant work in transforming
  abstract mesh to renderable mesh.

  This is the primary place that the user uses GPU compute to
  accelerate data transformation and mesh generation. If the user
  choose to do GPU compute here, he can use the existing drawing
  context and keep the outputs on the GPU.

  Note: abstract mesh does not need to be a 1-on-1 match with
  renderable match */

  generateRenderableMeshes(mesh) {
    let currentRenderableMesh;
    if (mesh instanceof Triangles) {
      currentRenderableMesh = new WebGLTriangles({
        triangles: mesh,
        renderer: this
      });
    } else if (mesh instanceof Lines) {
      currentRenderableMesh = new WebGLLines({
        line: mesh,
        renderer: this
      });
    } else if (mesh instanceof InstancedSpheres) {
      currentRenderableMesh = new WebGLInstancedTriangles({
        instancedTriangles: mesh,
        renderer: this
      });
    } else {
      console.log("WebGLRenderer.generateRenderableMeshes(). Unknown type of mesh!")
    }
    return currentRenderableMesh;
  }

  /* This function will be significantly improved */
  updateRenderableGeometries({container, layerID, groupID, meshID, attributeID}) {
    const geometry = this.getRenderableGeometryByID(layerID);
    geometry.groups[groupID].meshes[meshID].updateAttribute({
      attributeID,
      mesh: container.getLayerByID(layerID).geometry.groups[groupID].meshes[meshID]
    });

    /*TODO: We might also need to update other vertex attributes and uniforms*/
  }

  getRenderableGeometryByID(ID) {
    for (let i = 0; i < this.renderableGeometries.length; i++) {
      if (this.renderableGeometries[i].id === ID) {
        return this.renderableGeometries[i];
      }
    }
    return null;
  }
  /* Rendering function
  Since most of the work has been done elsewhere. This function should be
  kept very simple. Just iterate through all renderable meshes and call their
  render function
  */
  render() {
    if (this.needsRedraw) {
      // if (this.frameNo % 3 === 0)
      // {
      //   gl.clearColor(0.2, 0.0, 0.0, 1.0);
      // } else if (this.frameNo % 3 === 1) {
      //   gl.clearColor(0.0, 0.2, 0.0, 1.0);
      // } else {
      //   gl.clearColor(0.0, 0.0, 0.2, 1.0);
      // }
      /* Different rendering passes can be added to the render() function
      e.g. render to texture, shadow pass, etc...
      */
      let renderToScreenStage = false;
      let saveToDisk = false;
      for (let cameraID = 0; cameraID < this.cameraManager.cameras.length; cameraID++) {
        // Get current camera and set appropriate framebuffer
        const currentCamera = this.cameraManager.getCamera(cameraID);
        if (this.cameraManager.getCameraTarget(cameraID) !== -1) {
          renderToScreenStage = true;
        }
        const transformMatrices = currentCamera.getTransformMatrices();
        for (let i = 0; i < this.renderableGeometries.length; i++) {
          const currentRenderableGeometry = this.renderableGeometries[i];

          for (let j = 0; j < currentRenderableGeometry.groups.length; j++) {
            const currentRenderableGroup = currentRenderableGeometry.groups[j];

            for (let k = 0; k < currentRenderableGroup.meshes.length; k++) {
              const currentRenderableMesh = currentRenderableGroup.meshes[k];
              currentRenderableMesh.render(transformMatrices);
            }
          }
        }
        // Put the rendered content of the first camera to screen
        if (renderToScreenStage === true) {
          this.renderToScreen(this.framebufferManager.getFramebufferTexture(this.cameraManager.getCameraTarget(cameraID)));
        }
        if (saveToDisk === true) {
          //this.framebufferManager.outputContent(currentCameraTarget);
        }
      }

      // console.log("Draw completed. Frame No. ", this.frameNo);

      this.needsRedraw = false;
      this.frameNo++;
    }
  }

  renderToScreen(tex) {
    const gl = this.glContext;
    this.framebufferManager.bindFramebuffer(-1);

    const screenQuadProgram = this.programManager.getProgram(this.programManager.getScreenQuadProgramID());

    screenQuadProgram.use();

    // This is just to show buffer reuse. Change planeXY will affect the on-screen compositing, which is
    // not what we want.
    // Also be awared that we are acutally looking at the "back" face of this on-screen quad, since left hand coord is used for NDC space

    const buffer0 = this.bufferManager.getVertexBufferByName('triangles_planeXY_vertex_position');
    const buffer1 = this.bufferManager.getVertexBufferByName('triangles_planeXY_vertex_tex_coord');
    const buffer2 = this.bufferManager.getVertexIndexBufferByName('triangles_planeXY_vertex_index');

    /* left hand coord is used for NDC space */
    // let buffer2 = new Buffer(gl).setData({
    //   data: new Uint16Array([0, 2, 1, 2, 3, 1]),
    //   target: GL.ELEMENT_ARRAY_BUFFER,
    //   size: 1
    // });

    screenQuadProgram.setBuffers({
      position: buffer0,
      texCoords: buffer1,
      index: buffer2
    });

    screenQuadProgram.setUniforms({
      screenTexture: tex
    });

    gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
  }
}
