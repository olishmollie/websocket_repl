#!/usr/bin/env python

from threading import Event
from websockets.exceptions import ConnectionClosedOK
from websockets.sync.server import serve

class WebSocketServer:
    def __init__(self, host="127.0.0.1", port=5000):
        self.host = host
        self.port = port
        self.run_token = Event()

    def handler(self, websocket):
        print(f"Connection {websocket.remote_address} established.")
        self.run_token.set()
        while self.run_token.is_set():
            try:
                message = websocket.recv(timeout=0.1)
                print(f"message = {message}")
                websocket.send(message)
            except TimeoutError:
                pass
            except ConnectionClosedOK:
                print(f"Connection {websocket.remote_address} closed.")
                self.run_token.clear()
                break

    def run(self):
        with serve(self.handler, host=self.host, port=self.port) as server:
            try:
                print("Listening for connections on 127.0.0.1:5000...")
                server.serve_forever()
            except KeyboardInterrupt:
                self.run_token.clear()
                print("Exiting...")

if __name__ == "__main__":
    server = WebSocketServer()
    server.run()
