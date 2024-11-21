/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/********************************************************************
 * Demo created by Jason Mayes 2021.
 *
 * Got questions? Reach out to me on social:
 * Twitter:  https://twitter.com/jason_mayes
 * LinkedIn: https://linkedin.com/in/creativetech
 ********************************************************************/


const CAM_WIDTH = 640;
const CAM_HEIGHT = 480;
const MIN_DETECTION_CONFIDENCE = 0.5;
const ANIMATION_TIME = 500;
// Min number of seconds before we send another alert.
const MIN_ALERT_COOLDOWN_TIME = 60;

const STEP_1 = document.getElementById('step1');
const STEP_3 = document.getElementById('step3');

const ENABLE_WEBCAM_BTN = document.getElementById('webcamButton');

const CHOSEN_ITEM = { value: 'cat' };
const MONITORING_TEXT = document.getElementById('monitoring');

const VIDEO = document.getElementById('webcam');
const LIVE_VIEW = document.getElementById('liveView');

const CANVAS = document.createElement('canvas');
const CTX = CANVAS.getContext('2d');

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];
var model = undefined;
var ratioX = 1;
var ratioY = 1;
var state = 'setup';
var foundMonitoredObjects = [];

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run. Only loaded once on page load.
cocoSsd.load().then(function(loadedModel) {
  model = loadedModel;
  // Show demo section now model is ready to use.
  ENABLE_WEBCAM_BTN.classList.remove('disabled');
});


// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}


// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  ENABLE_WEBCAM_BTN.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  if (!model) {
    console.log('Wait! Model not loaded yet.');
    return;
  }

  // Hide the enable button.
  event.target.classList.add('removed');
  
  // Remove the prompt text
  const prompt = document.querySelector('.prompt');
  if (prompt) {
    prompt.classList.add('removed');
  }

  // getUsermedia parameters.
  const constraints = {
    video: {
      facingMode: 'environment',
      width: CAM_WIDTH,
      height: CAM_HEIGHT
    }
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    VIDEO.srcObject = stream;
    
    VIDEO.addEventListener('loadeddata', function() {
      recalculateVideoScale();
      predictWebcam();
    });
  });
}


function renderFoundObject(prediction) {
  const p = document.createElement('p');
  p.innerText =
    prediction.class +
    ' - with ' +
    Math.round(parseFloat(prediction.score) * 100) +
    '% confidence.';
  // Draw in top left of bounding box outline.
  p.style =
    'left: ' +
    prediction.bbox[0] * ratioX +
    'px;' +
    'top: ' +
    prediction.bbox[1] * ratioY +
    'px;' +
    'width: ' +
    (prediction.bbox[2] * ratioX - 10) +
    'px;';

  // Draw the actual bounding box.
  const highlighter = document.createElement('div');
  highlighter.setAttribute('class', 'highlighter');
  highlighter.style =
    'left: ' +
    prediction.bbox[0] * ratioX +
    'px; top: ' +
    prediction.bbox[1] * ratioY +
    'px; width: ' +
    prediction.bbox[2] * ratioX +
    'px; height: ' +
    prediction.bbox[3] * ratioY +
    'px;';

  LIVE_VIEW.appendChild(highlighter);
  LIVE_VIEW.appendChild(p);

  // Store drawn objects in memory so we can delete them next time around.
  children.push(highlighter);
  children.push(p);
}


function predictWebcam() {
  model.detect(VIDEO).then(function(predictions) {
    // Remove previous highlighting
    for (let i = 0; i < children.length; i++) {
      LIVE_VIEW.removeChild(children[i]);
    }
    children.splice(0);
    
    // Check for cats in this frame instead of phones
    for (let n = 0; n < predictions.length; n++) {
      if (predictions[n].score > MIN_DETECTION_CONFIDENCE && predictions[n].class === 'cat') {
        renderFoundObject(predictions[n]);
        
        // Show AI indicator if not already shown
        if (MONITORING_TEXT.classList.contains('invisible')) {
          MONITORING_TEXT.classList.remove('invisible');
        }
      }
    }

    // Continue detection regardless of whether a cat was found
    window.requestAnimationFrame(predictWebcam);
  });
}


// Handle browser resizing for bounding box and video rendering.
function recalculateVideoScale() {
  ratioY = VIDEO.clientHeight / VIDEO.videoHeight;
  ratioX = VIDEO.clientWidth / VIDEO.videoWidth;
  CANVAS.width = VIDEO.videoWidth;
  CANVAS.height = VIDEO.videoHeight;
}


window.addEventListener("resize", recalculateVideoScale);
