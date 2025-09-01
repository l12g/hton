declare module "htonjs" {
  export function create<T extends Record<string, any>>(
    init: (state: T) => T | void
  ): {
    mount: (el: HTMLElement | string) => void;
    destroy: () => void;
    state: T;
  };
  export function effect(fn: () => void): void;
}
