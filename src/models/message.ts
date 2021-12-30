import * as SocketIO from "socket.io";

export interface Message {
  payload: string;
}

export interface EnterRoomMessage {
  payload: {
    nickName: string;
    roomName: string;
  }
}

export interface NamedSocket {
  webSocket:SocketIO.Socket;
  nickname:string | null;
}