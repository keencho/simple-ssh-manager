<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { Terminal } from "@xterm/xterm";
  import { FitAddon } from "@xterm/addon-fit";
  import { WebLinksAddon } from "@xterm/addon-web-links";
  import { SerializeAddon } from "@xterm/addon-serialize";
  import {
    type PaneData,
    type TabData,
    findPane,
    registerXterm,
    unregisterXterm,
    takePendingOutput,
    takeAdoptedContent,
    setPaneCwd,
    setFocusedPane,
    getSessionHome,
    isSessionHomeInflight,
    markSessionHomeInflight,
    clearSessionHomeInflight,
    setSessionHome,
    getCurrentTheme,
    getCurrentFontFamily,
    FONT_DEFAULT,
    MAX_PANES_PER_TAB,
  } from "../../stores/terminals.svelte";
  import * as Ssh from "../../api/ssh";
  import {
    sendResize,
    focusPane,
    updateWindowTitle,
    closePane,
    toggleZoomForPane,
    setActiveTab,
    isOurShortcut,
    splitActiveSameSession,
    openSessionPicker,
    copyActiveSelection,
    pasteToActive,
  } from "../../terminal/operations";
  import { t } from "../../i18n";
  import { mountContextMenu } from "../modals/mount";
  import { openSftpPanel } from "../../sftp/operations";
  import { TERM_CLOSE_SVG, TERM_ZOOM_OUT_SVG } from "./icons";
  import type { ContextMenuItem } from "../sidebar/types";

  let { pane, tab }: { pane: PaneData; tab: TabData } = $props();

  let paneEl: HTMLElement;
  let xtermEl: HTMLElement;
  let term: Terminal;
  let fit: FitAddon;

  const isFocused = $derived(tab.focusedPaneId === pane.id);
  const isHidden = $derived(tab.zoomedPaneId !== null && tab.zoomedPaneId !== pane.id);
  const isMulti = $derived(tab.panes.length > 1);
  const hasZoom = $derived(tab.zoomedPaneId !== null);
  const flexValue = $derived.by(() => {
    if (hasZoom) return isHidden ? "0 0 0" : "1 1 0";
    const idx = tab.panes.findIndex((p) => p.id === pane.id);
    return `${tab.ratios[idx] ?? 1} 1 0`;
  });

  function triggerHomeFetch(sessionId: string | null | undefined) {
    if (!sessionId) return;
    if (getSessionHome(sessionId) || isSessionHomeInflight(sessionId)) return;
    markSessionHomeInflight(sessionId);
    Ssh.getSessionHome(sessionId)
      .then((home) => { if (home) setSessionHome(sessionId, home); })
      .catch(() => {})
      .finally(() => clearSessionHomeInflight(sessionId));
  }

  onMount(() => {
    term = new Terminal({
      theme: getCurrentTheme().xterm,
      fontFamily: getCurrentFontFamily(),
      fontSize: pane.fontSize ?? FONT_DEFAULT,
      lineHeight: 1.08,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 10000,
      allowProposedApi: true,
      minimumContrastRatio: 4.5,
    });
    term.attachCustomKeyEventHandler((ev) => {
      if (ev.type !== "keydown") return true;
      return !isOurShortcut(ev);
    });

    fit = new FitAddon();
    const serialize = new SerializeAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.loadAddon(serialize);
    term.open(xtermEl);

    registerXterm(pane.id, { term, fit, serialize });

    // Replay scrollback rescued from a cross-tab move (if any), then drain
    // any output that arrived during the unmount/remount window.
    const adopted = takeAdoptedContent(pane.id);
    if (adopted) term.write(adopted);
    const queued = takePendingOutput(pane.id);
    for (const c of queued) term.write(c);

    // OSC 7 cwd tracking
    term.parser.registerOscHandler(7, (data) => {
      const m = data.match(/^file:\/\/[^/]*(\/.*)$/);
      if (m) {
        try { setPaneCwd(pane.id, decodeURIComponent(m[1])); }
        catch { setPaneCwd(pane.id, m[1]); }
      }
      return false;
    });

    // OSC 0/2 window title fallback (e.g. "user@host: ~/path")
    term.onTitleChange((title) => {
      const m = title.match(/^[^:@\s]+@[^:]+:\s*(.+)$/);
      if (!m) return;
      let path = m[1].trim();
      if (path.startsWith("~")) {
        const home = getSessionHome(pane.sessionId ?? "");
        if (home) path = home + path.slice(1);
        else { triggerHomeFetch(pane.sessionId); return; }
      }
      if (path.startsWith("/")) setPaneCwd(pane.id, path);
    });

    // PTY input → broadcast-aware write
    term.onData((data) => {
      const r = findPane(pane.id);
      if (!r || r.pane.exited) return;
      const bytes = Array.from(new TextEncoder().encode(data));
      if (r.tab.broadcast) {
        for (const p of r.tab.panes) {
          if (!p.exited) void Ssh.ptyWrite(p.id, bytes);
        }
      } else {
        void Ssh.ptyWrite(pane.id, bytes);
      }
    });

    const ro = new ResizeObserver(() => {
      if (pane.exited) return;
      if (paneEl.offsetWidth <= 0 || paneEl.offsetHeight <= 0) return;
      try { fit.fit(); } catch {}
      sendResize(pane.id);
    });
    ro.observe(paneEl);

    requestAnimationFrame(() => {
      if (pane.exited) return;
      try { fit.fit(); } catch {}
      sendResize(pane.id);
    });

    return () => {
      ro.disconnect();
      unregisterXterm(pane.id);
      try { term.dispose(); } catch {}
    };
  });

  function handlePaneMousedown() {
    const r = findPane(pane.id);
    if (!r) return;
    if (r.tab.focusedPaneId !== pane.id) {
      setFocusedPane(r.tab.id, pane.id);
      term.focus();
      sendResize(pane.id);
      updateWindowTitle();
    }
  }

  function handleZoomClick(e: MouseEvent) {
    e.stopPropagation();
    const r = findPane(pane.id);
    if (r) toggleZoomForPane(r.tab.id, pane.id);
  }

  function handleCloseClick(e: MouseEvent) {
    e.stopPropagation();
    void closePane(pane.id);
  }

  function handleHeaderDblClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest(".pane-header-btn")) return;
    const r = findPane(pane.id);
    if (r) toggleZoomForPane(r.tab.id, pane.id);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const onXterm = !!target.closest(".pane-xterm");
    const r = findPane(pane.id);
    if (!r) return;
    setActiveTab(r.tab.id);
    setFocusedPane(r.tab.id, pane.id);

    const items: ContextMenuItem[] = [];
    if (onXterm) {
      const hasSel = term.hasSelection();
      items.push({
        label: t("terminal.menu.copy") + (hasSel ? "" : t("terminal.menu.copyNoSelection")),
        action: () => {
          void copyActiveSelection().then((ok) => { if (ok) term.clearSelection(); });
        },
      });
      items.push({ label: t("terminal.menu.paste"), action: () => void pasteToActive() });
      items.push({ label: "-", action: () => {} });
    }
    if (r.tab.panes.length < MAX_PANES_PER_TAB && pane.sshArgs.length > 0) {
      items.push({ label: t("terminal.menu.splitVerticalSame"), action: () => splitActiveSameSession() });
      items.push({ label: t("terminal.menu.splitVerticalOther"), action: () => void openSessionPicker() });
      items.push({ label: "-", action: () => {} });
    }
    if (pane.sessionId) {
      if (pane.cwd) {
        const display = pane.cwd.length > 40 ? "..." + pane.cwd.slice(-37) : pane.cwd;
        items.push({
          label: t("terminal.menu.sftpOpenWithCwd", { path: display }),
          action: () => void openSftpPanel(pane.sessionId!, pane.cwd!, pane.baseTitle),
        });
      }
      items.push({ label: t("terminal.menu.sftpOpenHome"), action: () => void openSftpPanel(pane.sessionId!, undefined, pane.baseTitle) });
      items.push({ label: "-", action: () => {} });
    }
    items.push({
      label: r.tab.zoomedPaneId === pane.id
        ? t("terminal.menu.fullscreenExit")
        : t("terminal.menu.fullscreen"),
      action: () => toggleZoomForPane(r.tab.id, pane.id),
    });
    items.push({ label: "-", action: () => {} });
    items.push({ label: t("terminal.menu.closePane"), action: () => void closePane(pane.id), danger: true });
    mountContextMenu(e.clientX, e.clientY, items);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="term-pane"
  class:pane-focused={isFocused}
  class:pane-hidden={isHidden}
  data-pane-id={pane.id}
  bind:this={paneEl}
  style="flex: {flexValue}"
  onmousedown={handlePaneMousedown}
  oncontextmenu={handleContextMenu}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="pane-header"
    class:pane-header-visible={isMulti || hasZoom}
    class:pane-exited={pane.exited}
    draggable="true"
    ondblclick={handleHeaderDblClick}
  >
    <span class="pane-header-title">{pane.title}</span>
    <span class="pane-header-actions">
      <button
        class="pane-header-btn pane-header-zoom"
        title={$_("terminal.pane.zoom")}
        onclick={handleZoomClick}
      >{@html TERM_ZOOM_OUT_SVG}</button>
      <button
        class="pane-header-btn pane-header-close"
        title={$_("terminal.pane.close")}
        onclick={handleCloseClick}
      >{@html TERM_CLOSE_SVG}</button>
    </span>
  </div>
  <div class="pane-xterm" bind:this={xtermEl}></div>
</div>
