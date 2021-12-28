import { Socket } from "dgram";
import * as express from "express";
import * as core from 'express-serve-static-core';
import * as http from "http";
import { WebSocket, WebSocketServer } from "ws";
import { Message, NamedSocket } from "./models/message";
const app:core.Express = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.render("home")); 

const server:http.Server = http.createServer(app);
const wss:WebSocketServer = new WebSocketServer({ server });

const sockets:NamedSocket[] = [];

const sendMessageToSocket = (socket:NamedSocket, message:string) => {
  socket.webSocket.send(message);
}

wss.on("connection", (socket:WebSocket) => {
  const namedSocket: NamedSocket = {
    webSocket: socket,
    nickname: "Unknown"
  }
  sockets.push(namedSocket);
  console.log("Connected to Client ✅");

  sockets.forEach((socket:NamedSocket) => {
    sendMessageToSocket(
      socket,
      `Hello, ${namedSocket.nickname} is connected!`
    );
  });
  
  socket.on("message", (message:Buffer) => {
    const _message:Message = JSON.parse((message.toString("utf8")));

    switch(_message.type) {
      case "message":
        sockets
          .filter((_socket:NamedSocket) => _socket.webSocket !== socket)
          .forEach(
            (_socket:NamedSocket) => {
              sendMessageToSocket(_socket, `${namedSocket.nickname}: ${_message.payload}`);
            }
          );
      break;
      case "nickname":

        if (namedSocket.nickname !== null) {
          sockets.forEach(
            (_socket:NamedSocket) => {
              sendMessageToSocket(_socket, `${namedSocket.nickname} -> ${_message.payload}`)
            });
        }
        namedSocket.nickname = _message.payload;
      break;
    }
  });

  socket.on("close", () => {
    console.log("Disconnected from Client ❌");
  })
});

server.listen(3000, () => console.log(`Listening on port 3000`));