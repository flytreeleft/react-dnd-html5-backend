export function isNodeInDoc(node) {
  var doc = !isNodeInIframe(node) ? document.documentElement : node.ownerDocument.documentElement;
  var parent = node && node.parentNode;
  return doc === node || doc === parent || !!(parent && parent.nodeType === 1 && doc.contains(parent));
}

export function isNodeInIframe(node) {
  var win = node && node.ownerDocument.defaultView;
  return !!(win && win.top !== win);
}

export function isIframe(node) {
  return node && node.tagName && node.tagName.toLowerCase() === 'iframe';
}

export function getWindow(target) {
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

export function getDocument(target) {
  var win = getWindow(target);

  return win ? win.document : null;
}