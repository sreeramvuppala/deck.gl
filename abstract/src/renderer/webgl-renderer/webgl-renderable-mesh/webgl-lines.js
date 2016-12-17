import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {GL} from 'luma.gl';

// Geometries that knows how to render itself
export default class WebGLLine extends WebGLRenderableMesh {
  constructor({line, renderer}) {
    super({mesh: line, renderer});
    this._numberOfPrimitives = line.attributes.get('vertexIndices').length / 2;
  }

  render(transformMatrices) {
    super.render(transformMatrices);
    this.renderer.glContext.drawElements(GL.LINES, this._numberOfPrimitives * 2, this.renderer.glContext.UNSIGNED_SHORT, 0);
  }
}
