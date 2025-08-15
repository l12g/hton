hton
  .create((get, set) => {
    return {
      count: 0,
      add() {
        set({ count: get().count + 1 });
      },
      reduce() {
        set({ count: get().count - 1 });
      },
    };
  })
  .mount(document.querySelector(".demo-attr"));
