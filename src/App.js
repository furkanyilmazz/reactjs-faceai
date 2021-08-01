import React, { useEffect, useState, useRef } from 'react';
import "./App.css";

import * as faceapi from 'face-api.js';

export default function App() {

  const videoHeight = 720;
  const videoWidth = 540;
  const [initializing, setInitializing] = useState(false)
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      setInitializing(true);
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]).then(startVideo)
    }
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;

    navigator.getUserMedia(
      {
        video: {},
      },
      function (stream) {
        var video = document.querySelector('video');
        video.srcObject = stream;
        video.play();
      },
      function (err) {
        console.log("hata: " + err.name);
      }
    );


  }

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (initializing) {
        setInitializing(false);
      }
      canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
      const displaySize = {
        width: videoWidth,
        heigth: videoHeight
      }
      faceapi.matchDimensions(canvasRef.current, displaySize);
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvasRef.current.getContext('2d').clearRect(0, 0, videoWidth, videoHeight);
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections)
      //console.log(detections);
    }, 100)
  }

  return (
    <div className="main">
      <span>{initializing ? "Initializing" : "Ready"}</span>
      <div>
        <video id="video" className="video" ref={videoRef} autoPlay muted height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} />
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

