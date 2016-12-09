// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
/* eslint-disable func-style */
/* eslint-disable no-console */
/* global console, process */
/* global document, window */
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from 'redux';
import {Provider, connect} from 'react-redux';

import {GL, createGLContext, Buffer, Shader, Program} from 'luma.gl';
import {mat2, mat4, vec2, vec4} from 'gl-matrix';
import autobind from 'autobind-decorator';
import flattenDeep from 'lodash.flattendeep';

// import * as request from 'd3-request';
import {FPSStats} from 'react-stats';

// ---- Default Settings ---- //
/* eslint-disable no-process-env */
// const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN ||
//  'Set MAPBOX_ACCESS_TOKEN environment variable or put your token here.';

const INITIAL_STATE = {
  camera: {
    position: [1.0, 1.0, 1.0],
    lookAt: [0.0, 0.0, 0.0],
    fov: 30,
    aspectRatio: 0.75
  },
  dataProcessed: false
};

function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
  case 'PREPROCESS':
    return {...state, dataProcessed: true};
  default:
    return state;
  }
}

// ---Action--- //

function preprocessData(rawData) {
  return {type: 'PREPROCESS', rawData};
}


/* Renderer classes
Renderers are responsible for data presentation. It knows how to generate renderable
data structures from abstract data. It handles all internal states of a rendering
engine, such as WebGL. It also manages resources such as buffers, textures and programs
to maximize reuse. All rendering optimization (sorting/clipping etc...) happens here
*/

// Base class
class Renderer {
  constructor() {

  }
}

// Different types of renderer goes in here
class HeadlessWebGLRenderer extends Renderer {
  constructor() {
    super();
  }
}

class WebGL2Renderer extends Renderer {
  constructor() {
    super();
  }
}

class WebGLRenderer extends Renderer {
  constructor() {
    super();
    this.currentCanvas = null;
    this.currentRendererContext = null;
    this.debugContext = false;
    this.activated = true;
    this.activeContainer = null;
    this.activeRenderingGeometries = []; // These are an array that holds processed geometries ready for rendering. It should mimic the geometries array in activeContainer but should be optimized for rendering performance.
    this.bufferManager = new BufferManager(this);
    this.textureManager = new TextureManager(this);
    this.programManager = new ProgramManager(this);
    this.shaderManager = new ShaderManager(this);

    this.frameNo = 0;
  }

  _initialize(canvas, debug, glOptions) {
    console.log("WebGLRenderer._intialize()");

    this.currentCanvas = canvas;
    this.debugContext = debug;
    this.contextOptions = glOptions;
    try {
      this.currentRendererContext = createGLContext({canvas, debug, ...glOptions});
      console.log("WebGL context successfully created: ", this.currentRendererContext);
    } catch (error) {
      console.log("Context creation failed");
      console.log("error: ", error);
      return;
    }

    if (typeof window !== 'undefined') {
      this.animationFrame = requestAnimationFrame(this._animationLoop);
    }

    const gl = this.currentRendererContext;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    console.log("WebGLRenderer._intialize() done");
  }
  @autobind _animationLoop() {
    // console.log("WebGLRenderer._animationLoop() fired");

    if (this.activated) {
      this.render();
    }
    if (typeof window !== 'undefined') {
      this.animationFrame = requestAnimationFrame(this._animationLoop);
    }
  }

  setActiveContainer(container) {
    this.activeContainer = container;
  }

  generateTrianglesFromTriangles(triangles) {
    return new WebGLTriangles({
      triangles: triangles,
      renderer: this
    });
  }

  generateLineFromLine(line) {
    return new WebGLLine({
      line: line,
      renderer: this
    });
  }

  generateInstancedTrianglesFromInstancedSpheres(instancedSpheres) {
    return new WebGLInstancedTriangles({
      instancedTriangles: instancedSpheres,
      renderer: this
    })

  }

  // This will be a major place
  processContainers() {
    console.log("WebGLRenderer.processContainers()");

    let container = this.activeContainer;

    // When data structure changed, we need to update the rendering geometries.
    // Right now, rendering geometries are regenerated from ground up. This should be
    // optimized to regenerating only the change part of the whole scene tree
    if (container.dataStructureChanged === true) {
      this.activeRenderingGeometries = [];
      let activeRenderingGeometries = this.activeRenderingGeometries;

      for (let i = 0; i < container.layers.length; i++) {
        let currentGeometry = container.layers[container.layerOrder[i]].geometry;
        let currentRenderingGeometry = new RenderingGeometry();

        activeRenderingGeometries.push(currentRenderingGeometry);

        for (let j = 0; j < currentGeometry.groups.length; j++) {
          let currentRenderingGroup = new RenderingGroup();
          currentRenderingGeometry.groups.push(currentRenderingGroup);

          let currentGroup = currentGeometry.groups[j];

          for (let k = 0; k < currentGroup.meshes.length; k++) {
            let currentRenderingMesh;

            let currentMesh = currentGroup.meshes[k];

            let processFunction;

            if (currentMesh instanceof Triangles) {
              currentRenderingMesh = this.generateTrianglesFromTriangles(currentMesh)
            } else if (currentMesh instanceof Line) {
              currentRenderingMesh = this.generateLineFromLine(currentMesh)
            } else if (currentMesh instanceof InstancedSpheres) {
              currentRenderingMesh = this.generateInstancedTrianglesFromInstancedSpheres(currentMesh)
            } else {
              console.log("unknown type of primitive!")
            }
            currentRenderingGroup.meshes.push(currentRenderingMesh);
          }
        }
      }

      // Optimizing renderingGeometries
      // TODO
      container.dataStructureChanged = false;
    }
  }

  render() {
    const container = this.activeContainer;
    const gl = this.currentRendererContext;
    if (container.needsRedraw) {
      // if (this.frameNo % 3 === 0)
      // {
      //   gl.clearColor(0.2, 0.0, 0.0, 1.0);
      // } else if (this.frameNo % 3 === 1) {
      //   gl.clearColor(0.0, 0.2, 0.0, 1.0);
      // } else {
      //   gl.clearColor(0.0, 0.0, 0.2, 1.0);
      // }
      gl.clearColor(0.0, 0.0, 0.2, 1.0);
      gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

      this.processContainers();

      for (let cameraID = 0; cameraID < container.cameras.length; cameraID++) {
        let currentCamera = container.cameras[cameraID];
        let transformMatrices = currentCamera.getTransformMatrices();
        for (let i = 0; i < this.activeRenderingGeometries.length; i++) {
          let currentRenderingGeometry = this.activeRenderingGeometries[i];

          for (let j = 0; j < currentRenderingGeometry.groups.length; j++) {
            let currentRenderingGroup = currentRenderingGeometry.groups[j];

            for (let k = 0; k < currentRenderingGroup.meshes.length; k++) {
              let currentRenderingMesh = currentRenderingGroup.meshes[k];

              currentRenderingMesh.render(transformMatrices);
            }
          }
        }
      }
      console.log("frameNo: ", this.frameNo);
      container.needsRedraw = false;
      this.frameNo++;
    }
  }
}

class BufferManager {
  constructor(renderer) {
    this._renderer = renderer;
    this.vertexBuffers = [];
    this.vertexIndexBuffers = [];
  }

  newVertexBuffer({data, size, instanced = 0}) {
    let buffer = new Buffer(this._renderer.currentRendererContext);
    buffer.setData({data: data, size: size, target: GL.ARRAY_BUFFER, instanced: instanced});
    this.vertexBuffers.push(buffer);
    return this.vertexBuffers.length - 1;
  }

  newVertexIndexBuffer({data}) {
    let buffer = new Buffer(this._renderer.currentRendererContext);
    buffer.setData({data: data, target: GL.ELEMENT_ARRAY_BUFFER});
    this.vertexIndexBuffers.push(buffer);
    return this.vertexIndexBuffers.length - 1;
  }

  getVertexBuffer(index) {
    return this.vertexBuffers[index];
  }

  getVertexIndexBuffer(index) {
    return this.vertexIndexBuffers[index];
  }

}

class VertexAttributeManager {
  constructor(renderer) {
    this._renderer = renderer;

  }
}

class ProgramManager {
  constructor(renderer) {
    this._renderer = renderer;
    this.programs = [];

    this.defaultProgram = null;
  }

  newProgramFromShaders({vsSource, fsSource}) {

    // Create default program
    if (this.defaultProgram === null) {
      const vsSource = `\
      attribute vec3 position;
      attribute vec4 color;
      attribute vec2 texCoords;

      uniform mat4 modelMatrix;
      uniform mat4 viewProjectionMatrix;
      uniform vec3 cameraPosition;

      varying vec4 vColor;
      varying vec2 vTexCoords;

      void main(void) {
        vec4 position_clipspace = viewProjectionMatrix * modelMatrix * vec4(position, 1.0);
        vColor = color;
        vTexCoords = texCoords;
        gl_Position = position_clipspace;
      }
      `;

      const fsSource = `\
      #ifdef GL_ES
      precision highp float;
      #endif

      varying vec4 vColor;
      varying vec2 vTexCoords;

      void main(void) {
        gl_FragColor = vColor;
      }
      `;

      // this._vertexShaderID = this._renderer.shaderManager.newShaderFromSource(vsSource, GL.VERTEX_SHADER);

      // this._fragmentShaderID = this._renderer.shaderManager.newShaderFromSource(fsSource, GL.FRAGMENT_SHADER);

      const defaultProgram = new Program(this._renderer.currentRendererContext, {
        vs: vsSource,
        fs: fsSource
      });
      this.programs.push(defaultProgram);
    }

    const program = new Program(this._renderer.currentRendererContext, {
      vs: vsSource,
      fs: fsSource
    });

    this.programs.push(program);
    return this.programs.length - 1;
  }

  getProgram(id) {
    return this.programs[id];
  }

  getDefaultProgramID() {
    return 0;
  }
}

class ShaderManager {
  constructor(renderer) {
    this._renderer = renderer;
    this.shaders = [];
  }

  newShaderFromSource(source, type) {
    const shader = new Shader(this._renderer.currentRendererContext, source, type);
    this.shaders.push(shader);
    return this.shaders.length - 1;
  }
}

class TextureManager {
  constructor() {
  }
}


class RenderingGeometry {
  constructor() {
    this.groups = [];
  }
}

class RenderingGroup {
  constructor() {
    this.meshes = [];
  }
}

class RenderingMesh {
  constructor({mesh, renderer}) {
    console.log("WebGLRenderable.constructor()");
    this._modelMatrix = null;
    this._renderer = renderer;
    this._vertexBufferIDs = [];
    this._numberOfPrimitives = 0;


    this.mesh = mesh;
    // These can be initialized in the super class because they are required for all Mesh objects
    this._modelMatrix = mesh.modelMatrix;
    this._vertexBufferIDs.push(this._renderer.bufferManager.newVertexBuffer({
      data: mesh.vertices,
      size: 3
    }));
    this._vertexBufferIDs.push(this._renderer.bufferManager.newVertexBuffer({
      data: mesh.texCoords,
      size: 2
    }));
    this._vertexBufferIDs.push(this._renderer.bufferManager.newVertexBuffer({
      data: mesh.color,
      size: 4
    }));
    this._vertexIndexBufferID = this._renderer.bufferManager.newVertexIndexBuffer({
      data: mesh.vertexIndices
    });

    console.log("WebGLRenderable.constructor() done");
  }
  getVertexBufferByID(id) {
    return this._renderer.bufferManager.getVertexBuffer(id);
  }

  getVertexIndexBufferByID(id) {
    return this._renderer.bufferManager.getVertexIndexBuffer(id);
  }


  getProgramByID(id) {
    return this._renderer.programManager.getProgram(id);
  }

  render(transformMatrices) {
    console.log("ERROR! WebGLRenderable.render() shouldn't be called");
  }
}

// Primitives that knows how to render itself
class WebGLTriangles extends RenderingMesh {
  constructor({triangles, renderer}) {
    super({mesh: triangles, renderer: renderer});

    console.log("WebGLTriangles.constructor()");

    this._numberOfPrimitives = triangles.vertexIndices.length / 3;
    this._programID = this._renderer.programManager.getDefaultProgramID();

    console.log("WebGLTriangles constructor done");
  }

  render(transformMatrices) {

    this.getProgramByID(this._programID).use();

    this.getProgramByID(this._programID).setBuffers({
      position: this.getVertexBufferByID(this._vertexBufferIDs[0]),
      texCoords: this.getVertexBufferByID(this._vertexBufferIDs[1]),
      color: this.getVertexBufferByID(this._vertexBufferIDs[2]),
      index: this.getVertexIndexBufferByID(this._vertexIndexBufferID)
      });

    this.getProgramByID(this._programID).setUniforms({
        modelMatrix: this._modelMatrix
      })

    this.getProgramByID(this._programID).setUniforms({
      viewProjectionMatrix: transformMatrices.viewProjectionMatrix
    })

    this._renderer.currentRendererContext.drawElements(GL.TRIANGLES, this._numberOfPrimitives * 3, this._renderer.currentRendererContext.UNSIGNED_SHORT, 0);
  }
}

// Geometries that knows how to render itself
class WebGLLine extends RenderingMesh {
  constructor({line, renderer}) {
    super({mesh: line, renderer: renderer});

    console.log("WebGLLine.constructor()");

    this._numberOfPrimitives = line.vertexIndices.length / 2;
    this._programID = this._renderer.programManager.getDefaultProgramID();

    console.log("WebGLLine constructor done");
  }

  render(transformMatrices) {

    this.getProgramByID(this._programID).use();

    this.getProgramByID(this._programID).setBuffers({
      position: this.getVertexBufferByID(this._vertexBufferIDs[0]),
      texCoords: this.getVertexBufferByID(this._vertexBufferIDs[1]),
      color: this.getVertexBufferByID(this._vertexBufferIDs[2]),
      index: this.getVertexIndexBufferByID(this._vertexIndexBufferID)
      });

    this.getProgramByID(this._programID).setUniforms({
        modelMatrix: this._modelMatrix
      })

    this.getProgramByID(this._programID).setUniforms({
      viewProjectionMatrix: transformMatrices.viewProjectionMatrix
    })

    this._renderer.currentRendererContext.drawElements(GL.LINES, this._numberOfPrimitives * 2, this._renderer.currentRendererContext.UNSIGNED_SHORT, 0);
  }
}

class WebGLInstancedTriangles extends RenderingMesh {
  constructor({instancedTriangles, renderer}) {
    super({mesh: instancedTriangles, renderer: renderer});

    console.log("WebGLInstancedTriangles.constructor()");
    this._numberOfPrimitives = instancedTriangles.vertexIndices.length / 3;
    this._numberOfInstances = instancedTriangles.instancedPosition.length / 3;

    this._vertexBufferIDs.push(this._renderer.bufferManager.newVertexBuffer({
      data: instancedTriangles.instancedPosition,
      size: 3,
      instanced: 1
    }));
    this._vertexBufferIDs.push(this._renderer.bufferManager.newVertexBuffer({
      data: instancedTriangles.instancedColor,
      size: 4,
      instanced: 1
    }));
    this._vertexBufferIDs.push(this._renderer.bufferManager.newVertexBuffer({
      data: instancedTriangles.instancedRadius,
      size: 1,
      instanced: 1
    }));

    const vsSource = `\
    attribute vec3 position;
    attribute vec4 color;
    attribute vec2 texCoords;

    attribute vec3 instancedPosition;
    attribute vec4 instancedColor;
    attribute float instancedRadius;

    uniform mat4 modelMatrix;
    uniform mat4 viewProjectionMatrix;
    uniform vec3 cameraPosition;

    varying vec4 vColor;
    varying vec2 vTexCoords;

    void main(void) {
      vec4 position_clipspace = viewProjectionMatrix * modelMatrix * vec4((position * instancedRadius + instancedPosition), 1.0);
      vColor = instancedColor;
      //vColor = vec4(1.0, 0.5, 0.5, 1.0);
      vTexCoords = texCoords;
      gl_Position = position_clipspace;
    }
    `;

    const fsSource = `\
    #ifdef GL_ES
    precision highp float;
    #endif

    varying vec4 vColor;
    varying vec2 vTexCoords;

    void main(void) {
      gl_FragColor = vColor;
    }
    `;

    this._programID = this._renderer.programManager.newProgramFromShaders({
      vsSource: vsSource,
      fsSource: fsSource
    });

    console.log("WebGLInstancedTriangles.constructor() done");
  }

  render(transformMatrices) {

    this.getProgramByID(this._programID).use();

    this.getProgramByID(this._programID).setBuffers({
        position: this.getVertexBufferByID(this._vertexBufferIDs[0]),
        texCoords: this.getVertexBufferByID(this._vertexBufferIDs[1]),
        color: this.getVertexBufferByID(this._vertexBufferIDs[2]),
        index: this.getVertexIndexBufferByID(this._vertexIndexBufferID),
        instancedPosition: this.getVertexBufferByID(this._vertexBufferIDs[3]),
        instancedColor: this.getVertexBufferByID(this._vertexBufferIDs[4]),
        instancedRadius: this.getVertexBufferByID(this._vertexBufferIDs[5])
      });

    this.getProgramByID(this._programID).setUniforms({
        modelMatrix: this._modelMatrix
      })

    this.getProgramByID(this._programID).setUniforms({
      viewProjectionMatrix: transformMatrices.viewProjectionMatrix
    })

    const extension = this._renderer.currentRendererContext.getExtension('ANGLE_instanced_arrays');

    extension.drawElementsInstancedANGLE(
      GL.TRIANGLES, this._numberOfPrimitives * 3, this._renderer.currentRendererContext.UNSIGNED_SHORT, 0, this._numberOfInstances
      );
  }
}

/*
Containers are data holders. They hold abstract data and abstract cameras for presenting the data.
Data are organized into layers (or a more general name here?)
*/

class Container {
  constructor() {
    this.renderers = [];
    this.layers = [];
    this.cameras = [];
    this.layerOrder = [];

    // state variables
    this.dataChanged = false; // if data content changed
    this.dataStructureChanged = false; // if data structure changed
    this.needsRedraw = false; // if camera/viewport changed
  }

  addLayers(layer) {
    this.layers.push(layer);
    this.layerOrder.push(this.layers.length - 1);

    this.dataChanged = true;
    this.dataStructureChanged = true;
  }

  addCamera(camera) {
    this.cameras.push(camera);
    this.needsRedraw = true; // if camera/viewport changed
  }

  attachRenderer(renderer) {
    this.renderers.push(renderer);
    renderer.setActiveContainer(this);
  }
}



/* Layers are data containers.
  A Layer contains data that stores data in abstract form (maybe high dimensional)
  and a geometry that stores data in representable form (two dimensional or three dimensional,
  at most four with a dimension of time?)
*/
class Layer {
  constructor() {
    this.data = null;
    this.geometry = new Geometry();
    this.opaque = true;
  }
  generateGeometry() {
    console.log("ERROR! Layer.generateGeometry() shouldn't be called");
  }
  setOpaque(opaque) {
    this.opaque = opaque;
  }
}


class Plane extends Layer {
  constructor({data}) {
    super();
    this.data = data;
    this.geometry.data = data;
    this.geometry.texCoords = [1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0];
    this.geometry.color = [1.0, 0.0, 0.0, 0.5, 0.0, 1.0, 0.0, 0.5, 0.0, 0.0, 1.0, 0.5, 1.0, 1.0, 0.0, 0.5];
    this.geometry.vertexIndices = [0, 2, 1, 3, 1, 2];
  }

  generateGeometry() {
    const defaultGroup = new Group();
    this.geometry.groups.push(defaultGroup);

    let quad = new Triangles({
      vertices: this.data,
      texCoords: this.geometry.texCoords,
      color: this.geometry.color,
      vertexIndices: this.geometry.vertexIndices,
      id: 0
    });

    defaultGroup.meshes.push(quad);
  }
}

class Axes extends Layer {
  constructor() {
    super();
    this.data = [[-2.0, 0.0, 0.0, 2.0, 0.0, 0.0], [0.0, -2.0, 0.0, 0.0, 2.0, 0.0], [0.0, 0.0, -2.0, 0.0, 0.0, 2.0]];

    // Color, texture coordinates and vertex indices are representation related
    // So they are stored in geometry instead of directly under Layer
    this.geometry.data = this.data;
    this.geometry.texCoords = [[1.0, 1.0, 1.0, 0.0], [0.0, 1.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]];
    this.geometry.color = [[1.0, 0.5, 0.0, 1.0, 1.0, 0.0, 0.5, 1.0], [0.0, 0.5, 1.0, 1.0, 0.5, 0.0, 1.0, 1.0], [0.5, 1.0, 0.0, 1.0, 0.0, 1.0, 0.5, 1.0]];
    this.geometry.vertexIndices = [0, 1];
  }

  generateGeometry() {
    const defaultGroup = new Group();
    this.geometry.groups.push(defaultGroup);

    for (let lineID = 0; lineID < this.data.length; lineID++) {

      let line = new Line({
        vertices: this.data[lineID],
        texCoords: this.geometry.texCoords[lineID],
        color: this.geometry.color[lineID],
        vertexIndices: this.geometry.vertexIndices
      });

      defaultGroup.meshes.push(line);
    }
  }
}

class Scatterplot3D extends Layer {
  constructor({data, color, size}) {
    super();
    this.data = data;
    this.geometry.data = data;
    this.geometry.color = color;
    this.geometry.size = size;
  }

  generateGeometry() {
    const defaultGroup = new Group();
    this.geometry.groups.push(defaultGroup);

    let instancedSpheres = new InstancedSpheres({
      instancedPosition: flattenDeep(this.geometry.data),
      instancedColor: flattenDeep(this.geometry.color),
      instancedRadius: flattenDeep(this.geometry.size)
    })

    defaultGroup.meshes.push(instancedSpheres);
  }

  // createRandomTestData() {
  //   const numOfPoints = 10000;
  //   this.data = new Float32Array(numPoints);
  //   this.data.map(a => Math.random());
  //   console.log("Generating random data: ", this.data);
  // }
}


/* data in representable form */
class Geometry {
  constructor() {
    this.groups = [];
    /* are these necessary? */
    this.data = null;
    this.texCoords = null;
    this.color = null;
    this.vertexIndices = null;
  }
}

/* Group is an extra layer of aggregation that helps
renderer reorganizing meshes
*/
class Group {
  constructor() {
    this.meshes = [];
  }
}

/*
Meshes are consists of a bunch of primitives. Primitives doesn't need to
coincide with primitives renderers support natively. But any renderer
needs to know how to convert each type of primitives here
to real native primitives that can be rendered
*/
class Mesh {
  constructor() {
    this.vertices = null;
    this.texCoords = null;
    this.color = null;
    this.vertexIndices = null;
    this.normals = null;
    this.modelMatrix = null;
    this.id = null;
  }
}

class Triangles extends Mesh {
  constructor({vertices, texCoords, color, vertexIndices, id}) {
    super();
    this.vertices = new Float32Array(vertices);
    this.texCoords = new Float32Array(texCoords);
    this.color = new Float32Array(color);
    this.vertexIndices = new Uint16Array(vertexIndices);
    this.modelMatrix = mat4.create();
    this.id = id;
  }
}

class Line extends Mesh {
  constructor({vertices, texCoords, color, vertexIndices, id}) {
    super();
    this.vertices = new Float32Array(vertices);
    this.texCoords = new Float32Array(texCoords);
    this.color = new Float32Array(color);
    this.vertexIndices = new Uint16Array(vertexIndices);
    this.modelMatrix = mat4.create();
    this.id = id;
  }
}

class InstancedSpheres extends Mesh {
  constructor({instancedPosition, instancedColor, instancedRadius, id}) {
    super();
    const X = 0.525731112119133606;
    const Z = 0.850650808352039932;
    // 12 vertices
    this.vertices = new Float32Array([
      -X, 0.0, Z, X, 0.0, Z, -X, 0.0, -Z, X, 0.0, -Z,
      0.0, Z, X, 0.0, Z, -X, 0.0, -Z, X, 0.0, -Z, -X,
      Z, X, 0.0, -Z, X, 0.0, Z, -X, 0.0, -Z, -X, 0.0
      ]);

    // 20 triangles, 60 vertex indices
    this.vertexIndices = new Uint16Array([
      0, 4, 1, 0, 9, 4, 9, 5, 4, 4, 5, 8, 4, 8, 1,
      8, 10, 1, 8, 3, 10, 5, 3, 8, 5, 2, 3, 2, 7, 3,
      7, 10, 3, 7, 6, 10, 7, 11, 6, 11, 0, 6, 0, 1, 6,
      6, 1, 10, 9, 0, 11, 9, 11, 2, 9, 2, 5, 7, 2, 11
      ]);

    // no texture coord for now
    this.texCoords = new Float32Array(12 * 2);

    // this is not in use for instanced rendering
    this.color = new Float32Array(12 * 4);
    for (let i = 0; i < 12; i++) {
      this.color[i * 4 + 0] = 1.0;
      this.color[i * 4 + 1] = 0.0;
      this.color[i * 4 + 2] = 0.0;
      this.color[i * 4 + 3] = 1.0;
    }

    this.instancedPosition = new Float32Array(instancedPosition);
    this.instancedColor = new Float32Array(instancedColor);
    this.instancedRadius = new Float32Array(instancedRadius);

    this.modelMatrix = mat4.create();
    this.id = id;


  }

}
/*
Cameras

Just standard cameras right now
We need to have cameras that are compatible
with existing deck.gl viewport and maybe Mapbox viewport/camera

*/

/*
These two matrices is all what a camera can do with rendering
*/
class TranformMatrices {
  constructor() {
    this.viewMatrix = null;
    this.projectionMatrix = null;
    this.viewProjectionMatrix = null;
  }
}

/*
Camera can be perspective or orthogonal
*/
class Camera {
  constructor({eye, lookAt, up, fovY, aspect, near, far, type}) {
    this.transformMatrices = new TranformMatrices();

    let viewMatrix = mat4.create();
    let projectionMatrix = mat4.create();
    let viewProjectionMatrix = mat4.create();

    mat4.lookAt(viewMatrix, eye, lookAt, up);
    if (type === "perspective") {
      mat4.perspective(projectionMatrix, fovY, aspect, near, far)
    }

    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    this.transformMatrices.viewMatrix = viewMatrix;
    this.transformMatrices.projectionMatrix = projectionMatrix;
    this.transformMatrices.viewProjectionMatrix = viewProjectionMatrix;
  }

  getTransformMatrices() {
    return this.transformMatrices;
  }
}

/*
Example App

Example app should manipulate container, camera and renderer only.
We should specify APIs for these classes.

We also need to speficy APIs for generating and manipulating Layers.
*/
class ExampleApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentWillMount() {
    this._handleResize();
    window.addEventListener('resize', this._handleResize);
    this._loadData();
  }

  componentDidMount() {
    const debug = false;
    const glOptions = null;

    // Before creating the WebGL renderer, a canvas should be ready
    this.renderer = new WebGLRenderer();
    this.renderer._initialize(this.refs.canvas, debug, glOptions);

    // create container
    this.container = new Container();

    // create camera
    this.camera = new Camera({
      eye: [1, 2, -3],
      lookAt: [0.0, 0.0, 0.0],
      up: [0.0, -1.0, 0.0],
      fovY: 45,
      aspect: this.refs.canvas.width/this.refs.canvas.height,
      near: 0.1,
      far: 100.0,
      type: "perspective"
    });

    // camera is owned by container
    this.container.addCamera(this.camera);

    // container and renderer should be independent.
    // However, we should have a way to reset renderer to its initial state
    this.container.attachRenderer(this.renderer);

    // These are all "layers"

    // These two are opaque layers
    const axes = new Axes();
    axes.generateGeometry();

    let scatterplotData = [];
    let scatterplotColor = [];
    let scatterplotSize = [];

    for (let i = 0; i < 100; i++) {
      scatterplotData.push([Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * -1.0]);
      scatterplotColor.push([Math.random() * 1.0, Math.random() * 1.0, Math.random() * 1.0, 1.0]);
      scatterplotSize.push(Math.random() * 0.1);
    }
    const scatterplot = new Scatterplot3D({
      data: scatterplotData,
      color: scatterplotColor,
      size: scatterplotSize,
    })
    scatterplot.generateGeometry();

    // This is a transparent layer.
    const plane = new Plane({
      data: [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]
    });
    plane.generateGeometry();

    // Add layers in order.
    // Eventually r
    this.container.addLayers(axes);
    this.container.addLayers(scatterplot);
    this.container.addLayers(plane);
  }

  @autobind _handleResize() {
    this.setState({width: window.innerWidth, height: window.innerHeight});
  }

  @autobind _handleDataLoaded(rawData) {
    this.props.dispatch(preprocessData(rawData));
  }

  _loadData() {
    const data = [[0.5, 0.2, 0.3], [0.3, -0.2, 0.1], [1.0, -0.3, 2.2]];
    this._handleDataLoaded(data);
  }

  render() {
    const {id} = this.props;
    const {width, height} = this.state;
    return (
      <div>
        <div ref="fps" className="fps" />
        <canvas
          ref = {'canvas'}
          width = {width}
          height = {height} />
        <FPSStats isActive/>
      </div>
      );
  }
}

function mapStateToProps(state) {
  return {
    camera: state.camera
  };
}

// ---- Main ---- //
const store = createStore(reducer);
const App = connect(mapStateToProps)(ExampleApp);

const container = document.createElement('div');
document.body.appendChild(container);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  container
);
/* eslint-enable func-style */
/* eslint-enable no-console */
