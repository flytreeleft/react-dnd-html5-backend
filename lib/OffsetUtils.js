'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNodeClientOffset = getNodeClientOffset;
exports.getEventClientOffset = getEventClientOffset;
exports.getEventPageOffset = getEventPageOffset;
exports.getEventOffset = getEventOffset;
exports.getDragPreviewOffset = getDragPreviewOffset;

var _round = require('lodash/round');

var _round2 = _interopRequireDefault(_round);

var _BrowserDetector = require('./BrowserDetector');

var _MonotonicInterpolant = require('./MonotonicInterpolant');

var _MonotonicInterpolant2 = _interopRequireDefault(_MonotonicInterpolant);

var _DOM = require('./DOM');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint
 no-mixed-operators: off
 */
var ELEMENT_NODE = 1;

function getElement(node) {
  return node.nodeType === ELEMENT_NODE ? node : node.parentElement;
}

function getIframeZoomFactor(iframe) {
  var win = (0, _DOM.getWindow)(iframe);
  var viewWidth = iframe.getBoundingClientRect().width;
  var actualWidth = parseFloat(win.getComputedStyle(iframe).width);
  return (0, _round2.default)(viewWidth / actualWidth, 2);
}

function offsetToPage(node, untilToTopWin) {
  var el = getElement(node);
  if (!el) {
    return null;
  }

  var source = el;
  var offset = { x: source.offsetLeft, y: source.offsetTop };
  // https://www.kirupa.com/html5/get_element_position_using_javascript.htm
  while (el && el.offsetParent) {
    el = el.offsetParent;
    if (el.tagName === 'BODY') {
      // deal with browser quirks with body/window/document and page scroll
      var scrollLeft = el.scrollLeft || document.documentElement.scrollLeft;
      var scrollTop = el.scrollTop || document.documentElement.scrollTop;

      offset.x += el.offsetLeft - scrollLeft + el.clientLeft;
      offset.y += el.offsetTop - scrollTop + el.clientTop;
    } else {
      // for all other non-BODY elements
      offset.x += el.offsetLeft - el.scrollLeft + el.clientLeft;
      offset.y += el.offsetTop - el.scrollTop + el.clientTop;
    }
  }

  if (untilToTopWin && (0, _DOM.isInIframe)(source)) {
    var iframe = (0, _DOM.getIframeElement)(source);
    var zoom = getIframeZoomFactor(iframe);
    var iframeOffset = offsetToPage(iframe, untilToTopWin) || { x: 0, y: 0 };

    offset.x = offset.x * zoom + iframeOffset.x;
    offset.y = offset.y * zoom + iframeOffset.y;
  }
  return offset;
}

function offsetToViewport(node, untilToTopWin) {
  var el = getElement(node);
  if (!el) {
    return null;
  }

  var _el$getBoundingClient = el.getBoundingClientRect(),
      top = _el$getBoundingClient.top,
      left = _el$getBoundingClient.left;

  var offset = { x: left, y: top };

  if (untilToTopWin && (0, _DOM.isInIframe)(el)) {
    var iframe = (0, _DOM.getIframeElement)(el);
    var iframeOffset = offsetToViewport(iframe, untilToTopWin) || { x: 0, y: 0 };
    var zoom = getIframeZoomFactor(iframe);

    offset.x = offset.x * zoom + iframeOffset.x;
    offset.y = offset.y * zoom + iframeOffset.y;
  }
  return offset;
}

function eventOffset(e, relativeToPage, untilToTopWin) {
  var offset = { x: 0, y: 0 };
  var el = e.target || e.srcElement;

  if (relativeToPage) {
    var win = (0, _DOM.getWindow)(el);
    // NOTE: Event.pageX/pageY will not return the correct value in iframe,
    // so using Event.offsetX/offsetY (which is relative to the element content)
    // plus the offset and border of target element.
    var elOffset = offsetToPage(el);
    var computedStyle = win.getComputedStyle(el);
    var elBorder = {
      left: parseInt(computedStyle.borderLeftWidth, 10),
      top: parseInt(computedStyle.borderTopWidth, 10)
    };
    offset = {
      x: e.offsetX + elOffset.x + elBorder.left,
      y: e.offsetY + elOffset.y + elBorder.top
    };
  } else {
    offset = {
      x: e.clientX,
      y: e.clientY
    };
  }

  if (untilToTopWin && (0, _DOM.isInIframe)(el)) {
    var getOffset = relativeToPage ? offsetToPage : offsetToViewport;
    var iframe = (0, _DOM.getIframeElement)(el);
    var iframeOffset = getOffset(iframe, untilToTopWin) || { x: 0, y: 0 };
    var zoom = getIframeZoomFactor(iframe);

    offset.x = offset.x * zoom + iframeOffset.x;
    offset.y = offset.y * zoom + iframeOffset.y;
  }

  return offset;
}

function getNodeClientOffset(node) {
  var el = getElement(node);
  if (!el) {
    return null;
  }

  var _el$getBoundingClient2 = el.getBoundingClientRect(),
      top = _el$getBoundingClient2.top,
      left = _el$getBoundingClient2.left;

  return { x: left, y: top };
}

function getEventClientOffset(e, untilToTopWin) {
  return eventOffset(e, false, untilToTopWin);
}

function getEventPageOffset(e, untilToTopWin) {
  return eventOffset(e, true, untilToTopWin);
}

function getEventOffset(e) {
  return {
    clientOffset: getEventClientOffset(e),
    clientOffsetUntilToTop: getEventClientOffset(e, true),
    pageOffset: getEventPageOffset(e),
    pageOffsetUntilToTop: getEventPageOffset(e, true)
  };
}

function getDragPreviewOffset(sourceNode, dragPreview, clientOffset, anchorPoint) {
  // The browsers will use the image intrinsic size under different conditions.
  // Firefox only cares if it's an image, but WebKit also wants it to be detached.
  var isImage = dragPreview.nodeName === 'IMG' && ((0, _BrowserDetector.isFirefox)() || !document.documentElement.contains(dragPreview));
  var dragPreviewNode = isImage ? sourceNode : dragPreview;

  var dragPreviewNodeOffsetFromClient = getNodeClientOffset(dragPreviewNode);
  var offsetFromDragPreview = {
    x: clientOffset.x - dragPreviewNodeOffsetFromClient.x,
    y: clientOffset.y - dragPreviewNodeOffsetFromClient.y
  };

  var sourceWidth = sourceNode.offsetWidth,
      sourceHeight = sourceNode.offsetHeight;
  var anchorX = anchorPoint.anchorX,
      anchorY = anchorPoint.anchorY;


  var dragPreviewWidth = isImage ? dragPreview.width : sourceWidth;
  var dragPreviewHeight = isImage ? dragPreview.height : sourceHeight;

  // Work around @2x coordinate discrepancies in browsers
  if ((0, _BrowserDetector.isSafari)() && isImage) {
    dragPreviewHeight /= window.devicePixelRatio;
    dragPreviewWidth /= window.devicePixelRatio;
  } else if ((0, _BrowserDetector.isFirefox)() && !isImage) {
    dragPreviewHeight *= window.devicePixelRatio;
    dragPreviewWidth *= window.devicePixelRatio;
  }

  // Interpolate coordinates depending on anchor point
  // If you know a simpler way to do this, let me know
  var interpolantX = new _MonotonicInterpolant2.default([0, 0.5, 1], [
  // Dock to the left
  offsetFromDragPreview.x,
  // Align at the center
  offsetFromDragPreview.x / sourceWidth * dragPreviewWidth,
  // Dock to the right
  offsetFromDragPreview.x + dragPreviewWidth - sourceWidth]);
  var interpolantY = new _MonotonicInterpolant2.default([0, 0.5, 1], [
  // Dock to the top
  offsetFromDragPreview.y,
  // Align at the center
  offsetFromDragPreview.y / sourceHeight * dragPreviewHeight,
  // Dock to the bottom
  offsetFromDragPreview.y + dragPreviewHeight - sourceHeight]);
  var x = interpolantX.interpolate(anchorX);
  var y = interpolantY.interpolate(anchorY);

  // Work around Safari 8 positioning bug
  if ((0, _BrowserDetector.isSafari)() && isImage) {
    // We'll have to wait for @3x to see if this is entirely correct
    y += (window.devicePixelRatio - 1) * dragPreviewHeight;
  }

  return { x: x, y: y };
}