#!/usr/bin/env python

from code import InteractiveConsole
from threading import Event
from websockets.exceptions import ConnectionClosedOK
from websockets.sync.server import serve


class WebSocketRepl(InteractiveConsole):
    def __init__(self, websocket, locals=None):
        super().__init__(locals=locals)
        self.websocket = websocket

    def raw_input(self, prompt=""):
        self.websocket.send(prompt)
        try:
            code = self.websocket.recv()
            print(f"code = {code}")
            if code == "":
                raise EOFError
        except ConnectionClosedOK:
            print(f"Connection closed.")
            self.websocket.close()

    def write(self, data):
        self.websocket.send(data)

class WebSocketServer:
    def __init__(self, host="127.0.0.1", port=5000):
        self.host = host
        self.port = port
        self.run_token = Event()
        self.websocket = None

    def handler(self, websocket):
        print(f"Connection {websocket.remote_address} established.")
        self.websocket = websocket
        console = WebSocketRepl(websocket)
        self.run_token.set()
        while self.run_token.is_set():
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
                self.run_token.clear()
                if self.websocket:
                    self.websocket.close()


if __name__ == "__main__":
    server = WebSocketServer()
    server.run()

