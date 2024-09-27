var psh = (function () {

    var psh = function () {

        const self = this;
        const socket = new WebSocket("ws://127.0.0.1:5000");

        var pos = 0;
        var lno = 0;
        var buf = "";

        var messageCallback = (event) => {
            self.push(event.data);
        }

        function resetMessageCallback() {
            messageCallback = (event) => {
                self.push(event.data);
            }
        }

        function sendBuf() {
            if (socket !== undefined && socket != null) {
                socket.send(buf);
                pos = 0;
                buf = "";
            }
        }

        function moveToEnd() {
            var length = self.htmlElement.value.length;
            self.htmlElement.setSelectionRange(length, length);
        }

        function keyHandler(e) {
            // Newline
            if (e.keyCode === 13) {
                messageCallback = (event) => {
                    self.push(event.data);
                    moveToEnd();
                    resetMessageCallback();
                }
                sendBuf();
            }
            // Shift
            else if (e.keyCode === 16) {
                // Do nothing.
            }
            // C-c
            else if (e.ctrlKey && e.keyCode === 67) {
                e.preventDefault();
            }
            // C-l
            else if (e.ctrlKey && e.keyCode === 76) {
                // TODO: Clear the shell.
                e.preventDefault();
                messageCallback = (event) => {
                    self.push(event.data);
                    self.htmlElement.value += buf;
                    resetMessageCallback();
                }
                self.htmlElement.value = "";
                socket.send("");
            }
            // Backspace
            else if (e.keyCode === 8) {
                if (pos === 0) {
                    e.preventDefault();
                } else {
                    --pos;
                    buf = buf.substring(0, buf.length - 1);
                }
            }
            // Tab
            else if (e.keyCode === 9) {
                // TODO: Tab completion
                e.preventDefault();
            }
            // C-p and C-n
            else if (e.ctrlKey && (e.keyCode === 78 || e.keyCode === 80)) {
                // TODO: History
                e.preventDefault();
            }
            // C-a
            else if (e.ctrlKey && e.keyCode === 65) {
                // TODO: Move to beginning of input
                e.preventDefault();
            }
            // C-b: Move backward
            else if (e.ctrlKey && e.keyCode === 66) {
                if (pos === 0) {
                    e.preventDefault();
                } else {
                    --pos;
                }
            }
            // C-f: Move forward;
            else if (e.ctrlKey && e.keyCode === 70) {
                if (pos < buf.length)
                    ++pos;
            }
            // Handle arrow keys
            else if (e.keyCode >= 37 && e.keyCode <= 40) {
                switch (e.keyCode) {
                    case 37:
                        if (pos === 0) {
                            e.preventDefault();
                        }
                        break;
                    case 38:
                    case 40:
                        e.preventDefault();
                }
            }
            // All other keys
            else if (!e.ctrlKey) {
                if (e.key !== undefined) {
                    ++pos;
                    buf += e.key;
                }
            }
        }

        self.push = function (txt) {
            self.htmlElement.value += txt;
        }

        self.value = function () {
            return buf;
        }

        self.htmlElement = document.createElement("textarea");
        self.htmlElement.cols = 80;
        self.htmlElement.rows = 20;
        self.htmlElement.style.background = "black";
        self.htmlElement.style.color = "white";
        self.htmlElement.style.height = "100%";
        self.htmlElement.style.width = "100%";
        self.htmlElement.contentEditable = true;
        // self.htmlElement.removeEventListener("keydown", disableKeyboard);
        self.htmlElement.addEventListener("keydown", keyHandler);

        socket.addEventListener("open", (event) => {
            console.log("Websocket connection open");
        });

        socket.addEventListener("message", (event) => {
            messageCallback(event);
        });

        socket.addEventListener("close", (event) => {
            console.log("Websocket connection closed");
        });

    }

    return psh;
}());
