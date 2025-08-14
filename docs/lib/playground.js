class HelloWord extends HTMLElement {
  constructor() {
    super();
    const src = this.getAttribute("src");
    const codeNode = document.createElement("div");
    codeNode.innerHTML = `
    <div class="tabs">
    </div>
    <div class="html-code">
    <pre><code class="language-html"></code></pre>
    </div>
    <hr/>
    <div class="js-code">
    <pre><code class="language-js"></code></pre>
    </div>
   
    `;
    codeNode.className = "code";
    codeNode.querySelector(".html-code code").innerHTML = Prism.highlight(
      this.children[0].outerHTML.trim(),
      Prism.languages.html,
      "html"
    );

    this.children[0].before(codeNode);

    fetch(src, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
      .then((v) => v.text())
      .then((codeStr) => {
        const html = Prism.highlight(
          codeStr.trim(),
          Prism.languages.javascript,
          "javascript"
        );
        codeNode.querySelector(".js-code code").innerHTML = html;
        const fn = new Function("dom", codeStr);
        fn(this.children[1]);
      });
  }
}
window.customElements.define("code-box", HelloWord);
