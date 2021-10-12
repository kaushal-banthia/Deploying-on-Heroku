/*
NOTES:
1. The limits of x is from 0 to 2 in the video frame (Although it can go to numbers beyond that range, if that joint goes out of the frame)
2. The limits of y is from 0 to 1 in the video frame (Although it can go to numbers beyond that range, if that joint goes out of the frame)
*/

document.getElementById('input_video').style.display = "none";
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const beep = document.getElementById("beep-sound"); 
const frontSound = document.getElementById("front-sound"); 
const sideSound = document.getElementById("side-sound");
const startTheTimer = document.getElementById("start"); 

const frames = 20;
var frontDivider= 0;
var sideDivider = 0;

// The joints are ordered in this fashion
var joints = ['NOSE', 'LEFT_EYE_INNER', 'LEFT_EYE', 'LEFT_EYE_OUTER', 'RIGHT_EYE_INNER', 'RIGHT_EYE', 'RIGHT_EYE_OUTER', 'LEFT_EAR', 'RIGHT_EAR', 'MOUTH_LEFT', 'MOUTH_RIGHT', 'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT ELBOW', 'RIGHT_ELBOW', 'LEFT_WRIST', 'RIGHT_WRIST', 'LEFT_PINKY', 'RIGHT_PINKY', 'LEFT_INDEX', 'RIGHT_INDEX', 'LEFT_THUMB', 'RIGHT_THUMB', 'LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT__ANKLE', 'LEFT_HEEL', 'RIGHT_HEEL', 'LEFT_FOOT_INDEX', 'RIGHT_FOOT_INDEX'];
var count = frames; // for taking the average over 30 cycles
var minVisibilityRequired = 0.65

var front = 1;
var side = 0;

const holdingTime = 10*1000;
var time = 0;
var score = {"frontLDistance": 0, "frontLAngle": 0, "frontRDistance": 0, "frontRAngle": 0, "sideDistance": 0, "sideAngle": 0};

function onResults(results)
{
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,{color: '#FFFF00', lineWidth: 8});
  drawLandmarks(canvasCtx, results.poseLandmarks,{color: '#FF0000', lineWidth: 2});
  canvasCtx.restore();

  if (front)
    frontpose(results);
  if (side)
    sidepose(results); 
}

function toetouch(results, right)
{
  // Locations
  var HandX = results.poseLandmarks[19 + right]['x'];
  var HandY = results.poseLandmarks[19 + right]['y'];
  var LegX = results.poseLandmarks[31 + right]['x'];
  var LegY = results.poseLandmarks[31 + right]['y'];
  var Distance = Math.sqrt(Math.pow((HandX - LegX), 2) + Math.pow((HandY - LegY), 2));

  minVisibilityRequired = 0.65;
  document.getElementById("text").innerHTML="Great! Now touch your toes!";
  
  var slope1 = (results.poseLandmarks[23 + right]['y'] - results.poseLandmarks[25 + right]['y'])/(results.poseLandmarks[23 + right]['x'] - results.poseLandmarks[25 + right]['x']);
  var slope2 = (results.poseLandmarks[27 + right]['y'] - results.poseLandmarks[25 + right]['y'])/(results.poseLandmarks[27 + right]['x'] - results.poseLandmarks[25 + right]['x']);
  var angle = 180/Math.PI*Math.atan(Math.abs((slope1 - slope2)/(1+slope1*slope2)));

  // console.log(Distance, angle);

  if (time < holdingTime)
  {
    if (time == 0)
    {
      console.log("HI");
      sideSound.pause();
      beep.play();

      startTime = new Date().getTime();
    }
    
    // If distance between the hand and legs is < threshold
    // If the angle of the legs is < threshold
    if (Distance <= 0.1)
      score["sideDistance"]++;
    if (angle<10)
      score["sideAngle"]++;
    
    sideDivider++;
    var endTime = new Date().getTime();
    time += endTime - startTime + 0.1;
    startTime = new Date().getTime();
  }

  else
  {
    score["sideDistance"] = Math.round(score["sideDistance"]/sideDivider);
    score["sideAngle"] = Math.round(score["sideAngle"]/sideDivider);
    beep.play();
    downloadImage();
    window.alert("Leg Angle: " + (score["sideAngle"]*100).toString() + "%\n" + 
    "Toe Touch Distance: " + (score["sideDistance"]*100).toString() + "%");
    time = 0;
    window.close();
  }
}

function sidepose(results)
{
  // Access the elements by using the following line
  // results.poseLandmarks[index]
  
  if (results.poseLandmarks)
  {
    // Visibilties
    var visibilityOf19 = results.poseLandmarks[19]['visibility']; // Left Index
    var visibilityOf20 = results.poseLandmarks[20]['visibility']; // Right Index
    var visibilityOf23 = results.poseLandmarks[23]['visibility']; // Left Hip
    var visibilityOf24 = results.poseLandmarks[24]['visibility']; // Right Hip
    var visibilityOf25 = results.poseLandmarks[25]['visibility']; // Left Knee
    var visibilityOf26 = results.poseLandmarks[26]['visibility']; // Right Knee
    var visibilityOf27 = results.poseLandmarks[27]['visibility']; // Left Ankle
    var visibilityOf28 = results.poseLandmarks[28]['visibility']; // Right Ankle
    var visibilityOf31 = results.poseLandmarks[31]['visibility']; // Left Foot Index
    var visibilityOf32 = results.poseLandmarks[32]['visibility']; // Right Foot Index

    var right = -1; // -1 for none, 0 for left, 1 for right
    if (visibilityOf19 < minVisibilityRequired || visibilityOf23 < minVisibilityRequired || visibilityOf25 < minVisibilityRequired || visibilityOf27 < minVisibilityRequired || visibilityOf31 < minVisibilityRequired)
    {
      if (visibilityOf20 < minVisibilityRequired || visibilityOf24 < minVisibilityRequired || visibilityOf26 < minVisibilityRequired || visibilityOf28 < minVisibilityRequired || visibilityOf32 < minVisibilityRequired)
      {
        document.getElementById("text").innerHTML="Please get into Side Pose.";
        sideSound.play();
        if (time != 0)
          startTime = new Date().getTime();
      }
      else
        right = 1;
    }

    else
      right = 0;
    
    if (right == 1 || right == 0)
      toetouch(results, right);
  }
}

function frontpose(results)
{
  // Access the elements by using the following line
  // results.poseLandmarks[index]
  
  if (results.poseLandmarks)
  {
    // Locations
    var leftHandX = results.poseLandmarks[19]['x'];
    var leftHandY = results.poseLandmarks[19]['y'];
    var rightHandX = results.poseLandmarks[20]['x'];
    var rightHandY = results.poseLandmarks[20]['y'];
    var leftLegX = results.poseLandmarks[31]['x'];
    var leftLegY = results.poseLandmarks[31]['y'];
    var rightLegX = results.poseLandmarks[32]['x'];
    var rightLegY = results.poseLandmarks[32]['y'];
    var leftDistance = Math.sqrt(Math.pow((leftHandX - leftLegX), 2) + Math.pow((leftHandY - leftLegY), 2));
    var rightDistance = Math.sqrt(Math.pow((rightHandX - rightLegX), 2) + Math.pow((rightHandY - rightLegY), 2));

    // Visibilties
    var visibilityOf19 = results.poseLandmarks[19]['visibility']; // Left Index
    var visibilityOf20 = results.poseLandmarks[20]['visibility']; // Right Index
    var visibilityOf31 = results.poseLandmarks[31]['visibility']; // Left Foot Index
    var visibilityOf32 = results.poseLandmarks[32]['visibility']; // Right Foot Index

    if (visibilityOf19 < minVisibilityRequired || visibilityOf20 < minVisibilityRequired || visibilityOf31 < minVisibilityRequired || visibilityOf32 < minVisibilityRequired)
    {
      document.getElementById("text").innerHTML="Please get into Front pose.";
      frontSound.play();
      if (time != 0)
        startTime = new Date().getTime();
    }

    else
    {
      minVisibilityRequired = 0.5;
      document.getElementById("text").innerHTML="Great! You are in Front pose!";

      var lslope1 = (results.poseLandmarks[23]['y'] - results.poseLandmarks[25]['y'])/(results.poseLandmarks[23]['x'] - results.poseLandmarks[25]['x']);
      var lslope2 = (results.poseLandmarks[27]['y'] - results.poseLandmarks[25]['y'])/(results.poseLandmarks[27]['x'] - results.poseLandmarks[25]['x']);
      var langle = 180/Math.PI*Math.atan(Math.abs((lslope1 - lslope2)/(1+lslope1*lslope2)));

      var rslope1 = (results.poseLandmarks[24]['y'] - results.poseLandmarks[26]['y'])/(results.poseLandmarks[24]['x'] - results.poseLandmarks[26]['x']);
      var rslope2 = (results.poseLandmarks[28]['y'] - results.poseLandmarks[26]['y'])/(results.poseLandmarks[28]['x'] - results.poseLandmarks[26]['x']);
      var rangle = 180/Math.PI*Math.atan(Math.abs((rslope1 - rslope2)/(1+rslope1*rslope2)));

      // console.log(leftDistance, rightDistance, langle, rangle);

      if (time < holdingTime)
      {
        if (time == 0)
        {
          frontSound.pause();
          beep.play();
          
          startTime = new Date().getTime();
        }

        // If distance between the hand and legs is < threshold, then score = 1. Else its 0
        if (leftDistance <= 0.1)
          score["frontLDistance"]++;
        if (rightDistance <= 0.1)
          score["frontRDistance"]++;
        if (langle < 10)
          score["frontLAngle"]++;
        if (rangle < 10)
          score["frontRAngle"]++;

        frontDivider++;
        var endTime = new Date().getTime();
        time += endTime - startTime + 0.1;
        startTime = new Date().getTime();
      }

      else
      {
        score["frontRDistance"] = (score["frontRDistance"]/frontDivider);
        score["frontLDistance"] = (score["frontLDistance"]/frontDivider);
        score["frontLAngle"] = (score["frontLAngle"]/frontDivider);
        score["frontRAngle"] = (score["frontRAngle"]/frontDivider);
        beep.play();
        downloadImage();
        window.alert("Left Leg Angle: " + (score["frontLAngle"]*100).toString() + "%\n" +
                     "Right Leg Angle: " + (score["frontRAngle"]*100).toString() + "%\n" + 
                     "Left Toe Touch Distance: " + (score["frontLDistance"]*100).toString() + "%\n" +
                     "Right Toe Touch Distance: " + (score["frontRDistance"]*100).toString() + "%");
        front = 0;
        side = 1;
        minVisibilityRequired = 0.75;
        time = 0;
      }
    }
  }
}

function downloadImage()
{
    var image = canvasElement.toDataURL();  
  
    // create temporary link  
    var tmpLink = document.createElement( 'a' );  
    tmpLink.download = 'image.png'; // set the name of the download file 
    tmpLink.href = image;  
  
    // temporarily add link to body and initiate the download  
    document.body.appendChild( tmpLink );  
    tmpLink.click();  
    document.body.removeChild( tmpLink );
}

// Instantiating the model
const pose = new Pose({locateFile: (file) => {return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Calling function after we get the results from the Blazepose model
pose.onResults(onResults);

// Instantiating the camera
const camera = new Camera(videoElement, {onFrame: async () => {await pose.send({image: videoElement});},
  width: 1000,
  height: 500
});

// Starting the camera
camera.start();