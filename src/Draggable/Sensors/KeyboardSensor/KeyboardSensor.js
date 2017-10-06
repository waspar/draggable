import {closest, matches} from 'shared/utils';
import Sensor from './../Sensor';

import {
  DragStartSensorEvent,
  // DragMoveSensorEvent,
  DragStopSensorEvent,
} from './../SensorEvent';

const SPACE_CODE = 32;
const DOWN_CODE = 40;
const RIGHT_CODE = 39;
const UP_CODE = 38;
const LEFT_CODE = 37;

export default class KeyboardSensor extends Sensor {
  constructor(containers = [], options = {}) {
    super(containers, options);

    this.dragging = false;

    this._onKeyup = this._onKeyup.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
  }

  attach() {
    document.addEventListener('focus', this._onFocus, true);
    document.addEventListener('blur', this._onBlur, true);
    document.addEventListener('keydown', this._onKeyup, true);
  }

  detach() {
    document.removeEventListener('focus', this._onFocus, true);
    document.removeEventListener('blur', this._onBlur, true);
    document.removeEventListener('keydown', this._onKeyup, true);
  }

  _onFocus(event) {
    const draggable = event.target;
    const container = closest(event.target, this.containers);
    const isDraggable = Boolean(matches(event.target, this.options.handle || this.options.draggable));
    const isContainer = Boolean(container);

    if (isDraggable && isContainer) {
      this.potentialDraggable = draggable;
      this.potentialContainer = container;
    }
  }

  _onBlur() {
    this.potentialDraggable = null;
    this.potentialContainer = null;
  }

  _onKeyup(event) {
    if (!this.potentialDraggable && !this.potentialContainer && !this.dragging) {
      return;
    }

    if (!isRelevantKeycode(event)) {
      return;
    }

    event.preventDefault();

    if (event.keyCode === SPACE_CODE) {
      this._toggleDrag(event);
    }

    if (event.keyCode === RIGHT_CODE || event.keyCode === DOWN_CODE) {
      this._nextDraggable();
    }

    if (event.keyCode === LEFT_CODE || event.keyCode === UP_CODE) {
      this._previousDraggable();
    }
  }

  _toggleDrag(event) {
    if (this.dragging) {
      this._dragStop(event);
    } else {
      this._dragStart(event);
    }
  }

  _dragStart(event) {
    const dragStartEvent = new DragStartSensorEvent({
      target: this.potentialDraggable,
      container: this.potentialContainer,
      originalEvent: event,
    });

    this.trigger(this.potentialContainer, dragStartEvent);

    this.currentContainer = this.potentialContainer;
    this.dragging = !dragStartEvent.canceled();

    requestAnimationFrame(() => {
      if (!this.currentContainer) { return; }
      this.allDraggableElements = Array.from(this.currentContainer.querySelectorAll(this.options.draggable));
    });
  }

  _dragStop(event) {
    const dragStopEvent = new DragStopSensorEvent({
      target: this.potentialDraggable,
      container: this.potentialContainer,
      originalEvent: event,
    });

    this.trigger(this.currentContainer, dragStopEvent);
    this.dragging = false;
    this.allDraggableElements = null;
  }

  _nextDraggable(currentDraggable) {
    let currentIndex;
    this.allDraggableElements.forEach((draggableElement, index) => {
      if (draggableElement === currentDraggable) {
        currentIndex = index;
      }
    });
    return this.allDraggableElements[currentIndex++];
  }

  _previousDraggable(currentDraggable) {
    let currentIndex;
    this.allDraggableElements.forEach((draggableElement, index) => {
      if (draggableElement === currentDraggable) {
        currentIndex = index;
      }
    });
    return this.allDraggableElements[currentIndex--];
  }
}

function isRelevantKeycode(event) {
  return Boolean(
    event.keyCode === SPACE_CODE ||
    event.keyCode === DOWN_CODE ||
    event.keyCode === RIGHT_CODE ||
    event.keyCode === UP_CODE ||
    event.keyCode === LEFT_CODE
  );
}
