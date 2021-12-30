const socket = io();

const welcome = document.getElementById('welcome');
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;
let nickName;

const showRoom = (_message, _roomName, _nickName, _countRoomMember) => {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  const messageForm = room.querySelector("#message");
  const nicknameForm = room.querySelector("#nickname");
  h3.innerHTML = `Current Room: ${roomName} (${_countRoomMember}) / Your Nickname: ${nickName}`;
  messageForm.addEventListener("submit", handleMessageSubmit);
  nicknameForm.addEventListener("submit", handleNickanmeSubmit);
}

const handleNickanmeSubmit = (event) => {
  event.preventDefault();
  const nicknameForm = room.querySelector("#nickname");
  const input = nicknameForm.querySelector("input");
  const nickname = input.value;
  socket.emit(
    "nickname",
    nickname,
    () => sendMessage(`You are now known as ${nickname}`)
  );
  input.value = "";
}

const handleMessageSubmit = (event) => {
  event.preventDefault();
  const messageForm = room.querySelector("#message");
  const input = messageForm.querySelector("input");
  const message = input.value;
  socket.emit(
    "message",
    message,
    roomName,
    () => sendMessage(`You: ${message}`)
  );
  input.value = "";
}

const handleRoomSubmit = (event) => {
  event.preventDefault();
  const elemRoomName = form.querySelector("#roomName");
  const elemNickName = form.querySelector("#nickName");
  socket.emit(
    "enter_room",
    { 
      payload: {
        nickName: elemNickName.value,
        roomName: elemRoomName.value
      }
    },
    showRoom
  );

  roomName = elemRoomName.value;
  nickName = elemNickName.value;
  elemRoomName.value = "";
  elemNickName.value = "";
}

const sendMessage = (message) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerHTML = message;
  ul.appendChild(li);
}

socket.on("welcome", (nickname, countRoomMember) => {
  const h3 = room.querySelector("h3");
  h3.innerHTML = `Current Room: ${roomName}(${countRoomMember}) / Your Nickname: ${nickName}`;
  
  sendMessage(`${nickname ?? "Someone"} joined to room!`)
});

socket.on("bye", (reason, nickname) => {
  const h3 = room.querySelector("h3");
  h3.innerHTML = `Current Room: ${roomName}(${countRoomMember}) / Your Nickname: ${nickName}`;

  sendMessage(
    `${nickname ?? "Someone"} left the room!${ reason ? ` Reason: ${reason}` : ""}`
  );
});
socket.on(
  "message",
  (message, nickname) => 
    sendMessage(`${nickname ?? "unknown"}: ${message}`)
);
socket.on(
  "nicknameChanged",
  (oldNickname, newNickname) =>
    sendMessage(`${oldNickname ?? "unknown"} is now known as ${newNickname}`)
);
socket.on(
  "room_list_change",
  (roomList) => {
    const elemRoomList = welcome.querySelector("ul");
    elemRoomList.innerHTML = "";
    
    roomList.forEach(room => {
      const li = document.createElement("li");
      li.innerText = room;
      elemRoomList.append(li);
    });
  }
);

form.addEventListener("submit", handleRoomSubmit);