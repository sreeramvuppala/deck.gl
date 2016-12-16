import {Mesh} from './mesh';

export default class Triangles extends Mesh {
  constructor({vertices, texCoords, color, vertexIndices, id}) {
    super();
    this.vertices = new Float32Array(vertices);
    this.texCoords = new Float32Array(texCoords);
    this.color = new Float32Array(color);
    this.vertexIndices = new Uint16Array(vertexIndices);
    this.id = 'triangles_' + id;
  }

  updateVertices(newVertices) {
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i] = newVertices[i];
    }
  }
}
