#!/usr/bin/env python

import sys

from code import InteractiveConsole
from websockets.exceptions import ConnectionClosedOK
from websockets.sync.server import ServerConnection, serve

# Allow a websocket object (like the one passed to WebSocketServer.handler)
# to replace a file object.
ServerConnection.write = ServerConnection.send


class WebSocketRepl(InteractiveConsole):
    FORBIDDEN = ["import code", "from code import", "exit()"]

    def __init__(self, websocket: ServerConnection, locals=None):
        super().__init__(locals=locals)
        self.websocket = websocket

    def raw_input(self, prompt=""):
        self.websocket.send(prompt)
        try:
            code = self.websocket.recv()
            for cmd in self.FORBIDDEN:
                if cmd in code:
                    code = ""
            return code
        except ConnectionClosedOK:
            sys.stdout = sys.__stdout__
            self.websocket.close()

    def write(self, data: str):
        """Write to the websocket if an exception occurs."""
        self.websocket.send(data)


class WebSocketServer:
    def __init__(self, host="127.0.0.1", port=5000):
        self.host = host
        self.port = port
        self.websocket = None

    def handler(self, websocket: ServerConnection):
        """Handle an incoming websocket connection."""
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
