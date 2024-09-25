const shell = document.querySelector("#shell")
shell.rows = 20
shell.cols = 80
shell.style.background = "black"
shell.style.color = "white"

const socket = new WebSocket("ws://127.0.0.1:5000");

socket.addEventListener("open", (event) => {
    console.log("Websocket connection open");
});

socket.addEventListener("message", (event) => {
    shell.value += event.data
});

socket.addEventListener("close", (event) => {
    console.log("Websocket connection closed");
});

inputBuffer = "";

shell.removeEventListener("keydown", disableKeyboard);
shell.addEventListener("keydown", handleKeydown);

function disableKeyboard(e) {
    e.preventDefault();
    e.stopPropagation();
    clear();
    clearInterval(introInterval);
    output(welcomeStr);
    init();
}

function handleKeydown(e) {
    // Handle newline
    if (e.keyCode === 13) {
        e.preventDefault();
        // cursorPos = beginningOfLine();
        // exec(inputBuffer);
        console.log("Sending ", inputBuffer)
        socket.send(inputBuffer)
    }
    // Handle C-c
    else if (e.ctrlKey && e.keyCode === 67) {
        e.preventDefault();
        this.value += "\n";
        // cursorPos = beginningOfLine();
    }
    // Handle C-l (clear screen)
    else if (e.ctrlKey && e.keyCode === 76) {
        shell.value = ">>>"
    }
    // Handle delete and backspace
    else if (e.keyCode === 8 || e.keyCode === 46) {
        inputBuffer = inputBuffer.substr(0, inputBuffer.length - 1)
        // if (atBeginningOfLine()) {
        //     e.preventDefault();
        // } else {
        //     --cursorPos;
        // }
    }
    // // Disable tab (for now, will do completion eventually)
    // else if (e.keyCode === 9) {
    //     e.preventDefault();
    // }
    // // Disable C-p and C-n (line movement)
    // else if (e.ctrlKey && (e.keyCode === 78 || e.keyCode === 80)) {
    //     e.preventDefault();
    // }
    // // C-a: Move to beginning of input
    // else if (e.ctrlKey && e.keyCode === 65) {
    //     e.preventDefault();
    //     cursorPos = this.selectionStart = this.selectionEnd = beginningOfLine();
    // }
    // // C-b: Move backward
    // else if (e.ctrlKey && e.keyCode === 66) {
    //     if (atBeginningOfLine()) {
    //         e.preventDefault();
    //     } else {
    //         --cursorPos;
    //     }
    // }
    // // Handle arrow keys
    // else if (e.keyCode >= 37 && e.keyCode <= 40) {
    //     switch (e.keyCode) {
    //         case 37:
    //             if (atBeginningOfLine()) {
    //                 e.preventDefault();
    //             }
    //             break;
    //         case 38:
    //         case 40:
    //             e.preventDefault();
    //     }
    // }
    // // All other keys
    else {
        inputBuffer += e.key
        console.log("inputBuffer = ", inputBuffer);
        cursorPos = this.selectionStart + 1;
    }
}




// var jshContainer = document.querySelector("#jshContainer");
// var jshTextArea = document.querySelector("#jshTextArea");
// var snakeCanvas = document.querySelector("#snakeCanvas");
// var pwd = "~";
// var inputBuffer = "";
// var cursorPos = beginningOfLine();

// // Disable focusing away from textarea
// document.addEventListener("click", function (e) {
//     jshTextArea.focus();
// });

// // Always restore cursor position even if you click
// jshTextArea.addEventListener("click", function (e) {
//     e.preventDefault();
//     e.stopPropagation();
//     this.selectionStart = this.selectionEnd = cursorPos;
// });

// // Insert text into buffer
// jshTextArea.addEventListener("input", function (e) {
//     inputBuffer = this.value.substr(beginningOfLine());
// });

// function handleKeydown(e) {
//     // Handle newline
//     if (e.keyCode === 13) {
//         e.preventDefault();
//         cursorPos = beginningOfLine();
//         exec(inputBuffer);
//     }
//     // Handle C-c
//     else if (e.ctrlKey && e.keyCode === 67) {
//         e.preventDefault();
//         this.value += "\n$ ";
//         cursorPos = beginningOfLine();
//     }
//     // Handle C-l (clear screen)
//     else if (e.ctrlKey && e.keyCode === 76) {
//         clear();
//     }
//     // Handle delete and backspace
//     else if (e.keyCode === 8 || e.keyCode === 46) {
//         if (atBeginningOfLine()) {
//             e.preventDefault();
//         } else {
//             --cursorPos;
//         }
//     }
//     // Disable tab (for now, will do completion eventually)
//     else if (e.keyCode === 9) {
//         e.preventDefault();
//     }
//     // Disable C-p and C-n (line movement)
//     else if (e.ctrlKey && (e.keyCode === 78 || e.keyCode === 80)) {
//         e.preventDefault();
//     }
//     // C-a: Move to beginning of input
//     else if (e.ctrlKey && e.keyCode === 65) {
//         e.preventDefault();
//         cursorPos = this.selectionStart = this.selectionEnd = beginningOfLine();
//     }
//     // C-b: Move backward
//     else if (e.ctrlKey && e.keyCode === 66) {
//         if (atBeginningOfLine()) {
//             e.preventDefault();
//         } else {
//             --cursorPos;
//         }
//     }
//     // Handle arrow keys
//     else if (e.keyCode >= 37 && e.keyCode <= 40) {
//         switch (e.keyCode) {
//             case 37:
//                 if (atBeginningOfLine()) {
//                     e.preventDefault();
//                 }
//                 break;
//             case 38:
//             case 40:
//                 e.preventDefault();
//         }
//     }
//     // All other keys
//     else {
//         cursorPos = this.selectionStart + 1;
//     }
// }

// function prompt() {
//     return pwd + " $ ";
// }

// function currentLine() {
//     return (jshTextArea.value.match(/\n/g) || []).length;
// }

// function beginningOfLine() {
//     let pos;
//     if ((pos = jshTextArea.value.lastIndexOf("\n")) === -1) {
//         return prompt().length;
//     }
//     return pos + prompt().length + 1;
// }

// function atBeginningOfLine() {
//     return (
//         jshTextArea.selectionStart <= 2 ||
//         jshTextArea.selectionStart <= beginningOfLine()
//     );
// }

// function output(str) {
//     if (str.length > 0) {
//         jshTextArea.value += "\n" + str + "\n" + prompt();
//         inputBuffer = "";
//     } else {
//         jshTextArea.value += "\n" + prompt();
//     }
//     jshTextArea.scrollTop = jshTextArea.scrollHeight;
//     cursorPos = jshTextArea.selectionStart;
// }

