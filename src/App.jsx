import {useRef,useEffect} from 'react'
import * as faceapi from 'face-api.js'
import './App.css'

function App(){
  const videoRef = useRef()
  const canvasRef = useRef()

  // Ejecuto apenas el cliente entra
  useEffect(()=>{
    startVideo()
    videoRef && loadModels()
  },[])

  // Abro la camara 
  const startVideo = ()=>{
    navigator.mediaDevices.getUserMedia({video:true})
    .then((currentStream)=>{
      videoRef.current.srcObject = currentStream
    })
    .catch((err)=>{
      console.log(err)
    })
  }
  // Cargo los modelos de la api

  const loadModels = ()=>{
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models")

      ]).then(()=>{
      faceMyDetect()
    })
  }

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

  return (
    <div className="app">
        <h1 className='app_header_text'>Artificial intelligence</h1>
        <video ref={videoRef} autoPlay className='video'></video>
        <canvas ref={canvasRef} width="940" height="650" className="canvas"/>
    </div>
    )

}

export default App;