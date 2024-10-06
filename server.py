import logging
import sys

from flask import Flask, send_file
from websockets.exceptions import ConnectionClosedOK

from websocket import WebsocketRepl, WebsocketServer


def serve_index():
    return send_file("index.html")


def serve_ws(websocket):
    remote_address = websocket.remote_address
    logging.info(f"Connection {remote_address} established.")
    sys.stdout = websocket
    console = WebsocketRepl(websocket)
    try:
        console.interact()
    except ConnectionClosedOK:
        sys.stdout = sys.__stdout__
        logging.info(f"Connection {remote_address} closed.")


def onclose():
    sys.stdout = sys.__stdout__

app = Flask(__name__, static_url_path="/", static_folder=".")
repl = WebsocketServer(handler=serve_ws, on_exit=onclose, port=3333)

app.add_url_rule("/", view_func=serve_index, methods=["GET"])

if __name__ == "__main__":
    app.run()

