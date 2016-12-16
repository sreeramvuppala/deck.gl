import {Mesh} from './mesh';
import {mat4} from 'gl-matrix';

export default class InstancedSpheres extends Mesh {
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

    this.id = 'instanced_sphere_' + id;
  }

  updateInstancedPositions(newPositions) {
    for (let i = 0; i < this.instancedPosition.length; i++) {
      this.instancedPosition[i] = newPositions[i];
    }
  }

}
