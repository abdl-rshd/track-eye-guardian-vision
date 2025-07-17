import { useEffect, useRef, useState, useCallback } from 'react';

interface DetectionResult {
  id: string;
  type: 'person' | 'animal' | 'vehicle' | 'obstacle' | 'debris';
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: {
    x: number;
    y: number;
  };
}

interface YOLOv8Detection {
  detections: DetectionResult[];
  isProcessing: boolean;
  error: string | null;
  processFrame: (canvas: HTMLCanvasElement, videoElement: HTMLVideoElement) => Promise<DetectionResult[]>;
}

export function useYOLOv8Detection(): YOLOv8Detection {
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<any>(null);
  const isInitializing = useRef(false);

  // YOLO class names mapping to our detection types
  const classMapping: Record<number, string> = {
    0: 'person',      // person
    1: 'animal',      // bicycle -> treated as vehicle
    2: 'vehicle',     // car
    3: 'vehicle',     // motorcycle
    5: 'vehicle',     // bus
    7: 'vehicle',     // truck
    15: 'animal',     // cat
    16: 'animal',     // dog
    17: 'animal',     // horse
    18: 'animal',     // sheep
    19: 'animal',     // cow
    20: 'animal',     // elephant
    21: 'animal',     // bear
    22: 'animal',     // zebra
    23: 'animal',     // giraffe
  };

  const getDetectionType = (classId: number): DetectionResult['type'] => {
    return (classMapping[classId] as DetectionResult['type']) || 'obstacle';
  };

  // Initialize YOLOv8 model
  useEffect(() => {
    const initializeModel = async () => {
      if (modelRef.current || isInitializing.current) return;
      
      try {
        isInitializing.current = true;
        setError(null);
        
        // Dynamic import to avoid SSR issues
        const { pipeline } = await import('@huggingface/transformers');
        
        console.log('Loading YOLOv8 model...');
        
        // Initialize object detection pipeline with YOLOv8
        const detector = await pipeline(
          'object-detection',
          'Xenova/yolov8n',
          {
            device: 'webgpu', // Use WebGPU for better performance, fallback to CPU
            dtype: 'fp16',
          }
        );
        
        modelRef.current = detector;
        console.log('YOLOv8 model loaded successfully');
        
      } catch (err) {
        console.error('Failed to load YOLOv8 model:', err);
        setError(`Failed to initialize YOLOv8: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        isInitializing.current = false;
      }
    };

    initializeModel();
  }, []);

  const processFrame = useCallback(async (
    canvas: HTMLCanvasElement, 
    videoElement: HTMLVideoElement
  ): Promise<DetectionResult[]> => {
    if (!modelRef.current) {
      throw new Error('YOLOv8 model not loaded');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      // Convert canvas to image data for YOLOv8
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Run YOLOv8 detection
      const results = await modelRef.current(canvas);
      
      // Process results into our format
      const processedDetections: DetectionResult[] = results.map((result: any, index: number) => {
        const bbox = result.box;
        const confidence = result.score;
        const classId = result.class_id || 0;
        
        return {
          id: `det-${Date.now()}-${index}`,
          type: getDetectionType(classId),
          confidence: confidence,
          bbox: {
            x: bbox.xmin,
            y: bbox.ymin,
            width: bbox.xmax - bbox.xmin,
            height: bbox.ymax - bbox.ymin,
          },
          center: {
            x: (bbox.xmin + bbox.xmax) / 2,
            y: (bbox.ymin + bbox.ymax) / 2,
          },
        };
      });

      // Filter detections by confidence threshold
      const filteredDetections = processedDetections.filter(det => det.confidence > 0.5);
      
      setDetections(filteredDetections);
      return filteredDetections;
      
    } catch (err) {
      const errorMsg = `Detection failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      console.error('YOLOv8 detection error:', err);
      throw new Error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    detections,
    isProcessing,
    error,
    processFrame,
  };
}