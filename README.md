# HTON

simple & lightweight html render

# Usage

```html
<div id="app">Hello {text}</div>
```

```js
import { create } from "hton";
create((get, set) => {
  setTimeout(() => {
    set({
      text: get().text + "!",
    });
  }, 1000);
  return {
    text: "world",
  };
}).mount(document.querySelector("#app"));
```

# Doc

[https://l12g.github.io/hton/#/](https://l12g.github.io/hton/#/)
