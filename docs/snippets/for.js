hton
  .create((state) => {
    return {
      list: [1, 2, 3, 4],
      obj: { a: 1, b: 2, c: 3, d: 4 },
      push() {
        state.list = [...state.list, Date.now()];
      },
      pop() {
        state.list = state.list.slice(1);
      },
      pushObj() {
        state.obj = {
          ...state.obj,
          [Math.random().toString(32).slice(-8)]: Date.now(),
        };
      },
    };
  })
  .mount(document.querySelector(".demo-for"));
