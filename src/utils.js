export function call(fnlike, ...rest) {
  return typeof fnlike === "function" ? fnlike.call(null, ...rest) : fnlike;
}
export const nope = () => {};

function x() {
  Object.keys(ctx);
}
export function compile(ctx, expression) {
  const body = `with(ctx){return ${expression}}`;
  const args = ["ctx", body];
  const fn = new Function(...args);
  return () => fn(ctx);
}

export function walk(el, fn) {
  if (!el) return;
  el.$next = el.nextElementSibling;
  fn(el);
  if (el.getAttribute("x-for")) {
    walk(el.nextElementSibling, fn);
  } else {
    let cur = el.firstElementChild;
    while (cur) {
      fn(cur);
      [...cur.children].forEach((c) => {
        walk(c, fn);
      });
      cur = cur.nextElementSibling;
    }
  }
}

export function compose(...fns) {
  return (...args) => {
    [...fns].reduceRight(
      (acc, cur) => {
        if (acc === null) {
          return null;
        }
        const result = cur.apply(null, acc);
        if (result === null) {
          return null;
        }
        if (result === undefined) {
          return [...args];
        }
        return Array.isArray(result) ? result : [result];
      },
      [...args]
    );
  };
}
export function extendContext(base, ctx) {
  const keys = Object.keys(ctx);
  return new Proxy(ctx, {
    has() {
      return true;
    },
    get(obj, k, re) {
      if (keys.includes(k)) {
        return obj[k];
      }
      return base[k];
    },
    set(obj, k, v) {
      if (keys.includes(k)) {
        obj[k] = v;
      } else {
        base[k] = v;
      }
      return true;
    },
  });
}

export function isInput(el) {
  return el.tagName === "INPUT";
}
export function isCheckbox(el) {
  return isInput(el) && el.getAttribute("type") === "checkbox";
}
export function isRadio(el) {
  return isInput(el) && el.getAttribute("type") === "radio";
}
export function isTemplate(el) {
  return el && el.tagName === "TEMPLATE";
}
