var psh = (function () {

    var psh = function (debug) {

        const self = this;
        const socket = new WebSocket("ws://127.0.0.1:5000");

        var state = {
            pos: 0,
            buf: ""
        }

        resetMessageCallback();

        function setValue(txt) {
            self.htmlElement.value = txt;
        }

        function resetState() {
            state.pos = 0;
            state.buf = "";
        }

        function resetMessageCallback() {
            messageCallback = (event) => {
                push(event.data);
            }
        }

        function appendMessageCallback(f) {
            messageCallback = (event) => {
                push(event.data);
                f();
                resetMessageCallback();
            }
        }

        function moveToEnd() {
            var length = self.htmlElement.value.length;
            self.htmlElement.setSelectionRange(length, length);
        }

        function push(txt) {
            self.htmlElement.value += txt;
            moveToEnd();
        }

        function clickHandler() {
            moveToEnd();
        }

        function logState() {
            if (debug) {
                console.info(state);
            }
        }

        function keyHandler(e) {
            // Newline
            if (e.keyCode === 13) {
                appendMessageCallback(() => {
                    moveToEnd();
                    resetState();
                });
                socket.send(state.buf);
            }
            // C-c
            else if (e.ctrlKey && e.keyCode === 67) {
                e.preventDefault();
            }
            // C-l
            else if (e.ctrlKey && e.keyCode === 76) {
                e.preventDefault();
                appendMessageCallback(() => {
                    push(state.buf);
                });
                setValue("");
                socket.send("");
            }
            // Backspace
            else if (e.keyCode === 8) {
                if (e.ctrlKey || state.pos === 0) {
                    e.preventDefault();
                } else {
                    --state.pos;
                    state.buf = state.buf.substring(0, state.buf.length - 1);
                }
            }
            // Tab
            else if (e.keyCode === 9) {
                // TODO: Tab completion
                e.preventDefault();
                push("\t");
                state.buf += "\t";
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
                if (state.pos === 0) {
                    e.preventDefault();
                } else {
                    --state.pos;
                }
            }
            // C-f: Move forward;
            else if (e.ctrlKey && e.keyCode === 70) {
                if (state.pos < state.buf.length)
                    ++state.pos;
            }
            // Handle arrow keys
            else if (e.keyCode >= 37 && e.keyCode <= 40) {
                switch (e.keyCode) {
                    case 37:
                        if (state.pos === 0) {
                            e.preventDefault();
                        }
                        break;
                    case 38:
                    case 40:
                        e.preventDefault();
                }
            }
            // Shift/Alt/Ctrl
            else if (e.keyCode >= 16 && e.keyCode <= 18) {
                // Do nothing.
            }
            // All other keys
            else {
                ++state.pos;
                state.buf += e.key;
            }
        }

        self.value = function () {
            return state.buf;
        }

        self.htmlElement = document.createElement("textarea");
        self.htmlElement.cols = 80;
        self.htmlElement.rows = 20;
        self.htmlElement.style.background = "black";
        self.htmlElement.style.color = "white";
        self.htmlElement.style.height = "100%";
        self.htmlElement.style.width = "100%";
        self.htmlElement.contentEditable = true;
        self.htmlElement.spellcheck = false;
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
