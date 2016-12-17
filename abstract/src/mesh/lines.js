import {Mesh} from './mesh';

export default class Line extends Mesh {
  constructor({vertices, texCoords, color, vertexIndices, id}) {
    super();
    this.attributes.set(
      'vertices',
      new Float32Array(vertices)
    );
    this.attributes.set(
      'texCoords',
      new Float32Array(texCoords)
    );
    this.attributes.set(
      'color',
      new Float32Array(color)
    );
    this.attributes.set(
      'vertexIndices',
      new Uint16Array(vertexIndices)
    );
    this.id = 'line_' + id;
  }
}
