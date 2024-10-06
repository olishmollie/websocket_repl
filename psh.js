var psh = (function () {
  var psh = function (opts) {
    const self = this;

    const defaults = {
      host: "127.0.0.1",
      port: 5000,
      debug: false,
      histsize: 100,
    };

    opts = { ...defaults, ...opts };

    const url = "ws://" + opts.host + ":" + opts.port;
    const socket = new WebSocket(url);
    var messageCallback;

    socket.addEventListener("message", (event) => {
      messageCallback(event);
    });

    socket.addEventListener("open", (event) => {
      console.log("Connection with " + event.target.url + " established.");
    });

    socket.addEventListener("close", (event) => {
      console.log("Connection with " + event.target.url + " closed.");
    });

    socket.addEventListener("error", (event) => {
      push("Error: " + "Failed to connect to " + event.target.url + ".");
    });

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
      max: opts.histSize || 20,
    };

    self.htmlElement = document.createElement("textarea");
    self.htmlElement.style.boxSizing = "border-box";
    self.htmlElement.style.height = "100%";
    self.htmlElement.style.width = "100%";
    self.htmlElement.style.background = "black";
    self.htmlElement.style.color = "white";
    self.htmlElement.style.resize = "none";
    self.htmlElement.contentEditable = true;
    self.htmlElement.spellcheck = false;
    self.htmlElement.readonly = true;
    self.htmlElement.autocomplete = false;
    self.htmlElement.addEventListener("keydown", keyHandler);
    self.htmlElement.addEventListener("click", clickHandler);

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
      pos = lineState.back + pos;
      self.htmlElement.setSelectionRange(pos, pos);
    }

    // Push text to the shell. Pass replGenerated=false for user input.
    function push(txt, replGenerated = true) {
      self.htmlElement.value += txt;
      if (replGenerated) {
        lineState.back = getLength();
      }
    }

    // Reset the line editing state.
    function resetState() {
      lineState.front = 0;
      lineState.back = 0;
      lineState.buf = "";
    }

    // Reset the message callback to its default value.
    function resetMessageCallback() {
      messageCallback = (event) => {
        push(event.data);
        self.htmlElement.scrollTop = self.htmlElement.scrollHeight;
      };
    }

    // Temporarily append `f` to the message callback.
    function appendMessageCallback(f) {
      messageCallback = (event) => {
        push(event.data);
        f();
        self.htmlElement.scrollTop = self.htmlElement.scrollHeight;
        resetMessageCallback();
      };
    }

    // Move cursor to the end of the input.
    function moveToEnd() {
      moveCursor(lineState.buf.length);
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
        lineState.back + lineState.buf.length,
        "end",
      );
    }

    // Is a character a word delimeter?
    function isWordDelimeter(c) {
      return " ".includes(c);
    }

    // Move backward one word.
    function moveBackWord() {
      var inWord = false;
      var i = lineState.front - 1;
      for (i; i >= 0; --i) {
        if (!inWord && !isWordDelimeter(lineState.buf[i])) {
          inWord = true;
          continue;
        }
        if (inWord && isWordDelimeter(lineState.buf[i])) {
          break;
        }
      }
      lineState.front = i + 1;
      moveCursor(lineState.front);
    }

    // Move forward one word.
    function moveForwardWord() {
      var inWord = false;
      var i = lineState.front;
      for (i; i < lineState.buf.length; ++i) {
        if (!inWord && !isWordDelimeter(lineState.buf[i])) {
          inWord = true;
          continue;
        }
        if (inWord && isWordDelimeter(lineState.buf[i])) {
          break;
        }
      }
      lineState.front = i;
      moveCursor(lineState.front);
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

    // Remove user text from `start` to `end`.
    function removeUserText(start, end) {
      self.htmlElement.setRangeText(
        "",
        lineState.back + start,
        lineState.back + end,
      );
    }

    // Log line-editing state to the console.
    function logState() {
      if (opts.debug) {
        console.info(lineState);
      }
    }

    // Log history state to the console.
    function logHistory() {
      if (opts.debug) {
        console.log(history);
      }
    }

    // Handle keydown events for line editing.
    function keyHandler(e) {
      // Newline
      if (e.keyCode === 13) {
        e.preventDefault();
        appendMessageCallback(resetState);
        push("\n", false);
        socket.send(lineState.buf);
        if (lineState.buf.length > 0) {
          addToHistory(lineState.buf);
        }
      }
      // C-c
      else if (e.ctrlKey && e.keyCode === 67) {
        e.preventDefault();
      }
      // C-l
      else if (e.ctrlKey && e.keyCode === 76) {
        e.preventDefault();
        appendMessageCallback(() => {
          push(lineState.buf, false);
        });
        setValue("");
        // Get the prompt back by sending empty data.
        socket.send("");
      }
      // M-Backspace: Delete word
      else if (e.altKey && e.keyCode === 8) {
        e.preventDefault();
        var end = lineState.front;
        moveBackWord();
        lineState.buf =
          lineState.buf.slice(0, lineState.front) + lineState.buf.slice(end);
        removeUserText(lineState.front, end);
      }
      // Backspace
      else if (e.keyCode === 8) {
        if (e.ctrlKey || lineState.front === 0) {
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
          removeUserText(lineState.front, lineState.front + 1);
        }
      }
      // Tab
      else if (e.keyCode === 9) {
        // TODO: Tab completion
        e.preventDefault();
        var spaces = "    ";
        push(spaces, false);
        lineState.buf += spaces;
        lineState.front += spaces.length;
      }
      // C-p/Up arrow: Cycle through history backwards
      else if ((e.ctrlKey && e.keyCode === 80) || e.keyCode === 38) {
        e.preventDefault();
        cmd = getHistoryBackward();
        if (cmd != null) {
          setUserText(cmd);
          lineState.buf = cmd;
          lineState.front = cmd.length;
        }
      }
      // C-n/Down-arrow: Cycle through history forwards
      else if ((e.ctrlKey && e.keyCode === 78) || e.keyCode === 40) {
        e.preventDefault();
        cmd = getHistoryForward();
        if (cmd != null) {
          setUserText(cmd);
          lineState.buf = cmd;
          lineState.front = cmd.length;
        } else {
          setUserText("");
          lineState.buf = "";
        }
      }
      // C-a: Move cursor to beginning
      else if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault();
        lineState.front = 0;
        moveCursor(lineState.front);
      }
      // C-e: Move cursor to end
      else if (e.ctrlKey && e.keyCode === 69) {
        e.preventDefault();
        moveToEnd();
        lineState.front = lineState.buf.length;
      }
      // C-b/Right arrow: Move backward
      else if ((e.ctrlKey && e.keyCode === 66) || e.keyCode === 37) {
        e.preventDefault();
        if (lineState.front > 0) {
          moveCursor(--lineState.front);
        }
      }
      // M-b: Move backward one word
      else if (e.altKey && e.keyCode === 66) {
        e.preventDefault();
        if (lineState.front > 0) {
          moveBackWord();
        }
      }
      // C-f/Right arrow: Move forward
      else if ((e.ctrlKey && e.keyCode === 70) || e.keyCode === 39) {
        e.preventDefault();
        if (lineState.front < lineState.buf.length) {
          moveCursor(++lineState.front);
        }
      }
      // M-f: Move forward one word
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

    self.close = function () {
      socket.close();
    };
  };

  return psh;
})();
