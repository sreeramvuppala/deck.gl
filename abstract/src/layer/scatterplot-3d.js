import {Layer} from './layer';
import {InstancedSpheres} from '../mesh';

function flatten(data) {
  const dim0 = data.length;
  const dim1 = data[0].length;

  if (dim1 === undefined) {
    return data;
  }
  const retArray = new Array(dim0 * dim1);
  for (let i = 0; i < dim0; i++) {
    for (let j = 0; j < dim1; j++) {
      retArray[j + i * dim1] = data[i][j];
    }
  }
  return retArray;
}

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
      instancedPosition: flatten(this.geometry.data),
      instancedColor: flatten(this.geometry.color),
      instancedRadius: flatten(this.geometry.size),
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
    this.geometry.groups[groupID].meshes[meshID].updateAttribute({
      attributeID: 'instancedPosition',
      data: flatten(this.geometry.data)
    });
    // notify the container that data has changed
    for (let i = 0; i < this.containers.length; i++) {
      this.containers[i].notifyDataChange({
        layerID: this.id,
        groupID,
        meshID,
        attributeID: 'instancedPosition'
      });
    }
  }
}
