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
  Pause,
  MapPin,
  Zap
} from 'lucide-react';
import { ObstacleDetection } from './ObstacleDetection';
import { VideoFeed } from './VideoFeed';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  onLogout: () => void;
}

interface Detection {
  id: string;
  type: 'obstacle' | 'person' | 'animal' | 'debris' | 'vehicle';
  confidence: number;
  location: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
}

interface TrackData {
  id: string;
  stationName: string;
  trackNumber: string;
  location: string;
  camera: string;
  status: 'clear' | 'obstacle' | 'maintenance' | 'danger';
  detections: Detection[];
  isActive: boolean;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const { toast } = useToast();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [totalDetections, setTotalDetections] = useState(0);
  const [dangerousDetections, setDangerousDetections] = useState(0);
  const [tracks, setTracks] = useState<TrackData[]>([]);

  // Railway station names and locations
  const stationData = [
    { name: 'Central Station', location: 'Downtown', city: 'Mumbai' },
    { name: 'North Junction', location: 'North District', city: 'Delhi' },
    { name: 'East Terminal', location: 'Industrial Area', city: 'Bangalore' },
    { name: 'South Express', location: 'Residential Zone', city: 'Chennai' },
    { name: 'West Metro', location: 'Commercial Hub', city: 'Kolkata' },
    { name: 'Park Avenue', location: 'Green Belt', city: 'Hyderabad' },
    { name: 'River View', location: 'Riverside', city: 'Pune' },
    { name: 'Hill Station', location: 'Elevated Area', city: 'Shimla' },
  ];

  const detectionTypes = [
    { type: 'person' as const, descriptions: ['Person on tracks', 'Pedestrian crossing', 'Worker maintenance', 'Trespasser detected'] },
    { type: 'animal' as const, descriptions: ['Stray dog', 'Cattle on tracks', 'Wild animal', 'Bird flock'] },
    { type: 'debris' as const, descriptions: ['Fallen tree branch', 'Construction debris', 'Garbage pile', 'Metal scraps'] },
    { type: 'vehicle' as const, descriptions: ['Car on tracks', 'Motorcycle crossing', 'Bicycle', 'Emergency vehicle'] },
    { type: 'obstacle' as const, descriptions: ['Unknown object', 'Large debris', 'Structural damage', 'Equipment failure'] },
  ];

  // Initialize tracks with random data
  useEffect(() => {
    const initialTracks: TrackData[] = Array.from({ length: 8 }, (_, i) => {
      const station = stationData[i % stationData.length];
      const trackNumber = `${String.fromCharCode(65 + Math.floor(i / 2))}-${(i % 2) + 1}`;
      
      return {
        id: `track-${i + 1}`,
        stationName: station.name,
        trackNumber,
        location: `${station.location}, ${station.city}`,
        camera: `CAM-${String(i + 1).padStart(3, '0')}`,
        status: Math.random() > 0.7 ? 'clear' : (Math.random() > 0.5 ? 'obstacle' : 'clear'),
        detections: [],
        isActive: true,
      };
    });

    setTracks(initialTracks);
  }, []);

  // Real-time detection simulation
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      
      setTracks(prevTracks => {
        const updatedTracks = prevTracks.map(track => {
          // Random chance for new detection
          if (Math.random() > 0.85) {
            const detectionTypeData = detectionTypes[Math.floor(Math.random() * detectionTypes.length)];
            const description = detectionTypeData.descriptions[Math.floor(Math.random() * detectionTypeData.descriptions.length)];
            
            const newDetection: Detection = {
              id: `det-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: detectionTypeData.type,
              confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
              location: track.location,
              dangerLevel: getDangerLevel(detectionTypeData.type),
              timestamp: new Date(),
              description,
            };

            // Show alert for dangerous detections
            if (newDetection.dangerLevel === 'high' || newDetection.dangerLevel === 'critical') {
              toast({
                title: "⚠️ DANGER ALERT",
                description: `${newDetection.description} detected at ${track.stationName} - Track ${track.trackNumber}`,
                variant: "destructive",
              });
            }

            const updatedDetections = [...track.detections, newDetection];
            
            // Keep only recent detections (last 10)
            const recentDetections = updatedDetections.slice(-10);
            
            return {
              ...track,
              detections: recentDetections,
              status: newDetection.dangerLevel === 'critical' ? 'danger' as const : 
                     newDetection.dangerLevel === 'high' ? 'obstacle' as const : 
                     track.status,
            };
          }

          // Random chance to clear detections
          if (Math.random() > 0.9 && track.detections.length > 0) {
            return {
              ...track,
              detections: track.detections.slice(0, -1),
              status: track.detections.length === 1 ? 'clear' as const : track.status,
            };
          }

          return track;
        });

        return updatedTracks;
      });
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, toast]);

  // Calculate statistics
  useEffect(() => {
    const allDetections = tracks.flatMap(track => track.detections);
    setTotalDetections(allDetections.length);
    
    const dangerous = allDetections.filter(d => d.dangerLevel === 'high' || d.dangerLevel === 'critical');
    setDangerousDetections(dangerous.length);
  }, [tracks]);

  const getDangerLevel = (type: Detection['type']): Detection['dangerLevel'] => {
    switch (type) {
      case 'person':
        return Math.random() > 0.3 ? 'critical' : 'high';
      case 'animal':
        return Math.random() > 0.5 ? 'high' : 'medium';
      case 'vehicle':
        return 'critical';
      case 'debris':
        return Math.random() > 0.7 ? 'medium' : 'low';
      case 'obstacle':
        return Math.random() > 0.6 ? 'high' : 'medium';
      default:
        return 'medium';
    }
  };

  const clearTracks = tracks.filter(track => track.status === 'clear').length;
  const activeCameras = tracks.filter(track => track.isActive).length;
  
  const getCurrentThreatLevel = () => {
    const allDetections = tracks.flatMap(track => track.detections);
    if (allDetections.some(d => d.dangerLevel === 'critical')) return 'CRITICAL';
    if (allDetections.some(d => d.dangerLevel === 'high')) return 'HIGH';
    if (allDetections.some(d => d.dangerLevel === 'medium')) return 'MEDIUM';
    return 'LOW';
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-destructive';
      case 'HIGH': return 'text-destructive';
      case 'MEDIUM': return 'text-warning';
      case 'LOW': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const currentThreatLevel = getCurrentThreatLevel();

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Cameras</p>
                  <p className="text-2xl font-bold text-foreground">{activeCameras}</p>
                </div>
                <Camera className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Detections</p>
                  <p className="text-2xl font-bold text-warning">{totalDetections}</p>
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
                  <p className="text-2xl font-bold text-success">{clearTracks}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Threat Level</p>
                  <p className={`text-xl font-bold ${getThreatLevelColor(currentThreatLevel)}`}>
                    {currentThreatLevel}
                  </p>
                </div>
                <Zap className={`h-8 w-8 ${getThreatLevelColor(currentThreatLevel)}`} />
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
            <ObstacleDetection detections={tracks.flatMap(track => track.detections)} />
            
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
                    {dangerousDetections} Active
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