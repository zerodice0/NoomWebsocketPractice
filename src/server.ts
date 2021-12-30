import * as SocketIO from "socket.io";
import * as http from "http";
import * as express from "express";
import { Express } from 'express-serve-static-core';
import { Message, NamedSocket } from "./models/message";

const app:Express = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.render("home")); 

const httpServer:http.Server = http.createServer(app);
const webSocketServer:SocketIO.Server = new SocketIO.Server(httpServer);
// let sockets:NamedSocket[] = [];

webSocketServer.on("connection", (socket:SocketIO.Socket) => {
  const model:NamedSocket = {
    webSocket: socket,
    nickname: null,
  }
  // sockets.push(model);

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
      socket.to(roomName).emit("welcome", model.nickname);
    }
  );

  socket.on(
    "message",
    (message: Message, roomName:string, done:Function | null) => {
      socket.to(roomName).emit("message", message, model.nickname);
      if (done != null) {
        done("Message from Backend");
      }
    }
  );

  socket.on(
    "nickname",
    (nickname: string, done: Function | null) => {
      if (done != null) {
        done(model.nickname, nickname);
      }

      const originalNickname = model.nickname;
      const newNickname = nickname;
      socket.rooms.forEach(
        room => {
          socket
            .to(room)
            .emit("nicknameChanged", originalNickname, newNickname);
        }
      );

      model.nickname = nickname;
    }
  )

  socket.on(
    "disconnecting",
    (reason:string) => {
      socket.rooms.forEach(
        room => {
          socket.to(room).emit("bye", reason, model.nickname);
        }
      );

      // sockets = [...sockets.filter((namedSocket:NamedSocket) => socket != namedSocket.webSocket)];
    }
  );
})

const handleListen = ():void => console.log(`Listening on port http://localhost:3000`);
httpServer.listen(3000, handleListen);

