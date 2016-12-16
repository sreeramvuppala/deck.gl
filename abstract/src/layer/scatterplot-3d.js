import {Layer} from './layer';
import {InstancedSpheres} from '../mesh';
import flattenDeep from 'lodash.flattendeep';

export default class Scatterplot3D extends Layer {
  constructor({data, color, size, id = ''}) {
    super({id});
    this.data = data;
    this.geometry.data = data;
    this.geometry.color = color;
    this.geometry.size = size;
  }

  generateGeometry() {
    /* We didn't some data processing here. (even though
    it's pretty straight-forward flatten operation) */
    const instancedSpheres = new InstancedSpheres({
      instancedPosition: flattenDeep(this.geometry.data),
      instancedColor: flattenDeep(this.geometry.color),
      instancedRadius: flattenDeep(this.geometry.size),
      id: this.id
    });

    this.geometry.groups[0].meshes.push(instancedSpheres);
  }

  rotateAlongZAxis(angle) {
    const sin_angle = Math.sin(angle);
    const cos_angle = Math.cos(angle);
    for (let i = 0; i < this.data.length; i++) {
      this.data[i][0] = this.data[i][0] * cos_angle - this.data[i][1] * sin_angle;
      this.data[i][1] = this.data[i][0] * sin_angle + this.data[i][1] * cos_angle;
    }
    this.geometry.data = this.data;
    this.updateGeometry();
  }

  updateGeometry() {
    const groupID = 0;
    const meshID = 0;
    this.geometry.groups[groupID].meshes[meshID].updateInstancedPositions(flattenDeep(this.geometry.data));
    // notify the container that data has changed
    for (let i = 0; i < this.containers.length; i++) {
      this.containers[i].notifyDataChange({layerID: this.id, groupID, meshID});
    }
  }
}
