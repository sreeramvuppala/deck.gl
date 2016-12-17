import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {GL} from 'luma.gl';

export default class WebGLTriangles extends WebGLRenderableMesh {
  constructor({triangles, renderer}) {
    super({mesh: triangles, renderer});
    this._numberOfPrimitives = triangles.attributes.get('vertexIndices').length / 3;
  }

  render(transformMatrices) {
    super.render(transformMatrices);
    this.renderer.glContext.drawElements(GL.TRIANGLES, this._numberOfPrimitives * 3, this.renderer.glContext.UNSIGNED_SHORT, 0);
  }
}
