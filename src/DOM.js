export function isIframe(node) {
  return node && node.tagName && node.tagName.toLowerCase() === 'iframe';
}

export function getWindow(target) {
  if (!target) {
    return null;
  }

  let win;
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

export function getDocument(target) {
  const win = getWindow(target);

  return win ? win.document : null;
}

export function isNodeInDoc(node) {
  const doc = getDocument(isIframe(node) ? node.ownerDocument : node);
  const docEl = doc && doc.documentElement;
  const parent = node && node.parentNode;

  return docEl === node || docEl === parent ||
         !!(parent && parent.nodeType === 1 && docEl && docEl.contains(parent));
}

export function isInIframe(node) {
  const win = isIframe(node) ? getWindow(node.ownerDocument) : getWindow(node);
  return !!win && win.top !== win;
}

export function getIframeElement(node) {
  const win = isIframe(node) ? getWindow(node.ownerDocument) : getWindow(node);

  return win ? win.frameElement : null;
}
