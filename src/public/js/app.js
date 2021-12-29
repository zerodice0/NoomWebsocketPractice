const socket = io();

const welcome = document.getElementById('welcome');
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

const showRoom = () => {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  const form = room.querySelector("form");
  h3.innerHTML = `Current Room: ${roomName}`;
  form.addEventListener("submit", handleMessageSubmit);
}

const handleMessageSubmit = (event) => {
  event.preventDefault();
  const form = room.querySelector("form");
  const input = form.querySelector("input");
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
  const input = form.querySelector("input");
  socket.emit(
    "enter_room",
    { payload: input.value },
    showRoom
  );

  roomName = input.value;
  input.value = "";
}

const sendMessage = (message) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerHTML = message;
  ul.appendChild(li);
}

socket.on("welcome", () => sendMessage("Someone joined to room!"));
socket.on("bye", (reason) => sendMessage(
  `Someone left the room!${ reason ? ` Reason: ${reason}` : ""}` 
));
socket.on("message", (message) => sendMessage(message));

form.addEventListener("submit", handleRoomSubmit);