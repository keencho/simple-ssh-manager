import { mount, unmount } from "svelte";
import InputPromptModal from "./InputPromptModal.svelte";
import type { TabResult } from "./inputPromptTypes";

export function mountInputPrompt(opts: {
  message: string;
  defaultValue?: string;
  onTab?: (value: string) => Promise<TabResult>;
}): Promise<string | null> {
  return new Promise((resolve) => {
    const target = document.createElement("div");
    document.body.appendChild(target);

    let component: ReturnType<typeof mount> | null = null;
    const close = () => {
      if (component) unmount(component);
      target.remove();
    };

    component = mount(InputPromptModal, {
      target,
      props: {
        message: opts.message,
        defaultValue: opts.defaultValue ?? "",
        onTab: opts.onTab,
        onConfirm: (value: string) => { close(); resolve(value); },
        onCancel: () => { close(); resolve(null); },
      },
    });
  });
}

export type { TabResult };
