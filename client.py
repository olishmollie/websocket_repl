#!/usr/bin/env python

from websockets.sync.client import connect

def hello():
    with connect("ws://127.0.0.1:5000") as websocket:
        websocket.send("Hello world!")
        message = websocket.recv()
        print(f"Received: {message}")

hello()
