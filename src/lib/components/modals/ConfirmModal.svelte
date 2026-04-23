<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";

  let { title, message, onConfirm, onCancel }: {
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } = $props();

  let okBtn: HTMLButtonElement | undefined = $state();

  onMount(() => {
    okBtn?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function handleOverlayMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) onCancel();
  }
</script>

<div class="dialog-overlay" role="presentation" onmousedown={handleOverlayMouseDown}>
  <div class="dialog-box">
    {#if title}
      <div class="dialog-title">{title}</div>
    {/if}
    <div class="dialog-message">{message}</div>
    <div class="dialog-footer">
      <button class="dialog-btn dialog-btn-cancel" onclick={onCancel}>{$_("common.cancel")}</button>
      <button class="dialog-btn dialog-btn-ok" bind:this={okBtn} onclick={onConfirm}>{$_("common.ok")}</button>
    </div>
  </div>
</div>
