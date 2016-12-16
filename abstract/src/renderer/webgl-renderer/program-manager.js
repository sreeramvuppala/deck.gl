import {Program} from 'luma.gl';

// // This is not being used right now. luma.gl didn't expose the Shader class
// class ShaderManager {
//   constructor(renderer) {
//     this.renderer = renderer;
//     this.shaders = [];
//   }

//   newShaderFromSource(source, type) {
//     const shader = new Shader(this.renderer.glContext, source, type);
//     this.shaders.push(shader);
//     return this.shaders.length - 1;
//   }
// }

/* shader management should go here */
export class ProgramManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.programs = [];


    const vsDefault = `\
    attribute vec3 position;
    attribute vec4 color;
    attribute vec2 texCoords;

    uniform mat4 modelMatrix;
    uniform mat4 viewProjectionMatrix;
    uniform vec3 cameraPosition;

    varying vec4 vColor;
    varying vec2 vTexCoords;

    void main(void) {
      vec4 position_clipspace = viewProjectionMatrix * modelMatrix * vec4(position, 1.0);
      vColor = color;
      vTexCoords = texCoords;
      gl_Position = position_clipspace;
    }
    `;

    const fsDefault = `\
    #ifdef GL_ES
    precision highp float;
    #endif

    varying vec4 vColor;
    varying vec2 vTexCoords;

    void main(void) {
      gl_FragColor = vColor;
    }
    `;

    // this._vertexShaderID = this.renderer.shaderManager.newShaderFromSource(vsSource, GL.VERTEX_SHADER);
    // this._fragmentShaderID = this.renderer.shaderManager.newShaderFromSource(fsSource, GL.FRAGMENT_SHADER);

    const defaultProgram = new Program(this.renderer.glContext, {
      vs: vsDefault,
      fs: fsDefault
    });
    this.programs.push(defaultProgram);

    this.defaultProgram = defaultProgram;

      const vsScreenQuad = `\
      attribute vec3 position;
      attribute vec2 texCoords;

      varying vec2 vTexCoords;

      void main(void) {
        vTexCoords = texCoords;
        gl_Position = vec4(position, 1.0);
      }
      `;

      const fsScreenQuad = `\
      #ifdef GL_ES
      precision highp float;
      #endif

      uniform sampler2D screenTexture;
      varying vec2 vTexCoords;

      void main(void) {
        gl_FragColor = texture2D(screenTexture, vTexCoords);
      }
      `;

      // this._vertexShaderID = this.renderer.shaderManager.newShaderFromSource(vsSource, GL.VERTEX_SHADER);
      // this._fragmentShaderID = this.renderer.shaderManager.newShaderFromSource(fsSource, GL.FRAGMENT_SHADER);

      const screenQuadProgram = new Program(this.renderer.glContext, {
        vs: vsScreenQuad,
        fs: fsScreenQuad
      });
      this.programs.push(screenQuadProgram);
      this.screenQuadProgram = screenQuadProgram;

  }

  newProgramFromShaders({vsSource, fsSource}) {
    const program = new Program(this.renderer.glContext, {
      vs: vsSource,
      fs: fsSource
    });

    this.programs.push(program);
    return this.programs.length - 1;
  }

  getProgram(id) {
    return this.programs[id];
  }

  getDefaultProgramID() {
    return 0;
  }

  getScreenQuadProgramID() {
    return 1;
  }
}
