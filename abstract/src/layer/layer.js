
/* data in representable form */
class Geometry {
  constructor() {
    this.groups = [];
    /* are these necessary? */
    this.data = null;
    this.texCoords = null;
    this.color = null;
    this.vertexIndices = null;
    this.generated = false;
    this.hidden = false;
  }
}

/* Group is an extra layer of aggregation that helps
renderer reorganizing meshes
*/
class Group {
  constructor() {
    this.meshes = [];
  }
}

/* Layers are data containers.
  A Layer contains "data" property that stores data in an abstract form (maybe high dimensional)
  and a geometry that stores data in representable form (two dimensional or three dimensional,
  at most four with a dimension of time?)
*/
export class Layer {
  constructor({id = ''}) {

    this.containers = [];

    /* data holds the abstract data (or called unprocessed data) in its original form */
    this.data = null;
    /* geometry is a tree structure that hold data in a more presentable way
    There could be significant things going on transforming this.data to this.geometry
    Abstract meshes are generated and stored together to form a group
    */
    this.geometry = new Geometry();
    /* */
    this.computeContext = null;

    this.useGPUCompute = false;

    this.id = id;

    this.geometry.groups.push(new Group());
  }

  generateGeometry() {
  }

  hide() {
    this.geometry.hidden = true;
  }

  show() {
    this.geometry.hidden = false;
  }

  attachContainer({container}) {
    this.containers.push(container);
  }
}





