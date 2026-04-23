<script lang="ts">
  import { ui } from "../../stores/ui.svelte";

  let { sidebarEl }: { sidebarEl: HTMLElement | null } = $props();

  let dragging = false;
  let startX = 0;
  let startW = 0;

  function onMouseDown(e: MouseEvent) {
    if (!sidebarEl) return;
    dragging = true;
    startX = e.clientX;
    startW = sidebarEl.offsetWidth;
    document.body.classList.add("sidebar-resizing");
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      if (!dragging || !sidebarEl) return;
      const direction = ui.sidebarPosition === "right" ? -1 : 1;
      const w = Math.max(240, Math.min(640, startW + direction * (ev.clientX - startX)));
      sidebarEl.style.width = w + "px";
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("sidebar-resizing");
      if (sidebarEl) ui.setSidebarWidth(sidebarEl.offsetWidth);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div id="sidebar-resizer" role="separator" aria-orientation="vertical" onmousedown={onMouseDown}></div>
