var psh = (function () {
  var psh = function (debug) {
    const self = this;
    const socket = new WebSocket("ws://127.0.0.1:5000");
    const histlen = 10;

    // Tracks the line editing state.
    var lineState = {
      back: 0,
      front: 0,
      buf: "",
    };

    resetMessageCallback();

    // Set the text of the shell, making no distinction between
    // user and repl-generated input.
    function setValue(txt) {
      self.htmlElement.value = txt;
    }

    // Return the total length of the text string in the shell.
    function getLength() {
      return self.htmlElement.value.length;
    }

    // Move the cursor to position `pos`.
    function moveCursor(pos) {
      self.htmlElement.setSelectionRange(pos, pos);
    }

    // Push repl-generated text to the shell. Should not be used
    // for user input.
    function push(txt) {
      self.htmlElement.value += txt;
      lineState.back = getLength();
    }

    // Reset the line editing state.
    function resetState() {
      lineState.front = 0;
      lineState.back = 0;
      lineState.buf = "";
    }

    // Reset the message callback to its default value.
    function resetMessageCallback() {
      messageCallfront = (event) => {
        push(event.data);
      };
    }

    // Temporarily append `f` to the message callback.
    function appendMessageCallback(f) {
      messageCallfront = (event) => {
        push(event.data);
        f();
        resetMessageCallback();
      };
    }

    // Move cursor to the end of the input.
    function moveToEnd() {
      moveCursor(getLength());
    }

    // Prevent clicking into "uneditable" parts of the shell.
    function clickHandler() {
      moveToEnd();
    }

    // Log shell state to the console.
    function logState() {
      if (debug) {
        console.info(lineState);
      }
    }

    // Handle keydown events for line editing. The tricky part
    // is to not clobber the textarea's functionality while
    // also providing a decent line editing experience.
    function keyHandler(e) {
      // Newline
      if (e.keyCode === 13) {
        e.preventDefault();
        appendMessageCallback(resetState);
        push("\n");
        socket.send(lineState.buf);
      }
      // C-c
      else if (e.ctrlKey && e.keyCode === 67) {
        e.preventDefault();
      }
      // C-l
      else if (e.ctrlKey && e.keyCode === 76) {
        e.preventDefault();
        appendMessageCallback(() => {
          self.htmlElement.value += lineState.buf;
        });
        setValue("");
        socket.send("");
      }
      // Backspace
      else if (e.keyCode === 8) {
        if (e.ctrlKey || e.altKey || lineState.front === 0) {
          e.preventDefault();
        } else {
          --lineState.front;
          lineState.buf =
            lineState.buf.slice(0, lineState.front) + lineState.buf.slice(lineState.front + 1);
        }
      }
      // Tab
      else if (e.keyCode === 9) {
        // TODO: Tab completion
        e.preventDefault();
        var spaces = "    ";
        push(spaces);
        lineState.buf += spaces;
      }
      // C-p and C-n
      else if (e.ctrlKey && (e.keyCode === 78 || e.keyCode === 80)) {
        // TODO: History
        e.preventDefault();
        // if (lineState.history.length > 0 && lineState.hidx < lineState.history.length) {
        //   lineState.buf = lineState.history[lineState.hidx++];
        //   push(lineState.buf);
        // }
      }
      // C-a
      else if (e.ctrlKey && e.keyCode === 65) {
        // TODO: Move to beginning of input
        e.preventDefault();
        moveCursor(lineState.back);
        lineState.front = 0;
      }
      // C-b: Move backward
      else if (e.ctrlKey && e.keyCode === 66) {
        // The textarea already has this builtin, so just
        // move update the state.
        if (lineState.front === 0) {
          e.preventDefault();
        } else {
          --lineState.front;
        }
      }
      // C-f: Move forward;
      else if (e.ctrlKey && e.keyCode === 70) {
        // The textarea already has this builtin, so just
        // move update the state.
        if (lineState.front < lineState.buf.length) {
          ++lineState.front;
        }
      }
      // Handle arrow keys
      else if (e.keyCode >= 37 && e.keyCode <= 40) {
        switch (e.keyCode) {
          case 37:
            if (lineState.front === 0) {
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
      else if (!e.ctrlKey && !e.altKey) {
        ++lineState.front;
        lineState.buf =
          lineState.buf.slice(0, lineState.front - 1) +
          e.key +
          lineState.buf.slice(lineState.front - 1);
      }
      logState();
    }

    self.value = function () {
      return lineState.buf;
    };

    self.htmlElement = document.createElement("textarea");
    self.htmlElement.cols = 80;
    self.htmlElement.rows = 20;
    self.htmlElement.style.background = "black";
    self.htmlElement.style.color = "white";
    self.htmlElement.style.height = "100%";
    self.htmlElement.style.width = "100%";
    self.htmlElement.style.resize = "none";
    self.htmlElement.contentEditable = true;
    self.htmlElement.spellcheck = false;
    self.htmlElement.readonly = true;
    self.htmlElement.addEventListener("keydown", keyHandler);
    self.htmlElement.addEventListener("click", clickHandler);

    socket.addEventListener("open", (event) => {
      console.log("Websocket connection open");
    });

    socket.addEventListener("message", (event) => {
      messageCallfront(event);
    });

    socket.addEventListener("close", (event) => {
      console.log("Websocket connection closed");
    });
  };

  return psh;
})();
