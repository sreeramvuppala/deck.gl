import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {GL} from 'luma.gl';

export default class WebGLInstancedTriangles extends WebGLRenderableMesh {
  constructor({instancedTriangles, renderer}) {
    super({mesh: instancedTriangles, renderer});

    this._numberOfPrimitives = instancedTriangles.attributes.get('vertexIndices').length / 3;

    // Additional properties and attributes required for instanced drawing
    this._numberOfInstances = instancedTriangles.attributes.get('instancedPosition').length / 3;

    this._vertexBufferIDs.set(
      'instancedPosition',
      this.renderer.bufferManager.newVertexBuffer({
        data: instancedTriangles.attributes.get('instancedPosition'),
        size: 3,
        instanced: 1,
        id: instancedTriangles.id + '_instanced_position'
      })
    );

    this._vertexBufferIDs.set(
      'instancedColor',
      this.renderer.bufferManager.newVertexBuffer({
        data: instancedTriangles.attributes.get('instancedColor'),
        size: 4,
        instanced: 1,
        id: instancedTriangles.id + '_instanced_color'
      })
    );

    this._vertexBufferIDs.set(
      'instancedRadius',
      this.renderer.bufferManager.newVertexBuffer({
        data: instancedTriangles.attributes.get('instancedRadius'),
        size: 1,
        instanced: 1,
        id: instancedTriangles.id + '_instanced_radius'
      })
    );

    // Standard instanced drawing shaders
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

    this._programID = this.renderer.programManager.newProgramFromShaders({
      vsSource,
      fsSource
    });
  }

  render(transformMatrices) {
    super.render(transformMatrices);

    // Additional attributes (instance drawing related)
    /* because setBuffers are separated into two calls between super class's render()
    and sub class's render(), luma.gl will complain that some attributes are not supplied
    in the first setBuffers() call. But the rendering works fine */
    this.getProgramByID(this._programID).setBuffers({
      instancedPosition: this.getVertexBufferByID('instancedPosition'),
      instancedColor: this.getVertexBufferByID('instancedColor'),
      instancedRadius: this.getVertexBufferByID('instancedRadius')
    });

    const extension = this.renderer.glContext.getExtension('ANGLE_instanced_arrays');

    extension.drawElementsInstancedANGLE(
      GL.TRIANGLES, this._numberOfPrimitives * 3, this.renderer.glContext.UNSIGNED_SHORT, 0, this._numberOfInstances
      );
  }

  updateAttribute({attributeID, mesh}) {
    this.getVertexBufferByID(attributeID).setData({data: mesh.attributes.get(attributeID), size: 3, target: GL.ARRAY_BUFFER, instanced: 1});
  }

}
