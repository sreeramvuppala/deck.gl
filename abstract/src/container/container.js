/*
Containers are data holders.  (Model)
They hold abstract data. Data are organized into layers (or a more general name here?)
TODO: move camera array to renderer. Camera is more for presenting the data
than the data itself
*/

export default class Container {
  constructor({controller}) {
    // A container can have multiple renderers
    this.controller = controller;

    /* It definitely can have multiple layers. We are expecting the
     whole framework to function properly with hundreds of layers */
    this.layers = [];
    this.layerOrder = [];

    // state variables

    // if data structure changed
    this.dataStructureChanged = false;

    // compute canvas and compute webgl context
    this.computeCanvas = null;
    this.computeContext = null;
  }

  addLayers(layer) {
    if (layer.geometry.generated === false) {
      layer.generateGeometry();
      layer.geometry.generated = true;
    }
    this.layers.push(layer);
    this.layerOrder.push(this.layers.length - 1);

    layer.attachContainer({container: this});

    this.dataStructureChanged = true;
  }

  getLayerByID(id) {
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].id === id) {
        return this.layers[i];
      }
    }
    return null;
  }

  notifyDataStructureChange() {
  }

  notifyDataChange({layerID, groupID, meshID}) {
    this.controller.updateRenderableGeometries({
      layerID,
      groupID: 0,
      meshID: 0
    });
  }
}
