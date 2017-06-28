window.addEventListener('load', () => {
  var sendButton = document.getElementById('sendButton');
  var connectButton = document.getElementById('connectButton');
  var inviteButton = document.getElementById('inviteButton');
  var videoButton = document.getElementById('videoButton');
  var muteButton = document.getElementById('muteButton');
  var messageTextArea = document.getElementById('messageTextArea');
  
  var host = false;
  var offerDesc = {};
  var answerDesc = {};
  var candidates = [];
  var channel = {};
  var pc = new RTCPeerConnection({ 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]});
  pc.onicecandidate = (peerConnection, e) => {
    console.log("onicecandidate pc1: ", peerConnection, e);
    console.log("candidate:", JSON.stringify(peerConnection.candidate));
    if (peerConnection.candidate) {
      candidates.push(peerConnection.candidate);
      if (host) {
        var offerTextArea = document.getElementById('offerTextArea');
        offerTextArea.value = JSON.stringify({sessionDesc: offerDesc, candidates: candidates});
      } else {
        var answerTextArea = document.getElementById('answerTextArea');
        answerTextArea.value = JSON.stringify({sessionDesc: answerDesc, candidates: candidates});
      }
    }
  };
  
  pc.oniceconnectionstatechange = (peerConnection, e) => {
    console.log("oniceconnectionstatechange pc1", peerConnection, e);
  };
  pc.ondatachannel = event => {
    console.log("ondatachannel", event);
    channel = event.channel;
    channelCreated(channel);
  };
  pc.ontrack = e => {
    console.log("ontrack");
    var remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo.srcObject !== e.streams[0]) {
      remoteVideo.srcObject = e.streams[0];
      pc.addStream(e.streams[0]);
      console.log('pc2 received remote stream');
    }
  };
  
  function channelCreated(channel) {
    channel.onopen = () => {
      console.log("onopen");
    };
    channel.onclose = () => {
      console.log("onclose");
    };
    channel.onmessage = event => {
      console.log("onmessage", event);
      var textDiv = document.getElementById('textDiv');
      textDiv.innerHTML += event.data + '<br>';
    };
  }

  inviteButton.onclick = () => {
    host = true;
    channel = pc.createDataChannel('sendDataChannel');
    channelCreated(channel);
    
    pc.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1})
      .then((sessionDesc) => {
        offerDesc = sessionDesc;
        var offerTextArea = document.getElementById('offerTextArea');
        offerTextArea.value = JSON.stringify({sessionDesc: offerDesc, candidates: candidates});
        pc.setLocalDescription(sessionDesc)
          .then(() => {
            console.log("setLocalDescription complete");
          })
          .catch((error) => {
            console.log("Failed to set session description: " + error.toString());
          });
      })
      .catch((error) => {
        console.log("Failed to create session description: " + error.toString());
      })
    .catch((err) => { 
      console.log(err.name + ": " + err.message); 
    });
  };
  
  connectButton.onclick = () => {
    var offerTextArea = document.getElementById('offerTextArea');
    var answerTextArea = document.getElementById('answerTextArea');
    var remoteDesc;
    if (offerTextArea.value !== "" && answerTextArea.value !== "") {
      remoteDesc = JSON.parse(answerTextArea.value);
    } else if (offerTextArea.value !== "" && answerTextArea.value === "") {
      remoteDesc = JSON.parse(offerTextArea.value);
    } else {
      alert("Error with fields");
      return;
    }
    
    pc.setRemoteDescription(remoteDesc.sessionDesc)
      .then(() => {
        console.log("setRemoteDescription complete");
      })
      .catch((error) => {
        console.log("Failed to set session description: " + error.toString());
      });
    remoteDesc.candidates.forEach(candidate => {
      pc.addIceCandidate(candidate)
        .then(() => {
          console.log("addIceCandidate complete");
        })
        .catch((error) => {
          console.log("Failed to addIceCandidate: " + error.toString());
        });
    });
    if (answerTextArea.value === "") {
      pc.createAnswer()
        .then((desc) => {
          answerDesc = desc;
          answerTextArea.value = JSON.stringify({sessionDesc: desc, candidates: candidates});
          pc.setLocalDescription(desc)
            .then(() => {
              console.log("setLocalDescription complete");
            })
            .catch((error) => {
              console.log("Failed to set session description: " + error.toString());
            });
        })
        .catch((error) => {
          console.log("Failed to set session description: " + error.toString());
        });
    }
  };
  
  sendButton.onclick = () => {
    channel.send(messageTextArea.value);
    console.log("sent", messageTextArea.value);
    
    var textDiv = document.getElementById('textDiv');
    textDiv.innerHTML += messageTextArea.value + '<br>';
    
    messageTextArea.value = '';
    messageTextArea.focus();
  };
  
  videoButton.onclick = () => {
    navigator.mediaDevices.getUserMedia({video:{ width: 320, height: 180 }, audio:true})
      .then(stream => {
        var localVideo = document.getElementById('localVideo');
        localVideo.srcObject = stream;
        pc.addStream(stream);
      })
      .catch(err => { 
        console.log(err.name + ": " + err.message); 
      });
  };
  
  muteButton.onclick = () => {
    var remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.muted = !remoteVideo.muted;
    if (remoteVideo.muted) { muteButton.innerText = "Unmute"; }
    else { muteButton.innerText = "Mute"; }
  };
  
  messageTextArea.onkeyup = e => {
    if (e.keyCode === 13) { // Enter
      e.preventDefault();
      sendButton.click();
      return false;
    }
  };
});
