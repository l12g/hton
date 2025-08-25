export function call(fnlike, ...rest) {
  return typeof fnlike === "function" ? fnlike.call(null, ...rest) : fnlike;
}
export const nope = () => {};

export function compile(ctx, expression) {
  const body = `with(ctx){return ${expression}}`;
  const args = ["ctx", body];
  const fn = new Function(...args);
  return () => fn(ctx);
}

export function walk(el, fn) {
  if (!isValidNode(el)) return;
  if (!el.$next) {
    el.$next = el.nextElementSibling;
  }
  fn(el);

  if (!isElement(el)) {
    return;
  }
  if (isTemplate(el)) {
    walkTemplate(el, fn);
    return;
  }
  if (hasAttr(el, "for")) {
    return;
  }
  if (hasAttr(el, "if") || hasAttr(el, "elseif") || hasAttr(el, "else")) {
    return;
  }

  for (const c of el.childNodes) {
    walk(c, fn);
  }
}
export function walkTemplate(el, fn) {
  [...el.content.childNodes].forEach((c) => walk(c, fn));
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
  return isValidNode(el) && el.tagName === "INPUT";
}
export function isCheckbox(el) {
  return isInput(el) && el.getAttribute("type") === "checkbox";
}
export function isRadio(el) {
  return isInput(el) && el.getAttribute("type") === "radio";
}
export function isTemplate(el) {
  return isValidNode(el) && el.tagName === "TEMPLATE";
}
export function isTextNode(el) {
  return isValidNode(el) && el.nodeType === 3;
}
export function isElement(el) {
  return isValidNode(el) && [1, 11].includes(el.nodeType);
}
export function isFragment(el) {
  return isValidNode(el) && el.nodeType === 11;
}
export function isValidNode(el) {
  return el && [1, 3, 11].includes(el.nodeType);
}
export function formatAttr(attr) {
  const prefix = "_";
  return prefix + attr;
}
export function hasAttr(el, attr) {
  return el.hasAttribute(formatAttr(attr));
}
export function getAttr(el, attr) {
  return el.getAttribute(formatAttr(attr));
}
export function removeAttr(el, attr) {
  return el.removeAttribute(formatAttr(attr));
}
