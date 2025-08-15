# 简介

> html + addon = hton

一个快速，轻量`gzip≈1k`的 html 渲染库

hton 不创建 dom，它只是在 html 上添加了一些属性，通过这些属性来操作 dom

# 安装

```bash
npm install hton
```

# 使用

```js
import { create } from "hton";
create(() => {
  return {
    msg: "hello world",
  };
}).mount(document.querySelector(".app"));
```

or

```html
<script src="path/to/hton.js"></script>
<div class="app">
  <h1 _text="msg"></h1>
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

# 示例

## 计数器

<code-box src="./snippets/count.js">
  <div class="demo-count">
    <h1>
      count: {count}
    </h1>
  </div>
</code-box>

## 事件绑定

<code-box src="./snippets/event.js">
  <div class="demo-event">
    <button _on="{click}">click me</button>
  </div>
</code-box>

## class & style

<code-box src="./snippets/style.js">
  <div class="demo-style">
    <button _on="{click:add}">add</button>
    <button _on="{click:reduce}">reduce</button>
    <hr/>
    <h3 _text="count"></h3>
    <div _style="style()">style</div>
  </div>
</code-box>

## 条件渲染

<code-box src="./snippets/if.js">
  <div class="demo-if">
    <button _on="{click:add}">add</button>
    <button _on="{click:reduce}">reduce</button>
    <hr/>
    <div>count: {count}</div>
    <h3  _if="count<1">😀</h3>
    <h3  _elseif="count<2">😁</h3>
    <h3  _elseif="count<3">🤣</h3>
    <h3  _elseif="count<4">😂</h3>
    <h3  _elseif="count<5">😆</h3>
    <h3  _else>😶</h3>
    <template _if="count<1">
      <div>content from template</div>
      <div>content from template</div>
      <div>content from template</div>
    </template>
    <template _else>
      <div>content from template else</div>
    </template>
  </div>
</code-box>

> if 不会创建或销毁 dom，它会创建一个占位符，并在适当的时候去替换 dom

## 列表渲染

<code-box src="./snippets/for.js">
  <div class="demo-for">
    <button _on="{click:push}">push</button>
    <button _on="{click:pop}">pop</button>
    <button _on="{click:pushObj}">pushObj</button>
    <hr/>
    <ul>
      <li _for="item,index in list">
        <span _text="index"></span>
        ：
        <span _text="item"></span>
      </li>
    </ul>
     <ul>
      <li _for="v,k in obj">
        <span _text="k"></span>
        ：
        <span _text="v"></span>
      </li>
    </ul>

  </div>
</code-box>

> key 去哪了？
>
> 没有 key，全量更新！
>
> 可能以后会加吧

## 表单

<code-box src="./snippets/form.js">
<div class='demo-form'>
  <input _model="input"/>
  <button _on="{click:setInput}">random</button>
  <div>input: {input}</div>
</div>
</code-box>

## 属性

<code-box src="./snippets/attr.js">
<div class='demo-attr'>
  <button _on="{click:add}">add</button>
  <button _on="{click:reduce}">reduce</button>
  <hr/>
  <h1 _attr="{'data-count':count}">h1 with data-count="{count}"</h1>
</div>
</code-box>
