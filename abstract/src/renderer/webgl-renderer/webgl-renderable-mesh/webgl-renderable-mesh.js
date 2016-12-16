// All RenderableMesh objects know how to render itself
// Probably WebGLTriangles, WebGLLines, WebGLPoints, WebGLQuads and their instanced counterparts will suffice right now

/* The base class, RenderableMesh
This is
*/
export class WebGLRenderableMesh {
  constructor({mesh, renderer}) {
    console.log('WebGLRenderable.constructor()');
    // These can be initialized in the super class because they are required for all Mesh objects
    this.renderer = renderer;

    // hidden
    this.hidden = false;

    // It has a reference to the abstract mesh. Remember, abstract mesh
    // may or may not be the same as the renderable mesh
    this.mesh = mesh;

    // We store IDs here because our buffer management is centralized.
    this._vertexBufferIDs = [];

    // Number of primitives depends on what kind of primitive this mesh holds
    this._numberOfPrimitives = 0;

    // Model matrix for moving the mesh easier
    // Mesh space stuff, such as rotation, scaling probably will happen here
    this._modelMatrix = mesh.modelMatrix;

    // default program
    this._programID = this.renderer.programManager.getDefaultProgramID();

    // All renderable mesh need to have vertice position, texture coords, vertex color and vertex indices
    this._vertexBufferIDs.push(this.renderer.bufferManager.newVertexBuffer({
      id: mesh.id + '_vertex_position',
      data: mesh.vertices,
      size: 3
    }));
    this._vertexBufferIDs.push(this.renderer.bufferManager.newVertexBuffer({
      id: mesh.id + '_vertex_tex_coord',
      data: mesh.texCoords,
      size: 2
    }));
    this._vertexBufferIDs.push(this.renderer.bufferManager.newVertexBuffer({
      id: mesh.id + '_vertex_color',
      data: mesh.color,
      size: 4
    }));
    this._vertexIndexBufferID = this.renderer.bufferManager.newVertexIndexBuffer({
      id: mesh.id + '_vertex_index',
      data: mesh.vertexIndices
    });

    console.log("WebGLRenderable.constructor() done");
  }

  // Convenient function for communicating with resource managers
  getVertexBufferByID(id) {
    return this.renderer.bufferManager.getVertexBufferByID(id);
  }

  getVertexIndexBufferByID(id) {
    return this.renderer.bufferManager.getVertexIndexBufferByID(id);
  }

  getProgramByID(id) {
    return this.renderer.programManager.getProgram(id);
  }

  render(transformMatrices) {
    // These are default attributes and uniforms
    // We can add more default stuff here
    this.getProgramByID(this._programID).use();

    this.getProgramByID(this._programID).setBuffers({
      position: this.getVertexBufferByID(this._vertexBufferIDs[0]),
      texCoords: this.getVertexBufferByID(this._vertexBufferIDs[1]),
      color: this.getVertexBufferByID(this._vertexBufferIDs[2]),
      index: this.getVertexIndexBufferByID(this._vertexIndexBufferID)
    });

    this.getProgramByID(this._programID).setUniforms({
      modelMatrix: this._modelMatrix
    });

    this.getProgramByID(this._programID).setUniforms({
      viewProjectionMatrix: transformMatrices.viewProjectionMatrix
    });
  }
}
