// Mouse-driven drag and resize for SFTP floating panels.
// Used as Svelte actions on the panel root and resize handle.

export function panelDrag(
  node: HTMLElement,
  opts: {
    handle: () => HTMLElement | null;
    onMove: (left: number, top: number) => void;
    onPress: () => void;
  },
): { destroy(): void } {
  let dragging = false;
  let dx = 0;
  let dy = 0;

  function onHeaderDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    dragging = true;
    dx = e.clientX - node.offsetLeft;
    dy = e.clientY - node.offsetTop;
    opts.onPress();
  }
  function onMove(e: MouseEvent) {
    if (!dragging) return;
    const left = Math.max(0, e.clientX - dx);
    const top = Math.max(0, e.clientY - dy);
    opts.onMove(left, top);
  }
  function onUp() { dragging = false; }

  let attached: HTMLElement | null = null;
  function attach() {
    const h = opts.handle();
    if (h && h !== attached) {
      if (attached) attached.removeEventListener("mousedown", onHeaderDown);
      attached = h;
      attached.addEventListener("mousedown", onHeaderDown);
    }
  }
  attach();
  // In case the header element appears after first frame.
  requestAnimationFrame(attach);

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);

  return {
    destroy() {
      if (attached) attached.removeEventListener("mousedown", onHeaderDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    },
  };
}

export function panelResize(
  node: HTMLElement,
  opts: {
    onResize: (width: number, height: number) => void;
    onCommit: (width: number, height: number) => void;
    minW: number;
    minH: number;
    getStartSize: () => { width: number; height: number };
  },
): { destroy(): void } {
  let resizing = false;
  let startX = 0, startY = 0, startW = 0, startH = 0;
  let lastW = 0, lastH = 0;

  function onDown(e: MouseEvent) {
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    const s = opts.getStartSize();
    startW = s.width;
    startH = s.height;
    lastW = startW;
    lastH = startH;
    e.preventDefault();
    e.stopPropagation();
  }
  function onMove(e: MouseEvent) {
    if (!resizing) return;
    const w = Math.max(opts.minW, startW + (e.clientX - startX));
    const h = Math.max(opts.minH, startH + (e.clientY - startY));
    lastW = w;
    lastH = h;
    opts.onResize(w, h);
  }
  function onUp() {
    if (!resizing) return;
    resizing = false;
    opts.onCommit(lastW, lastH);
  }

  node.addEventListener("mousedown", onDown);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);

  return {
    destroy() {
      node.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    },
  };
}
