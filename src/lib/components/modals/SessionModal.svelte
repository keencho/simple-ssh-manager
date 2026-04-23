<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { open } from "@tauri-apps/plugin-dialog";
  import type { SshSession, JumpHost, Folder, AuthMethod } from "../../api/types";
  import * as Data from "../../api/data";
  import { ICONS } from "../../icons";

  let { mode, initial, defaultFolderId, folders, onSave, onCancel, onError }: {
    mode: "add" | "edit";
    initial?: SshSession;
    defaultFolderId?: string | null;
    folders: Folder[];
    onSave: (newData: Awaited<ReturnType<typeof Data.createSession>>) => void;
    onCancel: () => void;
    onError: (msg: string) => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  const isEdit = mode === "edit";

  /* eslint-disable */
  // svelte-ignore state_referenced_locally
  let name = $state(initial?.name ?? "");
  // svelte-ignore state_referenced_locally
  let host = $state(initial?.host ?? "");
  // svelte-ignore state_referenced_locally
  let port = $state(initial?.port ?? 22);
  // svelte-ignore state_referenced_locally
  let user = $state(initial?.user ?? "");
  // svelte-ignore state_referenced_locally
  let keyFile = $state(initial?.key_file ?? "");
  // svelte-ignore state_referenced_locally
  let folderId = $state<string>(
    isEdit ? (initial?.folder_id ?? "") : (defaultFolderId ?? "")
  );
  // svelte-ignore state_referenced_locally
  let authMethod = $state<AuthMethod>(initial?.auth_method ?? "key");
  // svelte-ignore state_referenced_locally
  let storePassword = $state<boolean>(initial?.store_password ?? true);
  let password = $state("");
  let showPassword = $state(false);

  // svelte-ignore state_referenced_locally
  let useJump = $state(!!initial?.jump_host);
  // svelte-ignore state_referenced_locally
  let jHost = $state(initial?.jump_host?.host ?? "");
  // svelte-ignore state_referenced_locally
  let jPort = $state(initial?.jump_host?.port ?? 22);
  // svelte-ignore state_referenced_locally
  let jUser = $state(initial?.jump_host?.user ?? "");
  // svelte-ignore state_referenced_locally
  let jKey = $state(initial?.jump_host?.key_file ?? "");
  // svelte-ignore state_referenced_locally
  let jAuthMethod = $state<AuthMethod>(initial?.jump_host?.auth_method ?? "key");
  // svelte-ignore state_referenced_locally
  let jStorePassword = $state<boolean>(initial?.jump_host?.store_password ?? true);
  let jPassword = $state("");
  let jShowPassword = $state(false);

  let nameInput: HTMLInputElement | undefined = $state();

  onMount(() => {
    setTimeout(() => nameInput?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function handleOverlayMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) onCancel();
  }

  async function browseKey(setter: (path: string) => void) {
    const path = await open({
      filters: [{ name: "Key Files", extensions: ["pem", "key", "ppk"] }],
      multiple: false,
    });
    if (path) setter(path as string);
  }

  // When switching auth method, clear the OPPOSITE method's data so the user
  // can't accidentally save stale credentials. Edit mode: editing an existing
  // session and switching method silently drops the previous credential at
  // save time (backend cleans up keyring/cache).
  function switchAuth(target: "main" | "jump", method: AuthMethod) {
    if (target === "main") {
      authMethod = method;
      if (method === "password") keyFile = "";
      else password = "";
    } else {
      jAuthMethod = method;
      if (method === "password") jKey = "";
      else jPassword = "";
    }
  }

  async function save() {
    const trimmedName = name.trim();
    const trimmedHost = host.trim();
    const trimmedUser = user.trim();
    const trimmedKey = keyFile.trim();
    const finalFolderId = folderId || null;
    const finalPort = Number(port) || 22;

    if (!trimmedName || !trimmedHost || !trimmedUser) {
      onError($_("modal.session.errors.required"));
      return;
    }

    // Password required when adding a new password-auth session (or edit with empty saved).
    if (authMethod === "password" && !isEdit && !password) {
      onError($_("modal.session.errors.passwordRequired"));
      return;
    }

    let jumpHost: JumpHost | null = null;
    let jumpPasswordToSend: string | null = null;
    if (useJump) {
      const jh = jHost.trim();
      const ju = jUser.trim();
      const jk = jKey.trim();
      const jp = Number(jPort) || 22;
      if (jh && ju) {
        if (jAuthMethod === "password" && !isEdit && !jPassword) {
          onError($_("modal.session.errors.passwordRequired"));
          return;
        }
        jumpHost = {
          host: jh,
          port: jp,
          user: ju,
          key_file: jk,
          auth_method: jAuthMethod,
          store_password: jStorePassword,
        };
        if (jAuthMethod === "password" && jPassword) jumpPasswordToSend = jPassword;
      }
    }

    const passwordToSend: string | null = (authMethod === "password" && password) ? password : null;

    try {
      let newData;
      if (isEdit && initial) {
        newData = await Data.updateSession({
          ...initial,
          name: trimmedName,
          host: trimmedHost,
          port: finalPort,
          user: trimmedUser,
          key_file: trimmedKey,
          folder_id: finalFolderId,
          jump_host: jumpHost,
          auth_method: authMethod,
          store_password: storePassword,
        }, passwordToSend, jumpPasswordToSend);
      } else {
        newData = await Data.createSession({
          name: trimmedName,
          host: trimmedHost,
          port: finalPort,
          user: trimmedUser,
          keyFile: trimmedKey,
          folderId: finalFolderId,
          jumpHost,
          authMethod,
          storePassword,
          password: passwordToSend,
          jumpPassword: jumpPasswordToSend,
        });
      }
      onSave(newData);
    } catch (e) {
      onError($_("modal.session.errors.save", { values: { error: String(e) } }));
    }
  }
</script>

<div class="modal-overlay" role="presentation" onmousedown={handleOverlayMouseDown}>
  <div class="modal">
    <button class="modal-close" onclick={onCancel} aria-label="close">{@html ICONS.close}</button>
    <div class="modal-title">
      {isEdit ? $_("modal.session.title.edit") : $_("modal.session.title.add")}
    </div>

    <div class="form-group">
      <label class="form-label" for="f-name">{$_("modal.session.fields.name")}</label>
      <input
        id="f-name"
        class="form-input"
        bind:this={nameInput}
        bind:value={name}
        placeholder={$_("modal.session.fields.namePlaceholder")}
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="f-host">{$_("modal.session.fields.host")}</label>
        <input
          id="f-host"
          class="form-input"
          bind:value={host}
          placeholder={$_("modal.session.fields.hostPlaceholder")}
        />
      </div>
      <div class="form-group small">
        <label class="form-label" for="f-port">{$_("modal.session.fields.port")}</label>
        <input id="f-port" class="form-input" type="number" bind:value={port} />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="f-user">{$_("modal.session.fields.user")}</label>
      <input
        id="f-user"
        class="form-input"
        bind:value={user}
        placeholder={$_("modal.session.fields.userPlaceholder")}
      />
    </div>

    <div class="form-group">
      <div class="form-label">{$_("modal.session.auth.label")}</div>
      <div class="auth-method-row">
        <label class="auth-radio">
          <input type="radio" name="auth-main" value="key" checked={authMethod === "key"} onchange={() => switchAuth("main", "key")} />
          <span class="radio-mark"></span>
          <span>{$_("modal.session.auth.key")}</span>
        </label>
        <label class="auth-radio">
          <input type="radio" name="auth-main" value="password" checked={authMethod === "password"} onchange={() => switchAuth("main", "password")} />
          <span class="radio-mark"></span>
          <span>{$_("modal.session.auth.password")}</span>
        </label>
      </div>
    </div>

    {#if authMethod === "key"}
      <div class="form-group">
        <label class="form-label" for="f-keyfile">{$_("modal.session.fields.keyfile")}</label>
        <div class="form-file-row">
          <input
            id="f-keyfile"
            class="form-input"
            bind:value={keyFile}
            placeholder={$_("modal.session.fields.keyfilePlaceholder")}
          />
          <button class="form-file-btn" onclick={() => browseKey((p) => (keyFile = p))}>
            {$_("modal.session.fields.browse")}
          </button>
        </div>
      </div>
    {:else}
      <div class="form-group">
        <label class="form-label" for="f-pwd">{$_("modal.session.auth.password")}</label>
        <div class="form-file-row">
          <input
            id="f-pwd"
            class="form-input"
            type={showPassword ? "text" : "password"}
            bind:value={password}
            placeholder={isEdit ? "••••••••" : $_("modal.session.auth.passwordPlaceholder")}
            autocomplete="off"
          />
          <button
            type="button"
            class="form-file-btn"
            title={showPassword ? $_("modal.session.auth.hide") : $_("modal.session.auth.show")}
            onclick={() => (showPassword = !showPassword)}
          >{showPassword ? "🙈" : "👁"}</button>
        </div>
      </div>
      <label class="auth-store">
        <input type="checkbox" bind:checked={storePassword} />
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        <span class="auth-store-text">
          <span>{$_("modal.session.auth.storePassword")}</span>
          <span class="auth-store-hint">{$_("modal.session.auth.storePasswordHint")}</span>
        </span>
      </label>
    {/if}

    <div class="form-group">
      <label class="form-label" for="f-folder">{$_("modal.session.fields.folder")}</label>
      <select id="f-folder" class="form-select" bind:value={folderId}>
        <option value="">{$_("modal.session.fields.folderUncategorized")}</option>
        {#each folders as f (f.id)}
          <option value={f.id}>{f.name}</option>
        {/each}
      </select>
    </div>

    <label class="jump-toggle">
      <input type="checkbox" bind:checked={useJump} />
      <span class="toggle-track"><span class="toggle-thumb"></span></span>
      <span class="jump-toggle-label">{$_("modal.session.jump.toggle")}</span>
    </label>

    <div class="jump-section" class:hidden={!useJump}>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="f-jhost">{$_("modal.session.jump.host")}</label>
          <input
            id="f-jhost"
            class="form-input"
            bind:value={jHost}
            placeholder={$_("modal.session.jump.hostPlaceholder")}
          />
        </div>
        <div class="form-group small">
          <label class="form-label" for="f-jport">{$_("modal.session.fields.port")}</label>
          <input id="f-jport" class="form-input" type="number" bind:value={jPort} />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="f-juser">{$_("modal.session.jump.user")}</label>
        <input
          id="f-juser"
          class="form-input"
          bind:value={jUser}
          placeholder={$_("modal.session.jump.userPlaceholder")}
        />
      </div>
      <div class="form-group">
        <div class="form-label">{$_("modal.session.auth.label")}</div>
        <div class="auth-method-row">
          <label class="auth-radio">
            <input type="radio" name="auth-jump" value="key" checked={jAuthMethod === "key"} onchange={() => switchAuth("jump", "key")} />
            <span class="radio-mark"></span>
            <span>{$_("modal.session.auth.key")}</span>
          </label>
          <label class="auth-radio">
            <input type="radio" name="auth-jump" value="password" checked={jAuthMethod === "password"} onchange={() => switchAuth("jump", "password")} />
            <span class="radio-mark"></span>
            <span>{$_("modal.session.auth.password")}</span>
          </label>
        </div>
      </div>
      {#if jAuthMethod === "key"}
        <div class="form-group">
          <label class="form-label" for="f-jkeyfile">{$_("modal.session.jump.keyfile")}</label>
          <div class="form-file-row">
            <input
              id="f-jkeyfile"
              class="form-input"
              bind:value={jKey}
              placeholder={$_("modal.session.jump.keyfilePlaceholder")}
            />
            <button class="form-file-btn" onclick={() => browseKey((p) => (jKey = p))}>
              {$_("modal.session.fields.browse")}
            </button>
          </div>
        </div>
      {:else}
        <div class="form-group">
          <label class="form-label" for="f-jpwd">{$_("modal.session.auth.password")}</label>
          <div class="form-file-row">
            <input
              id="f-jpwd"
              class="form-input"
              type={jShowPassword ? "text" : "password"}
              bind:value={jPassword}
              placeholder={isEdit ? "••••••••" : $_("modal.session.auth.passwordPlaceholder")}
              autocomplete="off"
            />
            <button
              type="button"
              class="form-file-btn"
              title={jShowPassword ? $_("modal.session.auth.hide") : $_("modal.session.auth.show")}
              onclick={() => (jShowPassword = !jShowPassword)}
            >{jShowPassword ? "🙈" : "👁"}</button>
          </div>
        </div>
        <label class="auth-store">
          <input type="checkbox" bind:checked={jStorePassword} />
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="auth-store-text">
            <span>{$_("modal.session.auth.storePassword")}</span>
            <span class="auth-store-hint">{$_("modal.session.auth.storePasswordHint")}</span>
          </span>
        </label>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-cancel" onclick={onCancel}>{$_("common.cancel")}</button>
      <button class="btn-save" onclick={save}>{$_("modal.session.actions.save")}</button>
    </div>
  </div>
</div>

<style>
  /* Auth method — clean inline radios, no container */
  .auth-method-row {
    display: inline-flex;
    gap: 22px;
    align-items: center;
  }
  .auth-radio {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    font-size: 13px;
    color: var(--text-secondary);
    transition: color 0.15s;
  }
  .auth-radio input { display: none; }
  .auth-radio .radio-mark {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid var(--text-tertiary);
    background: transparent;
    flex-shrink: 0;
    position: relative;
    transition: border-color 0.15s;
  }
  .auth-radio .radio-mark::after {
    content: "";
    position: absolute;
    inset: 0;
    margin: auto;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    transform: scale(0);
    transition: transform 0.15s ease-out;
  }
  .auth-radio:hover { color: var(--text); }
  .auth-radio:hover .radio-mark { border-color: var(--text-secondary); }
  .auth-radio:has(input:checked) { color: var(--text); }
  .auth-radio:has(input:checked) .radio-mark {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .auth-radio:has(input:checked) .radio-mark::after {
    transform: scale(1);
  }

  /* Store-password toggle row */
  .auth-store {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 4px 0 12px;
    cursor: pointer;
    user-select: none;
  }
  .auth-store input { display: none; }
  .auth-store .toggle-track {
    margin-top: 1px;
  }
  .auth-store input:checked + .toggle-track {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
  }
  .auth-store input:checked + .toggle-track .toggle-thumb {
    left: 18px;
    background: var(--accent);
  }
  .auth-store-text {
    display: flex;
    flex-direction: column;
  }
  .auth-store-hint {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 2px;
  }
</style>
