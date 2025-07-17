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
  Upload,
  Eye,
  FileVideo,
  Zap
} from 'lucide-react';
import { ObstacleDetection } from './ObstacleDetection';
import { VideoUpload } from './VideoUpload';
import { VideoAnalysis } from './VideoAnalysis';
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

interface UploadedVideo {
  id: string;
  file: File;
  url: string;
  name: string;
  size: string;
  duration?: number;
  status: 'ready' | 'analyzing' | 'completed' | 'error';
}

interface TrackData {
  id: string;
  stationName: string;
  trackNumber: string;
  location: string;
  detections: Detection[];
}

export function Dashboard({ onLogout }: DashboardProps) {
  const { toast } = useToast();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [totalDetections, setTotalDetections] = useState(0);
  const [dangerousDetections, setDangerousDetections] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<UploadedVideo | null>(null);
  const [allDetections, setAllDetections] = useState<Detection[]>([]);

  // Sample detection types for random generation (keep for demo purposes)
  const detectionTypes = [
    { type: 'person' as const, descriptions: ['Person on tracks', 'Pedestrian crossing', 'Worker maintenance', 'Trespasser detected'] },
    { type: 'animal' as const, descriptions: ['Stray dog', 'Cattle on tracks', 'Wild animal', 'Bird flock'] },
    { type: 'debris' as const, descriptions: ['Fallen tree branch', 'Construction debris', 'Garbage pile', 'Metal scraps'] },
    { type: 'vehicle' as const, descriptions: ['Car on tracks', 'Motorcycle crossing', 'Bicycle', 'Emergency vehicle'] },
    { type: 'obstacle' as const, descriptions: ['Unknown object', 'Large debris', 'Structural damage', 'Equipment failure'] },
  ];

  // Helper function to determine danger level
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

  // Handle video upload
  const handleVideoSelect = (video: UploadedVideo) => {
    setUploadedVideos(prev => {
      const existing = prev.find(v => v.id === video.id);
      if (existing) {
        return prev.map(v => v.id === video.id ? video : v);
      }
      return [...prev, video];
    });
    
    setCurrentVideo(video);
  };

  // Remove uploaded video
  const handleRemoveVideo = (videoId: string) => {
    setUploadedVideos(prev => prev.filter(v => v.id !== videoId));
    if (currentVideo?.id === videoId) {
      setCurrentVideo(null);
    }
  };

  // Handle video analysis status updates
  const handleStatusUpdate = (videoId: string, status: UploadedVideo['status']) => {
    setUploadedVideos(prev => 
      prev.map(v => v.id === videoId ? { ...v, status } : v)
    );
  };

  // Handle analysis completion
  const handleAnalysisComplete = (videoId: string, detections: Detection[]) => {
    toast({
      title: "✅ Analysis Complete",
      description: `Found ${detections.length} detections in video`,
    });
    setLastUpdate(new Date());
  };

  // Handle YOLOv8 detections from video analysis
  const handleDetection = (detection: Detection) => {
    setAllDetections(prev => {
      const updated = [...prev, detection];
      // Keep only recent detections (last 20)
      return updated.slice(-20);
    });

    // Show alert for dangerous detections
    if (detection.dangerLevel === 'high' || detection.dangerLevel === 'critical') {
      toast({
        title: "🤖 YOLOv8 DETECTION",
        description: `${detection.description} detected in video`,
        variant: "destructive",
      });
    }

    setLastUpdate(new Date());
  };

  // Simulate some background detections for demo (much reduced frequency)
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Very occasional simulated detection for demo
      if (Math.random() > 0.98) {
        const detectionTypeData = detectionTypes[Math.floor(Math.random() * detectionTypes.length)];
        const description = detectionTypeData.descriptions[Math.floor(Math.random() * detectionTypeData.descriptions.length)];
        
        const newDetection: Detection = {
          id: `sim-det-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: detectionTypeData.type,
          confidence: Math.random() * 0.4 + 0.6,
          location: 'Background Monitor',
          dangerLevel: getDangerLevel(detectionTypeData.type),
          timestamp: new Date(),
          description: `[Simulated] ${description}`,
        };

        setAllDetections(prev => [...prev, newDetection].slice(-20));
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Calculate statistics
  useEffect(() => {
    setTotalDetections(allDetections.length);
    
    const dangerous = allDetections.filter(d => d.dangerLevel === 'high' || d.dangerLevel === 'critical');
    setDangerousDetections(dangerous.length);
  }, [allDetections]);

  const getCurrentThreatLevel = () => {
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

  // Calculated values
  const completedAnalyses = uploadedVideos.filter(v => v.status === 'completed').length;
  const activeCameras = uploadedVideos.filter(v => v.status === 'analyzing').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Railway Monitor</h1>
              <p className="text-sm text-muted-foreground">YOLOv8 Video Analysis System</p>
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
                  <p className="text-sm text-muted-foreground">Uploaded Videos</p>
                  <p className="text-2xl font-bold text-foreground">{uploadedVideos.length}</p>
                </div>
                <FileVideo className="h-8 w-8 text-primary" />
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
                  <p className="text-sm text-muted-foreground">Completed Analysis</p>
                  <p className="text-2xl font-bold text-success">{completedAnalyses}</p>
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
          {/* Video Upload and Analysis */}
          <div className="lg:col-span-2 space-y-4">
            {!currentVideo ? (
              <VideoUpload
                onVideoSelect={handleVideoSelect}
                uploadedVideos={uploadedVideos}
                onRemoveVideo={handleRemoveVideo}
                currentVideo={currentVideo}
              />
            ) : (
              <VideoAnalysis
                video={currentVideo}
                onDetection={handleDetection}
                onAnalysisComplete={handleAnalysisComplete}
                onStatusUpdate={handleStatusUpdate}
              />
            )}
            
            {currentVideo && (
              <Button
                variant="outline"
                onClick={() => setCurrentVideo(null)}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Back to Upload
              </Button>
            )}
          </div>

          {/* Detection Results and System Status */}
          <div className="space-y-4">
            <ObstacleDetection detections={allDetections} />
            
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  YOLOv8 Analysis Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Model Status</span>
                  <Badge variant="default" className="bg-success">Loaded</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Processing</span>
                  <Badge variant="outline" className={activeCameras > 0 ? "bg-warning" : "bg-muted"}>
                    {activeCameras > 0 ? `${activeCameras} Active` : 'Idle'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Videos</span>
                  <Badge variant="outline" className="border-primary text-primary">
                    {uploadedVideos.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alerts</span>
                  <Badge variant="outline" className="border-warning text-warning">
                    {dangerousDetections} Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">YOLOv8 Detection</span>
                  <Badge variant="default" className="bg-success">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Network Status</span>
                  <Badge variant="default" className="bg-success">Connected</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Video Processing</span>
                  <Badge variant="default" className="bg-primary">Ready</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Threat Alerts</span>
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