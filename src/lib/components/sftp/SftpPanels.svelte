<script lang="ts">
  import { sftpStore } from "../../stores/sftp.svelte";
  import SftpPanel from "./SftpPanel.svelte";
</script>

{#each sftpStore.panels as panel (panel.id)}
  <SftpPanel {panel} />
{/each}
