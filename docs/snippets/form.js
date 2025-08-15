hton
  .create((get, set) => {
    return {
      input: "",
      setInput() {
        set({ input: Math.random() });
      },
    };
  })
  .mount(document.querySelector(".demo-form"));
