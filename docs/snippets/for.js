hton
  .create((get, set) => {
    return {
      list: [1, 2, 3, 4],
      obj: { a: 1, b: 2, c: 3, d: 4 },
      push() {
        set({
          list: [...get().list, Date.now()],
        });
      },
      pop() {
        set({
          list: get().list.slice(1),
        });
      },
      pushObj() {
        set({
          obj: {
            ...get().obj,
            [Math.random().toString(32).slice(-8)]: Date.now(),
          },
        });
      },
    };
  })
  .mount(document.querySelector(".demo-for"));
