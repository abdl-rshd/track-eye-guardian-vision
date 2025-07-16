import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Clock, 
  Users, 
  LogOut,
  Play,
  Pause
} from 'lucide-react';
import { ObstacleDetection } from './ObstacleDetection';
import { VideoFeed } from './VideoFeed';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [detectedObstacles, setDetectedObstacles] = useState(3);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate obstacle detection changes
      if (Math.random() > 0.7) {
        setDetectedObstacles(prev => Math.max(0, prev + (Math.random() > 0.5 ? 1 : -1)));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const tracks = [
    { id: 1, name: 'Track A-1', status: 'clear' as const, camera: 'CAM-001' },
    { id: 2, name: 'Track A-2', status: 'obstacle' as const, camera: 'CAM-002' },
    { id: 3, name: 'Track B-1', status: 'clear' as const, camera: 'CAM-003' },
    { id: 4, name: 'Track B-2', status: 'maintenance' as const, camera: 'CAM-004' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Railway Monitor</h1>
              <p className="text-sm text-muted-foreground">Live Track Surveillance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isMonitoring ? "default" : "secondary"} className="bg-success">
              <Activity className="h-3 w-3 mr-1" />
              {isMonitoring ? 'MONITORING' : 'PAUSED'}
            </Badge>
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Cameras</p>
                  <p className="text-2xl font-bold text-foreground">4</p>
                </div>
                <Camera className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Obstacles Detected</p>
                  <p className="text-2xl font-bold text-warning">{detectedObstacles}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clear Tracks</p>
                  <p className="text-2xl font-bold text-success">2</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Update</p>
                  <p className="text-sm font-medium text-foreground">
                    {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feeds */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Video Feeds</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMonitoring(!isMonitoring)}
                  >
                    {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isMonitoring ? 'Pause' : 'Resume'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tracks.map((track) => (
                    <VideoFeed 
                      key={track.id} 
                      track={track} 
                      isActive={isMonitoring}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Obstacle Detection */}
          <div className="space-y-4">
            <ObstacleDetection obstacles={detectedObstacles} />
            
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">AI Detection</span>
                  <Badge variant="default" className="bg-success">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Network Status</span>
                  <Badge variant="default" className="bg-success">Connected</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recording</span>
                  <Badge variant="default" className="bg-primary">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alerts</span>
                  <Badge variant="outline" className="border-warning text-warning">
                    {detectedObstacles} Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}