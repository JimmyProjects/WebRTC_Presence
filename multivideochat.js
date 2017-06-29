window.addEventListener('load', () => {
  var localStream;
  var peerConnections = [];
  
  var videoButton = document.getElementById('videoButton');
  var stopVideoButton = document.getElementById('stopVideoButton');
  var muteSelfButton = document.getElementById('muteSelfButton');
  var addNewPeerButton = document.getElementById('addNewPeerButton');
  var peerDiv = document.getElementById('peerDiv');
  
  videoButton.onclick = () => {
    navigator.mediaDevices.getUserMedia({video:{ width: 320, height: 180 }, audio:true})
      .then(stream => {
        localStream = stream;
        var localVideo = document.getElementById('localVideo');
        localVideo.srcObject = stream;
        peerConnections.forEach(pc => {
          pc.addStream(stream);
        });
      })
      .catch(err => { 
        console.log(err.name + ": " + err.message); 
      });
  };
  
  stopVideoButton.onclick = () => {
    localStream.getTracks().forEach(track => {
        track.stop();
    });
  };
  
  muteSelfButton.onclick = () => {
    // don't send audio out
  };
  
  addNewPeerButton.onclick = () => {
    const peerNumber = peerConnections.length;
    var peerDivClone = peerDiv.cloneNode(true);
    peerDivClone.classList.remove("hidden");
    peerDivClone.id = peerDivClone.id + peerNumber;
    for(var i=0;i < peerDivClone.childNodes.length; i++) {
      var childNode = peerDivClone.childNodes[i];
      childNode.id = childNode.id + peerNumber;
    }
    document.body.appendChild(peerDivClone);
    initNewPeer(peerNumber);
  };
  
  function initNewPeer(peerNumber) {
    var sendButton = document.getElementById('sendButton' + peerNumber);
    var connectButton = document.getElementById('connectButton' + peerNumber);
    var inviteButton = document.getElementById('inviteButton' + peerNumber);
    var muteButton = document.getElementById('muteButton' + peerNumber);
    var messageTextArea = document.getElementById('messageTextArea' + peerNumber);
    var textDiv = document.getElementById('textDiv' + peerNumber);
    var remoteVideo = document.getElementById('remoteVideo' + peerNumber);
    var offerTextArea = document.getElementById('offerTextArea' + peerNumber);
    var answerTextArea = document.getElementById('answerTextArea' + peerNumber);
    
    var host = false;
    var offerDesc = {};
    var answerDesc = {};
    var candidates = [];
    var channel = {};
    var pc = new RTCPeerConnection({ 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }]});
    peerConnections.push(pc);
    pc.onicecandidate = (peerConnection, e) => {
      console.log("onicecandidate pc1: ", peerConnection, e);
      console.log("candidate:", JSON.stringify(peerConnection.candidate));
      if (peerConnection.candidate) {
        candidates.push(peerConnection.candidate);
        if (host) {
          offerTextArea.value = JSON.stringify({sessionDesc: offerDesc, candidates: candidates});
        } else {
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
        textDiv.innerHTML += event.data + '<br>';
      };
    }

    inviteButton.onclick = () => {
      console.log("invitebutton click");
      host = true;
      channel = pc.createDataChannel('sendDataChannel');
      channelCreated(channel);
      
      pc.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1})
        .then((sessionDesc) => {
          offerDesc = sessionDesc;
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
          .then(desc => {
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
      
      textDiv.innerHTML += messageTextArea.value + '<br>';
      
      messageTextArea.value = '';
      messageTextArea.focus();
    };
    
    muteButton.onclick = () => {
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
  } // function initNewPeer
});
