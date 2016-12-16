import autobind from 'autobind-decorator';

export default class EventManager {
  constructor({controller, canvas}) {
    this.controller = controller;
    canvas.addEventListener('wheel', this.processEvent);
  }

  isCameraEvent(event) {
    //console.log('event: ', event);
    return true;
  }

  isControllerEvent(event) {
    return true;
  }

  @autobind processEvent(event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.isCameraEvent(event)) {
      this.controller.routeCameraEvent(event);
    } else if (this.isContainerEvent(event)) {
      this.controller.routeContainerEvent(event);
    } else {
      console.log('Unknown event: ', event);
    }
  }
}
