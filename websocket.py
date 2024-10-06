import sys
import time

from code import InteractiveConsole
from multiprocessing import Process
from threading import Thread
from websockets.exceptions import ConnectionClosedOK
from websockets.sync.server import ServerConnection, serve

ServerConnection.write = ServerConnection.send
ServerConnection.flush = lambda x: None


class WebsocketRepl(InteractiveConsole):
    FORBIDDEN = ["import code", "from code import", "exit()"]

    def __init__(self, websocket: ServerConnection, locals=None):
        super().__init__(locals=locals)
        self.websocket = websocket

    def raw_input(self, prompt=""):
        self.websocket.send(prompt)
        code = self.websocket.recv()
        for cmd in self.FORBIDDEN:
            if cmd in code:
                code = ""
        return code

    def write(self, data: str):
        """Write to the websocket if an exception occurs."""
        self.websocket.send(data)


class WebsocketServer(Thread):
    def __init__(self, handler=None, host="127.0.0.1", port=5000):
        super().__init__()
        self.daemon = True
        self.host = host
        self.port = port
        self.handler = handler
        if self.handler is None:
            self.handler = self.default_handler
        self.websockets = {}
        self.start()

    def default_handler(self, websocket: ServerConnection):
        """Serve a Python REPL over the websocket connection."""
        remote_address = websocket.remote_address
        self.websockets[remote_address] = websocket
        print(f"Connection {remote_address} established.")
        sys.stdout = websocket
        console = WebsocketRepl(websocket)
        try:
            console.interact()
        except ConnectionClosedOK:
            self.restore_stdout()
            print(f"Connection {remote_address} closed.")

    def run(self):
        """Serve websocket connections until interrupted."""
        with serve(self.handler, host=self.host, port=self.port) as server:
            try:
                print("Listening for connections on 127.0.0.1:5000...")
                server.serve_forever()
            except KeyboardInterrupt:
                self.restore_stdout()
                for _, websocket in self.websockets.items():
                    websocket.close()

    def restore_stdout(self):
        sys.stdout = sys.__stdout__
