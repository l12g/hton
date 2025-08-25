hton
  .create((state) => {
    return {
      input: "",
      setInput() {
        state.input = Math.random();
      },
    };
  })
  .mount(document.querySelector(".demo-form"));
