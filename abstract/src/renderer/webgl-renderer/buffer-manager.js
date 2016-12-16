import {Buffer, GL} from 'luma.gl';
export class BufferManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.vertexBuffers = [];
    this.vertexIndexBuffers = [];
  }

  newVertexBuffer({data, size, instanced = 0, id = ''}) {
    const buffer = new Buffer(this.renderer.glContext, {id});
    buffer.setData({data, size, target: GL.ARRAY_BUFFER, instanced});
    this.vertexBuffers.push(buffer);
    return this.vertexBuffers.length - 1;
  }

  newVertexIndexBuffer({data, id = ''}) {
    const buffer = new Buffer(this.renderer.glContext, {id});
    buffer.setData({data, target: GL.ELEMENT_ARRAY_BUFFER});
    this.vertexIndexBuffers.push(buffer);
    return this.vertexIndexBuffers.length - 1;
  }

  getVertexBufferByID(index) {
    return this.vertexBuffers[index];
  }

  getVertexIndexBufferByID(index) {
    return this.vertexIndexBuffers[index];
  }

  getVertexBufferByName(name) {
    for (let index = 0; index < this.vertexBuffers.length; index++) {
      if (this.vertexBuffers[index].id === name) {
        return this.vertexBuffers[index];
      }
    }
    return null;
  }

  getVertexIndexBufferByName(name) {
    for (let index = 0; index < this.vertexIndexBuffers.length; index++) {
      if (this.vertexIndexBuffers[index].id === name) {
        return this.vertexIndexBuffers[index];
      }
    }
    return null;
  }

}
