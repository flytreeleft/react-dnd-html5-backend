'use strict';

exports.__esModule = true;
exports.isNodeInDoc = isNodeInDoc;
exports.isInIframe = isInIframe;
exports.isIframe = isIframe;
exports.getWindow = getWindow;
exports.getDocument = getDocument;
exports.getIframeElement = getIframeElement;

function isNodeInDoc(node) {
  var doc = !isInIframe(node) ? document.documentElement : node.ownerDocument.documentElement;
  var parent = node && node.parentNode;
  return doc === node || doc === parent || !!(parent && parent.nodeType === 1 && doc.contains(parent));
}

function isInIframe(node) {
  var win = node && node.ownerDocument.defaultView;
  return !!(win && win.top !== win);
}

function isIframe(node) {
  return node && node.tagName && node.tagName.toLowerCase() === 'iframe';
}

function getWindow(target) {
  if (!target) {
    return null;
  }

  var win;
  if (target.window === target) {
    win = target;
  } else if (isIframe(target)) {
    win = target.contentWindow || target.contentDocument;
  } else if (target instanceof Document) {
    win = target.defaultView;
  } else {
    win = target.ownerDocument.defaultView;
  }

  return win;
}

function getDocument(target) {
  var win = getWindow(target);

  return win ? win.document : null;
}

function getIframeElement(node) {
  var win = getWindow(node);

  return win ? win.frameElement : null;
}