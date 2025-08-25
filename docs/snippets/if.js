hton
  .create((state) => {
    return {
      count: 0,
      add() {
        state.count++;
      },
      reduce() {
        state.count--;
      },
    };
  })
  .mount(document.querySelector(".demo-if"));
