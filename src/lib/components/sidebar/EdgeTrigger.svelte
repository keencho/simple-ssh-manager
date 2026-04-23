<script lang="ts">
  import { _ } from "svelte-i18n";
  import { ICONS } from "../../icons";
  import { ui } from "../../stores/ui.svelte";

  let { onToggle }: { onToggle: () => void } = $props();
</script>

<button
  class="sidebar-edge-trigger"
  id="sidebar-edge-trigger"
  title={$_("sidebar.actions.show")}
  onclick={onToggle}
  aria-hidden={!ui.sidebarHidden}
>{@html ICONS.chevronRight}</button>
