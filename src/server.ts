import * as SocketIO from "socket.io";
import * as http from "http";
import * as express from "express";
import { Express } from 'express-serve-static-core';
import { EnterRoomMessage, Message, NamedSocket } from "./models/message";
import { instrument } from "@socket.io/admin-ui";

const app:Express = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.render("home")); 

const httpServer:http.Server = http.createServer(app);
const webSocketServer:SocketIO.Server = new SocketIO.Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true
  }
});

instrument(webSocketServer, {
  auth: false
});

const publicRoomKeys = () => {
  const {
    sockets: {
      adapter: {sids, rooms}
    }
  } = webSocketServer;

  const publicRoomKeys:string[] = [];
  
  rooms.forEach((_:Set<string>, key:string) => {
    if (sids.get(key) === undefined) {
      publicRoomKeys.push(key);
    }
  })

  return publicRoomKeys;
}

const countRoomMembers = (roomName:string):number => {
  return webSocketServer.sockets.adapter.rooms.get(roomName).size;
}

webSocketServer.on("connection", (socket:SocketIO.Socket) => {
  const model:NamedSocket = {
    webSocket: socket,
    nickname: null,
  }

  socket.on("join_room", (roomName:string) => {
    socket.join(roomName);
    socket.to(roomName).emit(
      "welcome",
      model.nickname,
      countRoomMembers(roomName)
    );
  })

  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  })

  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  })

  socket.on("iceCandidate", (candidate, roomName) => {
    socket.to(roomName).emit("iceCandidate", candidate);
  });

  // webSocketServer.sockets.emit("room_list_change", publicRoomKeys());

  // socket.onAny((event:string) => {
  //   console.log("Socket Event: ", event);
  //   // console.log(webSocketServer.sockets.adapter);
  // });

  // socket.on(
  //   "enter_room",
  //   (message: EnterRoomMessage, done:Function | null) => {
  //     const roomName:string = message.payload.roomName;
  //     const nickName:string = message.payload.nickName;

  //     model.nickname = nickName;

  //     socket.join(roomName);
  //     if (done != null) {
  //       done("Message from Backend", roomName, nickName, countRoomMembers(roomName));
  //     }
  //     socket.to(roomName).emit("welcome", model.nickname, countRoomMembers(roomName));
  //     webSocketServer.sockets.emit("room_list_change", publicRoomKeys());
  //   }
  // );

  // socket.on(
  //   "message",
  //   (message: Message, roomName:string, done:Function | null) => {
  //     socket.to(roomName).emit("message", message, model.nickname);
  //     if (done != null) {
  //       done("Message from Backend");
  //     }
  //   }
  // );

  // socket.on(
  //   "nickname",
  //   (nickname: string, done: Function | null) => {
  //     if (done != null) {
  //       done(model.nickname, nickname);
  //     }

  //     const originalNickname = model.nickname;
  //     const newNickname = nickname;
  //     socket.rooms.forEach(
  //       room => {
  //         socket
  //           .to(room)
  //           .emit("nicknameChanged", originalNickname, newNickname);
  //       }
  //     );

  //     model.nickname = nickname;
  //   }
  // )

  // socket.on(
  //   "disconnecting",
  //   (reason:string) => {
  //     socket.rooms.forEach(
  //       room => {
  //         socket.to(room).emit("bye", reason, model.nickname, countRoomMembers(room)-1);
  //       }
  //     );

  //     // sockets = [...sockets.filter((namedSocket:NamedSocket) => socket != namedSocket.webSocket)];
  //   }
  // );

  // socket.on(
  //   "disconnect",
  //   (_: string) => {
  //     webSocketServer.sockets.emit("room_list_change", publicRoomKeys());
  //   }
  // )
})

const handleListen = ():void => console.log(`Listening on port http://localhost:3000`);
httpServer.listen(3000, handleListen);

