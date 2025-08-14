hton
  .create((get, set) => {
    setInterval(() => {
      set({ count: get().count + 1 });
    }, 1000);
    return {
      count: 0,
    };
  })
  .mount(document.querySelector(".demo-count"));
