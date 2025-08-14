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

  const handler = {
    has() {
      return true;
    },
    get(obj, k) {
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
  };
  const ctx = new Proxy({}, handler);

  const get = () => {
    return ctx;
  };
  const set = (obj = {}) => {
    Object.assign(ctx, obj);
  };
  const userContext = fn(get, set);

  Object.assign(ctx, userContext);

  return {
    mount(el) {
      const children = [...el.children];
      const ticks = [];
      children.forEach((c) => {
        walk(c, (dom) => {
          ticks.push(() =>
            render({
              dom,
              ctx,
              effect,
            })
          );
        });
      });
      ticks.forEach(call);
    },
    cbs,
  };
}
