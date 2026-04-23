<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { ContextMenuItem } from "../sidebar/types";

  let { x, y, items, onClose }: {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
  } = $props();

  let menuEl: HTMLDivElement | undefined = $state();
  // svelte-ignore state_referenced_locally
  let pos = $state({ x, y, visible: false });

  onMount(() => {
    const adjust = async () => {
      await tick();
      if (!menuEl) return;
      const rect = menuEl.getBoundingClientRect();
      let ax = x, ay = y;
      if (rect.right > window.innerWidth) ax = Math.max(4, window.innerWidth - rect.width - 4);
      if (rect.bottom > window.innerHeight) ay = Math.max(4, window.innerHeight - rect.height - 4);
      pos = { x: ax, y: ay, visible: true };
    };
    void adjust();

    const onMouseDown = (e: MouseEvent) => {
      if (menuEl && !menuEl.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => document.addEventListener("mousedown", onMouseDown, true), 0);
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    return () => {
      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
    };
  });

  function runItem(item: ContextMenuItem) {
    onClose();
    item.action();
  }
</script>

<div
  class="ctx-menu"
  bind:this={menuEl}
  style="left: {pos.x}px; top: {pos.y}px; visibility: {pos.visible ? 'visible' : 'hidden'}"
  role="menu"
>
  {#each items as item, i (i)}
    {#if item.label === "-"}
      <div class="ctx-sep"></div>
    {:else}
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="ctx-item"
        class:ctx-item-danger={item.danger}
        onclick={() => runItem(item)}
        role="menuitem"
        tabindex="-1"
      >
        {#if item.icon}{@html item.icon}{/if}
        <span>{item.label}</span>
      </div>
    {/if}
  {/each}
</div>
