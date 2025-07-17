import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  Clock,
  Eye,
  Download,
  CheckCircle
} from 'lucide-react';
import { useYOLOv8Detection } from '@/hooks/useYOLOv8Detection';

interface Detection {
  id: string;
  type: 'obstacle' | 'person' | 'animal' | 'debris' | 'vehicle';
  confidence: number;
  location: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
  timeInVideo?: number; // Time in seconds when detection occurred
}

interface UploadedVideo {
  id: string;
  file: File;
  url: string;
  name: string;
  size: string;
  duration?: number;
  status: 'ready' | 'analyzing' | 'completed' | 'error';
}

interface VideoAnalysisProps {
  video: UploadedVideo;
  onDetection: (detection: Detection) => void;
  onAnalysisComplete: (videoId: string, detections: Detection[]) => void;
  onStatusUpdate: (videoId: string, status: UploadedVideo['status']) => void;
}

export function VideoAnalysis({ 
  video, 
  onDetection, 
  onAnalysisComplete, 
  onStatusUpdate 
}: VideoAnalysisProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [analysisInterval, setAnalysisInterval] = useState<NodeJS.Timeout | null>(null);
  
  const { isProcessing, error, processFrame } = useYOLOv8Detection();

  const getDescriptionForType = (type: string): string => {
    const descriptions: Record<string, string[]> = {
      person: ['Person detected on tracks', 'Human presence detected', 'Pedestrian in danger zone'],
      animal: ['Animal on railway tracks', 'Wildlife detected', 'Animal obstruction'],
      vehicle: ['Vehicle on tracks', 'Unauthorized vehicle', 'Emergency vehicle'],
      obstacle: ['Unknown object detected', 'Potential obstruction', 'Foreign object'],
      debris: ['Debris on tracks', 'Scattered objects', 'Track obstruction'],
    };
    
    const typeDescriptions = descriptions[type] || descriptions.obstacle;
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  };

  const getDangerLevel = (type: string, confidence: number): Detection['dangerLevel'] => {
    if (confidence < 0.6) return 'low';
    
    switch (type) {
      case 'person':
        return confidence > 0.8 ? 'critical' : 'high';
      case 'vehicle':
        return 'critical';
      case 'animal':
        return confidence > 0.75 ? 'high' : 'medium';
      case 'debris':
        return confidence > 0.7 ? 'medium' : 'low';
      case 'obstacle':
        return confidence > 0.8 ? 'high' : 'medium';
      default:
        return 'medium';
    }
  };

  const analyzeCurrentFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) {
      return;
    }

    try {
      const yoloDetections = await processFrame(canvasRef.current, videoRef.current);
      
      // Convert YOLOv8 detections to our format
      yoloDetections.forEach(yoloDetection => {
        const detection: Detection = {
          id: yoloDetection.id,
          type: yoloDetection.type,
          confidence: yoloDetection.confidence,
          location: `Video: ${video.name}`,
          dangerLevel: getDangerLevel(yoloDetection.type, yoloDetection.confidence),
          timestamp: new Date(),
          description: getDescriptionForType(yoloDetection.type),
          timeInVideo: videoRef.current?.currentTime || 0,
        };
        
        setDetections(prev => [...prev, detection]);
        onDetection(detection);
      });
      
    } catch (err) {
      console.error('Frame analysis failed:', err);
    }
  }, [video.name, isProcessing, processFrame, onDetection]);

  const startAnalysis = useCallback(() => {
    if (!videoRef.current) return;
    
    setIsAnalyzing(true);
    setDetections([]);
    onStatusUpdate(video.id, 'analyzing');
    
    const video_element = videoRef.current;
    video_element.currentTime = 0;
    
    // Analyze frame every 2 seconds of video content
    const interval = setInterval(() => {
      if (video_element.ended) {
        // Analysis complete
        clearInterval(interval);
        setIsAnalyzing(false);
        onStatusUpdate(video.id, 'completed');
        onAnalysisComplete(video.id, detections);
        return;
      }
      
      analyzeCurrentFrame();
      
      // Jump to next analysis point (every 2 seconds)
      video_element.currentTime += 2;
      
    }, 1000); // Check every second
    
    setAnalysisInterval(interval);
  }, [video.id, analyzeCurrentFrame, onStatusUpdate, onAnalysisComplete, detections]);

  const stopAnalysis = useCallback(() => {
    if (analysisInterval) {
      clearInterval(analysisInterval);
      setAnalysisInterval(null);
    }
    setIsAnalyzing(false);
    onStatusUpdate(video.id, 'ready');
  }, [analysisInterval, video.id, onStatusUpdate]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
    setDetections([]);
    
    if (isAnalyzing) {
      stopAnalysis();
    }
  };

  const exportReport = () => {
    const report = {
      video: video.name,
      analysisDate: new Date().toISOString(),
      totalDetections: detections.length,
      detections: detections.map(d => ({
        timeInVideo: d.timeInVideo || 0,
        type: d.type,
        confidence: d.confidence,
        dangerLevel: d.dangerLevel,
        description: d.description,
      })),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_report_${video.name}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const video_element = videoRef.current;
    if (!video_element) return;

    const handleTimeUpdate = () => {
      const current = video_element.currentTime;
      const duration = video_element.duration;
      setCurrentTime(current);
      setProgress(duration ? (current / duration) * 100 : 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (isAnalyzing) {
        stopAnalysis();
      }
    };

    video_element.addEventListener('timeupdate', handleTimeUpdate);
    video_element.addEventListener('ended', handleEnded);

    return () => {
      video_element.removeEventListener('timeupdate', handleTimeUpdate);
      video_element.removeEventListener('ended', handleEnded);
    };
  }, [isAnalyzing, stopAnalysis]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span>{video.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {isAnalyzing && (
                <Badge variant="default" className="bg-warning">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  ANALYZING
                </Badge>
              )}
              {video.status === 'completed' && (
                <Badge variant="default" className="bg-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  COMPLETE
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Element */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={video.url}
              className="w-full h-full object-contain"
              onLoadedData={() => console.log('Video loaded')}
            />
            
            {/* Hidden canvas for processing */}
            <canvas 
              ref={canvasRef} 
              style={{ display: 'none' }}
              width={640}
              height={480}
            />
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{video.duration ? formatTime(video.duration) : '0:00'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePlayPause}
                disabled={isAnalyzing}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <div className="flex-1" />
              
              {!isAnalyzing && video.status !== 'analyzing' && (
                <Button
                  size="sm"
                  onClick={startAnalysis}
                  className="bg-primary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Start Analysis
                </Button>
              )}
              
              {isAnalyzing && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopAnalysis}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Stop Analysis
                </Button>
              )}
              
              {detections.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
              <p className="text-xs text-destructive font-medium">Analysis Error:</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Statistics */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            Analysis Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Detections:</span>
              <span className="font-medium text-foreground">{detections.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Critical Alerts:</span>
              <span className="font-medium text-destructive">
                {detections.filter(d => d.dangerLevel === 'critical').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High Risk:</span>
              <span className="font-medium text-warning">
                {detections.filter(d => d.dangerLevel === 'high').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium text-foreground">{Math.round(progress)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}