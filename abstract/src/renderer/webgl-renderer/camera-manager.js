import {Camera} from '../../camera';

/* Camera management
From renderer's point of view, a camera is just a set of
transformation matrices and a render target that receives
most of interactive commands from the user */
export class CameraManager {
  constructor(renderer) {
    this.renderer = renderer;
    // stores Camera objects
    this.cameras = [];
    // stores Framebuffer objects
    this.cameraTargets = [];
    // active camera
    this.activeCameraID = null;
  }

  newCamera({id, pos, anchor, up, fovY, aspect, near, far, type, target = null}) {
    const camera = new Camera({
      id,
      pos,
      anchor,
      up,
      fovY,
      aspect,
      near,
      far,
      type: 'perspective'
    });

    this.cameras.push(camera);

    if (target === null) {
      // using a special sentinel value for default framebuffer target
      this.cameraTargets.push(-1);
    } else {
      this.cameraTargets.push(target);
    }

    if (this.cameras.length === 1) {
      this.activeCameraID = 0;
    }
  }

  getCamera(ID) {
    this.renderer.framebufferManager.bindFramebuffer(this.cameraTargets[ID]);
    return this.cameras[ID];
  }

  getCameraTarget(ID) {
    return this.cameraTargets[ID];
  }

  setDefaultCamera(ID) {
    if (ID > this.cameras.length - 1) {
      console.log("invalid camera ID. out of range");
      return;
    }
    this.activeCameraID = ID;
  }

  processEvent(event) {
    const value = event.deltaY;
    this.cameras[this.activeCameraID].moveToAnchor({
      distance: value / 10.0
    });
    this.renderer.needsRedraw = true;
  }
}
