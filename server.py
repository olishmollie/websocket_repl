#!/usr/bin/env python

import sys

from code import InteractiveConsole
from websockets.exceptions import ConnectionClosedOK
from websockets.sync.server import ServerConnection, serve

# Allow a websocket object (like the one passed to WebSocketServer.handler)
# to replace a file object.
ServerConnection.write = ServerConnection.send


class WebSocketRepl(InteractiveConsole):
    def __init__(self, websocket, locals=None):
        super().__init__(locals=locals)
        self.websocket = websocket

    def raw_input(self, prompt=""):
        self.websocket.send(prompt)
        try:
            code = self.websocket.recv()
            if "import code" in code or "from code import" in code:
                return "print('Fuck you, dude.')"
            # sys.__stdout__.write(f"code = {repr(code)}")
            # sys.__stdout__.flush()
            return code
        except ConnectionClosedOK:
            sys.stdout = sys.__stdout__
            self.websocket.close()

    def write(self, data):
        """Write to the websocket if an exception occurs."""
        self.websocket.send(data)


class WebSocketServer:
    def __init__(self, host="127.0.0.1", port=5000):
        self.host = host
        self.port = port
        self.websocket = None

    def handler(self, websocket):
        print(f"Connection {websocket.remote_address} established.")
        self.websocket = websocket
        sys.stdout = websocket
        console = WebSocketRepl(websocket)
        try:
            console.interact()
        except TypeError:
            # SIGINT causes the console to throw a type error,
            # so bypass it here for clean shutdowns.
            pass

    def run(self):
        with serve(self.handler, host=self.host, port=self.port) as server:
            try:
                print("Listening for connections on 127.0.0.1:5000...")
                server.serve_forever()
            except KeyboardInterrupt:
                if self.websocket:
                    self.websocket.close()
                    sys.stdout = sys.__stdout__


if __name__ == "__main__":
    server = WebSocketServer()
    server.run()
