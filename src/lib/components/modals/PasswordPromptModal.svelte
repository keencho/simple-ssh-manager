<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";

  let {
    user,
    host,
    isJump,
    onConfirm,
    onCancel,
  }: {
    user: string;
    host: string;
    isJump: boolean;
    onConfirm: (password: string) => void;
    onCancel: () => void;
  } = $props();

  let inputEl: HTMLInputElement;
  let value = $state("");
  let show = $state(false);

  function handleOverlayMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) onCancel();
  }
  function handleKey(e: KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); if (value) onConfirm(value); }
    else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
  }

  onMount(() => {
    setTimeout(() => inputEl?.focus(), 50);
  });
</script>

<div class="dialog-overlay" role="presentation" onmousedown={handleOverlayMouseDown}>
  <div class="dialog-box">
    <div class="dialog-title">{$_("modal.passwordPrompt.title")}</div>
    <div class="dialog-message">
      {#if isJump}
        {$_("modal.passwordPrompt.subtitleJump", { values: { user, host } })}
      {:else}
        {$_("modal.passwordPrompt.subtitle", { values: { user, host } })}
      {/if}
    </div>
    <div class="pwprompt-row">
      <input
        class="dialog-input"
        bind:this={inputEl}
        bind:value
        type={show ? "text" : "password"}
        placeholder={$_("modal.passwordPrompt.placeholder")}
        autocomplete="off"
        onkeydown={handleKey}
      />
      <button
        type="button"
        class="dialog-btn"
        title={show ? $_("modal.session.auth.hide") : $_("modal.session.auth.show")}
        onclick={() => (show = !show)}
      >{show ? "🙈" : "👁"}</button>
    </div>
    <div class="dialog-footer">
      <button class="dialog-btn dialog-btn-cancel" onclick={onCancel}>{$_("modal.passwordPrompt.cancel")}</button>
      <button class="dialog-btn dialog-btn-ok" onclick={() => value && onConfirm(value)}>{$_("modal.passwordPrompt.ok")}</button>
    </div>
  </div>
</div>

<style>
  .pwprompt-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }
  .pwprompt-row .dialog-input { flex: 1; }
  .dialog-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }
</style>
