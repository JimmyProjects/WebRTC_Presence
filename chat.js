window.addEventListener('load', () => {
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
  
  function channelCreated(channel) {
    channel.onopen = () => {
      console.log("onopen");
    };
    channel.onclose = () => {
      console.log("onclose");
    };
    channel.onmessage = event => {
      console.log("onmessage", event);
    };
  }
  
  var inviteButton = document.getElementById('inviteButton');
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
  
  var connectButton = document.getElementById('connectButton');
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
  
  var sendButton = document.getElementById('sendButton');
  sendButton.onclick = () => {
    var messageTextArea = document.getElementById('messageTextArea');
    channel.send(messageTextArea.value);
    console.log("sent", messageTextArea.value);
  };
});
