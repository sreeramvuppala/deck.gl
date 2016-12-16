import {Layer} from './layer';
import {InstancedSpheres} from '../mesh';
import flattenDeep from 'lodash.flattendeep';

export default class L2NormScatterplot extends Layer {
  constructor({data, color, size, id = ''}) {
    super({id});
    this.data = data;
    this.geometry.color = color;
    this.geometry.size = size;
  }

  generateGeometry() {
    this.geometry.data = this.calculateNorm(this.data);

    /* We didn't some data processing here. (even though
    it's pretty straight-forward flatten operation) */
    const instancedSpheres = new InstancedSpheres({
      instancedPosition: flattenDeep(this.geometry.data),
      instancedColor: flattenDeep(this.geometry.color),
      instancedRadius: flattenDeep(this.geometry.size.map(a => a * 0.3)),
      id: this.id
    });

    this.geometry.groups[0].meshes.push(instancedSpheres);
  }

  calculateNorm(data) {
    const retData = [];
    if (this.computeContext !== null && this.useGPUCompute === true) { // GPU data processing

    } else { // CPU data processing
      for (let i = 0; i < data.length; i++) {
        const distance = Math.sqrt(data[i][0] * data[i][0] + data[i][1] * data[i][1] + data[i][1] * data[i][1]);
        retData.push(distance);
        retData.push(distance);
        retData.push(-distance);
      }
    }
    return retData;
  }
}
