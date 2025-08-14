import { call, compile, compose, walk, extendContext } from "./utils";

function remove(dom) {
  const chs = [...dom.children];
  chs.forEach(remove);
  if (dom.$clears) {
    dom.$clears.forEach(call);
  }
  dom.remove();
}

function react(attr, { dom, ctx, effect }, fn) {
  const exp = dom.getAttribute(attr);
  dom.removeAttribute(attr);

  if (!exp) return;
  if (!fn) return;
  const tick = compile(ctx, exp);
  dom.$clears.push(
    effect(() => {
      fn(call(tick));
    })
  );
}

function xtext(opt) {
  return react("x-text", opt, (value) => {
    opt.dom.innerText = value;
  });
}

function xon(opt) {
  return react("x-on", opt, (obj) => {
    Object.keys(obj).forEach((event) => {
      opt.dom.addEventListener(event, obj[event]);
      opt.dom.$clears.push(() => {
        opt.dom.removeEventListener(event, obj[event]);
      });
    });
  });
}

function xif(opt) {
  if (!opt.dom.getAttribute("x-if")) {
    return;
  }

  const marker = new Comment("x-if");
  react("x-if", opt, (value) => {
    if (value) {
      if (marker.parentNode) {
        marker.replaceWith(opt.dom);
      }
    } else {
      if (opt.dom.parentNode) {
        opt.dom.replaceWith(marker);
      }
    }
  });
}
function xfor(opt) {
  const { dom, ctx, effect } = opt;
  const exp = dom.getAttribute("x-for");
  dom.removeAttribute("x-for");
  if (!exp) return;

  const parsed = exp.split(/\bin\b/).map((v) => v.trim());
  const error = new Error(
    "x-for must be like 'k,v in list (for object) or item in list (for array)'"
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

  const marker = new Comment("x-for");
  const doc = document.createDocumentFragment();
  dom.replaceWith(marker);
  const doms = [];

  const tick = compile(ctx, kbody, "loop");
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
      const clone = dom.cloneNode(true);
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
  dom.$clears.push(effect(run));
  return null;
}

function xclass(opt) {
  react("x-class", opt, (value) => {
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
  react("x-attr", opt, (value) => {
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
  react("x-style", opt, (value) => {
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

export const render = compose(
  xon,
  xstyle,
  xattr,
  xclass,
  xtext,
  xif,
  xfor,
  prepare
);
