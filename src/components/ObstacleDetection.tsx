import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, Clock, MapPin } from 'lucide-react';

interface ObstacleDetectionProps {
  obstacles: number;
}

export function ObstacleDetection({ obstacles }: ObstacleDetectionProps) {
  const obstacleData = [
    {
      id: 1,
      type: 'Debris',
      location: 'Track A-2, KM 15.3',
      confidence: 94,
      timestamp: '2 min ago',
      severity: 'high'
    },
    {
      id: 2,
      type: 'Animal',
      location: 'Track B-1, KM 8.7',
      confidence: 87,
      timestamp: '5 min ago',
      severity: 'medium'
    },
    {
      id: 3,
      type: 'Fallen Tree',
      location: 'Track A-1, KM 22.1',
      confidence: 98,
      timestamp: '12 min ago',
      severity: 'high'
    }
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          AI Obstacle Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {obstacleData.slice(0, obstacles).map((obstacle) => (
          <div key={obstacle.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${
                  obstacle.severity === 'high' ? 'text-destructive' : 'text-warning'
                }`} />
                <span className="font-medium text-foreground">{obstacle.type}</span>
              </div>
              <Badge variant={obstacle.severity === 'high' ? 'destructive' : 'outline'}>
                {obstacle.confidence}% confident
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {obstacle.location}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Detected {obstacle.timestamp}
            </div>
          </div>
        ))}
        
        {obstacles === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No obstacles detected</p>
            <p className="text-sm">All tracks are clear</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}