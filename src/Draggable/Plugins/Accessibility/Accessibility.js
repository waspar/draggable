const ARIA_GRABBED = 'aria-grabbed';
const ARIA_LABEL = 'aria-label';
const TABINDEX = 'tabindex';

export default class Accessibility {
  constructor(draggable) {
    this.draggable = draggable;

    this.draggableElements = [];
    this.containerElements = [...this.draggable.containers];

    this._onInit = this._onInit.bind(this);
    this._onDestroy = this._onDestroy.bind(this);
  }

  attach() {
    this.draggable
      .on('draggable:initialize', this._onInit)
      .on('draggable:destroy', this._onDestroy)
      .on('drag:start', _onDragStart)
      .on('drag:stop', _onDragStop);
  }

  detach() {
    this.draggable
      .off('draggable:initialize', this._onInit)
      .off('draggable:destroy', this._onDestroy)
      .off('drag:start', _onDragStart)
      .off('drag:stop', _onDragStop);
  }

  _onInit() {
    for (const container of this.containerElements) {
      const draggableSelector = this.draggable.options.handle || this.draggable.options.draggable;
      const draggableElements = container.querySelectorAll(draggableSelector);

      this.draggableElements = [
        ...this.draggableElements,
        ...draggableElements,
      ];
    }

    // Can wait until the next best frame is available
    requestAnimationFrame(() => {
      this.draggableElements.forEach(decorateDraggableElement);
      this.containerElements.forEach(decorateContainerElement);
    });
  }

  _onDestroy() {
    // Can wait until the next best frame is available
    requestAnimationFrame(() => {
      this.draggableElements.forEach(stripDraggableElement);
      this.containerElements.forEach(stripContainerElement);
    });
  }
}

function _onDragStart({source}) {
  source.setAttribute(ARIA_GRABBED, true);

  const statusElement = document.createElement('div');
  statusElement.setAttribute('role', 'status');
  statusElement.setAttribute('id', 'status');
  statusElement.setAttribute('aria-live', 'polite');
  statusElement.id = 'status';
  statusElement.innerHtml = 'Drag started';

  document.body.appendChild(statusElement);
}

function _onDragStop({source}) {
  source.setAttribute(ARIA_GRABBED, false);
}

function decorateDraggableElement(element) {
  const missingTabindex = !element.getAttribute(TABINDEX);
  const missingAriaLabel = !element.getAttribute(ARIA_LABEL);

  if (missingTabindex) { element.setAttribute(TABINDEX, 0); }
  if (missingAriaLabel) { element.setAttribute(ARIA_LABEL, 'Draggable Item'); }

  element.setAttribute(ARIA_GRABBED, false);
}

function decorateContainerElement(element) {
  const missingTabindex = !element.getAttribute(TABINDEX);
  const missingAriaLabel = !element.getAttribute(ARIA_LABEL);
  const missingAriaControls = !element.getAttribute('aria-controls');

  if (missingTabindex) { element.setAttribute(TABINDEX, 0); }
  if (missingAriaLabel) { element.setAttribute(ARIA_LABEL, 'Container with draggable items'); }
  if (missingAriaControls) { element.setAttribute('aria-controls', 'Container with draggable items'); }

  element.setAttribute('aria-relevant', 'additions removals');
  element.setAttribute('aria-live', 'polite');
}

function stripDraggableElement(element) {
  element.removeAttribute(ARIA_GRABBED);
  element.removeAttribute(ARIA_LABEL);
  element.removeAttribute(TABINDEX);
}

function stripContainerElement(element) {
  element.removeAttribute(ARIA_LABEL);
}
