import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedVideo {
  id: string;
  file: File;
  url: string;
  name: string;
  size: string;
  duration?: number;
  status: 'ready' | 'analyzing' | 'completed' | 'error';
}

interface VideoUploadProps {
  onVideoSelect: (video: UploadedVideo) => void;
  uploadedVideos: UploadedVideo[];
  onRemoveVideo: (id: string) => void;
  currentVideo?: UploadedVideo | null;
}

export function VideoUpload({ 
  onVideoSelect, 
  uploadedVideos, 
  onRemoveVideo, 
  currentVideo 
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a video file (MP4, MOV, AVI, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a video file smaller than 100MB",
          variant: "destructive",
        });
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      const uploadedVideo: UploadedVideo = {
        id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: videoUrl,
        name: file.name,
        size: formatFileSize(file.size),
        status: 'ready',
      };

      // Get video duration
      const videoElement = document.createElement('video');
      videoElement.onloadedmetadata = () => {
        uploadedVideo.duration = videoElement.duration;
        onVideoSelect({ ...uploadedVideo });
      };
      videoElement.src = videoUrl;

      toast({
        title: "Video Uploaded",
        description: `${file.name} ready for analysis`,
      });
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onVideoSelect, toast]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    // Create a synthetic event to reuse the file selection logic
    const syntheticEvent = {
      target: { files }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleFileSelect(syntheticEvent);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const getStatusColor = (status: UploadedVideo['status']) => {
    switch (status) {
      case 'ready': return 'bg-primary';
      case 'analyzing': return 'bg-warning';
      case 'completed': return 'bg-success';
      case 'error': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: UploadedVideo['status']) => {
    switch (status) {
      case 'ready': return <Play className="h-3 w-3" />;
      case 'analyzing': return <AlertTriangle className="h-3 w-3 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'error': return <X className="h-3 w-3" />;
      default: return <File className="h-3 w-3" />;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Video Upload & Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Upload Railway Video
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag & drop your video file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports MP4, MOV, AVI • Max size: 100MB
          </p>
          <Button variant="outline" className="mt-4">
            <Upload className="h-4 w-4 mr-2" />
            Select Video
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Uploaded Videos List */}
        {uploadedVideos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Uploaded Videos</h4>
            {uploadedVideos.map((video) => (
              <div
                key={video.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  currentVideo?.id === video.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <File className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {video.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{video.size}</span>
                      {video.duration && (
                        <>
                          <span>•</span>
                          <span>{Math.round(video.duration)}s</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(video.status)}>
                    {getStatusIcon(video.status)}
                    {video.status.toUpperCase()}
                  </Badge>
                  
                  {video.status === 'ready' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVideoSelect(video)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Analyze
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveVideo(video.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {uploadedVideos.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No videos uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}