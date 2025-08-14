hton
  .create(() => {
    return {
      click() {
        alert("clicked");
      },
    };
  })
  .mount(document.querySelector(".demo-event"));
