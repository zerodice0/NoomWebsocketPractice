import * as SocketIO from "socket.io";
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

const httpServer:http.Server = http.createServer(app);
const webSocketServer:SocketIO.Server = new SocketIO.Server(httpServer);

webSocketServer.on("connection", socket => {
  socket.onAny((event:string) => {
    console.log("Socket Event: ", event);
  });

  socket.on(
    "enter_room",
    (message: {payload:string}, done:Function) => {
      const roomName:string = message.payload;
      console.log(socket.rooms);
      socket.join(roomName);
      done("Message from Backend");
      socket.to(roomName).emit("welcome");
    }
  );
})

const handleListen = ():void => console.log(`Listening on port http://localhost:3000`);
httpServer.listen(3000, handleListen);

