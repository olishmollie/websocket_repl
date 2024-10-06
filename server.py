import sys

from flask import Flask, send_file
from websockets.exceptions import ConnectionClosedOK

from websocket import WebsocketRepl, WebsocketServer


class Websocket:
    def __init__(self, app):
        self.app = app

    def add_url_rule(self, url, view_func=None, host="127.0.0.1", port=3333):
        ws = WebsocketServer(handler=view_func, host=host, port=port)
        self.app.add_url_rule(url, view_func=view_func)


def serve_index():
    return send_file("index.html")


def serve_ws(websocket):
    remote_address = websocket.remote_address
    print(f"Connection {remote_address} established.")
    sys.stdout = websocket
    console = WebsocketRepl(websocket)
    try:
        console.interact()
    except ConnectionClosedOK:
        sys.stdout = sys.__stdout__
        print(f"Connection {remote_address} closed.")


app = Flask(__name__, static_url_path="/", static_folder=".")
repl = Websocket(app)

app.add_url_rule("/", view_func=serve_index, methods=["GET"])
repl.add_url_rule("/", view_func=serve_ws)

if __name__ == "__main__":
    app.run()
