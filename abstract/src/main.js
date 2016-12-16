// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
/* eslint-disable func-style */
/* eslint-disable no-console */
/* global console, process */
/* global document, window */
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from 'redux';
import {Provider, connect} from 'react-redux';
import autobind from 'autobind-decorator';
// import * as request from 'd3-request';
import {FPSStats} from 'react-stats';

import DeckGLA from './deckgl-a';
import {Scatterplot3D, L2NormScatterplot} from './layer';

// ---- Default Settings ---- //
/* eslint-disable no-process-env */
// const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN ||
//  'Set MAPBOX_ACCESS_TOKEN environment variable or put your token here.';

const INITIAL_STATE = {
  camera: {
    position: [1.0, 1.0, 1.0],
    lookAt: [0.0, 0.0, 0.0],
    fov: 30,
    aspectRatio: 0.75
  },
  dataProcessed: false
};

function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
  case 'PREPROCESS':
    return {...state, dataProcessed: true};
  default:
    return state;
  }
}

// ---Action--- //

function preprocessData(rawData) {
  return {type: 'PREPROCESS', rawData};
}

/*
Example App

Example app is the main React component that our framework output
It should manipulate container, camera and renderer only.
We should specify APIs for these classes.

We also need to speficy APIs for generating and manipulating Layers.
*/
class ExampleApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layers: [],
      startTime: new Date(),
      previousTime: new Date(),
      currentTime: new Date()
    };

  }

  componentWillMount() {
    this._handleResize();
    window.addEventListener('resize', this._handleResize);
    this._loadData();
  }

  componentDidMount() {

    const {layers} = this.state;

    const numberOfPoints = 1000000;
    const range = 100.0;
    const scatterplotData = [];
    const scatterplotColor = [];
    const scatterplotSize = [];

    for (let i = 0; i < numberOfPoints; i++) {
      scatterplotData.push([
        Math.random() * range * 2 - range,
        Math.random() * range * 2 - range,
        Math.random() * -range
      ]);

      scatterplotColor.push([
        Math.random() * 1.0,
        Math.random() * 1.0,
        Math.random() * 1.0,
        1.0
      ]);

      scatterplotSize.push(Math.random() * 0.1);
    }

    const scatterplot = new Scatterplot3D({
      id: 'scatterplot3D',
      data: scatterplotData,
      color: scatterplotColor,
      size: scatterplotSize
    });

    layers.push(scatterplot);

    const oneColor = new Array(numberOfPoints * 4);
    for (let i = 0; i < numberOfPoints; i++) {
      oneColor[i * 4 + 0] = 0.3;
      oneColor[i * 4 + 1] = 0.3;
      oneColor[i * 4 + 2] = 0.3;
      oneColor[i * 4 + 3] = 1.0;
    }

    const norm = new L2NormScatterplot({
      id: 'L2norm',
      data: scatterplotData,
      color: oneColor,
      size: scatterplotSize
    });

    layers.push(norm);

    //setInterval(this.handleTimerUpdate, 1000);
  }

  componentWillReceiveProps(props) {
  }

  @autobind handleTimerUpdate() {
    this.setState({
      currentTime: new Date()
    });

    const {currentTime, previousTime, layers} = this.state;

    /* rotate a layer along X axis */
    const layer = layers[0];
    const deltaAngle = (currentTime - previousTime) / 1e4;
    layer.rotateAlongZAxis(deltaAngle);

    this.setState({
      previousTime: this.state.currentTime
    });
  }
  @autobind _handleResize() {
    this.setState({width: window.innerWidth, height: window.innerHeight});
  }

  @autobind _handleDataLoaded(rawData) {
    this.props.dispatch(preprocessData(rawData));
  }

  _loadData() {
    const data = [[0.5, 0.2, 0.3], [0.3, -0.2, 0.1], [1.0, -0.3, 2.2]];
    this._handleDataLoaded(data);
  }

  render() {
    const {width, height, layers} = this.state;
    return (
      <div>
        <div ref="fps" className="fps" />
        <DeckGLA
          width = {width}
          height = {height}
          layers = {layers}/>
        <FPSStats isActive/>
      </div>
      );
  }
}

function mapStateToProps(state) {
  return {
    camera: state.camera
  };
}

// ---- Main ---- //
const store = createStore(reducer);
const App = connect(mapStateToProps)(ExampleApp);

const container = document.createElement('div');
document.body.appendChild(container);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  container
);
/* eslint-enable func-style */
/* eslint-enable no-console */
