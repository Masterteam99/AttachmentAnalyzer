import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Square, Play, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebcamCaptureProps {
  onVideoCapture: (videoData: string) => void;
  exerciseName: string;
  isAnalyzing?: boolean;
}

export default function WebcamCapture({ onVideoCapture, exerciseName, isAnalyzing }: WebcamCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setHasPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to record your exercise.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const startRecording = useCallback(() => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onVideoCapture(base64data.split(',')[1]); // Remove data:video/webm;base64, prefix
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && isRecording) {
        stopRecording();
      }
    }, 30000);
  }, [stream, onVideoCapture, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const resetCapture = useCallback(() => {
    stopRecording();
    stopCamera();
    setHasPermission(null);
  }, [stopRecording, stopCamera]);

  if (hasPermission === null) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Setup Camera for {exerciseName}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="py-12">
            <Camera className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-6">
              We'll analyze your form in real-time using your camera.
            </p>
            <Button onClick={startCamera} className="bg-primary-600 hover:bg-primary-700">
              <Camera className="mr-2 h-4 w-4" />
              Enable Camera
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Camera className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <p className="text-red-600 mb-4">Camera access is required for movement analysis.</p>
          <p className="text-sm text-gray-500 mb-6">
            Please enable camera permissions in your browser settings and try again.
          </p>
          <Button onClick={startCamera} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Recording {exerciseName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative webcam-overlay">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto bg-black rounded-lg"
          />
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                Recording...
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4 mt-6">
          {!isRecording ? (
            <Button 
              onClick={startRecording}
              disabled={isAnalyzing}
              className="bg-red-600 hover:bg-red-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          )}
          
          <Button onClick={resetCapture} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Position yourself in front of the camera and perform the exercise.
            Recording will automatically stop after 30 seconds.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
