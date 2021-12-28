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
  h3.innerHTML = `Current Room: ${roomName}`;
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

form.addEventListener("submit", handleRoomSubmit);