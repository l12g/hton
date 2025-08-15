(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.hton = {}));
})(this, (function (exports) { 'use strict';

  function call(fnlike, ...rest) {
    return typeof fnlike === "function" ? fnlike.call(null, ...rest) : fnlike;
  }
  const nope = () => {};
  function compile(ctx, expression) {
    const body = `with(ctx){return ${expression}}`;
    const args = ["ctx", body];
    const fn = new Function(...args);
    return () => fn(ctx);
  }

  function walk(el, fn) {
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

  function compose(...fns) {
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
  function extendContext(base, ctx) {
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

  function isInput(el) {
    return el.tagName === "INPUT";
  }
  function isCheckbox(el) {
    return isInput(el) && el.getAttribute("type") === "checkbox";
  }
  function isRadio(el) {
    return isInput(el) && el.getAttribute("type") === "radio";
  }
  function isTemplate(el) {
    return el && el.tagName === "TEMPLATE";
  }

  const prefix = "_";

  function formatAttr(attr) {
    return prefix + attr;
  }
  function remove(dom) {
    const chs = [...dom.children];
    chs.forEach(remove);
    if (dom.$clears) {
      dom.$clears.forEach(call);
    }
    dom.remove();
  }

  function react(attr, { dom, ctx, effect }, fn) {
    attr = formatAttr(attr);
    const exp = dom.getAttribute(attr);
    dom.removeAttribute(attr);

    if (!exp) return;
    if (!fn) return;
    const tick = compile(ctx, exp);
    onClear(
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
  function xcontent(opt) {
    if (opt.dom.getAttribute("text")) {
      return;
    }
    const nodes = [...opt.dom.childNodes].filter((v) => v.nodeType === 3);
    const results = nodes
      .map((v) => {
        const match = v.textContent.match(/\{(.*?)\}/g);
        if (!match) return null;
        const ticks = match.map((m) =>
          compile(opt.ctx, m.slice(1, m.length - 1))
        );
        return {
          content: v.textContent,
          node: v,
          match,
          ticks,
        };
      })
      .filter(Boolean);
    if (results.length === 0) return;
    onClear(
      opt.dom,
      opt.effect(() => {
        results.forEach((n) => {
          n.node.textContent = n.ticks.reduce((prev, tick, index) => {
            return prev.replace(n.match[index], call(tick));
          }, n.content);
        });
      })
    );
  }

  function xhtml(opt) {
    react("html", opt, (value) => {
      opt.dom.innerHTML = value;
    });
  }

  function xon(opt) {
    return react("on", opt, (obj) => {
      Object.keys(obj).forEach((event) => {
        opt.dom.addEventListener(event, obj[event]);
        onClear(opt.dom, () => {
          opt.dom.removeEventListener(event, obj[event]);
        });
      });
    });
  }

  function xif(opt) {
    if (!opt.dom.getAttribute(formatAttr("if"))) {
      return;
    }
    const templateNodes = isTemplate(opt.dom)
      ? [...opt.dom.content.children]
      : [];
    const nodes = [];
    let next = opt.dom.$next;
    const elseAttr = formatAttr("else");
    const elseifAttr = formatAttr("elseif");
    while (next) {
      if (next.hasAttribute(elseAttr) || next.hasAttribute(elseifAttr)) {
        const attr = next.getAttribute(elseAttr) || next.getAttribute(elseifAttr);
        nodes.push({
          node: next,
          marker: new Comment("elif"),
          attr: next.getAttribute(elseAttr) || next.getAttribute(elseifAttr),
          tick: attr ? compile(opt.ctx, attr) : () => true,
        });
        next = next.$next;
      } else {
        break;
      }
    }

    const marker = new Comment("if");
    if (isTemplate(opt.dom)) {
      opt.dom.replaceWith(marker);
    }
    const toggleNode = (node, visible, marker) => {
      if (visible) {
        if (marker.parentNode) {
          if (isTemplate(node)) {
            marker.replaceWith(node.content);
          } else {
            marker.replaceWith(node);
          }
        }
      } else {
        if (isTemplate(node)) {
          if (!marker.parentNode) {
            templateNodes[0].before(marker);
          }
          templateNodes.forEach((n) => node.content.appendChild(n));
        } else {
          if (node.parentNode) {
            node.replaceWith(marker);
          }
        }
      }
    };

    react("if", opt, (value) => {
      toggleNode(opt.dom, value, marker);
      if (value) {
        nodes.map((n) => toggleNode(n.node, false, n.marker));
      } else {
        let trueIdx = -1;
        for (let i = 0; i < nodes.length; i++) {
          if (call(nodes[i].tick())) {
            trueIdx = i;
            break;
          }
        }
        nodes.map((n, i) => toggleNode(n.node, i === trueIdx, n.marker));
      }
    });
  }

  function xfor(opt) {
    const { dom, ctx, effect } = opt;
    const attr = formatAttr("for");
    const exp = dom.getAttribute(attr);
    dom.removeAttribute(attr);
    if (!exp) return;
    const origin = dom.cloneNode(true);
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

    const marker = new Comment("for");
    const doc = document.createDocumentFragment();
    dom.replaceWith(marker);
    const doms = [];

    const tick = compile(ctx, kbody);
    const run = ({ setCurrent } = {}) => {
      doms.forEach(remove);
      doms.length = 0;
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
        doms.push(clone);
        doc.append(clone);
      });
      marker.after(doc);
    };
    onClear(dom, effect(run));
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
    if (!opt.$clears) opt.dom.$clears = [];
  }
  function ref(opt) {
    react("ref", opt, (value, exp) => {
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
    onClear(dom, () => ctrl.abort());
    onClear(
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

  function onClear(dom, fn) {
    dom.$clears.push(fn);
  }

  const render = compose(
    ref,
    xmodel,
    xon,
    xstyle,
    xattr,
    xclass,
    xhtml,
    xtext,
    xcontent,
    // xtemplate,
    xif,
    xfor,
    prepare
  );

  function create(fn) {
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
    const userContext = fn(get, set, effect);

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

  const __version__ = "0.0.0";

  exports.__version__ = __version__;
  exports.create = create;

}));
