hton
  .create((state) => {
    return {
      count: 0,
      style() {
        return {
          color: state.count % 2 == 0 ? "red" : "blue",
          "background-color": state.count % 2 == 0 ? "green" : "yellow",
        };
      },
      add() {
        state.count++;
      },
      reduce() {
        state.count--;
      },
    };
  })
  .mount(document.querySelector(".demo-style"));
