<script lang="ts">
  import { onMount } from "svelte";
  import TerminalArea from "./lib/components/terminal/TerminalArea.svelte";
  import SftpPanels from "./lib/components/sftp/SftpPanels.svelte";

  onMount(() => {
    document.title = "Terminal";
  });
</script>

<TerminalArea />
<SftpPanels />
