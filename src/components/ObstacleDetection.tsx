import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, Clock, MapPin, User, Dog, Car, Wrench } from 'lucide-react';

interface Detection {
  id: string;
  type: 'obstacle' | 'person' | 'animal' | 'debris' | 'vehicle';
  confidence: number;
  location: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
}

interface ObstacleDetectionProps {
  detections: Detection[];
}

export function ObstacleDetection({ detections }: ObstacleDetectionProps) {
  const getDetectionIcon = (type: Detection['type']) => {
    switch (type) {
      case 'person':
        return <User className="h-4 w-4 text-destructive" />;
      case 'animal':
        return <Dog className="h-4 w-4 text-warning" />;
      case 'vehicle':
        return <Car className="h-4 w-4 text-destructive" />;
      case 'debris':
        return <Wrench className="h-4 w-4 text-warning" />;
      case 'obstacle':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDangerColor = (level: Detection['dangerLevel']) => {
    switch (level) {
      case 'critical':
        return 'text-destructive';
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getDangerBadge = (level: Detection['dangerLevel']) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Sort detections by timestamp (newest first) and danger level
  const sortedDetections = detections
    .sort((a, b) => {
      const dangerOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (dangerOrder[a.dangerLevel] !== dangerOrder[b.dangerLevel]) {
        return dangerOrder[b.dangerLevel] - dangerOrder[a.dangerLevel];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    })
    .slice(0, 10); // Show only latest 10 detections

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          AI Obstacle Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedDetections.map((detection) => (
          <div key={detection.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getDetectionIcon(detection.type)}
                <span className="font-medium text-foreground">{detection.description}</span>
              </div>
              <Badge variant={getDangerBadge(detection.dangerLevel)}>
                {Math.round(detection.confidence * 100)}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {detection.location}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {getTimeAgo(detection.timestamp)}
              </div>
              <Badge variant="outline" className={getDangerColor(detection.dangerLevel)}>
                {detection.dangerLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
        ))}
        
        {detections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No detections found</p>
            <p className="text-sm">All tracks are clear</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}