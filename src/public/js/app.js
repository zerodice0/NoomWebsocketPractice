const socket = io();

const stream = document.getElementById("stream");
const peerStream = document.getElementById("peerStream");
const videoPlayer = stream.querySelector("video");
const peerVideoPlayer = peerStream.querySelector("video");
const audioPlayButton = document.getElementById("audioPlay");
const videoPlayButton = document.getElementById("videoPlay");
const cameraSelect = document.getElementById("cameraSelect");
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const call = document.getElementById("call");
// const form = welcome.querySelector("form");
// const room = document.getElementById("room");

// room.hidden = true;
call.hidden = true;

let roomName;
let nickName;
let videoStream;
let peerConnection;
let dataChannel;

let isPlayAudio = true;
let isPlayVideo = true;

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === "videoinput");
    cameras.forEach(camera => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerHTML = camera.label;
      cameraSelect.appendChild(option);
    });
  } catch(e) {
    console.log(e);
  }
}

const getMedia = async (deviceId) => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: deviceId
        ? {deviceId: { exact: deviceId }} 
        : {facingMode: "user"},
      audio: true
    })

    videoPlayer.srcObject = videoStream;
  } catch(e) {
    console.log(e);
  }
}

// getMedia();
// getCameras();

audioPlayButton.addEventListener("click", () => {
  isPlayAudio = !isPlayAudio;
  initializeAudioButtonLabel();
    
  videoStream
    .getAudioTracks()
    .forEach(track => {
      track.enabled = !track.enabled;
    });
});

videoPlayButton.addEventListener("click", () => {
  isPlayVideo = !isPlayVideo;
  initializeCameraButtonLabel();

  videoStream
    .getVideoTracks()
    .forEach(track => {
      track.enabled = !track.enabled;
    });
});

const initializeAudioButtonLabel = () => {
  audioPlayButton.innerText = isPlayAudio
    ? "Mute"
    : "Play";
}

const initializeCameraButtonLabel = () => {
  videoPlayButton.innerText = isPlayVideo
  ? "Turn Camera Off"
  : "Turn Camera On";
}

const handleCameraChange = async (_) => {
  await getMedia(cameraSelect.value);
  isPlayAudio = true;
  isPlayVideo = true;
  initializeAudioButtonLabel();
  initializeCameraButtonLabel();

  if (peerConnection) {
    const videoTrack = videoStream.getVideoTracks()[0];
    const videoSender = peerConnection
      .getSenders()
      .find(sender => sender.track.kind === "video");
    console.log(videoSender, videoTrack);
    videoSender.replaceTrack(videoTrack);
  }
}

const handleWelcomeSubmit = async (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initMedia();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

const initMedia = async () => {
  welcome.hidden = true;
  call.hidden = false;

  await getMedia();
  getCameras();
  makeConnection();
}


cameraSelect.addEventListener("input", handleCameraChange);
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// RTC
const makeConnection = () => {
  peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.google.com:19302",
          "stun:stun.l.google.com:19302",
          "stun:stun.2.google.com:19302",
          "stun:stun.3.google.com:19302",
          "stun:stun.4.google.com:19302",
        ]
      }
    ]
  });
  peerConnection.addEventListener("icecandidate", handleIceCandidate);
  peerConnection.addEventListener("addstream", handleAddStream);
  
  videoStream
  .getTracks()
  .forEach(track => peerConnection.addTrack(track, videoStream));
}

const handleAddStream = (data) => {
  console.log("addstream event callback");
  console.log("my stream", videoStream);
  console.log("got peer's stream", data.stream);
  peerVideoPlayer.srcObject = data.stream;
}

const handleIceCandidate = (event) => {
  socket.emit("iceCandidate", event.candidate, roomName);
  console.log(event);
  console.log("candidate sent");
}

//socket callback
socket.on("welcome", async () => {
  dataChannel = peerConnection.createDataChannel("chat");
  dataChannel.addEventListener("message", event => {
    console.log(event.data);
  });
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
  console.log("offer sent");
});

socket.on("offer", async offer => {
  peerConnection.addEventListener("datachannel", event => {
    dataChannel = event.channel;
    dataChannel.addEventListener("message", event => {
      console.log(event.data);
    });
  });
  console.log("got offer");
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("answer sent");
})

socket.on("answer", async answer => {
  console.log("answer received", answer);
  await peerConnection.setRemoteDescription(answer);
})

socket.on("iceCandidate", iceCandidate => {
  console.log("ice candidate received", iceCandidate);
  if (iceCandidate) {
    peerConnection.addIceCandidate(iceCandidate);
  }
})

socket.on("bye", nickName => {
  // peerConnection.getTracks().forEach(track => track.stop());
  peerConnection.close();
  peerVideoPlayer.srcObject = null;
})
// const showRoom = (_message, _roomName, _nickName, _countRoomMember) => {
//   welcome.hidden = true;
//   room.hidden = false;
//   const h3 = room.querySelector("h3");
//   const messageForm = room.querySelector("#message");
//   const nicknameForm = room.querySelector("#nickname");
//   h3.innerHTML = `Current Room: ${roomName} (${_countRoomMember}) / Your Nickname: ${nickName}`;
//   messageForm.addEventListener("submit", handleMessageSubmit);
//   nicknameForm.addEventListener("submit", handleNicknameSubmit);
// }

// const handleNicknameSubmit = (event) => {
//   event.preventDefault();
//   const nicknameForm = room.querySelector("#nickname");
//   const input = nicknameForm.querySelector("input");
//   const nickname = input.value;
//   socket.emit(
//     "nickname",
//     nickname,
//     () => sendMessage(`You are now known as ${nickname}`)
//   );
//   input.value = "";
// }

// const handleMessageSubmit = (event) => {
//   event.preventDefault();
//   const messageForm = room.querySelector("#message");
//   const input = messageForm.querySelector("input");
//   const message = input.value;
//   socket.emit(
//     "message",
//     message,
//     roomName,
//     () => sendMessage(`You: ${message}`)
//   );
//   input.value = "";
// }

// const handleRoomSubmit = (event) => {
//   event.preventDefault();
//   const elemRoomName = form.querySelector("#roomName");
//   const elemNickName = form.querySelector("#nickName");
//   socket.emit(
//     "enter_room",
//     { 
//       payload: {
//         nickName: elemNickName.value,
//         roomName: elemRoomName.value
//       }
//     },
//     showRoom
//   );

//   roomName = elemRoomName.value;
//   nickName = elemNickName.value;
//   elemRoomName.value = "";
//   elemNickName.value = "";
// }

// const sendMessage = (message) => {
//   const ul = room.querySelector("ul");
//   const li = document.createElement("li");
//   li.innerHTML = message;
//   ul.appendChild(li);
// }

// socket.on("welcome", (nickname, countRoomMember) => {
//   const h3 = room.querySelector("h3");
//   h3.innerHTML = `Current Room: ${roomName}(${countRoomMember}) / Your Nickname: ${nickName}`;
  
//   sendMessage(`${nickname ?? "Someone"} joined to room!`)
// });

// socket.on("bye", (reason, nickname) => {
//   const h3 = room.querySelector("h3");
//   h3.innerHTML = `Current Room: ${roomName}(${countRoomMember}) / Your Nickname: ${nickName}`;

//   sendMessage(
//     `${nickname ?? "Someone"} left the room!${ reason ? ` Reason: ${reason}` : ""}`
//   );
// });

// socket.on(
//   "message",
//   (message, nickname) => 
//     sendMessage(`${nickname ?? "unknown"}: ${message}`)
// );

// socket.on(
//   "nicknameChanged",
//   (oldNickname, newNickname) =>
//     sendMessage(`${oldNickname ?? "unknown"} is now known as ${newNickname}`)
// );

// socket.on(
//   "room_list_change",
//   (roomList) => {
//     const elemRoomList = welcome.querySelector("ul");
//     elemRoomList.innerHTML = "";
    
//     roomList.forEach(room => {
//       const li = document.createElement("li");
//       li.innerText = room;
//       elemRoomList.append(li);
//     });
//   }
// );

// form.addEventListener("submit", handleRoomSubmit);
