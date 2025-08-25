import {
  call,
  compile,
  compose,
  extendContext,
  formatAttr,
  getAttr,
  hasAttr,
  isCheckbox,
  isRadio,
  isTemplate,
  isTextNode,
  isValidNode,
  removeAttr,
  walk,
} from "./utils";

function createMarker(desc) {
  if (__DEV__) {
    return new Comment(desc);
  }
  return new Text("");
}

function remove(dom) {
  const chs = [...dom.childNodes];
  chs.forEach(remove);
  if (dom.$clears) {
    dom.$clears.forEach(call);
  }
  dom.remove();
}

function react(attr, { dom, ctx, effect }, fn) {
  const exp = getAttr(dom, attr);
  removeAttr(dom, attr);
  if (!exp) return;
  if (!fn) return;
  const tick = compile(ctx, exp);
  clean(
    dom,
    effect(() => {
      fn(call(tick), exp);
    })
  );
}

function xtext(opt) {
  return react("text", opt, (value) => {
    opt.dom.innerText = value;
  });
}

function xhtml(opt) {
  react("html", opt, (value) => {
    opt.dom.innerHTML = value;
  });
}

function xon(opt) {
  let ctrl;
  return react("on", opt, (obj) => {
    if (ctrl) ctrl.abort();
    ctrl = new AbortController();
    Object.keys(obj).forEach((event) => {
      opt.dom.addEventListener(event, obj[event], { signal: ctrl.signal });
    });
  });
}

function xif(opt) {
  if (!hasAttr(opt.dom, "if")) {
    return;
  }
  const { dom, ctx, effect } = opt;
  const exp = getAttr(dom, "if");
  removeAttr(dom, "if");
  const marker = createMarker("if");
  dom.before(marker);
  const getTick = (el, exp) => {
    const ower = isTemplate(el) ? el.content : new DocumentFragment();
    const nodes = isTemplate(el) ? [...el.content.childNodes] : [el];
    if (!isTemplate(el)) {
      nodes.forEach((n) => ower.appendChild(n));
    }
    return {
      ower,
      nodes,
      tick: exp ? compile(ctx, exp) : () => true,
    };
  };
  const ticks = [getTick(dom, exp)];
  let next = dom.$next;
  while (next) {
    const v = getAttr(next, "elseif") || hasAttr(next, "else");
    if (v) {
      ticks.push(getTick(next, v));
      next.remove();
      removeAttr(next, "else");
      removeAttr(next, "elseif");
      next = next.$next;
    } else {
      break;
    }
  }

  ticks.forEach((tick) => {
    tick.nodes.forEach((n) => {
      tick.ower.appendChild(n);
      walk(n, (el) => {
        render({ ...opt, dom: el });
      });
    });
  });

  clean(
    dom,
    effect(() => {
      let trueIdx = -1;
      for (let i = 0; i < ticks.length; i++) {
        const cur = ticks[i];
        if (trueIdx === -1) {
          if (call(cur.tick)) {
            trueIdx = i;
          }
        }

        if (trueIdx === i) {
          marker.after(cur.ower);
        } else {
          cur.nodes.forEach((n) => cur.ower.appendChild(n));
        }
      }
    })
  );
}

function xfor(opt) {
  const { dom, ctx, effect } = opt;
  const exp = getAttr(dom, "for");
  if (!exp) return;

  removeAttr(dom, "for");
  const marker = createMarker("for");
  dom.replaceWith(marker);
  const origin = document.createElement("template");
  origin.innerHTML = isTemplate(dom) ? dom.innerHTML : dom.outerHTML;

  const parsed = exp.split(/\bin\b/).map((v) => v.trim());
  const error = new Error(
    "for must be like 'k,v in list (for object) or item in list (for array)'"
  );

  let kbody = "";
  let kkey = "";
  let kvalue = "";

  if (parsed.length === 2) {
    kbody = parsed[1];
    const kvs = parsed[0].split(",").map((v) => v.trim());
    if (kvs.length === 0) {
      throw error;
    }
    if (kvs.length === 1) {
      kvalue = kvs[0];
    } else if (kvs.length === 2) {
      kvalue = kvs[0];
      kkey = kvs[1];
    } else {
      throw error;
    }
  } else if (parsed.length === 1) {
    kbody = parsed[0];
  } else {
    throw error;
  }

  let doms = [];

  const tick = compile(ctx, kbody, "loop");
  const doc = document.createDocumentFragment();
  const run = ({ setCurrent } = {}) => {
    doms.forEach(remove);
    const objorlist = call(tick);
    call(setCurrent, null);
    const list = Array.isArray(objorlist)
      ? objorlist.map((v, index) => ({ $key: index, $value: v }))
      : Object.keys(objorlist).map((k) => ({
          $key: k,
          $value: objorlist[k],
        }));

    list.forEach((item) => {
      const clone = origin.cloneNode(true);
      const localCtx = {};
      if (kvalue) {
        localCtx[kvalue] = item.$value;
      }
      if (kkey) {
        localCtx[kkey] = item.$key;
      }

      walk(clone, (el) => {
        render({ dom: el, ctx: extendContext(ctx, localCtx), effect });
      });

      doc.append(clone.content);
      doms = [...doc.childNodes];
    });
    marker.after(doc);
  };
  effect(run);
  return null;
}

function xclass(opt) {
  react("class", opt, (value) => {
    Object.keys(value).forEach((key) => {
      if (value[key]) {
        opt.dom.classList.add(key);
      } else {
        opt.dom.classList.remove(key);
      }
    });
  });
}

function xattr(opt) {
  for (const atr of opt.dom.attributes) {
    if (/^_/.test(atr.name)) {
      const n = atr.name.slice(1);
      react(n, opt, (value) => {
        opt.dom.setAttribute(n, value);
      });
    }
  }
  react("attr", opt, (value) => {
    Object.keys(value).forEach((key) => {
      const v = value[key];
      if (v === false || v === null || v === undefined) {
        opt.dom.removeAttribute(key);
      } else {
        opt.dom.setAttribute(key, v);
      }
    });
  });
}

function xstyle(opt) {
  react("style", opt, (value) => {
    Object.keys(value).forEach((key) => {
      const v = value[key];
      if (v === false || v === null || v === undefined) {
        opt.dom.style.removeProperty(key);
      } else {
        opt.dom.style.setProperty(key, v);
      }
    });
  });
}

function prepare(opt) {
  if (!isValidNode(opt.dom)) {
    return null;
  }
  if (!opt.$clears) opt.dom.$clears = [];
}
function ref(opt) {
  react("ref", opt, (value) => {
    call(value, opt.dom);
  });
}

function xmodel(opt) {
  const { effect, dom, ctx } = opt;
  const attr = formatAttr("model");
  const exp = dom.getAttribute(attr);
  dom.removeAttribute(attr);
  if (!exp) return;
  const checkorradio = isCheckbox(dom) || isRadio(dom);
  const evt = checkorradio ? "click" : "input";
  const ctrl = new AbortController();
  dom.addEventListener(
    evt,
    (e) => {
      if (checkorradio) {
        ctx[exp] = e.target.checked;
      } else {
        ctx[exp] = e.target.value;
      }
    },
    { singal: ctrl.signal }
  );
  clean(dom, () => ctrl.abort());
  clean(
    dom,
    effect(() => {
      switch (dom.tagName) {
        case "INPUT":
        case "TEXTAREA":
          if (checkorradio) {
            dom.checked = !!ctx[exp];
          } else {
            dom.value = ctx[exp];
          }
          break;
        case "SELECT":
          dom.selectedIndex = ctx[exp];
      }
    })
  );
}

function xplain(opt) {
  if (!isTextNode(opt.dom)) {
    return;
  }
  const { dom, ctx, effect } = opt;

  if (!dom.parentNode) return null;
  const content = dom.textContent;

  const match = content.match(/\{(.*?)\}/g);

  if (match) {
    const ticks = match.map((m) => {
      return {
        match: m,
        tick: compile(ctx, m.slice(1, m.length - 1)),
      };
    });
    clean(
      dom,
      effect(() => {
        dom.textContent = ticks.reduce((prev, cur, index) => {
          return prev.replace(cur.match, call(cur.tick));
        }, content);
      })
    );
  }

  return null;
}

function clean(dom, fn) {
  dom.$clears.push(fn);
}

export const render = compose(
  xattr,
  ref,
  xmodel,
  xon,
  xstyle,
  xclass,
  xhtml,
  xtext,
  xif,
  xfor,
  xplain,
  prepare
);
