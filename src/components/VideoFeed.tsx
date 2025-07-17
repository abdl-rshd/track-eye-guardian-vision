import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, AlertTriangle, CheckCircle, Settings, Signal, Maximize2, Play, Pause } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { YOLOv8VideoAnalyzer } from './YOLOv8VideoAnalyzer';

interface Detection {
  id: string;
  type: 'obstacle' | 'person' | 'animal' | 'debris' | 'vehicle';
  confidence: number;
  location: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
}

interface Track {
  id: string;
  stationName: string;
  trackNumber: string;
  location: string;
  camera: string;
  streamUrl?: string;
  status: 'clear' | 'obstacle' | 'maintenance' | 'danger';
  isActive: boolean;
}

interface VideoFeedProps {
  track: Track;
  isActive: boolean;
  onDetection?: (detection: Detection) => void;
}

export function VideoFeed({ track, isActive, onDetection }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (track.streamUrl && videoRef.current && isActive) {
      const video = videoRef.current;
      video.src = track.streamUrl;
      if (isPlaying) {
        video.play().catch(() => setHasError(true));
      }
    }
  }, [track.streamUrl, isActive, isPlaying]);

  const handlePlayPause = () => {
    if (!videoRef.current || !track.streamUrl) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => setHasError(true));
    }
    setIsPlaying(!isPlaying);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsPlaying(false);
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clear':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'obstacle':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-warning" />;
      case 'danger':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Camera className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clear':
        return 'bg-success';
      case 'obstacle':
        return 'bg-destructive';
      case 'maintenance':
        return 'bg-warning';
      case 'danger':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span>{track.stationName} - Track {track.trackNumber}</span>
          </div>
          <Badge variant="outline" className={getStatusColor(track.status)}>
            {getStatusIcon(track.status)}
            {track.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Video Feed */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {track.streamUrl && !hasError ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                onError={handleVideoError}
                onLoadedData={() => setHasError(false)}
                controls={false}
                muted
                playsInline
              />
              
              {/* Video Controls Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handlePlayPause}
                      className="bg-black/70 text-white hover:bg-black/90"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleFullscreen}
                    className="bg-black/70 text-white hover:bg-black/90"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent">
              {isActive && !hasError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Live Feed: {track.camera}</p>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      <span className="text-xs text-success">RECORDING</span>
                    </div>
                  </div>
                </div>
              ) : hasError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-destructive opacity-50" />
                    <p className="text-sm text-muted-foreground">Stream Error</p>
                    <p className="text-xs text-muted-foreground">Unable to load camera feed</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">Feed Paused</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Status Overlay */}
          {track.status === 'obstacle' && (
            <div className="absolute top-2 left-2 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
              OBSTACLE DETECTED
            </div>
          )}
          {track.status === 'danger' && (
            <div className="absolute top-2 left-2 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded text-xs font-medium animate-pulse">
              ⚠️ CRITICAL DANGER
            </div>
          )}
          
          {/* Signal Strength */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
            <Signal className="h-3 w-3 text-success" />
            <span className="text-xs text-success">Strong</span>
          </div>
        </div>

        {/* Camera Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Camera: {track.camera}</span>
            <span>Resolution: 1920x1080</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Location: {track.location}</span>
            <span className="text-primary">Active</span>
          </div>
        </div>

        {/* YOLOv8 Analysis Component */}
        {isActive && onDetection && (
          <YOLOv8VideoAnalyzer 
            videoElement={videoRef.current}
            isActive={isActive && isPlaying}
            trackLocation={`${track.stationName} - Track ${track.trackNumber}`}
            onDetection={onDetection}
          />
        )}
      </CardContent>
    </Card>
  );
}