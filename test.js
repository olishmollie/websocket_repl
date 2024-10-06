const shell = new psh({
  host: "127.0.0.1",
  port: 3333,
  debug: true,
  histsize: 20,
});
document.querySelector("#box").append(shell.htmlElement);
