<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { ICONS } from "../../icons";
  import type { TabResult } from "./inputPromptTypes";

  let {
    message,
    defaultValue = "",
    onConfirm,
    onCancel,
    onTab,
  }: {
    message: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    onTab?: (value: string) => Promise<TabResult>;
  } = $props();

  let inputEl: HTMLInputElement;
  let value = $state("");
  let suggestions = $state<string[]>([]);

  $effect(() => { value = defaultValue; });

  function close(val: string | null) {
    if (val === null) onCancel();
    else onConfirm(val);
  }

  function handleOverlayMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) close(null);
  }

  async function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      close(value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (suggestions.length > 0) suggestions = [];
      else close(null);
    } else if (e.key === "Tab" && onTab) {
      e.preventDefault();
      const result = await onTab(value);
      if (result.completed !== null) {
        value = result.completed;
        suggestions = [];
      }
      if (result.candidates && result.candidates.length > 1) {
        suggestions = result.candidates;
      }
    }
  }

  function handleInput() {
    suggestions = [];
  }

  function pickSuggestion(name: string) {
    const parentDir = value.replace(/\/[^/]*$/, "") || "/";
    value = (parentDir === "/" ? "/" : parentDir + "/") + name + "/";
    suggestions = [];
    inputEl?.focus();
  }

  onMount(() => {
    setTimeout(() => {
      inputEl?.focus();
      inputEl?.select();
    }, 50);
  });
</script>

<div class="dialog-overlay" role="presentation" onmousedown={handleOverlayMouseDown}>
  <div class="dialog-box">
    <div class="dialog-message">{message}</div>
    <input
      class="dialog-input"
      type="text"
      bind:this={inputEl}
      bind:value
      oninput={handleInput}
      onkeydown={handleKeyDown}
    />
    {#if suggestions.length > 0}
      <div class="dialog-suggestions">
        {#each suggestions as name}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="dialog-suggestion-item"
            role="button"
            tabindex="0"
            onclick={() => pickSuggestion(name)}
          >{@html ICONS.folderOpen} {name}</div>
        {/each}
      </div>
    {/if}
    <div class="dialog-footer">
      <button class="dialog-btn dialog-btn-cancel" onclick={() => close(null)}>{$_("common.cancel")}</button>
      <button class="dialog-btn dialog-btn-ok" onclick={() => close(value)}>{$_("common.ok")}</button>
    </div>
  </div>
</div>
