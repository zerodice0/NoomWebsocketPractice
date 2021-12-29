import * as SocketIO from "socket.io";
import * as http from "http";
import * as express from "express";
import { Express } from 'express-serve-static-core';
import { Message } from "./models/message";

const app:Express = express();

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
    (message: Message, done:Function | null) => {
      const roomName:string = message.payload;
      socket.join(roomName);
      if (done != null) {
        done("Message from Backend");
      }
      socket.to(roomName).emit("welcome");
    }
  );

  socket.on(
    "message",
    (message: Message, roomName:string, done:Function | null) => {
      socket.to(roomName).emit("message", message);
      if (done != null) {
        done("Message from Backend");
      }
    }
  );

  socket.on(
    "disconnecting",
    (reason:string) => {
      socket.rooms.forEach(
        room => {
          socket.to(room).emit("bye", reason);
        }
      );
    }
  );
})

const handleListen = ():void => console.log(`Listening on port http://localhost:3000`);
httpServer.listen(3000, handleListen);

