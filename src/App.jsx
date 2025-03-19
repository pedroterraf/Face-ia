import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from "@mui/material";
import Skeleton from '@mui/material/Skeleton';
import './App.css';

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const streamRef = useRef();

  useEffect(() => {
    loadModels();
  }, []);

  const requestCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tu navegador no soporta acceso a la cámara.");
        return;
      }

      const permission = await navigator.permissions.query({ name: 'camera' });

      if (permission.state === 'denied') {
        alert('Permiso de cámara denegado. Habilítalo en la configuración del navegador.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("No se pudo acceder a la cámara:", error);
    }
  };

  const startVideo = async () => {
    if (isVideoPlaying) {
      const tracks = streamRef.current?.getTracks();
      tracks?.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setIsVideoPlaying(false);
    } else {
      setIsLoading(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          setIsLoading(false);
          setIsVideoPlaying(true);
          if (modelsLoaded) {
            faceMyDetect();
          }
        };
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    }
  };

  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.ageGenderNet.loadFromUri('/models'),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
    ]);
    setModelsLoaded(true);
  };

  const faceMyDetect = () => {
    setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
      faceapi.matchDimensions(canvasRef.current, { width: 940, height: 650 });

      const resized = faceapi.resizeResults(detections, { width: 940, height: 650 });
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      faceapi.draw.drawDetections(canvasRef.current, resized);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
      faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

      resized.forEach(detection => {
        const box = detection.detection.box;
        new faceapi.draw.DrawBox(box, {
          label: `${Math.round(detection.age)} Age, ${detection.gender}`
        }).draw(canvasRef.current);
      });
    }, 100);
  };

  return (
    <div className="app">
      <h1 className='app_header_text'>Artificial Intelligence</h1>
      
      {isLoading && (
        <Skeleton
          sx={{ bgcolor: 'grey.900', zIndex: 2 }}
          variant="rectangular"
          className='video'
        />
      )}

      {!isVideoPlaying && <img src='/img_face_ia.png' alt="" className='img_ia' />}
      
      <video ref={videoRef} autoPlay className='video' style={{ display: isLoading ? 'none' : 'block' }}></video>
      <canvas ref={canvasRef} className="canvas" />
      
      <div className='container_button'>
        <Button variant='contained' onClick={startVideo} className='button'>
          {isVideoPlaying ? 'Stop' : 'Scan me'}
        </Button>
      </div>
    </div>
  );
}

export default App;
