// Tree drag-drop as a Svelte action. Attach to the container that holds the
// folder/session tree (the same node whose children include `.tree-folder` divs).
// Reads/writes the data store directly and surfaces errors via mountAlert.

import { dataStore, setData } from "../stores/data.svelte";
import * as Data from "../api/data";
import { dndState } from "./state.svelte";
import { mountAlert } from "../components/modals/mount";
import { t } from "../i18n";
import type { SshSession, Folder } from "../api/types";

interface DndItem {
  el: HTMLElement;
  id: string;
  midY: number;
  height: number;
  originalIndex: number;
}

interface DndContext {
  type: "session" | "folder";
  dragEl: HTMLElement;
  dragId: string;
  dragOrigIdx: number;
  items: DndItem[];
  currentIndex: number;
  startY: number;
  folderId: string | null;
}

export function treeDragDrop(node: HTMLElement) {
  let dnd: DndContext | null = null;

  const onMouseDown = (e: MouseEvent) => {
    const handle = (e.target as HTMLElement).closest(".drag-handle") as HTMLElement | null;
    if (!handle) return;

    const sessionRow = handle.closest("[data-session-id]") as HTMLElement | null;
    const folderHeader = handle.closest(".tree-folder-header") as HTMLElement | null;

    let type: "session" | "folder";
    let dragEl: HTMLElement;
    let dragId: string;
    let folderId: string | null = null;

    if (sessionRow) {
      type = "session";
      dragEl = sessionRow;
      dragId = sessionRow.dataset.sessionId!;
      folderId = dataStore.sessions.find((s) => s.id === dragId)?.folder_id ?? null;
    } else if (folderHeader) {
      const folderEl = folderHeader.closest("[data-folder-id]") as HTMLElement | null;
      if (!folderEl) return;
      type = "folder";
      dragEl = folderEl;
      dragId = folderEl.dataset.folderId!;
    } else {
      return;
    }

    e.preventDefault();

    let allEls: HTMLElement[];
    if (type === "session") {
      const parent = dragEl.parentElement!;
      allEls = Array.from(parent.children).filter(
        (el) => el instanceof HTMLElement && el.dataset.sessionId,
      ) as HTMLElement[];
    } else {
      allEls = Array.from(node.children).filter(
        (el) => el instanceof HTMLElement && el.dataset.folderId,
      ) as HTMLElement[];
    }

    const items: DndItem[] = allEls.map((el, i) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        id: type === "session" ? el.dataset.sessionId! : el.dataset.folderId!,
        midY: r.top + r.height / 2,
        height: r.height,
        originalIndex: i,
      };
    });

    const dragOrigIdx = items.findIndex((it) => it.id === dragId);
    if (dragOrigIdx < 0) return;

    dragEl.style.position = "relative";
    dragEl.style.zIndex = "100";
    dragEl.classList.add("dnd-active-item");
    document.body.classList.add("dnd-active");

    dnd = {
      type, dragEl, dragId, dragOrigIdx,
      items, currentIndex: dragOrigIdx,
      startY: e.clientY, folderId,
    };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dnd) return;
    e.preventDefault();

    const deltaY = e.clientY - dnd.startY;
    const { dragOrigIdx, items, dragId } = dnd;
    const dragItem = items[dragOrigIdx];

    dnd.dragEl.style.transform = `translateY(${deltaY}px)`;

    const mouseY = e.clientY;
    let newIndex = dragOrigIdx;
    if (deltaY > 0) {
      for (let i = dragOrigIdx + 1; i < items.length; i++) {
        if (mouseY > items[i].midY) newIndex = i; else break;
      }
    } else {
      for (let i = dragOrigIdx - 1; i >= 0; i--) {
        if (mouseY < items[i].midY) newIndex = i; else break;
      }
    }

    if (newIndex !== dnd.currentIndex) {
      dnd.currentIndex = newIndex;
      for (const item of items) {
        if (item.id === dragId) continue;
        let shift = 0;
        if (dragOrigIdx < newIndex) {
          if (item.originalIndex > dragOrigIdx && item.originalIndex <= newIndex) shift = -dragItem.height;
        } else if (dragOrigIdx > newIndex) {
          if (item.originalIndex >= newIndex && item.originalIndex < dragOrigIdx) shift = dragItem.height;
        }
        item.el.style.transition = "transform 0.2s ease";
        item.el.style.transform = shift ? `translateY(${shift}px)` : "";
      }
    }
  };

  const onMouseUp = async () => {
    if (!dnd) return;
    const { type, dragId, items, currentIndex, dragOrigIdx, folderId } = dnd;

    for (const item of items) {
      item.el.style.transform = "";
      item.el.style.transition = "";
      item.el.style.position = "";
      item.el.style.zIndex = "";
    }
    dnd.dragEl.classList.remove("dnd-active-item");
    document.body.classList.remove("dnd-active");
    dnd = null;
    dndState.setJustFinished(true);
    setTimeout(() => dndState.setJustFinished(false), 50);

    if (dragOrigIdx === currentIndex) return;

    const ids = items.map((it) => it.id);
    const moved = ids.splice(dragOrigIdx, 1)[0];
    ids.splice(currentIndex, 0, moved);

    if (type === "session") {
      const updates: SshSession[] = ids.map((sid, i) => {
        const s = dataStore.sessions.find((s) => s.id === sid)!;
        return { ...s, order: i, folder_id: folderId };
      });
      try { setData(await Data.reorderSessions(updates)); }
      catch (e) { void mountAlert(t("sidebar.errors.reorder", { error: String(e) })); }
    } else {
      let rootFolderOrder: number | null = null;
      const updates: Folder[] = [];
      ids.forEach((fid, i) => {
        if (fid === "__root__") rootFolderOrder = i;
        else {
          const f = dataStore.folders.find((f) => f.id === fid)!;
          updates.push({ ...f, order: i });
        }
      });
      try { setData(await Data.reorderFolders(updates, rootFolderOrder)); }
      catch (e) { void mountAlert(t("sidebar.errors.reorder", { error: String(e) })); }
    }
    // Tree re-renders reactively from the dataStore change.
  };

  node.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  return {
    destroy() {
      node.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    },
  };
}
