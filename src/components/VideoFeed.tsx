import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, AlertTriangle, CheckCircle, Settings, Signal } from 'lucide-react';

interface Track {
  id: number;
  name: string;
  status: 'clear' | 'obstacle' | 'maintenance';
  camera: string;
}

interface VideoFeedProps {
  track: Track;
  isActive: boolean;
}

export function VideoFeed({ track, isActive }: VideoFeedProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clear':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'obstacle':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-warning" />;
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
            <span>{track.name}</span>
          </div>
          <Badge variant="outline" className={getStatusColor(track.status)}>
            {getStatusIcon(track.status)}
            {track.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Video Feed Placeholder */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent">
            {isActive ? (
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
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">Feed Paused</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Status Overlay */}
          {track.status === 'obstacle' && (
            <div className="absolute top-2 left-2 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
              OBSTACLE DETECTED
            </div>
          )}
          
          {/* Signal Strength */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
            <Signal className="h-3 w-3 text-success" />
            <span className="text-xs text-success">Strong</span>
          </div>
        </div>

        {/* Camera Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Camera: {track.camera}</span>
          <span>Resolution: 1920x1080</span>
        </div>
      </CardContent>
    </Card>
  );
}