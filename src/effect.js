import { nope } from "./utils";

export function createEffect() {
  let current = null;
  return {
    setCurrent: (v) => (v = current = v),
    getCurrent: () => current,
    effect: (fn) => {
      const _cur = current;
      current = fn;
      fn();
      current = _cur;
      return fn.$clear || nope;
    },
  };
}
const { setCurrent, getCurrent, effect } = createEffect();
export { setCurrent, getCurrent, effect };
