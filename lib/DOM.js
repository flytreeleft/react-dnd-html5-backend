'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isIframe = isIframe;
exports.getWindow = getWindow;
exports.getDocument = getDocument;
exports.isNodeInDoc = isNodeInDoc;
exports.isInIframe = isInIframe;
exports.getIframeElement = getIframeElement;
function isIframe(node) {
  return node && node.tagName && node.tagName.toLowerCase() === 'iframe';
}

function getWindow(target) {
  if (!target) {
    return null;
  }

  var win = void 0;
  if (target.window === target) {
    win = target;
  } else if (isIframe(target)) {
    win = target.contentWindow || target.contentDocument;
  } else if (target.defaultView) {
    win = target.defaultView;
  } else if (target.ownerDocument) {
    win = target.ownerDocument.defaultView;
  }

  return win;
}

function getDocument(target) {
  var win = getWindow(target);

  return win ? win.document : null;
}

function isNodeInDoc(node) {
  var doc = getDocument(isIframe(node) ? node.ownerDocument : node);
  var docEl = doc && doc.documentElement;
  var parent = node && node.parentNode;

  return docEl === node || docEl === parent || !!(parent && parent.nodeType === 1 && docEl && docEl.contains(parent));
}

function isInIframe(node) {
  var win = isIframe(node) ? getWindow(node.ownerDocument) : getWindow(node);
  return !!win && win.top !== win;
}

function getIframeElement(node) {
  var win = isIframe(node) ? getWindow(node.ownerDocument) : getWindow(node);

  return win ? win.frameElement : null;
}