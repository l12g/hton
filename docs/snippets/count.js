hton
  .create((state) => {
    setInterval(() => {
      state.count++;
    }, 1000);
    return {
      count: 0,
    };
  })
  .mount(document.querySelector(".demo-count"));
