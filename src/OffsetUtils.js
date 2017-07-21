/* eslint
 no-mixed-operators: off
 */
import round from 'lodash/round';
import { isSafari, isFirefox } from './BrowserDetector';
import MonotonicInterpolant from './MonotonicInterpolant';
import { isInIframe, getIframeElement, getWindow } from './DOM';

const ELEMENT_NODE = 1;

function getElement(node) {
  return node.nodeType === ELEMENT_NODE ? node : node.parentElement;
}

function getIframeZoomFactor(iframe) {
  var win = getWindow(iframe);
  var viewWidth = iframe.getBoundingClientRect().width;
  var actualWidth = parseFloat(win.getComputedStyle(iframe).width);
  return round(viewWidth / actualWidth, 2);
}

function offsetToPage(node, untilToTopWin) {
  var el = getElement(node);
  if (!el) {
    return null;
  }

  var source = el;
  var offset = {x: source.offsetLeft, y: source.offsetTop};
  // https://www.kirupa.com/html5/get_element_position_using_javascript.htm
  while ((el = el.offsetParent)) {
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

  if (untilToTopWin && isInIframe(source)) {
    var iframe = getIframeElement(source);
    var zoom = getIframeZoomFactor(iframe);
    var iframeOffset = offsetToPage(iframe, untilToTopWin) || {x: 0, y: 0};

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

  var {top, left} = el.getBoundingClientRect();
  var offset = {x: left, y: top};

  if (untilToTopWin && isInIframe(el)) {
    var iframe = getIframeElement(el);
    var iframeOffset = offsetToViewport(iframe, untilToTopWin) || {x: 0, y: 0};
    var zoom = getIframeZoomFactor(iframe);

    offset.x = offset.x * zoom + iframeOffset.x;
    offset.y = offset.y * zoom + iframeOffset.y;
  }
  return offset;
}

function eventOffset(e, relativeToPage, untilToTopWin) {
  var offset = {x: 0, y: 0};
  var el = e.target || e.srcElement;

  if (relativeToPage) {
    var win = getWindow(el);
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

  if (untilToTopWin && isInIframe(el)) {
    var getOffset = relativeToPage ? offsetToPage : offsetToViewport;
    var iframe = getIframeElement(el);
    var iframeOffset = getOffset(iframe, untilToTopWin) || {x: 0, y: 0};
    var zoom = getIframeZoomFactor(iframe);

    offset.x = offset.x * zoom + iframeOffset.x;
    offset.y = offset.y * zoom + iframeOffset.y;
  }

  return offset;
}

export function getNodeClientOffset(node) {
  var el = getElement(node);
  if (!el) {
    return null;
  }

  const { top, left } = el.getBoundingClientRect();
  return { x: left, y: top };
}

export function getEventClientOffset(e, untilToTopWin) {
  return eventOffset(e, false, untilToTopWin);
}

export function getEventPageOffset(e, untilToTopWin) {
  return eventOffset(e, true, untilToTopWin);
}

export function getEventOffset(e) {
  return {
    clientOffset: getEventClientOffset(e),
    clientOffsetUntilToTop: getEventClientOffset(e, true),
    pageOffset: getEventPageOffset(e),
    pageOffsetUntilToTop: getEventPageOffset(e, true)
  };
}

export function getDragPreviewOffset(sourceNode, dragPreview, clientOffset, anchorPoint) {
  // The browsers will use the image intrinsic size under different conditions.
  // Firefox only cares if it's an image, but WebKit also wants it to be detached.
  const isImage = dragPreview.nodeName === 'IMG' && (
    isFirefox() ||
    !document.documentElement.contains(dragPreview)
  );
  const dragPreviewNode = isImage ? sourceNode : dragPreview;

  const dragPreviewNodeOffsetFromClient = getNodeClientOffset(dragPreviewNode);
  const offsetFromDragPreview = {
    x: clientOffset.x - dragPreviewNodeOffsetFromClient.x,
    y: clientOffset.y - dragPreviewNodeOffsetFromClient.y,
  };

  const { offsetWidth: sourceWidth, offsetHeight: sourceHeight } = sourceNode;
  const { anchorX, anchorY } = anchorPoint;

  let dragPreviewWidth = isImage ? dragPreview.width : sourceWidth;
  let dragPreviewHeight = isImage ? dragPreview.height : sourceHeight;

  // Work around @2x coordinate discrepancies in browsers
  if (isSafari() && isImage) {
    dragPreviewHeight /= window.devicePixelRatio;
    dragPreviewWidth /= window.devicePixelRatio;
  } else if (isFirefox() && !isImage) {
    dragPreviewHeight *= window.devicePixelRatio;
    dragPreviewWidth *= window.devicePixelRatio;
  }

  // Interpolate coordinates depending on anchor point
  // If you know a simpler way to do this, let me know
  const interpolantX = new MonotonicInterpolant([0, 0.5, 1], [
    // Dock to the left
    offsetFromDragPreview.x,
    // Align at the center
    (offsetFromDragPreview.x / sourceWidth) * dragPreviewWidth,
    // Dock to the right
    offsetFromDragPreview.x + dragPreviewWidth - sourceWidth,
  ]);
  const interpolantY = new MonotonicInterpolant([0, 0.5, 1], [
    // Dock to the top
    offsetFromDragPreview.y,
    // Align at the center
    (offsetFromDragPreview.y / sourceHeight) * dragPreviewHeight,
    // Dock to the bottom
    offsetFromDragPreview.y + dragPreviewHeight - sourceHeight,
  ]);
  const x = interpolantX.interpolate(anchorX);
  let y = interpolantY.interpolate(anchorY);

  // Work around Safari 8 positioning bug
  if (isSafari() && isImage) {
    // We'll have to wait for @3x to see if this is entirely correct
    y += (window.devicePixelRatio - 1) * dragPreviewHeight;
  }

  return { x, y };
}
