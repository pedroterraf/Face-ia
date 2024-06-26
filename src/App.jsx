import { useRef, useEffect, useState } from 'react'
import * as faceapi from 'face-api.js'
import { Button } from "@mui/material";
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import './App.css'

function App() {
  const videoRef = useRef()
  const canvasRef = useRef()
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const streamRef = useRef()

  // Ejecuto apenas el cliente entra
  useEffect(() => {
    videoRef && loadModels()
  }, [])

  // Abro la cámara
  const startVideo = () => {
    if (isVideoPlaying) {
      // Detener el video
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      setIsVideoPlaying(false)
    } else {
      // Iniciar el video
      setIsLoading(true)
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((currentStream) => {
          streamRef.current = currentStream
          videoRef.current.srcObject = currentStream
          videoRef.current.onloadeddata = () => {
            setIsLoading(false)
            setIsVideoPlaying(true)
          }
        })
        .catch((err) => {
          console.log(err)
          setIsLoading(false)
        })
    }
  }

  // Cargo los modelos de la API
  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.ageGenderNet.loadFromUri('/models'),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
    ]).then(() => {
      faceMyDetect()
    })
  }

  const faceMyDetect = () => {
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender()

      // Detecta y muestra el estado
      canvasRef.current.innerHTML  = faceapi.createCanvasFromMedia(videoRef.current)
      faceapi.matchDimensions(canvasRef.current, {
        width: 940,
        height: 650
      })

      const resized = faceapi.resizeResults(detections, {
        width: 940,
        height: 650
      })

      // Limpiar el canvas
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      // Dibujar las líneas
      faceapi.draw.drawDetections(canvasRef.current, resized)
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized)
      faceapi.draw.drawFaceExpressions(canvasRef.current, resized)

      resized.forEach(detection => {
        const box = detection.detection.box
        new faceapi.draw.DrawBox(box, {
          label: `${Math.round(detection.age)} Age, ${detection.gender}`
        }).draw(canvasRef.current)
      })
    }, 100)
  }

  return (
    <div className="app">
      <h1 className='app_header_text'>Artificial Intelligence</h1>
      {isLoading &&
        <Skeleton
          sx={{bgcolor: 'grey.900'}}
          variant="rectangular"
          className='video'
        />
      }
      <video ref={videoRef} autoPlay className='video' style={{ display: isLoading ? 'none' : 'block' }}></video>
      <canvas ref={canvasRef} className="canvas" />
      <Button variant='contained' onClick={startVideo} className='button'>
        {isVideoPlaying ? 'Stop' : 'Scan me'}
      </Button>
    </div>
  )
}

export default App;
