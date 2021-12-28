const messageList = document.querySelector("ul");
const nicknameForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
})

socket.addEventListener("message", (message) => {
  const li = document.createElement("li");
  li.innerText = message.data;
  messageList.append(li);
  console.log("New message: ", message.data);
})

socket.addEventListener(("close"), () => {
  console.log("Disconnected from Server ❌");
})

nicknameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nickname = nicknameForm.querySelector("input").value;
  socket.send(JSON.stringify({
    type: "nickname",
    payload: nickname
  }));
})

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = messageForm.querySelector("input").value;
  const li = document.createElement("li");
  li.innerText = `You: ${message}`;
  messageList.append(li);
  socket.send(JSON.stringify({
    type: "message",
    payload: message
  }));
});