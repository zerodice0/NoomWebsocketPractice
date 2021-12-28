import {WebSocket} from "ws";

export interface Message {
  type: string;
  payload: string;
}

export interface NamedSocket {
  webSocket:WebSocket;
  nickname:string;
}