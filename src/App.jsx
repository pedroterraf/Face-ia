import { useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import './App.css'

function App() {
  const videoRef = useRef()
  const canvasRef = useRef()

  // Ejecuto apenas el cliente entra
  useEffect(() => {
    startVideo()
    videoRef && loadModels()
  }, [])

  // Abro la cámara
  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream
      })
      .catch((err) => {
        console.log(err)
      })
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
      <video ref={videoRef} autoPlay className='video'></video>
      <canvas ref={canvasRef} className="canvas" />
    </div>
  )
}

export default App

/* 
  const faceMyDetect = ()=>{
    setInterval(async()=>{
      const detections = await faceapi.detectAllFaces(videoRef.current,
        new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()

      //Detecta y muestra el estado
      canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(videoRef.current)
      faceapi.matchDimensions(canvasRef.current,{
        width:940,
        height:650
      })

      const resized = faceapi.resizeResults(detections,{
         width:940,
        height:650
      })

      faceapi.draw.drawDetections(canvasRef.current,resized)
      faceapi.draw.drawFaceLandmarks(canvasRef.current,resized)
      faceapi.draw.drawFaceExpressions(canvasRef.current,resized)
      
    },100)
  }

*/