'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _defaults = require('lodash/defaults');

var _defaults2 = _interopRequireDefault(_defaults);

var _shallowEqual = require('./shallowEqual');

var _shallowEqual2 = _interopRequireDefault(_shallowEqual);

var _EnterLeaveCounter = require('./EnterLeaveCounter');

var _EnterLeaveCounter2 = _interopRequireDefault(_EnterLeaveCounter);

var _BrowserDetector = require('./BrowserDetector');

var _OffsetUtils = require('./OffsetUtils');

var _NativeDragSources = require('./NativeDragSources');

var _NativeTypes = require('./NativeTypes');

var NativeTypes = _interopRequireWildcard(_NativeTypes);

var _DOM = require('./DOM');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HTML5Backend = function () {
  function HTML5Backend(manager) {
    _classCallCheck(this, HTML5Backend);

    this.actions = manager.getActions();
    this.monitor = manager.getMonitor();
    this.registry = manager.getRegistry();
    this.context = manager.getContext();

    this.sourcePreviewNodes = {};
    this.sourcePreviewNodeOptions = {};
    this.sourceNodes = {};
    this.sourceNodeOptions = {};
    this.enterLeaveCounter = new _EnterLeaveCounter2.default();

    this.getSourceClientOffset = this.getSourceClientOffset.bind(this);
    this.handleTopDragStart = this.handleTopDragStart.bind(this);
    this.handleTopDragStartCapture = this.handleTopDragStartCapture.bind(this);
    this.handleTopDragEndCapture = this.handleTopDragEndCapture.bind(this);
    this.handleTopDragEnter = this.handleTopDragEnter.bind(this);
    this.handleTopDragEnterCapture = this.handleTopDragEnterCapture.bind(this);
    this.handleTopDragLeaveCapture = this.handleTopDragLeaveCapture.bind(this);
    this.handleTopDragOver = this.handleTopDragOver.bind(this);
    this.handleTopDragOverCapture = this.handleTopDragOverCapture.bind(this);
    this.handleTopDrop = this.handleTopDrop.bind(this);
    this.handleTopDropCapture = this.handleTopDropCapture.bind(this);
    this.handleSelectStart = this.handleSelectStart.bind(this);
    this.endDragIfSourceWasRemovedFromDOM = this.endDragIfSourceWasRemovedFromDOM.bind(this);
    this.endDragNativeItem = this.endDragNativeItem.bind(this);
  }

  _createClass(HTML5Backend, [{
    key: 'setup',
    value: function setup() {
      if (typeof this.window === 'undefined') {
        return;
      }

      if (this.window.__isReactDndBackendSetUp) {
        // eslint-disable-line no-underscore-dangle
        throw new Error('Cannot have two HTML5 backends at the same time.');
      }
      this.window.__isReactDndBackendSetUp = true; // eslint-disable-line no-underscore-dangle
      this.addEventListeners(this.window);
    }
  }, {
    key: 'teardown',
    value: function teardown() {
      if (typeof this.window === 'undefined') {
        return;
      }

      this.window.__isReactDndBackendSetUp = false; // eslint-disable-line no-underscore-dangle
      this.removeEventListeners(this.window);
      this.clearCurrentDragSourceNode();
    }
  }, {
    key: 'addEventListeners',
    value: function addEventListeners(target) {
      target.addEventListener('dragstart', this.handleTopDragStart);
      target.addEventListener('dragstart', this.handleTopDragStartCapture, true);
      target.addEventListener('dragend', this.handleTopDragEndCapture, true);
      target.addEventListener('dragenter', this.handleTopDragEnter);
      target.addEventListener('dragenter', this.handleTopDragEnterCapture, true);
      target.addEventListener('dragleave', this.handleTopDragLeaveCapture, true);
      target.addEventListener('dragover', this.handleTopDragOver);
      target.addEventListener('dragover', this.handleTopDragOverCapture, true);
      target.addEventListener('drop', this.handleTopDrop);
      target.addEventListener('drop', this.handleTopDropCapture, true);
    }
  }, {
    key: 'removeEventListeners',
    value: function removeEventListeners(target) {
      target.removeEventListener('dragstart', this.handleTopDragStart);
      target.removeEventListener('dragstart', this.handleTopDragStartCapture, true);
      target.removeEventListener('dragend', this.handleTopDragEndCapture, true);
      target.removeEventListener('dragenter', this.handleTopDragEnter);
      target.removeEventListener('dragenter', this.handleTopDragEnterCapture, true);
      target.removeEventListener('dragleave', this.handleTopDragLeaveCapture, true);
      target.removeEventListener('dragover', this.handleTopDragOver);
      target.removeEventListener('dragover', this.handleTopDragOverCapture, true);
      target.removeEventListener('drop', this.handleTopDrop);
      target.removeEventListener('drop', this.handleTopDropCapture, true);
    }
  }, {
    key: 'addTopCaptureEventListeners',
    value: function addTopCaptureEventListeners(target) {
      if (!target.dragDropTopCaptureRef) {
        target.dragDropTopCaptureRef = 0;
        this.addEventListeners(target);
      }
      target.dragDropTopCaptureRef += 1;
    }
  }, {
    key: 'removeTopCaptureEventListeners',
    value: function removeTopCaptureEventListeners(target) {
      if (target.dragDropTopCaptureRef) {
        target.dragDropTopCaptureRef -= 1;
      }

      if (!target.dragDropTopCaptureRef) {
        this.removeEventListeners(target);
      }
    }
  }, {
    key: 'connectDragPreview',
    value: function connectDragPreview(sourceId, node, options) {
      var _this = this;

      this.sourcePreviewNodeOptions[sourceId] = options;
      this.sourcePreviewNodes[sourceId] = node;

      return function () {
        delete _this.sourcePreviewNodes[sourceId];
        delete _this.sourcePreviewNodeOptions[sourceId];
      };
    }
  }, {
    key: 'connectDragSource',
    value: function connectDragSource(sourceId, node, options) {
      var _this2 = this;

      this.sourceNodes[sourceId] = node;
      this.sourceNodeOptions[sourceId] = options;

      var handleDragStart = function handleDragStart(e) {
        return _this2.handleDragStart(e, sourceId);
      };
      var handleSelectStart = function handleSelectStart(e) {
        return _this2.handleSelectStart(e, sourceId);
      };

      node.setAttribute('draggable', true);
      node.addEventListener('dragstart', handleDragStart);
      node.addEventListener('selectstart', handleSelectStart);

      var iframe = (0, _DOM.isInIframe)(node) ? (0, _DOM.getWindow)(node) : null;
      if (iframe) {
        this.addTopCaptureEventListeners(iframe);
      }

      return function () {
        if (iframe) {
          _this2.removeTopCaptureEventListeners(iframe);
        }

        delete _this2.sourceNodes[sourceId];
        delete _this2.sourceNodeOptions[sourceId];

        node.removeEventListener('dragstart', handleDragStart);
        node.removeEventListener('selectstart', handleSelectStart);
        node.setAttribute('draggable', false);
      };
    }
  }, {
    key: 'connectDropTarget',
    value: function connectDropTarget(targetId, node) {
      var _this3 = this;

      var handleDragEnter = function handleDragEnter(e) {
        return _this3.handleDragEnter(e, targetId);
      };
      var handleDragOver = function handleDragOver(e) {
        return _this3.handleDragOver(e, targetId);
      };
      var handleDrop = function handleDrop(e) {
        return _this3.handleDrop(e, targetId);
      };

      node.addEventListener('dragenter', handleDragEnter);
      node.addEventListener('dragover', handleDragOver);
      node.addEventListener('drop', handleDrop);

      var iframe = (0, _DOM.isInIframe)(node) ? (0, _DOM.getWindow)(node) : null;
      if (iframe) {
        this.addTopCaptureEventListeners(iframe);
      }

      return function () {
        if (iframe) {
          _this3.removeTopCaptureEventListeners(iframe);
        }

        node.removeEventListener('dragenter', handleDragEnter);
        node.removeEventListener('dragover', handleDragOver);
        node.removeEventListener('drop', handleDrop);
      };
    }
  }, {
    key: 'getCurrentSourceNodeOptions',
    value: function getCurrentSourceNodeOptions() {
      var sourceId = this.monitor.getSourceId();
      var sourceNodeOptions = this.sourceNodeOptions[sourceId];

      return (0, _defaults2.default)(sourceNodeOptions || {}, {
        dropEffect: 'move'
      });
    }
  }, {
    key: 'getCurrentDropEffect',
    value: function getCurrentDropEffect() {
      if (this.isDraggingNativeItem()) {
        // It makes more sense to default to 'copy' for native resources
        return 'copy';
      }

      return this.getCurrentSourceNodeOptions().dropEffect;
    }
  }, {
    key: 'getCurrentSourcePreviewNodeOptions',
    value: function getCurrentSourcePreviewNodeOptions() {
      var sourceId = this.monitor.getSourceId();
      var sourcePreviewNodeOptions = this.sourcePreviewNodeOptions[sourceId];

      return (0, _defaults2.default)(sourcePreviewNodeOptions || {}, {
        anchorX: 0.5,
        anchorY: 0.5,
        captureDraggingState: false
      });
    }
  }, {
    key: 'getSourceClientOffset',
    value: function getSourceClientOffset(sourceId) {
      return (0, _OffsetUtils.getNodeClientOffset)(this.sourceNodes[sourceId]);
    }
  }, {
    key: 'isDraggingNativeItem',
    value: function isDraggingNativeItem() {
      var itemType = this.monitor.getItemType();
      return Object.keys(NativeTypes).some(function (key) {
        return NativeTypes[key] === itemType;
      });
    }
  }, {
    key: 'beginDragNativeItem',
    value: function beginDragNativeItem(type) {
      this.clearCurrentDragSourceNode();

      var SourceType = (0, _NativeDragSources.createNativeDragSource)(type);
      this.currentNativeSource = new SourceType();
      this.currentNativeHandle = this.registry.addSource(type, this.currentNativeSource);
      this.actions.beginDrag([this.currentNativeHandle]);

      // On Firefox, if mousemove fires, the drag is over but browser failed to tell us.
      // This is not true for other browsers.
      if ((0, _BrowserDetector.isFirefox)()) {
        this.window.addEventListener('mousemove', this.endDragNativeItem, true);
      }
    }
  }, {
    key: 'endDragNativeItem',
    value: function endDragNativeItem() {
      if (!this.isDraggingNativeItem()) {
        return;
      }

      if ((0, _BrowserDetector.isFirefox)()) {
        this.window.removeEventListener('mousemove', this.endDragNativeItem, true);
      }

      this.actions.endDrag();
      this.registry.removeSource(this.currentNativeHandle);
      this.currentNativeHandle = null;
      this.currentNativeSource = null;
    }
  }, {
    key: 'endDragIfSourceWasRemovedFromDOM',
    value: function endDragIfSourceWasRemovedFromDOM() {
      var node = this.currentDragSourceNode;
      if ((0, _DOM.isNodeInDoc)(node)) {
        return;
      }

      if (this.clearCurrentDragSourceNode()) {
        this.actions.endDrag();
      }
    }
  }, {
    key: 'setCurrentDragSourceNode',
    value: function setCurrentDragSourceNode(node) {
      this.clearCurrentDragSourceNode();
      this.currentDragSourceNode = node;
      this.currentDragSourceNodeOffset = (0, _OffsetUtils.getNodeClientOffset)(node);
      this.currentDragSourceNodeOffsetChanged = false;

      // Receiving a mouse event in the middle of a dragging operation
      // means it has ended and the drag source node disappeared from DOM,
      // so the browser didn't dispatch the dragend event.
      this.window.addEventListener('mousemove', this.endDragIfSourceWasRemovedFromDOM, true);
    }
  }, {
    key: 'clearCurrentDragSourceNode',
    value: function clearCurrentDragSourceNode() {
      if (this.currentDragSourceNode) {
        this.currentDragSourceNode = null;
        this.currentDragSourceNodeOffset = null;
        this.currentDragSourceNodeOffsetChanged = false;

        this.window.removeEventListener('mousemove', this.endDragIfSourceWasRemovedFromDOM, true);
        return true;
      }

      return false;
    }
  }, {
    key: 'checkIfCurrentDragSourceRectChanged',
    value: function checkIfCurrentDragSourceRectChanged() {
      var node = this.currentDragSourceNode;
      if (!node) {
        return false;
      }

      if (this.currentDragSourceNodeOffsetChanged) {
        return true;
      }

      this.currentDragSourceNodeOffsetChanged = !(0, _shallowEqual2.default)((0, _OffsetUtils.getNodeClientOffset)(node), this.currentDragSourceNodeOffset);

      return this.currentDragSourceNodeOffsetChanged;
    }
  }, {
    key: 'handleTopDragStartCapture',
    value: function handleTopDragStartCapture() {
      // NOTE: the previous dragged element maybe was removed before it can fire dragend event,
      // so clear the previous drag source and do endDrag.
      if (this.clearCurrentDragSourceNode()) {
        this.actions.endDrag();
      }
      this.dragStartSourceIds = [];
    }
  }, {
    key: 'handleDragStart',
    value: function handleDragStart(e, sourceId) {
      this.dragStartSourceIds.unshift(sourceId);
    }
  }, {
    key: 'handleTopDragStart',
    value: function handleTopDragStart(e) {
      var _this4 = this;

      var dragStartSourceIds = this.dragStartSourceIds;

      this.dragStartSourceIds = [];

      if (this.monitor.isDragging()) {
        return;
      }

      // Don't publish the source just yet (see why below)
      this.actions.beginDrag(dragStartSourceIds, {
        publishSource: false,
        getSourceClientOffset: this.getSourceClientOffset,
        getEventOffset: function getEventOffset() {
          return (0, _OffsetUtils.getEventOffset)(e);
        }
      });

      var dataTransfer = e.dataTransfer;

      var nativeType = (0, _NativeDragSources.matchNativeItemType)(dataTransfer);

      if (this.monitor.isDragging()) {
        if (typeof dataTransfer.setDragImage === 'function') {
          // Use custom drag image if user specifies it.
          // If child drag source refuses drag but parent agrees,
          // use parent's node as drag image. Neither works in IE though.
          var sourceId = this.monitor.getSourceId();
          var sourceNode = this.sourceNodes[sourceId];
          var dragPreview = this.sourcePreviewNodes[sourceId] || sourceNode;

          var _getCurrentSourcePrev = this.getCurrentSourcePreviewNodeOptions(),
              anchorX = _getCurrentSourcePrev.anchorX,
              anchorY = _getCurrentSourcePrev.anchorY;

          var anchorPoint = { anchorX: anchorX, anchorY: anchorY };
          var clientOffset = (0, _OffsetUtils.getEventClientOffset)(e);
          var dragPreviewOffset = (0, _OffsetUtils.getDragPreviewOffset)(sourceNode, dragPreview, clientOffset, anchorPoint);
          dataTransfer.setDragImage(dragPreview, dragPreviewOffset.x, dragPreviewOffset.y);
        }

        try {
          // Firefox won't drag without setting data
          dataTransfer.setData('application/json', {});
        } catch (err) {}
        // IE doesn't support MIME types in setData


        // Store drag source node so we can check whether
        // it is removed from DOM and trigger endDrag manually.
        this.setCurrentDragSourceNode(e.target);

        // Now we are ready to publish the drag source.. or are we not?

        var _getCurrentSourcePrev2 = this.getCurrentSourcePreviewNodeOptions(),
            captureDraggingState = _getCurrentSourcePrev2.captureDraggingState;

        if (!captureDraggingState) {
          // Usually we want to publish it in the next tick so that browser
          // is able to screenshot the current (not yet dragging) state.
          //
          // It also neatly avoids a situation where render() returns null
          // in the same tick for the source element, and browser freaks out.
          setTimeout(function () {
            return _this4.actions.publishDragSource();
          });
        } else {
          // In some cases the user may want to override this behavior, e.g.
          // to work around IE not supporting custom drag previews.
          //
          // When using a custom drag layer, the only way to prevent
          // the default drag preview from drawing in IE is to screenshot
          // the dragging state in which the node itself has zero opacity
          // and height. In this case, though, returning null from render()
          // will abruptly end the dragging, which is not obvious.
          //
          // This is the reason such behavior is strictly opt-in.
          this.actions.publishDragSource();
        }
      } else if (nativeType) {
        // A native item (such as URL) dragged from inside the document
        this.beginDragNativeItem(nativeType);
      } else if (!dataTransfer.types && (!e.target.hasAttribute || !e.target.hasAttribute('draggable'))) {
        // Looks like a Safari bug: dataTransfer.types is null, but there was no draggable.
        // Just let it drag. It's a native type (URL or text) and will be picked up in
        // dragenter handler.
        return; // eslint-disable-line no-useless-return
      } else {
        // If by this time no drag source reacted, tell browser not to drag.
        e.preventDefault();
      }
    }
  }, {
    key: 'handleTopDragEndCapture',
    value: function handleTopDragEndCapture() {
      if (this.clearCurrentDragSourceNode()) {
        // Firefox can dispatch this event in an infinite loop
        // if dragend handler does something like showing an alert.
        // Only proceed if we have not handled it already.
        this.actions.endDrag();
      }
    }
  }, {
    key: 'handleTopDragEnterCapture',
    value: function handleTopDragEnterCapture(e) {
      this.dragEnterTargetIds = [];

      var isFirstEnter = this.enterLeaveCounter.enter(e.target);
      if (!isFirstEnter || this.monitor.isDragging()) {
        return;
      }

      var dataTransfer = e.dataTransfer;

      var nativeType = (0, _NativeDragSources.matchNativeItemType)(dataTransfer);

      if (nativeType) {
        // A native item (such as file or URL) dragged from outside the document
        this.beginDragNativeItem(nativeType);
      }
    }
  }, {
    key: 'handleDragEnter',
    value: function handleDragEnter(e, targetId) {
      this.dragEnterTargetIds.unshift(targetId);
    }
  }, {
    key: 'handleTopDragEnter',
    value: function handleTopDragEnter(e) {
      var _this5 = this;

      var dragEnterTargetIds = this.dragEnterTargetIds;

      this.dragEnterTargetIds = [];

      if (!this.monitor.isDragging() || this.monitor.didDrop()) {
        // This is probably a native item type we don't understand.
        return;
      }

      if (!(0, _BrowserDetector.isFirefox)()) {
        // Don't emit hover in `dragenter` on Firefox due to an edge case.
        // If the target changes position as the result of `dragenter`, Firefox
        // will still happily dispatch `dragover` despite target being no longer
        // there. The easy solution is to only fire `hover` in `dragover` on FF.
        this.actions.hover(dragEnterTargetIds, {
          getEventOffset: function getEventOffset() {
            return (0, _OffsetUtils.getEventOffset)(e);
          }
        });
      }

      var canDrop = dragEnterTargetIds.some(function (targetId) {
        return _this5.monitor.canDropOnTarget(targetId);
      });

      if (canDrop) {
        // IE requires this to fire dragover events
        e.preventDefault();
        e.dataTransfer.dropEffect = this.getCurrentDropEffect();
      }
    }
  }, {
    key: 'handleTopDragOverCapture',
    value: function handleTopDragOverCapture() {
      this.dragOverTargetIds = [];
    }
  }, {
    key: 'handleDragOver',
    value: function handleDragOver(e, targetId) {
      this.dragOverTargetIds.unshift(targetId);
    }
  }, {
    key: 'handleTopDragOver',
    value: function handleTopDragOver(e) {
      var _this6 = this;

      var dragOverTargetIds = this.dragOverTargetIds;

      this.dragOverTargetIds = [];

      if (!this.monitor.isDragging() || this.monitor.didDrop()) {
        // This is probably a native item type we don't understand.
        // Prevent default "drop and blow away the whole document" action.
        e.preventDefault();
        e.dataTransfer.dropEffect = 'none';
        return;
      }

      this.actions.hover(dragOverTargetIds, {
        getEventOffset: function getEventOffset() {
          return (0, _OffsetUtils.getEventOffset)(e);
        }
      });

      var canDrop = dragOverTargetIds.some(function (targetId) {
        return _this6.monitor.canDropOnTarget(targetId);
      });

      if (canDrop) {
        // Show user-specified drop effect.
        e.preventDefault();
        e.dataTransfer.dropEffect = this.getCurrentDropEffect();
      } else if (this.isDraggingNativeItem()) {
        // Don't show a nice cursor but still prevent default
        // "drop and blow away the whole document" action.
        e.preventDefault();
        e.dataTransfer.dropEffect = 'none';
      } else if (this.checkIfCurrentDragSourceRectChanged()) {
        // Prevent animating to incorrect position.
        // Drop effect must be other than 'none' to prevent animation.
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    }
  }, {
    key: 'handleTopDragLeaveCapture',
    value: function handleTopDragLeaveCapture(e) {
      if (this.isDraggingNativeItem()) {
        e.preventDefault();
      }

      var isLastLeave = this.enterLeaveCounter.leave(e.target);
      if (!isLastLeave) {
        return;
      }

      if (this.isDraggingNativeItem()) {
        this.endDragNativeItem();
      }
    }
  }, {
    key: 'handleTopDropCapture',
    value: function handleTopDropCapture(e) {
      this.dropTargetIds = [];
      e.preventDefault();

      if (this.isDraggingNativeItem()) {
        this.currentNativeSource.mutateItemByReadingDataTransfer(e.dataTransfer);
      }

      this.enterLeaveCounter.reset();
    }
  }, {
    key: 'handleDrop',
    value: function handleDrop(e, targetId) {
      this.dropTargetIds.unshift(targetId);
    }
  }, {
    key: 'handleTopDrop',
    value: function handleTopDrop(e) {
      var dropTargetIds = this.dropTargetIds;

      this.dropTargetIds = [];

      this.actions.hover(dropTargetIds, {
        getEventOffset: function getEventOffset() {
          return (0, _OffsetUtils.getEventOffset)(e);
        }
      });
      this.actions.drop();

      if (this.isDraggingNativeItem()) {
        this.endDragNativeItem();
      } else {
        this.endDragIfSourceWasRemovedFromDOM();
      }
    }
  }, {
    key: 'handleSelectStart',
    value: function handleSelectStart(e) {
      var target = e.target;

      // Only IE requires us to explicitly say
      // we want drag drop operation to start

      if (typeof target.dragDrop !== 'function') {
        return;
      }

      // Inputs and textareas should be selectable
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // For other targets, ask IE
      // to enable drag and drop
      e.preventDefault();
      target.dragDrop();
    }
  }, {
    key: 'window',
    get: function get() {
      return this.context && this.context.window || window;
    }
  }]);

  return HTML5Backend;
}();

exports.default = HTML5Backend;