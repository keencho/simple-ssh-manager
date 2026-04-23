// Tiny shared flag used by the (still-vanilla in 4c) DnD code to suppress the
// click event that fires immediately after a drop. Will become a self-contained
// Svelte action in PHASE 4d.

let _justFinished = false;

export const dndState = {
  get justFinished() { return _justFinished; },
  setJustFinished(v: boolean) { _justFinished = v; },
};
