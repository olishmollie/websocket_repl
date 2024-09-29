var psh = (function () {
  var psh = function (debug) {
    const self = this;
    const socket = new WebSocket("ws://127.0.0.1:5000");

    // Tracks the line editing state.
    var lineState = {
      back: 0,
      front: 0,
      buf: "",
    };

    // Tracks history state.
    var history = {
      buf: [],
      sp: -1,
      idx: 0,
      max: 3,
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

    // Push repl-generated text to the shell. Not for user input.
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
      // TODO
      moveToEnd();
    }

    // Change the portion of the html that represents user input.
    function setUserText(txt) {
      self.htmlElement.setRangeText(
        txt,
        lineState.back,
        lineState.back + lineState.front,
        "end",
      );
    }

    // Move backward one word.
    function moveBackWord() {
      var spaceIdx = lineState.front - 1;
      var inWord = false;
      for (spaceIdx; spaceIdx >= 0; --spaceIdx) {
        if (!inWord && lineState.buf[spaceIdx] != " ") {
          inWord = true;
          continue;
        }
        if (inWord && lineState.buf[spaceIdx] === " ") {
          break;
        }
      }
      lineState.front = spaceIdx + 1;
      moveCursor(lineState.back + lineState.front);
    }

    // Move forward one word.
    function moveForwardWord() {
      var spaceIdx = lineState.front;
      var inWord = false;
      for (spaceIdx; spaceIdx < lineState.buf.length; ++spaceIdx) {
        if (!inWord && lineState.buf[spaceIdx] != " ") {
          inWord = true;
          continue;
        }
        if (inWord && lineState.buf[spaceIdx] === " ") {
          break;
        }
      }
      lineState.front = spaceIdx;
      moveCursor(lineState.back + lineState.front);
    }

    // Add `cmd` to history buffer.
    function addToHistory(cmd) {
      if (history.sp < history.max - 1) {
        history.buf.push(cmd);
        ++history.sp;
      } else {
        for (var i = 0; i < history.max - 1; ++i) {
          history.buf[i] = history.buf[i + 1];
        }
        history.buf[history.sp] = cmd;
      }
      history.idx = history.sp + 1;
    }

    // Cycle through history backwards.
    function getHistoryBackward() {
      if (history.idx > 0) {
        return history.buf[--history.idx];
      }
      return null;
    }

    // Cycle through history forwards.
    function getHistoryForward() {
      if (history.idx < history.buf.length) {
        return history.buf[++history.idx];
      }
      return null;
    }

    // Log shell state to the console.
    function logState() {
      if (debug) {
        console.info(lineState);
        console.log(history);
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
        addToHistory(lineState.buf);
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
        // Get the prompt back by sending empty data.
        socket.send("");
      }
      // Backspace
      else if (e.keyCode === 8) {
        if (e.ctrlKey || e.altKey || lineState.front === 0) {
          e.preventDefault();
        } else {
          // Built-in functionality works here.
          --lineState.front;
          lineState.buf =
            lineState.buf.slice(0, lineState.front) +
            lineState.buf.slice(lineState.front + 1);
        }
      }
      // C-d: Delete forward
      else if (e.ctrlKey && e.keyCode === 68) {
        e.preventDefault();
        if (lineState.front < lineState.buf.length) {
          lineState.buf =
            lineState.buf.slice(0, lineState.front) +
            lineState.buf.slice(lineState.front + 1);
          self.htmlElement.setRangeText(
            "",
            lineState.back + lineState.front,
            lineState.back + lineState.front + 1,
          );
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
      // C-p/Up arrow: Cycle through history backwards
      else if ((e.ctrlKey && e.keyCode === 80) || e.keyCode === 38) {
        e.preventDefault();
        cmd = getHistoryBackward();
        if (cmd != null) {
          lineState.buf = cmd;
          lineState.front = lineState.buf.length;
          setUserText(lineState.buf);
        }
      }
      // C-n/Down-arrow: Cycle through history forwards
      else if ((e.ctrlKey && e.keyCode === 78) || e.keyCode === 40) {
        e.preventDefault();
        cmd = getHistoryForward();
        if (cmd != null) {
          lineState.buf = cmd;
          lineState.front = lineState.buf.length;
        } else {
          lineState.buf = "";
        }
        setUserText(lineState.buf);
      }
      // C-a: Move cursor to beginning
      else if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault();
        moveCursor(lineState.back);
        lineState.front = 0;
      }
      // C-e: Move cursor to end
      else if (e.ctrlKey && e.keyCode === 69) {
        e.preventDefault();
        moveToEnd();
        lineState.front = lineState.buf.length;
      }
      // C-b/Right arrow: Move backward
      else if ((e.ctrlKey && e.keyCode === 66) || e.keyCode === 37) {
        // The textarea already has this builtin, so just update the state.
        if (lineState.front === 0) {
          e.preventDefault();
        } else {
          --lineState.front;
        }
      }
      // M-b: Move backward one word
      else if (e.altKey && e.keyCode === 66) {
        e.preventDefault();
        if (lineState.front > 0) {
          moveBackWord();
        }
      }
      // C-f/Right arrow: Move forward;
      else if ((e.ctrlKey && e.keyCode === 70) || e.keyCode === 39) {
        // The textarea already has this builtin, so just update the state.
        if (lineState.front < lineState.buf.length) {
          ++lineState.front;
        }
      }
      // M-n: Move forward one word
      else if (e.altKey && e.keyCode === 70) {
        e.preventDefault();
        if (lineState.front < lineState.buf.length) {
          moveForwardWord();
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
    self.htmlElement.autocomplete = false;
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
