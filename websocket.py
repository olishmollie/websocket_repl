import logging
import sys

from code import InteractiveConsole
from threading import Thread
from typing import Any, Callable, Mapping
from websockets.sync.server import ServerConnection, serve

# Allow a websocket object (ServerConnection) to stand in for a file
# object like stdout.
ServerConnection.write = ServerConnection.send # type: ignore
ServerConnection.flush = lambda _: None # type: ignore


class WebsocketRepl(InteractiveConsole):
    FORBIDDEN = ["import code", "from code import", "exit()"]

    def __init__(
        self, websocket: ServerConnection, locals: Mapping[str, Any] | None = None
    ):
        super().__init__(locals=locals)
        self.websocket = websocket
        sys.stdout = self.websocket

    def raw_input(self, prompt: str = "") -> str:
        self.websocket.send(prompt)
        code = str(self.websocket.recv())
        for cmd in self.FORBIDDEN:
            if cmd in code:
                code = ""
        return code

    def write(self, data: str):
        """Write to the websocket if an exception occurs."""
        self.websocket.send(data)


class WebsocketServer(Thread):
    def __init__(
        self,
        handler: Callable[[ServerConnection], None],
        host: str = "127.0.0.1",
        port: int = 5000,
    ):
        super().__init__()
        self.daemon = True
        self.handler = handler
        self.host = host
        self.port = port
        self.websockets = {}
        self.start()

    def run(self):
        """Serve websocket connections until interrupted."""
        with serve(self.handler, host=self.host, port=self.port) as server:
            try:
                logging.info("Listening for connections on 127.0.0.1:5000...")
                server.serve_forever()
            except KeyboardInterrupt:
                sys.stdout = sys.__stdout__
                for _, websocket in self.websockets.items():
                    websocket.close()

