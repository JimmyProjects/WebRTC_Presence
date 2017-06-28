// https://github.com/mdn/samples-server/blob/master/s/webrtc-capturestill/capture.js
window.addEventListener('load', () => {
  var localpc;
  
  var startButton = document.getElementById('startButton');
  var stopButton = document.getElementById('stopButton');
  startButton.onclick = () => {
    navigator.mediaDevices.getUserMedia({video:{ width: 320, height: 180 }, audio:true})
      .then((stream) => {
        localStream = stream;
        var localVideo = document.getElementById('localVideo');
        localVideo.srcObject = stream;
        startButton.disabled = true;
        stopButton.disabled = false;
        //window.setInterval(takepicture, 5000);
        
        //{ 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]}
        var pc = new RTCPeerConnection(null);
        localpc = pc;
        // stream.getTracks().forEach((track) => {
        //   pc.addTrack(track, stream);
        // });
        pc.addStream(stream);
        pc.onicecandidate = (peerConnection, e) => {
          console.log("onicecandidate pc1: ", peerConnection, e);
          console.log("candidate:", JSON.stringify(peerConnection.candidate));
        };
        pc.oniceconnectionstatechange = (peerConnection, e) => {
          console.log("oniceconnectionstatechange pc1", peerConnection, e);
        };
        pc.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1})
          .then((sessionDesc) => {
            var myIdTextArea = document.getElementById('myIdTextArea');
            myIdTextArea.value = JSON.stringify(sessionDesc);
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
          });
          
          stopButton.onclick = () => {
            stream.getTracks().forEach((track) => {
                track.stop();
            });
            startButton.disabled = false;
            stopButton.disabled = true;
            myIdTextArea.value = "";
          };
      })
      .catch((err) => { 
        console.log(err.name + ": " + err.message); 
      });
  };
  
  var remoteIceButton = document.getElementById('remoteIceButton');
  remoteIceButton.onclick = () => {
    var remoteIceTextArea = document.getElementById('remoteIceTextArea');
    const remoteIceDesc = JSON.parse(remoteIceTextArea.value);
    
    localpc.addIceCandidate(remoteIceDesc)
      .then(() => {
        console.log("addIceCandidate complete");
      })
      .catch((error) => {
        console.log("Failed to addIceCandidate: " + error.toString());
      });
  };
  
  var iceButton = document.getElementById('iceButton');
  iceButton.onclick = () => {
    var iceTextArea = document.getElementById('iceTextArea');
    const iceDesc = JSON.parse(iceTextArea.value);
    
    remotepc.addIceCandidate(iceDesc)
      .then(() => {
        console.log("addIceCandidate complete");
      })
      .catch((error) => {
        console.log("Failed to addIceCandidate: " + error.toString());
      });
  };
  
  var answerButton = document.getElementById('answerButton');
  answerButton.onclick = () => {
    var answerTextArea = document.getElementById('answerTextArea');
    const answerDesc = JSON.parse(answerTextArea.value);
    
    localpc.setRemoteDescription(answerDesc)
      .then(() => {
        console.log("setRemoteDescription complete");
      })
      .catch((error) => {
        console.log("Failed to set session description: " + error.toString());
      });
  };
  
  var remotepc;
  var callButton = document.getElementById('callButton');
  connectButton.onclick = () => {
    
    var remoteIdTextArea = document.getElementById('remoteIdTextArea');
    const remoteDesc = JSON.parse(remoteIdTextArea.value);
    
    // { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]}
    var pc = new RTCPeerConnection(null);
    remotepc = pc;
    pc.onicecandidate = (peerConnection, e) => {
      console.log("onicecandidate pc2", JSON.stringify(peerConnection.candidate), e);
    };
    pc.oniceconnectionstatechange = (peerConnection, e) => {
      console.log("oniceconnectionstatechange pc2", peerConnection.iceConnectionState, e);
    };
    pc.setRemoteDescription(remoteDesc)
      .then(() => {
        console.log("setRemoteDescription complete");
      })
      .catch((error) => {
        console.log("Failed to set session description: " + error.toString());
      });
    
    pc.ontrack = (e) => {
      var remoteVideo = document.getElementById('remoteVideo');
      if (remoteVideo.srcObject !== e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
        pc.addStream(e.streams[0]);
        console.log('pc2 received remote stream');
      }
    };
    
    pc.createAnswer()
      .then((desc) => {
        console.log("Answer desc:", JSON.stringify(desc));
        pc.setLocalDescription(desc)
          .then(() => {
            console.log("setLocalDescription complete");
          })
          .catch((error) => {
            console.log("Failed to set session description: " + error.toString());
          });
        
        if (localpc) {
          localpc.setRemoteDescription(desc)
            .then(() => {
              console.log("setRemoteDescription complete");
            })
            .catch((error) => {
              console.log("Failed to set session description: " + error.toString());
            });
          }
      })
      .catch((error) => {
        console.log("Failed to create session description: " + error.toString());
      });
  };
  
    
  //   var video = document.getElementsByTagName('video')[0];
  //   var photo = document.getElementById('photo');
  //   var startbutton = document.getElementById('startbutton');
  //   var canvas = document.getElementById('canvas');
  //   
  //   startbutton.addEventListener('click', (e) => {
  //     takepicture();
  //     e.preventDefault();
  //   }, false);
  //   
  //   
  // var width = 320;    // We will scale the photo width to this
  // var height = 0;     // This will be computed based on the input stream
  // var streaming = false;
  // 
  //   
  //   video.addEventListener('canplay', function(ev){
  //     if (!streaming) {
  //       height = video.videoHeight / (video.videoWidth/width);
  //     
  //       // Firefox currently has a bug where the height can't be read from
  //       // the video, so we will make assumptions if this happens.
  //     
  //       if (isNaN(height)) {
  //         height = width / (4/3);
  //       }
  //     
  //       video.setAttribute('width', width);
  //       video.setAttribute('height', height);
  //       canvas.setAttribute('width', width);
  //       canvas.setAttribute('height', height);
  //       streaming = true;
  //     }
  //   }, false);
  //   
  //   function clearphoto() {
  //     var context = canvas.getContext('2d');
  //     context.fillStyle = "#AAA";
  //     context.fillRect(0, 0, canvas.width, canvas.height);
  // 
  //     var data = canvas.toDataURL('image/png');
  //     photo.setAttribute('src', data);
  //   }
  //   function takepicture() {
  //     var context = canvas.getContext('2d');
  //     if (width && height) {
  //       canvas.width = width;
  //       canvas.height = height;
  //       context.drawImage(video, 0, 0, width, height);
  //     
  //       var data = canvas.toDataURL('image/png');
  //       photo.setAttribute('src', data);
  //     } else {
  //       clearphoto();
  //     }
  //   }
    
});
