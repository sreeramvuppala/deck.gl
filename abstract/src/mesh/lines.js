import {Mesh} from './mesh';

export default class Line extends Mesh {
  constructor({vertices, texCoords, color, vertexIndices, id}) {
    super();
    this.vertices = new Float32Array(vertices);
    this.texCoords = new Float32Array(texCoords);
    this.color = new Float32Array(color);
    this.vertexIndices = new Uint16Array(vertexIndices);
    this.id = 'line_' + id;
  }
}
