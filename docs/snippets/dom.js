hton
  .create(() => {
    return {
      ref(el) {
        el.focus();
      },
    };
  })
  .mount(document.querySelector(".demo-dom"));
