const socket = new WebSocket("ws://127.0.0.1:5000");

socket.addEventListener("open", (event) => {
    console.log("Websocket connection open");
});

socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
});

socket.addEventListener("close", (event) => {
    console.log("Websocket connection closed");
});

window.setTimeout(() => {
    socket.close();
}, 5000);
