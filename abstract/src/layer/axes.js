import {Layer} from './layer';
import {Lines} from '../mesh';

export default class Axes extends Layer {
  constructor() {
    super({id: 'axis'});
    this.data = [[-2.0, 0.0, 0.0, 2.0, 0.0, 0.0], [0.0, -2.0, 0.0, 0.0, 2.0, 0.0], [0.0, 0.0, -2.0, 0.0, 0.0, 2.0]];

    this.geometry.data = this.data;
    this.geometry.texCoords = [[1.0, 1.0, 1.0, 0.0], [0.0, 1.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]];
    this.geometry.color = [[1.0, 0.0, 0.0, 1.0 /*red*/, 0.0, 1.0, 0.0, 1.0/*green*/], [0.0, 0.0, 1.0, 1.0/*blue*/, 1.0, 1.0, 0.0, 1.0/*magenta*/], [0.0, 1.0, 1.0, 1.0, /*cyan*/ 1.0, 0.0, 0.1, 1.0 /*yellow*/]];
    this.geometry.vertexIndices = [0, 1];
  }

  generateGeometry() {

    for (let lineID = 0; lineID < this.data.length; lineID++) {

      const line = new Lines({
        vertices: this.data[lineID],
        texCoords: this.geometry.texCoords[lineID],
        color: this.geometry.color[lineID],
        vertexIndices: this.geometry.vertexIndices,
        id: this.id + lineID
      });

      this.geometry.groups[0].meshes.push(line);
    }
  }
}
