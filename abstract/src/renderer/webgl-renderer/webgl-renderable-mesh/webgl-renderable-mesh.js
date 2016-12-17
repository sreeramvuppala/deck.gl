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
    this._vertexBufferIDs = new Map();

    // Number of primitives depends on what kind of primitive this mesh holds
    this._numberOfPrimitives = 0;

    // Model matrix for moving the mesh easier
    // Mesh space stuff, such as rotation, scaling probably will happen here
    this._modelMatrix = mesh.modelMatrix;

    // default program
    this._programID = this.renderer.programManager.getDefaultProgramID();

    // All renderable mesh need to have vertice position, texture coords, vertex color and vertex indices
    this._vertexBufferIDs.set(
      'vertices',
      this.renderer.bufferManager.newVertexBuffer({
        id: mesh.id + '_vertex_position',
        data: mesh.attributes.get('vertices'),
        size: 3
      })
    );

    this._vertexBufferIDs.set(
      'texCoords',
      this.renderer.bufferManager.newVertexBuffer({
        id: mesh.id + '_vertex_tex_coord',
        data: mesh.attributes.get('texCoords'),
        size: 2
      })
    );

    this._vertexBufferIDs.set(
      'color',
      this.renderer.bufferManager.newVertexBuffer({
        id: mesh.id + '_vertex_color',
        data: mesh.attributes.get('color'),
        size: 4
      })
    )

    this._vertexBufferIDs.set(
      'vertexIndices',
      this.renderer.bufferManager.newVertexIndexBuffer({
        id: mesh.id + '_vertex_index',
        data: mesh.attributes.get('vertexIndices')
      })
    );

    console.log("WebGLRenderable.constructor() done");
  }

  // Convenient function for communicating with resource managers
  getVertexBufferByID(id) {
    return this.renderer.bufferManager.getVertexBufferByID(this._vertexBufferIDs.get(id));
  }

  getVertexIndexBufferByID(id) {
    return this.renderer.bufferManager.getVertexIndexBufferByID(this._vertexBufferIDs.get(id));
  }

  getProgramByID(id) {
    return this.renderer.programManager.getProgram(id);
  }

  render(transformMatrices) {
    // These are default attributes and uniforms
    // We can add more default stuff here
    this.getProgramByID(this._programID).use();

    const buffer0 = this.getVertexBufferByID('vertices');
    const buffer1 = this.getVertexBufferByID('texCoords');
    const buffer2 = this.getVertexBufferByID('color');
    const buffer3 = this.getVertexIndexBufferByID('vertexIndices');

    this.getProgramByID(this._programID).setBuffers({
      position: buffer0,
      texCoords: buffer1,
      color: buffer2,
      index: buffer3
    });

    this.getProgramByID(this._programID).setUniforms({
      modelMatrix: this._modelMatrix
    });

    this.getProgramByID(this._programID).setUniforms({
      viewProjectionMatrix: transformMatrices.viewProjectionMatrix
    });
  }
}
