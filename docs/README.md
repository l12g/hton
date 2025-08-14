# 简介

> html + addon = hton

为 html 页面增加一些响应式能力

# 安装

```bash
npm install hton
```

# 使用

```html
<script src="path/to/hton.js"></script>
<div class="app">
  <h1 x-text="msg"></h1>
</div>
<script>
  hton
    .create(() => {
      return {
        msg: "hello world",
      };
    })
    .mount(document.querySelector(".app"));
</script>
```

or

```js
import { create } from "hton";
create(() => {
  return {
    msg: "hello world",
  };
}).mount(document.querySelector(".app"));
```

# 示例

## 计数器

<code-box src="./snippets/count.js">
  <div class="demo-count">
    <h1 x-text="'count ：'+count"></h1>
  </div>
</code-box>

## 事件绑定

<code-box src="./snippets/event.js">
  <div class="demo-event">
    <button x-on="{click}">click me</button>
  </div>
</code-box>

## class & style

<code-box src="./snippets/style.js">
  <div class="demo-style">
    <h3 x-text="count"></h3>
    <div x-style="style">style</div>
    <hr/>
    <button x-on="{click:add}">add</button>
    <button x-on="{click:reduce}">reduce</button>

  </div>
</code-box>

## 条件渲染

<code-box src="./snippets/if.js">
  <div class="demo-if">
    <button x-on="{click:toggle}">toggle</button>
    <hr/>
    <h3  x-if="visible">好热~</h3>

  </div>
</code-box>

## 列表渲染

<code-box src="./snippets/for.js">
  <div class="demo-for">
    <button x-on="{click:push}">push</button>
    <button x-on="{click:pop}">pop</button>
    <button x-on="{click:pushObj}">pushObj</button>
    <hr/>
    <ul>
      <li x-for="item,index in list">
        <span x-text="index"></span>
        ：
        <span x-text="item"></span>
      </li>
    </ul>
     <ul>
      <li x-for="v,k in obj">
        <span x-text="k"></span>
        ：
        <span x-text="v"></span>
      </li>
    </ul>

  </div>
</code-box>

> key 去哪了？
>
> 没有 key，全量更新！
