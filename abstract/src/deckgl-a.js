/*
In most mobile apps, vanilla MVC pattern will sometimes lead to the "gigantic controller" situation that all codes are implemented in controller class while View and Model classes are relative simple. This is because most apps are dealing with complicated business logic and all those business logic operations map to the controller. This actually defeats the intention of MVC pattern and leads to non-separable classes that are hard to test andn maintain.

However, in our situation, MVC pattern works perfectly. In our visualization apps, View class are the most complicated part of the application, Model class can also be complicated if we'd like to implement some good data processing algorithms, such as PCA or t-SNE, and our Controller class can be very simple.
*/

import React, {PropTypes} from 'react';

import {WebGLRenderer} from './renderer';
import {Container} from './container';
import {EventManager} from './event';

import {Axes, Plane} from './layer';
import autobind from 'autobind-decorator';

export default class DeckGLA extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      startTime: new Date(),
      previousTime: new Date(),
      currentTime: new Date(),
      width: props.width,
      height: props.height
    };
    this.canvas = null;
    this.eventManager = null;
    this.propsChanged = true;
  }

  componentDidMount() {
    this.canvas = this.refs.canvas;

    const debug = false;
    const glOptions = null;

    // Before creating the WebGL renderer, a canvas should be ready
    this.renderer = new WebGLRenderer({controller: this, canvas: this.canvas, debug, glOptions});
    this.container = new Container({controller: this});
    this.eventManager = new EventManager({controller: this, canvas: this.canvas});

    // These are all "layers"
    // These two are opaque layers
    const axes = new Axes();

    this.container.addLayers(axes);

    const planeXY = new Plane({
      data: [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0],
      id: 'planeXY'
    });
    this.container.addLayers(planeXY);

    const planeYZ = new Plane({
      data: [0, -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1],
      id: 'planeYZ'
    });
    this.container.addLayers(planeYZ);

    const planeXZ = new Plane({
      data: [-1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, 1],
      id: 'planeXZ'
    });
    this.container.addLayers(planeXZ);

    this.renderer.newPerspectiveCamera({
      pos: [1.0, 1.0, -3],
      anchor: [0.0, 0.0, 0.0],
      up: [0.0, -1.0, 0.0],
      fovY: 45 / 180 * Math.PI,
      near: 0.01,
      far: 100.0,
      texture: true
    });

    // Initial set up of the animation loop
    if (typeof window !== 'undefined') {
      this.animationFrame = requestAnimationFrame(this._animationLoop);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.propsChanged = true;
  }

  @autobind _animationLoop() {
    this.setState({
      currentTime: new Date()
    });

    this.update();
    if (this.renderer.activated) {
      this.draw();
    }

    if (typeof window !== 'undefined') {
      this.animationFrame = requestAnimationFrame(this._animationLoop);
    }

    this.setState({
      previousTime: this.state.currentTime
    });
  }

  routeCameraEvent(event) {
    this.renderer.cameraManager.processEvent(event);
  }

  routeContainerEvent(event) {
    this.container.processEvent(event);
  }

  update() {
    // If props have changed after last animation loop
    if (this.propsChanged === true) {
      this.propsChangedUpdate();
    }
    // Called at every animation loop
    this.animationLoopUpdate();


  }

  propsChangedUpdate() {
    /* layer comparison. It's faulty right now. Adds only, no removeLayers functions.. */
    const {layers} = this.props;
    // Will reuse deck.gl's layer comparison
    for (let i = 0; i < layers.length; i++) {
      if (this.container.getLayerByID(layers[i].id) === null) {
        this.container.addLayers(layers[i]);
      }
    }

    this.propsChanged = false;
  }

  updateRenderableGeometries({layerID, groupID, meshID}) {
    this.renderer.updateRenderableGeometries({
      container: this.container,
      layerID,
      groupID,
      meshID
    });
    this.renderer.needsRedraw = true;
  }

  animationLoopUpdate() {

    // Handling data structure changes. It's obviously too aggressive to call regenerateRenderingGeometry() here but we can optimize later
    if (this.container.dataStructureChanged) {
      this.renderer.regenerateRenderableGeometries(this.container);
      this.container.dataStructureChanged = false;
    }
  }

  draw() {
    if (this.renderer !== null && this.renderer.needsRedraw === true) {
      this.renderer.render();
      this.renderer.needsRedraw = false;
    }
  }

  render() {
    return (
      <canvas
        ref = {'canvas'}
        width = {this.state.width}
        height = {this.state.height}
      />
    );
  }

}
