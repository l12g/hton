import { getCurrent } from "./effect";
import { render } from "./render";
import { call, walk } from "./utils";

export function create(fn) {
  const cbs = new Map();

  const state = new Proxy(
    {},
    {
      has() {
        return true;
      },
      get(obj, k) {
        if (k === Symbol.unscopables) {
          return null;
        }
        if (!cbs.get(k)) {
          cbs.set(k, new Set());
        }
        const current = getCurrent();
        if (current) {
          const _cur = current;
          cbs.get(k).add(_cur);
          _cur.$clear = () => {
            cbs.get(k).delete(_cur);
          };
        }
        return obj[k];
      },
      set(obj, k, v) {
        if (obj[k] === v) {
          return true;
        }
        obj[k] = v;
        if (cbs.has(k)) {
          const deps = cbs.get(k);
          deps.forEach((f) => f());
        }
        return true;
      },
    }
  );
  const userContext = fn(state) || {};
  Object.assign(state, userContext);
  const mount = (el) => {
    el = typeof el === "string" ? document.querySelector(el) : el;
    if (!el) {
      throw new Error("el not found");
    }
    const ticks = [];
    walk(el, (dom) => {
      ticks.push(() =>
        render({
          dom,
          ctx: state,
        })
      );
    });
    ticks.forEach(call);
  };

  return {
    mount,
    state,
  };
}
