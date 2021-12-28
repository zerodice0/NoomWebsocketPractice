import {WebSocket} from "ws";

export interface Message {
  payload: string;
}

export interface NamedSocket {
  webSocket:WebSocket;
  nickname:string;
}