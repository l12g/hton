hton
  .create((get, set) => {
    return {
      count: 0,
      style() {
        return {
          color: get().count % 2 == 0 ? "red" : "blue",
          "background-color": get().count % 2 == 0 ? "green" : "yellow",
        };
      },
      add() {
        set({ count: get().count + 1 });
      },
      reduce() {
        set({ count: get().count - 1 });
      },
    };
  })
  .mount(document.querySelector(".demo-style"));
