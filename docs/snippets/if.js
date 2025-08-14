hton
  .create((get, set) => {
    setInterval(() => {
      set({ count: get().count + 1 });
    }, 1000);
    return {
      visible: 0,
      toggle() {
        set({ visible: !get().visible });
      },
    };
  })
  .mount(document.querySelector(".demo-if"));
