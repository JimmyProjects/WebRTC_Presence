// https://github.com/mdn/samples-server/blob/master/s/webrtc-capturestill/capture.js
window.addEventListener('load', () => {
  console.log("hi");
  navigator.mediaDevices.getUserMedia({video:true, audio:false})
    .then((stream) => {
      //video.src = window.URL.createObjectURL(stream);
      video.srcObject = stream;
      video.play();
      window.setInterval(takepicture, 5000);
    })
    .catch((err) => { 
      console.log(err.name + ": " + err.message); 
    });
    
    var video = document.getElementsByTagName('video')[0];
    var photo = document.getElementById('photo');
    var startbutton = document.getElementById('startbutton');
    var canvas = document.getElementById('canvas');
    
    startbutton.addEventListener('click', (e) => {
      takepicture();
      e.preventDefault();
    }, false);
    
    
  var width = 320;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream
  var streaming = false;

    
    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);
      
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
      
        if (isNaN(height)) {
          height = width / (4/3);
        }
      
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);
    
    function clearphoto() {
      var context = canvas.getContext('2d');
      context.fillStyle = "#AAA";
      context.fillRect(0, 0, canvas.width, canvas.height);

      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
    }
    function takepicture() {
      var context = canvas.getContext('2d');
      if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
      
        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);
      } else {
        clearphoto();
      }
    }
    
});