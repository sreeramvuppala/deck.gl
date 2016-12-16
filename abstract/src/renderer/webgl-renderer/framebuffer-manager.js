import {Framebuffer, GL} from 'luma.gl';

export class FramebufferManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.framebuffers = [];
  }

  newFramebuffer({width, height}) {
    const framebuffer = new Framebuffer(this.renderer.glContext, {width, height});
    this.framebuffers.push(framebuffer);
    return this.framebuffers.length - 1;
  }

  bindFramebuffer(ID) {
    const gl = this.renderer.glContext;
    if (ID === -1) {
      gl.bindFramebuffer(GL.FRAMEBUFFER, null);
      gl.clearColor(0.2, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);
      // gl.enable(gl.CULL_FACE);
      // gl.frontFace(gl.CCW);
    } else {
      this.framebuffers[ID].bind();
      gl.clearColor(0.0, 0.0, 0.2, 1.0);
      gl.enable(gl.DEPTH_TEST);
      // gl.enable(gl.CULL_FACE);
      // gl.frontFace(gl.CCW);
    }
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.frontFace(gl.CCW);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  }

  getFramebufferTexture(ID) {
    return this.framebuffers[ID].texture;
  }
  // outputContent(ID) {
  //   if (ID === -1) {
  //     this.renderer.glContext.bindFramebuffer(this.renderer.glContext.FRAMEBUFFER, null);
  //   } else {
  //     this.framebuffers[ID].bind();
  //   }
  //   var data = new Uint8Array(16 * 16 * 4);
  //   this.renderer.glContext.readPixels(0, 0, 16, 16, this.renderer.glContext.RGBA, this.renderer.glContext.UNSIGNED_BYTE, data);
  //   console.log("framebuffer content: ", data);
  // }

}
