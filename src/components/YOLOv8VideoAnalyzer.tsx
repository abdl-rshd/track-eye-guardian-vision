import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye, EyeOff, Zap, Activity, RefreshCw } from 'lucide-react';
import { useYOLOv8Detection } from '@/hooks/useYOLOv8Detection';

interface Detection {
  id: string;
  type: 'obstacle' | 'person' | 'animal' | 'debris' | 'vehicle';
  confidence: number;
  location: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
}

interface YOLOv8VideoAnalyzerProps {
  videoElement: HTMLVideoElement | null;
  isActive: boolean;
  trackLocation: string;
  onDetection: (detection: Detection) => void;
}

export function YOLOv8VideoAnalyzer({ 
  videoElement, 
  isActive, 
  trackLocation, 
  onDetection 
}: YOLOv8VideoAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  
  const { detections, isProcessing, error, processFrame } = useYOLOv8Detection();

  const getDescriptionForType = (type: string): string => {
    const descriptions: Record<string, string[]> = {
      person: ['Person detected on tracks', 'Human presence detected', 'Pedestrian crossing'],
      animal: ['Animal on railway tracks', 'Wildlife detected', 'Stray animal present'],
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

  const analyzeFrame = useCallback(async () => {
    if (!videoElement || !canvasRef.current || !isActive || isProcessing) {
      return;
    }

    try {
      const yoloDetections = await processFrame(canvasRef.current, videoElement);
      
      // Convert YOLOv8 detections to our format
      yoloDetections.forEach(yoloDetection => {
        const detection: Detection = {
          id: yoloDetection.id,
          type: yoloDetection.type,
          confidence: yoloDetection.confidence,
          location: trackLocation,
          dangerLevel: getDangerLevel(yoloDetection.type, yoloDetection.confidence),
          timestamp: new Date(),
          description: getDescriptionForType(yoloDetection.type),
        };
        
        onDetection(detection);
      });

      setAnalysisCount(prev => prev + 1);
      setLastAnalysis(new Date());
      
    } catch (err) {
      console.error('Frame analysis failed:', err);
    }
  }, [videoElement, isActive, isProcessing, processFrame, trackLocation, onDetection]);

  // Start/stop analysis based on active state
  useEffect(() => {
    if (isActive && videoElement) {
      setIsAnalyzing(true);
      // Analyze every 2 seconds to balance performance and detection accuracy
      intervalRef.current = setInterval(analyzeFrame, 2000);
    } else {
      setIsAnalyzing(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, videoElement, analyzeFrame]);

  const handleManualAnalysis = () => {
    if (!isProcessing) {
      analyzeFrame();
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>YOLOv8 Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <Badge variant="default" className="bg-success">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                ACTIVE
              </Badge>
            )}
            {error && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                ERROR
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hidden canvas for processing */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
          width={640}
          height={480}
        />
        
        {/* Analysis Status */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frames Analyzed:</span>
            <span className="font-medium text-foreground">{analysisCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Processing:</span>
            <span className="font-medium text-foreground">
              {isProcessing ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Analysis:</span>
            <span className="font-medium text-foreground">
              {lastAnalysis ? lastAnalysis.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Detections:</span>
            <span className="font-medium text-warning">{detections.length}</span>
          </div>
        </div>

        {/* Manual Analysis Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualAnalysis}
          disabled={isProcessing || !videoElement}
          className="w-full"
        >
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          {isProcessing ? 'Analyzing...' : 'Analyze Frame'}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
            <p className="text-xs text-destructive font-medium">Error:</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Recent Detections */}
        {detections.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Recent Detections:</p>
            {detections.slice(0, 3).map((detection) => (
              <div key={detection.id} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground capitalize">{detection.type}</span>
                <Badge variant="outline" className="text-xs">
                  {Math.round(detection.confidence * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Model Status */}
        <div className="border-t border-border pt-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">YOLOv8 Model:</span>
            <Badge variant={error ? "destructive" : "default"} className="bg-success">
              {error ? 'Failed' : 'Loaded'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}