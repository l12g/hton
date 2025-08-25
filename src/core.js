import { render } from "./render";
import { call, nope, walk } from "./utils";

export function create(fn) {
  const cbs = new Map();

  let current = null;
  const setCurrent = (v) => (v = current = v);
  const effectArgs = { setCurrent };
  const effect = (fn) => {
    const _cur = current;
    current = fn;
    fn(effectArgs);
    current = _cur;
    return fn.$clear || nope;
  };

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
          deps.forEach((f) => f(effectArgs));
        }
        return true;
      },
    }
  );
  const userContext = fn(state, effect) || {};
  Object.assign(state, userContext);
  const mount = (el) => {
    el = typeof el === "string" ? document.querySelector(el) : el;
    const ticks = [];
    walk(el, (dom) => {
      ticks.push(() =>
        render({
          dom,
          ctx: state,
          effect,
        })
      );
    });
    ticks.forEach(call);
  };

  return {
    mount,
  };
}
