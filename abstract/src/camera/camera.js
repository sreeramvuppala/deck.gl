/*
Cameras

Just standard cameras right now
We need to have cameras that are compatible
with existing deck.gl viewport and maybe Mapbox viewport/camera

*/

import {vec3, mat4} from 'gl-matrix';
/*
These two matrices is all what a camera can do with rendering
*/
class TranformMatrices {
  constructor() {
    this.viewMatrix = null;
    this.projectionMatrix = null;
    this.viewProjectionMatrix = null;
  }
}

/*
Camera can be perspective or orthogonal.
Camera is renderer specific. Camera object should
also indicating what target it wish to draw on
*/
export default class Camera {
  constructor({pos, anchor, up, fovY, aspect, near, far, type}) {
    this.pos = vec3.fromValues(pos[0], pos[1], pos[2]);
    this.anchor = vec3.fromValues(anchor[0], anchor[1], anchor[2]);
    this.up = vec3.fromValues(up[0], up[1], up[2]);
    this.fovY = fovY;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.type = type;

    this.transformMatrices = new TranformMatrices();

    let viewMatrix = mat4.create();
    let projectionMatrix = mat4.create();
    let viewProjectionMatrix = mat4.create();

    mat4.lookAt(viewMatrix, pos, anchor, up);
    if (type === "perspective") {
      mat4.perspective(projectionMatrix, fovY, aspect, near, far)
    }

    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    this.transformMatrices.viewMatrix = viewMatrix;
    this.transformMatrices.projectionMatrix = projectionMatrix;
    this.transformMatrices.viewProjectionMatrix = viewProjectionMatrix;

  }

  moveToAnchor({distance}) {

    const transVector = vec3.create();

    vec3.subtract(transVector, this.pos, this.anchor);
    vec3.normalize(transVector, transVector);
    vec3.scale(transVector, transVector, distance);

    mat4.translate(this.transformMatrices.viewMatrix, this.transformMatrices.viewMatrix, transVector);
    mat4.multiply(this.transformMatrices.viewProjectionMatrix, this.transformMatrices.projectionMatrix, this.transformMatrices.viewMatrix);
  }

  getTransformMatrices() {
    return this.transformMatrices;
  }
}

